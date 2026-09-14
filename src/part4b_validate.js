
/* ============================================================
   Verification — the model against Israel's own gauge records
   ------------------------------------------------------------
   The honest position is that the moving water on this map is
   modelled. The fair question is then: how wrong is it?

   That is answerable without any live feed. The Hydrological
   Service publishes, for each of its active gauges, the mean
   annual volume actually measured there over decades. A volume
   per year converts straight to a discharge:

        m3/s  =  MCM * 1e6 / 31,556,952

   GloFAS can be asked the same question at the same coordinates,
   from its own multi-year reanalysis. Comparing the two gives a
   number for the model's bias and its spread, per gauge and over
   the whole network, computed live in the browser and shown to
   the reader rather than asserted.

   Two caveats stated up front. The periods differ: a gauge's
   record may run from 1966, the reanalysis covers the last ten
   years. And a 5 km model cell is not a gauge cross-section. So
   this measures order of magnitude and rank, which is what the
   map claims, not gauge accuracy, which it does not.
   ============================================================ */
const SEC_PER_YEAR = 31556952;
const VAL_YEARS = 4;              /* four hydrological years of reanalysis */
const VAL_BATCH = 4;              /* Open-Meteo weights a request by days x places */
let VAL_GAP = 66000;            /* so the live re-run is paced, not throttled */
const VAL_N = 48;                 /* a stratified sample of the gauge network */
const VAL_KEY = "validation_v2";
const VAL_TTL = 30 * 864e5;

let VALID = null;                       /* last result, once run */
const valByStation = new Map();         /* station index -> per-gauge row */

/* mean annual volume (MCM) as a mean discharge */
function measuredMeanQ(s){
  const mcm = s[10];
  return (mcm == null || !isFinite(mcm) || mcm <= 0) ? null : mcm * 1e6 / SEC_PER_YEAR;
}

/* daily modelled discharge over VAL_YEARS at each [lat, lon] */
async function modelSeries(points){
  const end = new Date(Date.now() - 4*864e5);
  const start = new Date(end.getTime() - VAL_YEARS*365.25*864e5);
  const iso = d => d.toISOString().slice(0,10);
  const url = FLOOD_API +
    "?latitude="  + points.map(p => p[0].toFixed(4)).join(",") +
    "&longitude=" + points.map(p => p[1].toFixed(4)).join(",") +
    "&daily=river_discharge&start_date=" + iso(start) + "&end_date=" + iso(end);
  const r = await fetchWithTimeout(url, {}, 60000);
  if (!r.ok) throw new Error("flood API HTTP " + r.status);
  let j = await r.json();
  if (!Array.isArray(j)) j = [j];
  return j.map(x => (x && x.daily && x.daily.river_discharge)
    ? { t: x.daily.time, q: x.daily.river_discharge } : null);
}

function median(a){
  const v = a.filter(x => x != null && isFinite(x)).sort((p,q) => p-q);
  if (!v.length) return null;
  const m = v.length >> 1;
  return v.length % 2 ? v[m] : (v[m-1] + v[m]) / 2;
}
function ranks(a){
  const idx = a.map((v,i) => [v,i]).sort((p,q) => p[0]-q[0]);
  const r = new Array(a.length);
  for (let i = 0; i < idx.length; ){
    let j = i;
    while (j+1 < idx.length && idx[j+1][0] === idx[i][0]) j++;
    const avg = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) r[idx[k][1]] = avg;
    i = j + 1;
  }
  return r;
}
function spearman(x, y){
  if (x.length < 3) return null;
  const a = ranks(x), b = ranks(y), n = a.length;
  const ma = a.reduce((s,v)=>s+v,0)/n, mb = b.reduce((s,v)=>s+v,0)/n;
  let num = 0, da = 0, db = 0;
  for (let i = 0; i < n; i++){
    const u = a[i]-ma, v = b[i]-mb;
    num += u*v; da += u*u; db += v*v;
  }
  return (da && db) ? num / Math.sqrt(da*db) : null;
}

/* one gauge's model behaviour, reduced to the few numbers that matter */
function summariseSeries(s){
  let sum = 0, n = 0, dry = 0;
  const summer = [], winter = [];
  for (let i = 0; i < s.q.length; i++){
    const v = s.q[i];
    if (v == null || !isFinite(v)) continue;
    sum += v; n++;
    if (v < DRY_Q) dry++;
    const mo = +s.t[i].slice(5,7);
    if (mo === 8 || mo === 9) summer.push(v);
    else if (mo === 1 || mo === 2) winter.push(v);
  }
  if (n < 365) return null;
  return { model: sum/n, days: n, dryFrac: dry/n,
           summer: median(summer), winter: median(winter) };
}

/* one gauge, on demand — cheap enough to run when a station is clicked */
async function validateStation(idx){
  if (valByStation.has(idx)) return valByStation.get(idx);
  const s = STATIONS.s[idx];
  const meas = measuredMeanQ(s);
  if (meas == null) return null;
  let row = null;
  try{
    const ser = await modelSeries([[s[3], s[4]]]);
    const st = ser[0] && summariseSeries(ser[0]);
    if (st) row = Object.assign({ station: idx, meas: meas }, st);
  }catch(e){ /* leave null; the panel simply says nothing */ }
  if (row) valByStation.set(idx, row);
  return row;
}

/* Which gauges to ask about.

   Open-Meteo's free tier prices a request by places multiplied by days, and
   four years at 126 places is far past the hour's allowance. Rather than
   shorten the window until a single wet winter decides the answer, the check
   takes a stratified sample: every gauge sorted by its measured mean, then
   evenly spaced picks, so the smallest desert wadi and the Dan are both in.
   Forty-eight gauges over four years, twelve requests a minute apart. */
function validationSample(){
  const all = [];
  for (let i = 0; i < STATIONS.s.length; i++){
    const m = measuredMeanQ(STATIONS.s[i]);
    if (m != null) all.push({ station: i, meas: m,
                              lat: STATIONS.s[i][3], lon: STATIONS.s[i][4] });
  }
  all.sort((a,b) => a.meas - b.meas);
  if (all.length <= VAL_N) return all;
  const step = all.length / VAL_N, out = [], seen = new Set();
  for (let k = 0; k < VAL_N; k++){
    const i = Math.min(all.length - 1, Math.round(k * step));
    if (seen.has(i)) continue;
    seen.add(i); out.push(all[i]);
  }
  return out;
}

/* the sampled network, live */
async function validateAgainstGauges(onProgress){
  const todo = validationSample();
  const rows = [];
  let failed = 0;
  for (let k = 0; k < todo.length; k += VAL_BATCH){
    const slice = todo.slice(k, k + VAL_BATCH);
    let ser = null;
    for (let a = 0; a < 2 && !ser; a++){
      try{ ser = await modelSeries(slice.map(s => [s.lat, s.lon])); }
      catch(e){ await sleep(1500); }
    }
    if (!ser){ failed += slice.length; }
    else for (let j = 0; j < slice.length; j++){
      const st = ser[j] && summariseSeries(ser[j]);
      if (!st){ failed++; continue; }
      const row = Object.assign({}, slice[j], st);
      rows.push(row);
      valByStation.set(row.station, row);
    }
    if (onProgress) onProgress(Math.min(1, (k + VAL_BATCH) / todo.length));
    if (k + VAL_BATCH < todo.length) await sleep(VAL_GAP);
  }
  return rollUp(rows, todo.length, failed);
}

function rollUp(rows, attempted, failed){
  const out = { when: new Date().toISOString().slice(0,10),
                ts: Date.now(), attempted: attempted, failed: failed,
                n: rows.length, years: VAL_YEARS };
  if (!rows.length) return out;
  const ratios = rows.map(r => r.model / r.meas).filter(v => isFinite(v) && v > 0);
  out.medianRatio = median(ratios);
  out.within2  = ratios.filter(v => v >= 0.5    && v <= 2).length / ratios.length;
  out.within3  = ratios.filter(v => v >= 1/3    && v <= 3).length / ratios.length;
  out.within10 = ratios.filter(v => v >= 0.1    && v <= 10).length / ratios.length;
  out.rho = spearman(rows.map(r => r.meas), rows.map(r => r.model));
  /* does the model know Israeli streams stop in late summer? */
  const seas = rows.map(r => (r.winter > 0 && r.summer != null) ? r.summer / r.winter : null)
                   .filter(v => v != null);
  out.seasonal = median(seas);
  out.summerDry = rows.filter(r => r.summer != null && r.summer < DRY_Q).length / rows.length;
  out.dryFrac = median(rows.map(r => r.dryFrac));
  /* the worst offenders, so the claim can be checked rather than believed */
  const sorted = rows.slice().sort((a,b) =>
    Math.abs(Math.log(b.model/b.meas)) - Math.abs(Math.log(a.model/a.meas)));
  out.worst = sorted.slice(0, 5).map(r => ({ station: r.station,
    name: STATIONS.s[r.station][2] || STATIONS.s[r.station][1],
    he: STATIONS.s[r.station][1],
    meas: +r.meas.toFixed(3), model: +r.model.toFixed(3) }));
  out.best = sorted.slice(-5).reverse().map(r => ({ station: r.station,
    name: STATIONS.s[r.station][2] || STATIONS.s[r.station][1],
    he: STATIONS.s[r.station][1],
    meas: +r.meas.toFixed(3), model: +r.model.toFixed(3) }));
  return out;
}

/* The figures shipped with the map, computed the same way, on the date
   stamped on them. The button re-runs the whole thing live if you would
   rather see it happen than take it on trust. */
async function loadValidation(){
  VALID = (typeof BAKED_VALIDATION !== "undefined" && BAKED_VALIDATION.n)
    ? BAKED_VALIDATION : null;
  if (VALID && VALID.perStation)
    for (const r of VALID.perStation) valByStation.set(r.station, r);
  const c = await cacheGet(VAL_KEY);
  if (c && c.ts && Date.now() - c.ts < VAL_TTL && c.n){
    VALID = c; VALID.live = true;
    if (c.perStation) for (const r of c.perStation) valByStation.set(r.station, r);
  }
  return VALID;
}
async function saveValidation(v){
  v.perStation = Array.from(valByStation.values()).map(r => ({
    station: r.station, meas: r.meas, model: r.model,
    summer: r.summer, winter: r.winter, dryFrac: r.dryFrac }));
  await cacheSet(VAL_KEY, v);
}

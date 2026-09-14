
/* ============================================================
   Live discharge — GloFAS via the Open-Meteo Flood API
   ------------------------------------------------------------
   GloFAS runs on a 0.05 degree grid (about 5 km), so many reaches
   share a cell. We snap every reach's outlet to its grid cell and
   ask only for the distinct cells.
   ============================================================ */
const GRID = 0.05;
const cellKey = (lat,lon) => Math.round(lat/GRID) + "_" + Math.round(lon/GRID);
const cellCenter = k => { const p = k.split("_"); return [ +p[0]*GRID, +p[1]*GRID ]; };

const FLOOD_API = "https://flood-api.open-meteo.com/v1/flood";

/* Open-Meteo counts each location in a multi-point request as one API call and
   caps the free tier around 600 calls a minute, so the fetch is batched,
   throttled, and retried; the caller can stop after a budget and come back for
   the rest in the background. */
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function fetchFlowBatch(slice){
  const lats = [], lons = [];
  for (const c of slice){ const p = cellCenter(c); lats.push(p[0].toFixed(3)); lons.push(p[1].toFixed(3)); }
  const url = FLOOD_API + "?latitude=" + lats.join(",") + "&longitude=" + lons.join(",")
    + "&daily=river_discharge&past_days=7&forecast_days=7";
  const r = await fetchWithTimeout(url, {}, 30000);
  if (!r.ok) throw new Error("HTTP " + r.status);
  let j = await r.json();
  if (!Array.isArray(j)) j = [j];
  const out = [];
  for (let k = 0; k < slice.length; k++){
    const d = j[k] && j[k].daily;
    if (d && d.river_discharge) out.push([slice[k], { t:d.time, q:d.river_discharge }]);
  }
  return out;
}

async function fetchFlow(cells, into, onProgress, budget){
  const BATCH = 100;
  const limit = budget == null ? cells.length : Math.min(budget, cells.length);
  const failed = [];
  let done = 0;
  for (let i = 0; i < limit; i += BATCH){
    const slice = cells.slice(i, i + BATCH);
    let ok = false;
    for (let attempt = 0; attempt < 2 && !ok; attempt++){
      try{
        for (const kv of await fetchFlowBatch(slice)) into.set(kv[0], kv[1]);
        ok = true;
      }catch(e){ if (attempt === 0) await sleep(2500); }
    }
    if (!ok) failed.push.apply(failed, slice);
    done += slice.length;
    if (onProgress) onProgress(done / limit);
    await sleep(120);
  }
  return { remaining: cells.slice(limit).concat(failed) };
}

/* 30-year day-of-year climatology for one cell, for "flow vs normal". */
const climoCache = new Map();
async function fetchClimatology(cellK){
  if (climoCache.has(cellK)) return climoCache.get(cellK);
  const p = cellCenter(cellK);
  const end = new Date(Date.now() - 3*864e5);
  const start = new Date(end.getTime() - 20*365.25*864e5);
  const iso = d => d.toISOString().slice(0,10);
  const url = FLOOD_API + "?latitude=" + p[0].toFixed(3) + "&longitude=" + p[1].toFixed(3)
    + "&daily=river_discharge&start_date=" + iso(start) + "&end_date=" + iso(end);
  let res = null;
  try{
    const r = await fetchWithTimeout(url, {}, 45000);
    const j = await r.json();
    if (j.daily && j.daily.river_discharge)
      res = { d:j.daily.time.map(doy), q:j.daily.river_discharge };
  }catch(e){}
  climoCache.set(cellK, res);
  return res;
}
function doy(iso){
  const d = new Date(iso + "T00:00:00Z");
  return Math.floor((d - Date.UTC(d.getUTCFullYear(),0,0)) / 864e5);
}
/* percentile of `value` inside the historical window +/- 10 days around `date` */
function percentileFor(climo, dateISO, value){
  if (!climo || value == null) return null;
  const target = doy(dateISO), pool = [];
  for (let i=0;i<climo.d.length;i++){
    const v = climo.q[i];
    if (v == null) continue;
    let dd = Math.abs(climo.d[i] - target);
    if (dd > 182) dd = 365 - dd;
    if (dd <= 10) pool.push(v);
  }
  if (pool.length < 40) return null;
  pool.sort((a,b)=>a-b);
  let lo = 0;
  while (lo < pool.length && pool[lo] < value) lo++;
  return Math.round(100 * lo / pool.length);
}
function anomColour(p){
  if (p == null) return pal().unknown;
  if (p < 10) return "#d03b3b";
  if (p < 25) return "#ec835a";
  if (p <= 75) return "#8b96a0";
  if (p <= 90) return "#3987e5";
  return "#9ec5f4";
}
function anomLabel(p){
  if (p == null) return T("nodata");
  if (p < 10) return T("much_below");
  if (p < 25) return T("below");
  if (p <= 75) return T("normal");
  if (p <= 90) return T("above");
  return T("much_above");
}


/* ============================================================
   Reliability
   ------------------------------------------------------------
   GloFAS runs on a 0.05 degree grid. A single river crosses several
   cells, and a cell with no modelled channel in it returns zero, so
   the raw values make a river appear to flow, stop, and flow again
   along its length. That is an artefact of the grid, not hydrology,
   and it should not reach a reader unexamined.

   So: order each named river headwater to mouth by the elevation of
   its cells, and carry the discharge downstream as a running maximum.
   Water accumulates downstream; it does not vanish and reappear. A
   genuinely dry headwater above a spring-fed reach survives this,
   because the running maximum only ever fills from upstream.

   A river whose cells are mostly empty is not smoothed into a
   confident line — it is shown as having no model data at all.
   ============================================================ */
const REL_MIN_COVERAGE = 0.34;

async function cellElevations(cells, cache){
  const need = [], pts = [];
  for (const c of cells){
    if (cache[c] != null) continue;
    need.push(c);
    const p = cellCenter(c);
    pts.push([p[1], p[0]]);          /* [lon, lat] for elevations() */
  }
  if (!pts.length) return 0;
  const el = await elevations(pts);
  let got = 0;
  for (let i = 0; i < need.length; i++)
    if (el[i] != null){ cache[need[i]] = el[i]; got++; }
  return got;
}

function rawQ(i){
  const r = S.reaches[i];
  if (!r.cell) return null;
  const f = S.flow.get(r.cell);
  if (!f) return null;
  const v = f.q[S.dayIdx];
  return (v == null || !isFinite(v)) ? null : v;
}

/* conf: 0 unusable · 1 filled from the profile · 2 the cell's own reading */
function reliabilityPass(){
  const n = S.reaches.length;
  S.chains = [];
  for (let i = 0; i < n; i++){
    const r = S.reaches[i];
    r.qShow = rawQ(i);
    r.conf = r.qShow == null ? 0 : 2;
    r.chain = -1; r.pos = -1; r.sparse = 0;
  }
  const el = S.cellEl || {};
  /* Group by the national network where it knows the river, by name where it
     does not. A network id is a fact about connectivity; a name is a label. */
  const chains = new Map();
  for (let i = 0; i < n; i++){
    const k = chainKey(S.reaches[i]);
    if (!k) continue;
    let a = chains.get(k); if (!a){ a = []; chains.set(k, a); }
    a.push(i);
  }
  for (const [key, grp] of chains){
   /* A shared name is not proof of continuity, so a name-grouped set is still
      split into spatially connected clusters. A network-grouped one is not:
      the source already established that those segments are one watercourse. */
   /* Only a bare name still needs splitting by distance. A spine or a basin
      has already established that these segments belong together. */
   const parts = key.slice(0,3) === "nm:" ? clusters(grp, 3.0) : [grp];
   for (const list of parts){
    if (list.length < 2) continue;
    let known = 0;
    for (const i of list) if (rawQ(i) != null) known++;
    if (!known) continue;
    if (list.length >= 3 && known / list.length < REL_MIN_COVERAGE){
      /* Too sparse to carry one cell's value along the whole river — that was
         the artefact this gate exists to stop. But it used to erase the
         reaches that had their own reading too, which is how a river came to
         vanish for half its length. A cell that reported is still a cell that
         reported; only the filling in between is withheld. */
      for (const i of list){
        const own = rawQ(i);
        S.reaches[i].qShow = own;
        S.reaches[i].conf = own == null ? 0 : 2;
        S.reaches[i].sparse = 1;
      }
      continue;
    }
    /* Headwater first. Accumulated length along the real network where we
       have it — measured distance the water has already travelled — and the
       elevation of the model cell only where we do not. */
    const accOf = i => S.reaches[i].spine ? S.reaches[i].spine.acc : null;
    const haveAcc = list.filter(i => accOf(i) != null).length;
    const useAcc = haveAcc >= Math.max(2, list.length * 0.6);
    const order = list.slice().sort((a, b) => {
      if (useAcc){
        const aa = accOf(a), ab = accOf(b);
        if (aa != null && ab != null) return aa - ab;      /* ascending: headwater first */
        if (aa == null) return 1;
        if (ab == null) return -1;
      }
      const ea = el[S.reaches[a].cell], eb = el[S.reaches[b].cell];
      if (ea == null && eb == null) return 0;
      if (ea == null) return 1;
      if (eb == null) return -1;
      return eb - ea;
    });
    for (const i of list) S.reaches[i].ordBy = useAcc ? "acc" : "elev";
    /* Keep the chain. The evidence pass needs the same headwater-to-mouth
       order, or it will undo along the river exactly what was smoothed here. */
    const ci = S.chains.length;
    S.chains.push(order);
    for (let k = 0; k < order.length; k++){
      S.reaches[order[k]].chain = ci;
      S.reaches[order[k]].pos = k;
    }
    let run = null;
    for (const i of order){
      const r = S.reaches[i], own = rawQ(i);
      if (own != null && (run == null || own > run)) run = own;
      if (run == null) continue;
      if (own == null || run > own){ r.qShow = run; r.conf = 1; }
      else { r.qShow = own; r.conf = 2; }
    }
   }
  }
  evidencePass();
}

/* group members whose ends come within `km` of each other, by union-find */
function clusters(list, km){
  if (list.length < 3) return [list];
  const cell = km / 100;                    /* degrees, near enough at this latitude */
  const parent = new Map();
  const find = a => { while (parent.get(a) !== a) { parent.set(a, parent.get(parent.get(a))); a = parent.get(a); } return a; };
  const join = (a, b) => { a = find(a); b = find(b); if (a !== b) parent.set(a, b); };
  for (const i of list) parent.set(i, i);
  const grid = new Map();
  for (const i of list){
    const g = S.reaches[i].g;
    for (const p of [g[0], g[g.length-1], g[Math.floor(g.length/2)]]){
      const cx = Math.floor(p[0]/cell), cy = Math.floor(p[1]/cell);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++){
        const k = (cx+dx) + "_" + (cy+dy);
        let a = grid.get(k); if (!a){ a = []; grid.set(k, a); }
        a.push(i);
      }
    }
  }
  for (const a of grid.values())
    for (let j = 1; j < a.length; j++) join(a[0], a[j]);
  const out = new Map();
  for (const i of list){
    const r = find(i);
    let a = out.get(r); if (!a){ a = []; out.set(r, a); }
    a.push(i);
  }
  return Array.from(out.values());
}


/* ============================================================
   Rain — the independent check on the model
   ------------------------------------------------------------
   GloFAS is one opinion, and a measured one this map cannot get.
   But a second, independent observation is free and reliable:
   whether it has rained on the catchment.

   Israel's hydrology makes this decisive. Outside the winter
   rains almost every watercourse here is an ephemeral wadi: it
   runs after rain and at no other time. So a modelled discharge
   in a cell that has had no rain for a fortnight is not evidence
   of water. It is the model's standing baseflow, which the gauge
   comparison in the About panel measures directly: GloFAS empties
   only about a third of Israel's gauge cells in late summer,
   where in truth nearly all of them stop.

   What this layer therefore establishes is not "how much water"
   but "could there be water at all" — and where the answer is no,
   the map says so instead of drawing a blue line.

   Deliberately generous: fourteen days, and five millimetres over
   the whole of them. That is far less than a wadi needs to run.
   It is a test the model has to fail badly to be overruled.
   ============================================================ */
const WX_API = "https://api.open-meteo.com/v1/forecast";
const RAIN_WINDOW = 14;      /* days of antecedent rain that count */
const RAIN_MM = 5;           /* mm over that window before flow is credible */

async function fetchRainBatch(slice){
  const lats = [], lons = [];
  for (const c of slice){ const p = cellCenter(c); lats.push(p[0].toFixed(3)); lons.push(p[1].toFixed(3)); }
  const url = WX_API + "?latitude=" + lats.join(",") + "&longitude=" + lons.join(",")
    + "&daily=precipitation_sum&past_days=21&forecast_days=7&timezone=UTC";
  const r = await fetchWithTimeout(url, {}, 30000);
  if (!r.ok) throw new Error("HTTP " + r.status);
  let j = await r.json();
  if (!Array.isArray(j)) j = [j];
  const out = [];
  for (let k = 0; k < slice.length; k++){
    const d = j[k] && j[k].daily;
    if (d && d.precipitation_sum) out.push([slice[k], { t:d.time, p:d.precipitation_sum }]);
  }
  return out;
}

async function fetchRain(cells, into, onProgress){
  const BATCH = 100;
  const failed = [];
  for (let i = 0; i < cells.length; i += BATCH){
    const slice = cells.slice(i, i + BATCH);
    let ok = false;
    for (let a = 0; a < 2 && !ok; a++){
      try{ for (const kv of await fetchRainBatch(slice)) into.set(kv[0], kv[1]); ok = true; }
      catch(e){ if (a === 0) await sleep(2000); }
    }
    if (!ok) failed.push.apply(failed, slice);
    if (onProgress) onProgress(Math.min(1, (i + BATCH) / cells.length));
    await sleep(120);
  }
  return failed;
}

/* Antecedent rain in this cell over the RAIN_WINDOW days ending on `dateISO`.
   Matched by date rather than by index, so a change in how many days the API
   returns cannot silently shift the window. */
function rainBefore(cellK, dateISO){
  const r = S.rain.get(cellK);
  if (!r || !r.t) return null;
  const end = r.t.indexOf(dateISO);
  if (end < 0) return null;
  let sum = 0, n = 0;
  for (let i = Math.max(0, end - RAIN_WINDOW + 1); i <= end; i++){
    const v = r.p[i];
    if (v == null || !isFinite(v)) continue;
    sum += v; n++;
  }
  return n ? { mm: +sum.toFixed(1), days: n } : null;
}


/* ============================================================
   Evidence — what the map is entitled to claim
   ------------------------------------------------------------
   Every reach ends in one of five states, and the state, not the
   raw model number, decides how it is drawn:

     dry          the model says no water, and nothing contradicts it
     stopped      the model says water, but this is a channel mapped
                  as intermittent and no rain has fallen: for an
                  Israeli wadi that means dry, and the map says dry
     flowing      the model says water and rain corroborates it
     unverified   the model says water, nothing corroborates it, and
                  we do not know whether this channel is perennial.
                  Drawn as unverified, not as water
     nodata       no model value at all

   The fourth state is the important one. It is the difference
   between a map that shows what it knows and one that shows what
   it has.
   ============================================================ */
const EV_NODATA = 0, EV_DRY = 1, EV_FLOW = 2, EV_UNVER = 3, EV_STOPPED = 4;

/* One reach, judged on its own evidence, before the river is considered. */
function reachState(r, q, rainMM, perennialUp, springUp, radarUp){
  if (q == null || !isFinite(q)) return { ev: EV_NODATA, why: null };
  if (q < DRY_Q) return { ev: EV_DRY, why: null };
  const reg = r.reg && r.reg.rec ? r.reg.rec.c : null;
  /* radar first: an observation outranks every model on this map */
  if (r.radar && r.radar.wet) return { ev: EV_FLOW, why: "radar" };
  if (radarUp) return { ev: EV_FLOW, why: "radarup" };
  if (rainMM == null) return { ev: EV_UNVER, why: "nocheck" };
  if (rainMM >= RAIN_MM) return { ev: EV_FLOW, why: "rain" };
  /* no rain, but a measured source is putting water in at or above here */
  if (r.spring || springUp) return { ev: EV_FLOW, why: "spring" };
  /* no rain: the measured regime decides, and a perennial source upstream
     counts as much as a perennial gauge on this reach itself */
  if (reg === R_PER || perennialUp) return { ev: EV_FLOW, why: "perennial" };
  if (reg === R_RARE) return { ev: EV_STOPPED, why: "rare" };
  if (reg === R_SEAS) return { ev: EV_STOPPED, why: "seasonal" };
  if (r.it) return { ev: EV_STOPPED, why: "norain" };
  return { ev: EV_UNVER, why: reg === R_NEAR ? "nearperennial" : "norain" };
}

/* ============================================================
   Evidence along a river, not scattered across it
   ------------------------------------------------------------
   The reliability pass carefully smooths discharge from headwater
   to mouth. The first version of this pass then threw that away,
   because all three of its inputs vary along a river for reasons
   that have nothing to do with the river:

     · rain is measured on a 5 km grid, and a long river crosses
       eight or ten cells. One clears the threshold, the next does
       not, and the map alternates blue and violet along a single
       watercourse
     · the regime comes from the nearest gauge, and a different
       reach can be nearer a different gauge of a different class
     · OpenStreetMap's intermittent tag is applied segment by
       segment by different contributors

   None of that is hydrology. Water enters a channel at a point
   and runs downstream: a river that is flowing cannot be dry
   further down, and rain that fell on the headwaters reaches the
   mouth, not the other way round. So the pass now walks each
   connected chain from headwater to mouth and carries what it
   knows downstream:

     · rain accumulates downstream — a reach is credited with the
       wettest cell at or above it, never one below
     · a perennial gauge makes everything below it perennial too,
       because the water it measures keeps going
     · once flowing, always flowing downstream

   The result is that a river changes state at most once along its
   length, and the map marks the point where it changes and says
   why. The Kishon is the case that matters: its upper reach in
   the Jezreel Valley really is dry in September while its lower
   reach really does run. That is true, and it should be shown as
   one honest transition rather than as flicker.
   ============================================================ */
function evidencePass(){
  const date = S.times[S.dayIdx];
  const n = S.reaches.length;

  for (let i = 0; i < n; i++){
    const r = S.reaches[i];
    r.rain = r.cell ? rainBefore(r.cell, date) : null;
    r.radar = r.cell ? radarFor(r.cell) : null;
    /* the hydrologically correct question, where the catchment is known */
    r.catch = r.basin != null ? catchmentRain(r.basin, date) : null;
    r.evWhy = null; r.dis = 0; r.trans = 0; r.rainUp = null;
  }

  /* reaches that belong to no chain are judged alone — there is nothing to
     carry to or from */
  for (let i = 0; i < n; i++){
    const r = S.reaches[i];
    if (r.chain >= 0) continue;
    const st = reachState(r, r.qShow,
      r.catch ? r.catch.mm : (r.rain ? r.rain.mm : null), false, false, false);
    r.ev = st.ev; r.evWhy = st.why;
    r.rainUp = r.rain ? r.rain.mm : null;
    r.cls = st.ev === EV_NODATA ? CLS_UNKNOWN
          : st.ev === EV_DRY || st.ev === EV_STOPPED ? CLS_DRY
          : st.ev === EV_UNVER ? CLS_UNVER : classOf(r.qShow);
    if (st.ev === EV_STOPPED) r.dis = 1;
    if (st.ev === EV_DRY && r.reg && r.reg.rec && r.reg.rec.c === R_PER) r.dis = -1;
  }

  for (const chain of (S.chains || [])){
    let rainUp = null, perennialUp = false, springUp = false, radarUp = false, flowing = false, prevEv = null;
    for (const i of chain){
      const r = S.reaches[i];
      /* Catchment rain, where a basin is known, is the better answer and
         supersedes carrying the cell value down the chain. The chain
         accumulation stays as the fallback for reaches outside any basin. */
      const own = r.catch ? r.catch.mm : (r.rain ? r.rain.mm : null);
      if (own != null) rainUp = rainUp == null ? own : Math.max(rainUp, own);
      r.rainUp = rainUp;

      let st = reachState(r, r.qShow, rainUp, perennialUp, springUp, radarUp);

      /* water does not stop and restart down one channel */
      if (flowing && (st.ev === EV_STOPPED || st.ev === EV_UNVER))
        st = { ev: EV_FLOW, why: "carried" };

      r.ev = st.ev; r.evWhy = st.why;
      r.cls = st.ev === EV_NODATA ? CLS_UNKNOWN
            : st.ev === EV_DRY || st.ev === EV_STOPPED ? CLS_DRY
            : st.ev === EV_UNVER ? CLS_UNVER : classOf(r.qShow);

      if (st.ev === EV_FLOW) flowing = true;
      if (r.reg && r.reg.rec && r.reg.rec.c === R_PER) perennialUp = true;
      if (r.spring) springUp = true;
      if (r.radar && r.radar.wet) radarUp = true;
      if (st.ev === EV_STOPPED) r.dis = 1;
      if (st.ev === EV_DRY && r.reg && r.reg.rec && r.reg.rec.c === R_PER) r.dis = -1;

      /* the one point on the river where the answer changes */
      if (prevEv !== null && prevEv !== st.ev &&
          (st.ev === EV_FLOW || prevEv === EV_FLOW)) r.trans = 1;
      prevEv = st.ev;
    }
  }
}

/* ---------- the comparison, run on every load ----------
   Where does the model contradict what was actually measured? Counted fresh
   each time rather than asserted once, so the answer moves with the data. */
function regimeReport(){
  const out = { matched:0, over:[], under:[], byClass:{P:0,N:0,S:0,R:0,U:0} };
  const seen = new Set();
  for (const r of S.reaches){
    if (!r.reg || !r.reg.rec) continue;
    out.matched++;
    out.byClass[r.reg.rec.c] = (out.byClass[r.reg.rec.c] || 0) + 1;
    if (!r.dis) continue;
    const nm = (LANG === "he" ? (r.he || r.en) : (r.en || r.he)) || "";
    const key = r.dis + "|" + nm + "|" + r.reg.rec.id;
    if (seen.has(key)) continue;
    seen.add(key);
    const row = { name:nm, cls:r.reg.rec.c, site:LANG === "he" ? r.reg.rec.siteHe : r.reg.rec.siteEn,
                  q:r.qShow, mm:r.rain ? r.rain.mm : null,
                  summer:r.reg.rec.summer, yfrac:r.reg.rec.yfrac, years:r.reg.rec.years };
    (r.dis > 0 ? out.over : out.under).push(row);
  }
  out.over.sort((a,b) => (b.q||0) - (a.q||0));
  out.under.sort((a,b) => (b.summer||0) - (a.summer||0));
  return out;
}

/* the discharge a reach is entitled to show as a number */
function shownQ(i){
  const r = S.reaches[i];
  if (!r || r.ev === EV_NODATA) return null;
  if (r.ev === EV_STOPPED) return 0;
  return r.qShow;
}

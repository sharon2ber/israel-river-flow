

/* ============================================================
   Flow regime — what the gauge record says a stream actually does
   ------------------------------------------------------------
   Most of Israel's watercourses are dry most of the time, a few
   run all year, and some carry water once in several years. Until
   now this map had no way to tell those apart, so a model number
   with no rain behind it could only ever be called "unverified".

   That distinction does not have to be guessed. The Hydrological
   Service publishes daily mean discharge for every gauging
   station, zeros included, through data.gov.il. Twenty-four
   hydrological years of it — 2000/01 to 2023/24 — classify each
   gauged stream by what was measured there, not by reputation:

     P  perennial      flow on 80% or more of July-September days
     N  near-perennial flow on 30% or more of all days, but the
                       summer is not continuous
     S  seasonal       flows in most years, the wet season only
     R  rare           flows in fewer than 60% of years
     U  unclassified   record too short to say

   Nineteen stations are perennial, twenty-seven near-perennial,
   seventy-six seasonal, seventeen rare. Those numbers are counted
   from the record, and every one of them is shown in the panel
   with the station it came from.

   The classification attaches to a gauge, not to a name, because
   a stream is not one thing along its length: the Jordan is
   perennial at Sede Nehemya, and the Besor at Re'im has flowed in
   fewer than three years in five. So a reach takes the regime of
   the nearest gauge on its own stream, and says which one.
   ============================================================ */
const REG_NEAR_KM = 30;        /* a gauge further than this speaks only for the name */
const R_PER = "P", R_NEAR = "N", R_SEAS = "S", R_RARE = "R", R_UNC = "U";

function regNorm(s){
  if (!s) return "";
  s = String(s).trim()
    .replace(/^(נחל|נהר|ואדי|wadi|nahal|nakhal|nahr)\s+/i, "")
    .replace(/['’`]/g, "")
    .replace(/[^\w֐-׿]+/g, " ")
    .trim().toLowerCase();
  return s;
}

/* stream name -> the gauges on it */
let REG_IDX = null;
function regimeIndex(){
  if (REG_IDX) return REG_IDX;
  REG_IDX = new Map();
  for (const r of REGIME.st){
    const rec = { id:r[0], he:r[1], en:r[2], lat:r[3], lon:r[4], c:r[5],
                  wet:r[6], summer:r[7], yfrac:r[8], days:r[9], years:r[10],
                  siteHe:r[11], siteEn:r[12] };
    for (const key of [rec.he, rec.en]){
      if (!key) continue;
      let a = REG_IDX.get(key);
      if (!a){ a = []; REG_IDX.set(key, a); }
      if (a.indexOf(rec) < 0) a.push(rec);
    }
  }
  return REG_IDX;
}

function haverKm(aLat, aLon, bLat, bLon){
  const R = 6371, t = Math.PI/180;
  const dLat = (bLat-aLat)*t, dLon = (bLon-aLon)*t;
  const s = Math.sin(dLat/2)**2 +
            Math.cos(aLat*t)*Math.cos(bLat*t)*Math.sin(dLon/2)**2;
  return 2*R*Math.asin(Math.sqrt(s));
}

/* The regime for one reach: the nearest gauge that sits on a stream of the
   same name. Returns null when nothing on this map's evidence applies —
   which is most unnamed wadis, and is left as not known rather than filled
   in with the class of some other stream. */
function regimeFor(r){
  const idx = regimeIndex();
  const cand = (idx.get(regNorm(r.he)) || []).concat(idx.get(regNorm(r.en)) || []);
  if (!cand.length) return null;
  const m = r.g[Math.floor(r.g.length/2)];
  let best = null, bestKm = Infinity;
  for (const c of cand){
    if (c.lat == null) continue;
    const km = haverKm(m[1], m[0], c.lat, c.lon);
    if (km < bestKm){ bestKm = km; best = c; }
  }
  if (best && bestKm <= REG_NEAR_KM) return { rec: best, km: +bestKm.toFixed(1), near: true };
  /* no gauge close by: fall back to the name, and say the match is weak */
  const usable = cand.filter(c => c.c !== R_UNC);
  if (!usable.length) return null;
  const counts = {};
  for (const c of usable) counts[c.c] = (counts[c.c] || 0) + 1;
  let top = usable[0];
  for (const c of usable) if (counts[c.c] > counts[top.c]) top = c;
  return { rec: top, km: best ? +bestKm.toFixed(1) : null, near: false };
}

/* attach once, when the network is built */
function assignRegimes(){
  let n = 0;
  for (const r of S.reaches){
    r.reg = regimeFor(r);
    if (r.reg) n++;
  }
  return n;
}

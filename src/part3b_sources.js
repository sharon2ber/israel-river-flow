
/* ============================================================
   Israeli authoritative layers (ArcGIS Feature Services)
   ------------------------------------------------------------
   The Water Authority publishes the national stream network and the
   stream-pollution sampling network as open, CORS-enabled feature
   services. They are the reason this map knows about thousands of
   wadis that OpenStreetMap does not carry.
   ============================================================ */

const AGS_RIVERS =
  "https://services1.arcgis.com/hWUp5lYOh3Fi9WoQ/arcgis/rest/services/israel_rivers/FeatureServer/1/query";
const AGS_SAMPLING =
  "https://services5.arcgis.com/dlrDjz89gx9qyfev/arcgis/rest/services/NehalimDigum/FeatureServer/0/query";

const AGS_PAGE = 2000;

async function agsPage(base, fields, offset, count){
  const url = base + "?where=1%3D1&outFields=" + encodeURIComponent(fields) +
    "&returnGeometry=true&outSR=4326&geometryPrecision=5&orderByFields=OBJECTID" +
    "&f=geojson&resultRecordCount=" + count + "&resultOffset=" + offset;
  const r = await fetchWithTimeout(url, {}, 45000);
  if (!r.ok) throw new Error("ArcGIS HTTP " + r.status);
  const j = await r.json();
  if (j.error) throw new Error("ArcGIS " + (j.error.message || "error"));
  return j.features || [];
}

/* the whole national stream layer, four pages of two thousand */
async function fetchOfficialRivers(onProgress){
  const out = [];
  for (let off = 0; off < 20000; off += AGS_PAGE){
    let page = null, err;
    for (let a = 0; a < 3 && !page; a++){
      try{ page = await agsPage(AGS_RIVERS, "RIVERNAME,ENGLISH,LENGTH", off, AGS_PAGE); }
      catch(e){ err = e; await napms(900 * (a + 1)); }
    }
    if (!page) throw err || new Error("stream layer unavailable");
    out.push.apply(out, page);
    if (onProgress) onProgress(Math.min(1, out.length / 7900));
    if (page.length < AGS_PAGE) break;
  }
  return out;
}

async function fetchSampling(){
  try{
    const f = await agsPage(AGS_SAMPLING, "*", 0, 2000);
    return f.filter(x => x.geometry && x.geometry.coordinates).map(x => ({
      lon: x.geometry.coordinates[0], lat: x.geometry.coordinates[1],
      stream: (x.properties["נחל"] || "").trim(),
      point:  (x.properties["נקודת_דיגום"] || "").trim()
    }));
  }catch(e){ return []; }
}

/* The official segments are separate line features, not a joined network:
   only 611 of 15,106 endpoints touch. So we simplify each one and group
   them by river name instead of chaining them into single polylines. */
function buildOfficial(features){
  const out = [];
  for (const f of features){
    const p = f.properties || {}, g = f.geometry;
    if (!g) continue;
    const he = (p.RIVERNAME || "").trim();
    const en = (p.ENGLISH || "").trim();
    const lines = g.type === "MultiLineString" ? g.coordinates : [g.coordinates];
    for (const line of lines){
      if (!line || line.length < 2) continue;
      const s = rdp(line, 0.0005);
      if (s.length < 2) continue;
      out.push({ he: he, en: en, g: s, wt: 1, it: 0, src: 1,
                 km: +lenKm(s).toFixed(2) });
    }
  }
  return out;
}

/* ---------- keeping OSM only where the official layer is silent ---------- */
const OV_CELL = 0.004;                       /* ~400 m */
function officialIndex(reaches){
  const idx = new Set();
  for (const r of reaches)
    for (const p of r.g)
      idx.add(Math.round(p[0]/OV_CELL) + "_" + Math.round(p[1]/OV_CELL));
  return idx;
}
function coveredByOfficial(g, idx){
  let hit = 0, n = 0;
  const step = Math.max(1, Math.floor(g.length / 6));
  for (let i = 0; i < g.length; i += step){
    n++;
    const cx = Math.round(g[i][0]/OV_CELL), cy = Math.round(g[i][1]/OV_CELL);
    let found = false;
    for (let dx = -1; dx <= 1 && !found; dx++)
      for (let dy = -1; dy <= 1 && !found; dy++)
        if (idx.has((cx+dx) + "_" + (cy+dy))) found = true;
    if (found) hit++;
  }
  return n > 0 && hit / n >= 0.6;
}

/* ---------- flow direction ----------
   Spot checks against rivers whose direction is known (Jordan, Lakhish,
   Soreq, Alexander, Hadera, Shiqma) show the official layer is digitised
   downstream about nine times in ten. Elevation at the two ends settles
   the rest: whichever end sits lower is downstream. Terrain never
   changes, so the answer is cached for good. */
const ELEV_API = "https://api.open-meteo.com/v1/elevation";
async function elevations(pts){
  const out = new Array(pts.length).fill(null);
  for (let i = 0; i < pts.length; i += 100){
    const s = pts.slice(i, i + 100);
    try{
      const url = ELEV_API + "?latitude=" + s.map(p => p[1].toFixed(4)).join(",") +
                  "&longitude=" + s.map(p => p[0].toFixed(4)).join(",");
      const r = await fetchWithTimeout(url, {}, 30000);
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (j.elevation) for (let k = 0; k < s.length; k++) out[i+k] = j.elevation[k];
    }catch(e){ /* leave nulls; the digitised order stands */ }
    await napms(150);
  }
  return out;
}

/* Orient the reaches that are long enough for a 90 m DEM to be decisive. */
async function orientByElevation(reaches, minKm, budget, cache){
  const idx = [];
  for (let i = 0; i < reaches.length; i++){
    const r = reaches[i];
    if (r.km < minKm) continue;
    idx.push(i);
  }
  idx.sort((a,b) => reaches[b].km - reaches[a].km);
  const todo = idx.slice(0, budget);

  const pts = [], need = [];
  for (const i of todo){
    const r = reaches[i];
    const a = r.g[0], b = r.g[r.g.length-1];
    const key = a[0].toFixed(4)+","+a[1].toFixed(4)+"|"+b[0].toFixed(4)+","+b[1].toFixed(4);
    if (cache && cache[key] != null){ applyOrient(r, cache[key]); continue; }
    need.push({ i: i, key: key });
    pts.push(a, b);
  }
  if (!pts.length) return 0;

  const el = await elevations(pts);
  let flipped = 0;
  for (let k = 0; k < need.length; k++){
    const ea = el[k*2], eb = el[k*2+1];
    if (ea == null || eb == null) continue;
    if (cache) cache[need[k].key] = [ea, eb];
    if (applyOrient(reaches[need[k].i], [ea, eb])) flipped++;
  }
  return flipped;
}
function applyOrient(r, pair){
  const ea = pair[0], eb = pair[1];
  r.hiEl = Math.max(ea, eb);
  r.loEl = Math.min(ea, eb);
  if (ea - eb < -3){                             /* runs uphill by >3 m: reverse it */
    r.g = r.g.slice().reverse();
    return true;
  }
  return false;
}


/* ============================================================
   Borders and the points where water crosses them
   ------------------------------------------------------------
   Boundary lines are Natural Earth's, kept with their own
   classification — international, indefinite, disputed, line of
   control — rather than flattened into one word. Crossing points
   are pure geometry: every place a watercourse intersects one.
   ============================================================ */
function borderSegments(){
  const only = SCOPE.borderPairs ? new Set(SCOPE.borderPairs) : null;
  const out = [];
  for (const s of BORDERS.s){
    const p = BORDERS.p[s[0]];
    if (only && !only.has(p[0] + "|" + p[1]) && !only.has(p[1] + "|" + p[0])) continue;
    out.push({ a:p[0], b:p[1], cls:p[2], g:s[1] });
  }
  return out;
}

function segIntersect(p1, p2, p3, p4){
  const d = (p2[0]-p1[0])*(p4[1]-p3[1]) - (p2[1]-p1[1])*(p4[0]-p3[0]);
  if (Math.abs(d) < 1e-14) return null;
  const t = ((p3[0]-p1[0])*(p4[1]-p3[1]) - (p3[1]-p1[1])*(p4[0]-p3[0])) / d;
  const u = ((p3[0]-p1[0])*(p2[1]-p1[1]) - (p3[1]-p1[1])*(p2[0]-p1[0])) / d;
  if (t < 0 || t > 1 || u < 0 || u > 1) return null;
  return [p1[0] + t*(p2[0]-p1[0]), p1[1] + t*(p2[1]-p1[1]), t];
}

/* Every intersection of a watercourse with a boundary line, with the side
   the water is leaving and the side it is entering read off the reach's
   own downstream direction. */
function findCrossings(reaches, borders){
  /* grid the boundary segments so this stays linear in the river count */
  const CELL = 0.05, grid = new Map();
  borders.forEach((b, bi) => {
    for (let i = 1; i < b.g.length; i++){
      const x0 = Math.min(b.g[i-1][0], b.g[i][0]), x1 = Math.max(b.g[i-1][0], b.g[i][0]);
      const y0 = Math.min(b.g[i-1][1], b.g[i][1]), y1 = Math.max(b.g[i-1][1], b.g[i][1]);
      for (let cx = Math.floor(x0/CELL); cx <= Math.floor(x1/CELL); cx++)
        for (let cy = Math.floor(y0/CELL); cy <= Math.floor(y1/CELL); cy++){
          const k = cx + "_" + cy;
          let a = grid.get(k); if (!a){ a = []; grid.set(k, a); }
          a.push([bi, i]);
        }
    }
  });

  const out = [], seen = new Set();
  for (let ri = 0; ri < reaches.length; ri++){
    const r = reaches[ri];
    for (let i = 1; i < r.g.length; i++){
      const p1 = r.g[i-1], p2 = r.g[i];
      const cx0 = Math.floor(Math.min(p1[0],p2[0])/CELL), cx1 = Math.floor(Math.max(p1[0],p2[0])/CELL);
      const cy0 = Math.floor(Math.min(p1[1],p2[1])/CELL), cy1 = Math.floor(Math.max(p1[1],p2[1])/CELL);
      const cand = new Set();
      for (let cx = cx0; cx <= cx1; cx++) for (let cy = cy0; cy <= cy1; cy++){
        const a = grid.get(cx + "_" + cy);
        if (a) for (const it of a) cand.add(it[0] + ":" + it[1]);
      }
      for (const key of cand){
        const parts = key.split(":");
        const b = borders[+parts[0]], j = +parts[1];
        const hit = segIntersect(p1, p2, b.g[j-1], b.g[j]);
        if (!hit) continue;
        /* one point per river per boundary pair, at 3 decimal places */
        const dedupe = (r.he || r.en || ri) + "|" + b.a + b.b + "|" +
                       hit[0].toFixed(3) + "," + hit[1].toFixed(3);
        if (seen.has(dedupe)) continue;
        seen.add(dedupe);
        /* which side is upstream: the start of this segment */
        out.push({ lon:+hit[0].toFixed(5), lat:+hit[1].toFixed(5),
                   reach:ri, he:r.he, en:r.en, a:b.a, b:b.b, cls:b.cls });
      }
    }
  }
  return out;
}

/* Which country a point sits in, decided by which side of the boundary it
   falls on, is more than this map should assert. Instead each crossing
   names the boundary it crosses, in the source's own words. */
function crossingLabel(c){
  return c.a + " \u2013 " + c.b;
}


/* ============================================================
   Israel first
   ------------------------------------------------------------
   This is a map of Israel's streams. Water in Lebanon, Syria,
   Jordan or Sinai earns its place only by crossing Israel's own
   border — and then the whole of that stream is drawn, as far as
   it runs, because half a river is not an answer.

   "Inside" is not a judgement this map makes. It is two published
   descriptions taken together, and a reach has to fall outside
   both: the extent Natural Earth draws, and the footprint of the
   Water Authority's own stream layer with a couple of kilometres
   of slack for a coarse edge.

   Which countries, which borders and whether foreign water is
   kept at all are read from SCOPE, not hard-coded here, so the
   same code covers a wider region unchanged.
   ============================================================ */
const DOM_CELL = 0.02;                     /* ~2 km */

/* The authoritative layer's own footprint, dilated by SCOPE.home.nearKm.
   Held to one cell of slack, not the two it used to carry: four kilometres
   of tolerance was enough to swallow whole Syrian and Jordanian wadis
   running parallel to the border. */
function domesticIndex(official){
  const core = new Set();
  for (const r of official)
    for (const p of r.g)
      core.add(Math.round(p[0]/DOM_CELL) + "_" + Math.round(p[1]/DOM_CELL));
  const rad = Math.max(1, Math.round((SCOPE.home.nearKm || 2) / 2.2));
  const out = new Set();
  for (const k of core){
    const parts = k.split("_"), cx = +parts[0], cy = +parts[1];
    for (let dx = -rad; dx <= rad; dx++)
      for (let dy = -rad; dy <= rad; dy++)
        out.add((cx+dx) + "_" + (cy+dy));
  }
  return out;
}

/* ---------- the mapped extent, as a set of rings ----------
   Ray casting, with a bounding box per ring so the common case — a point
   nowhere near — costs two comparisons. Israel's extent as Natural Earth
   draws it: 3 rings, 352 vertices, simplified to about 400 m. */
function ringBoxes(rings){
  return rings.map(g => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of g){
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return [x0, y0, x1, y1];
  });
}
let HOME_BOX = null;
function inHome(x, y, rings){
  if (!rings || !rings.length) return false;
  if (!HOME_BOX) HOME_BOX = ringBoxes(rings);
  let inside = false;
  for (let k = 0; k < rings.length; k++){
    const b = HOME_BOX[k];
    if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
    const g = rings[k];
    for (let i = 0, j = g.length - 1; i < g.length; j = i++){
      const xi = g[i][0], yi = g[i][1], xj = g[j][0], yj = g[j][1];
      if ((yi > y) !== (yj > y) &&
          x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
  }
  return inside;
}

/* A reach is domestic when most of it is: inside the mapped extent, or on
   top of the authoritative network. Sampled along its length rather than
   at the midpoint alone, which was the old test and let any foreign stream
   whose middle happened to fall near the border pass as Israeli. */
const DOM_FRAC = 0.4;
function isDomestic(g, idx){
  const rings = SCOPE.home.rings;
  const useOfficial = SCOPE.home.official !== false;
  const n = Math.min(g.length, 9);
  let hit = 0, tot = 0;
  for (let k = 0; k < n; k++){
    const p = g[Math.round(k * (g.length - 1) / Math.max(1, n - 1))];
    tot++;
    if (inHome(p[0], p[1], rings)) { hit++; continue; }
    if (useOfficial &&
        idx.has(Math.round(p[0]/DOM_CELL) + "_" + Math.round(p[1]/DOM_CELL))) hit++;
  }
  return tot > 0 && hit / tot >= DOM_FRAC;
}

/* Keep a foreign reach only if it belongs to a watercourse that reaches
   Israel: it crosses the border itself, or it joins end-to-end with one
   that does. Everything else — Syrian streams that never come near, wadis
   that stay in Sinai — is dropped before it is ever drawn. */
function keepIsraeliAndCrossing(osm, official, borders){
  if (SCOPE.foreignPolicy === "all") return osm;
  /* nothing to test "inside" against: keep everything rather than invent a rule */
  const hasRings = SCOPE.home.rings && SCOPE.home.rings.length;
  if (!hasRings && !official.length) return osm;
  HOME_BOX = null;
  const dom = domesticIndex(official);
  const keep = new Array(osm.length).fill(false);
  const foreign = [];
  for (let i = 0; i < osm.length; i++){
    if (isDomestic(osm[i].g, dom)) keep[i] = true;
    else foreign.push(i);
  }
  if (!foreign.length) return osm.filter((r, i) => keep[i]);

  /* which foreign reaches actually touch one of Israel's borders */
  const crossed = new Set();
  const sub = foreign.map(i => osm[i]);
  for (const c of findCrossings(sub, borders)) crossed.add(foreign[c.reach]);

  /* join foreign reaches end-to-end, then flood out from the ones that cross */
  const NEAR = 0.008;                       /* ~800 m */
  const grid = new Map();
  for (const i of foreign){
    const g = osm[i].g;
    for (const p of [g[0], g[g.length-1]]){
      const cx = Math.round(p[0]/NEAR), cy = Math.round(p[1]/NEAR);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++){
        const k = (cx+dx) + "_" + (cy+dy);
        let a = grid.get(k); if (!a){ a = []; grid.set(k, a); }
        a.push(i);
      }
    }
  }
  const adj = new Map();
  for (const a of grid.values())
    for (const i of a) for (const j of a){
      if (i === j) continue;
      let s = adj.get(i); if (!s){ s = new Set(); adj.set(i, s); }
      s.add(j);
    }
  const stack = Array.from(crossed), seen = new Set(stack);
  while (stack.length){
    const i = stack.pop();
    keep[i] = true;
    const nb = adj.get(i);
    if (!nb) continue;
    for (const j of nb) if (!seen.has(j)){ seen.add(j); stack.push(j); }
  }
  return osm.filter((r, i) => keep[i]);
}

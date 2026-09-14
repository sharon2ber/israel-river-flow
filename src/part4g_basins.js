

/* ============================================================
   Drainage basins — asking the rain question properly
   ------------------------------------------------------------
   Until now the map asked "did it rain on this stream's 5 km
   model cell". That is not the hydrological question. Water
   reaches a channel from its catchment, which may be a hundred
   times the size of one grid cell and shaped nothing like it.
   Asking per cell is what made the rain evidence flicker along a
   river, and carrying it downstream along the chain was a patch
   over a question that was wrong to begin with.

   Israel's national GIS publishes the real answer: 191 drainage
   basins, with names, areas, and — the part that matters — a
   topology. Each basin carries DRAIN_TO, naming the basin it
   empties into. That is a graph, and it lets the map ask what it
   should have been asking all along: how much rain has fallen
   anywhere in this stream's catchment, including every basin
   that drains into it.

   Source: opendata:Nikuz, govmap.gov.il open WFS. Fetched once
   and cached like the stream network; 2.4 MB raw, simplified to
   about 500 m on arrival, which is far finer than a question
   about catchments needs.
   ============================================================ */
const GOVMAP_WFS = "https://open.govmap.gov.il/geoserver/opendata/wfs";
const BASIN_SIMPLIFY = 0.005;          /* ~500 m; these are big polygons */

function wfsUrl(typeName, opts){
  return GOVMAP_WFS + "?service=WFS&version=2.0.0&request=GetFeature" +
    "&typeNames=" + typeName + "&outputFormat=application/json&srsName=EPSG:4326" +
    (opts || "");
}

async function fetchBasins(){
  const r = await fetchWithTimeout(wfsUrl("opendata:Nikuz", "&count=500"), {}, 60000);
  if (!r.ok) throw new Error("govmap HTTP " + r.status);
  const j = await r.json();
  const out = [];
  for (const f of (j.features || [])){
    const p = f.properties || {}, g = f.geometry;
    if (!g) continue;
    const polys = g.type === "MultiPolygon" ? g.coordinates : [g.coordinates];
    const rings = [];
    for (const poly of polys){
      const outer = poly[0];
      if (!outer || outer.length < 4) continue;
      const s = rdpRing(outer.map(c => [+c[0], +c[1]]), BASIN_SIMPLIFY);
      if (s.length >= 4) rings.push(s);
    }
    if (!rings.length) continue;
    out.push({
      code: String(p.BASIN_CODE == null ? "" : p.BASIN_CODE),
      to:   String(p.DRAIN_TO == null ? "" : p.DRAIN_TO),
      he:   (p.FNAME || "").trim(),
      en:   (p.LATIN_NAME || "").trim(),
      km2:  +p.ORIG_AREA || null,
      g: rings
    });
  }
  return out;
}

/* ---------- which basin a point is in ---------- */
let BASIN_BOX = null;
function basinBoxes(list){
  return list.map(b => {
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const ring of b.g) for (const p of ring){
      if (p[0] < x0) x0 = p[0];
      if (p[0] > x1) x1 = p[0];
      if (p[1] < y0) y0 = p[1];
      if (p[1] > y1) y1 = p[1];
    }
    return [x0, y0, x1, y1];
  });
}
function pointInRing(x, y, g){
  let inside = false;
  for (let i = 0, j = g.length - 1; i < g.length; j = i++){
    const xi = g[i][0], yi = g[i][1], xj = g[j][0], yj = g[j][1];
    if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
function basinAt(lon, lat){
  const list = S.basins;
  if (!list || !list.length) return null;
  if (!BASIN_BOX) BASIN_BOX = basinBoxes(list);
  for (let i = 0; i < list.length; i++){
    const b = BASIN_BOX[i];
    if (lon < b[0] || lon > b[2] || lat < b[1] || lat > b[3]) continue;
    for (const ring of list[i].g)
      if (pointInRing(lon, lat, ring)) return i;
  }
  return null;
}

/* ---------- the catchment graph ----------
   upstream[code] = every basin that eventually drains into it, itself
   included. Cycles are impossible in real drainage and would be a data
   error here, so the walk guards against them rather than trusting. */
function buildBasinGraph(){
  const list = S.basins || [];
  const byCode = new Map();
  list.forEach((b, i) => { if (b.code) byCode.set(b.code, i); });
  const feeds = new Map();                 /* code -> [codes draining into it] */
  for (const b of list){
    if (!b.to || b.to === b.code) continue;
    let a = feeds.get(b.to); if (!a){ a = []; feeds.set(b.to, a); }
    a.push(b.code);
  }
  const up = new Map();
  for (const b of list){
    const seen = new Set([b.code]);
    const stack = [b.code];
    while (stack.length){
      const c = stack.pop();
      for (const f of (feeds.get(c) || []))
        if (!seen.has(f)){ seen.add(f); stack.push(f); }
    }
    up.set(b.code, Array.from(seen));
  }
  S.basinByCode = byCode;
  S.basinUp = up;
  /* every model cell, filed under the basin it sits in */
  const cells = new Map();
  for (const c of S.flow.keys()){
    const p = cellCenter(c);
    const bi = basinAt(p[1], p[0]);
    if (bi == null) continue;
    const code = list[bi].code;
    let a = cells.get(code); if (!a){ a = []; cells.set(code, a); }
    a.push(c);
  }
  S.basinCells = cells;
  return { basins: list.length, withCells: cells.size };
}

/* The wettest cell anywhere in this basin's catchment, upstream included.
   Deliberately the maximum and not the mean: the question is whether water
   could be moving in this channel at all, and one wet sub-basin is enough
   for that. The threshold it is compared against is generous for the same
   reason. */
function catchmentRain(basinIdx, dateISO){
  if (basinIdx == null || !S.basins || !S.basinUp) return null;
  const b = S.basins[basinIdx];
  if (!b) return null;
  const codes = S.basinUp.get(b.code) || [b.code];
  let best = null, cells = 0;
  for (const code of codes){
    for (const c of (S.basinCells.get(code) || [])){
      const r = rainBefore(c, dateISO);
      cells++;
      if (r && (best == null || r.mm > best)) best = r.mm;
    }
  }
  return best == null ? null : { mm: +best.toFixed(1), basins: codes.length, cells: cells };
}


function assignBasins(){
  if (!S.basins || !S.basins.length) return 0;
  let n = 0;
  for (const r of S.reaches){
    const m = r.g[Math.floor(r.g.length/2)];
    r.basin = basinAt(m[0], m[1]);
    if (r.basin != null) n++;
  }
  return n;
}
function basinName(i){
  const b = S.basins && S.basins[i];
  if (!b) return null;
  return LANG === "he" ? (b.he || b.en) : (b.en || b.he);
}

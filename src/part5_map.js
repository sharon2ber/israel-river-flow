
/* ============================================================
   Map, canvas renderer, interaction
   ============================================================ */
const $ = s => document.querySelector(s);
const el = (t,c) => { const e = document.createElement(t); if (c) e.className = c; return e; };

/* The map pans and zooms anywhere — there is no fence around Israel. Data
   is only fetched for SCOPE.fetchBox, so elsewhere you get the basemap and
   nothing drawn on it, which is the honest result. A home button returns
   to the scope's own view. */
const map = L.map("map", {
  center: CENTER, zoom: ZOOM,
  minZoom: SCOPE.view.min, maxZoom: SCOPE.view.max,
  worldCopyJump: true,
  zoomControl: false, attributionControl: true,
  preferCanvas: true
});
L.control.zoom({ position: "topleft" }).addTo(map);

const HomeCtl = L.Control.extend({
  options: { position: "topleft" },
  onAdd: function(){
    const c = L.DomUtil.create("div", "leaflet-bar");
    const a = L.DomUtil.create("a", "", c);
    a.href = "#"; a.id = "homebtn"; a.innerHTML = "\u2302";
    a.style.fontSize = "18px"; a.style.lineHeight = "26px";
    L.DomEvent.on(a, "click", function(e){
      L.DomEvent.stop(e);
      map.setView(SCOPE.view.center, SCOPE.view.zoom);
    });
    L.DomEvent.disableClickPropagation(c);
    return c;
  }
});
map.addControl(new HomeCtl());

/* ---------- basemaps ----------
   All tiles come from Esri's open ArcGIS Online services. CARTO was dropped:
   its keyless basemap now serves tiles stamped API KEY REQUIRED. Each entry
   carries a fallback, and a probe tile decides at load time. */
const ESRI = "https://server.arcgisonline.com/ArcGIS/rest/services/";
const ESRI_ATTR = "Esri";
const OSM_ATTR = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const BASEMAPS = {
  dark: { surf:"dark", max:16,
    url: ESRI + "Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
    ref: ESRI + "Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    alt: { url:"https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png", sub:"abcd", max:20, ref:null },
    attr: ESRI_ATTR + ", HERE, Garmin, " + OSM_ATTR },
  hill: { surf:"light", max:16,
    url: ESRI + "Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}",
    ref: ESRI + "Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
    attr: "Hillshade: " + ESRI_ATTR + ", USGS, NOAA" },
  topo: { surf:"light", max:17, sub:"abc",
    url: "https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png",
    attr: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA), ' + OSM_ATTR },
  sat:  { surf:"light", max:19,
    url: ESRI + "World_Imagery/MapServer/tile/{z}/{y}/{x}",
    ref: ESRI + "Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
    attr: "Imagery: " + ESRI_ATTR + ", Maxar, Earthstar Geographics" }
};
const BASE_ORDER = ["dark", "hill", "topo", "sat"];

/* one tile, to find out whether a service is actually serving */
function probeTile(url, sub){
  return new Promise(res => {
    const u = url.replace("{z}", "9").replace("{y}", "205").replace("{x}", "307")
                 .replace("{s}", (sub || "a")[0]).replace("{r}", "");
    const img = new Image();
    let done = false;
    const fin = ok => { if (!done){ done = true; res(ok); } };
    img.onload  = () => fin(img.naturalWidth > 1);
    img.onerror = () => fin(false);
    setTimeout(() => fin(false), 9000);
    img.src = u;
  });
}
async function pickTiles(id){
  const b = BASEMAPS[id];
  if (b._picked) return b._picked;
  let choice = { url:b.url, sub:b.sub, max:b.max, ref:b.ref };
  if (!(await probeTile(b.url, b.sub)) && b.alt) choice = b.alt;
  b._picked = choice;
  return choice;
}

let baseLayer = null, labelLayer = null;
async function setBasemap(id){
  if (!BASEMAPS[id]) id = "dark";
  const b = BASEMAPS[id];
  const t = await pickTiles(id);
  if (baseLayer) map.removeLayer(baseLayer);
  if (labelLayer){ map.removeLayer(labelLayer); labelLayer = null; }
  baseLayer = L.tileLayer(t.url, { subdomains: t.sub || "abc", maxZoom: 20,
    maxNativeZoom: t.max, detectRetina: false, attribution: b.attr }).addTo(map);
  if (t.ref && S.layers.labels)
    labelLayer = L.tileLayer(t.ref, { subdomains: t.sub || "abc", maxZoom: 20,
      maxNativeZoom: t.max, detectRetina: false, pane: "shadowPane" }).addTo(map);
  SURF = b.surf;
  document.body.dataset.surf = b.surf;
  S.basemap = id;
  try{ localStorage.setItem("rfil_base", id); }catch(e){}
  if (typeof buildLegend === "function") buildLegend();
  invalidate();
}

/* ---------- state ---------- */
const S = {
  reaches: [], water: { polys: [], dams: [] },
  flow: new Map(),          // cellKey -> {t:[iso], q:[num]}
  rain: new Map(),          // cellKey -> {t:[iso], p:[mm]} — the independent check
  radar: new Map(),         // cellKey -> {wet, frac} — what the radar sees right now
  basins: [], basinUp: null, basinCells: null, basinByCode: null,
  times: [], dayIdx: 0, todayIdx: 0,
  speed: 1.0, minQ: -1,
  /* Nothing is on at the start. The map opens as the river network and a
     basemap, and everything else is something the reader chooses to add. */
  layers: { stations: false, water: false, names: false, anom: false, sampling: false,
            labels: false, borders: false, crossings: false, trans: false, springs: false,
            radar: false },
  hover: -1, sel: -1, selKind: null,
  basemap: "dark", sampling: [], groups: new Map(),
  borders: [], crossings: [], cellEl: {},
  anom: new Map()           // reach index -> percentile
};

/* ---------- canvas ---------- */
const cvs = L.DomUtil.create("canvas", "riv leaflet-zoom-hide");
map.getPanes().overlayPane.appendChild(cvs);
const ctx = cvs.getContext("2d");
/* Everything that does not move — water bodies, the static stroke of each
   reach, dams and labels — is rendered once into an offscreen canvas and
   blitted each frame, so only the travelling dashes are re-stroked. */
const base = document.createElement("canvas");
const bctx = base.getContext("2d");
let baseDirty = true;
const invalidate = () => { baseDirty = true; };
let DPR = 1, VW = 0, VH = 0;
let P = [];               // per reach: Float32Array of container coords
let BB2 = [];             // per reach: [minx,miny,maxx,maxy]
let GRIDIDX = new Map();  // pick grid
const CELLPX = 26;

function projector(){
  const z = map.getZoom();
  const scale = 256 * Math.pow(2, z);
  const pb = map.getPixelBounds();
  const ox = pb.min.x, oy = pb.min.y;
  const R = Math.PI / 180;
  return function(lon, lat){
    const x = (lon + 180) / 360 * scale - ox;
    const s = Math.sin(lat * R);
    const y = (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * scale - oy;
    return [x, y];
  };
}

function reset(){
  const size = map.getSize();
  VW = size.x; VH = size.y;
  DPR = Math.min(window.devicePixelRatio || 1, 2);
  cvs.width = VW * DPR; cvs.height = VH * DPR;
  cvs.style.width = VW + "px"; cvs.style.height = VH + "px";
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  base.width = cvs.width; base.height = cvs.height;
  bctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  baseDirty = true;
  L.DomUtil.setPosition(cvs, map.containerPointToLayerPoint([0, 0]));

  const pr = projector();
  P = new Array(S.reaches.length);
  BB2 = new Array(S.reaches.length);
  GRIDIDX = new Map();
  for (let i = 0; i < S.reaches.length; i++){
    const g = S.reaches[i].g, n = g.length;
    const a = new Float32Array(n * 2);
    let minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    for (let j = 0; j < n; j++){
      const p = pr(g[j][0], g[j][1]);
      a[j*2] = p[0]; a[j*2+1] = p[1];
      if (p[0] < minx) minx = p[0]; if (p[0] > maxx) maxx = p[0];
      if (p[1] < miny) miny = p[1]; if (p[1] > maxy) maxy = p[1];
    }
    P[i] = a; BB2[i] = [minx, miny, maxx, maxy];
    if (maxx < -40 || minx > VW + 40 || maxy < -40 || miny > VH + 40) continue;
    for (let j = 0; j < n; j++){
      const cx = Math.floor(a[j*2] / CELLPX), cy = Math.floor(a[j*2+1] / CELLPX);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++){
        const k = (cx+dx) + ":" + (cy+dy);
        let arr = GRIDIDX.get(k);
        if (!arr){ arr = []; GRIDIDX.set(k, arr); }
        if (arr[arr.length-1] !== i) arr.push(i);
      }
    }
  }
  WP = S.water.polys.map(w => {
    const a = new Float32Array(w.g.length * 2);
    for (let j = 0; j < w.g.length; j++){ const p = pr(w.g[j][0], w.g[j][1]); a[j*2]=p[0]; a[j*2+1]=p[1]; }
    a.km2 = w.a || 0;
    a.wet = w.wet ? 1 : 0;
    return a;
  });
  DP = S.water.dams.map(d => pr(d.lon, d.lat));
  BP = S.borders.map(b => {
    const a = new Float32Array(b.g.length * 2);
    for (let j = 0; j < b.g.length; j++){ const p = pr(b.g[j][0], b.g[j][1]); a[j*2]=p[0]; a[j*2+1]=p[1]; }
    a.cls = b.cls;
    return a;
  });
  XP = S.crossings.map(c => pr(c.lon, c.lat));
  TP = [];
  for (let i = 0; i < S.reaches.length; i++){
    const r = S.reaches[i];
    if (!r.trans) continue;
    const g = r.g[0];
    const p = pr(g[0], g[1]);
    p.i = i;
    TP.push(p);
  }
}
let WP = [], DP = [], BP = [], XP = [], TP = [];

/* The value a reach is allowed to show — after the reliability pass has
   smoothed the grid, and after the evidence pass has decided whether the
   number is corroborated at all. Everything downstream reads this, never
   the raw model output. */
function qOf(i){
  const r = S.reaches[i];
  if (!r) return null;
  if (r.ev === undefined) return r.qShow === undefined ? null : r.qShow;
  return shownQ(i);
}

/* ---------- draw ---------- */
let t0 = performance.now();
const QMID = [null, 0, 0.02, 0.2, 1, 8, 90, null];
let groups = [];   // 0 no data, 1 dry, 2..6 bins, 7 unverified

function classify(z){
  groups = [];
  for (let i = 0; i < NCLASS; i++) groups.push([]);
  for (let i = 0; i < S.reaches.length; i++){
    const b = BB2[i];
    if (!b || b[2] < -40 || b[0] > VW+40 || b[3] < -40 || b[1] > VH+40) continue;
    const q = qOf(i);
    if (S.minQ >= 0 && !(q >= S.minQ)) continue;
    const gk = S.reaches[i].groupKm || S.reaches[i].km;
    if (z < 9 && gk < 4) continue;
    if (z < 8 && gk < 9) continue;
    /* the evidence pass decides the class; classOf is only the fallback
       for the moment before rain has arrived */
    const c = S.reaches[i].cls;
    groups[c === undefined ? classOf(q) : c].push(i);
  }
}

function path(c, list){
  c.beginPath();
  for (const i of list){
    const a = P[i], n = a.length/2;
    c.moveTo(a[0], a[1]);
    for (let j = 1; j < n; j++) c.lineTo(a[j*2], a[j*2+1]);
  }
}

function drawBase(z){
  bctx.clearRect(0, 0, VW, VH);
  if (S.layers.borders && BP.length){
    bctx.save();
    for (const a of BP){
      bctx.beginPath();
      bctx.moveTo(a[0], a[1]);
      for (let j = 1; j < a.length/2; j++) bctx.lineTo(a[j*2], a[j*2+1]);
      const solid = a.cls === "int";
      bctx.setLineDash(solid ? [] : [6, 5]);
      bctx.strokeStyle = pal().border;
      bctx.globalAlpha = solid ? 0.55 : 0.42;
      bctx.lineWidth = 1.1;
      bctx.stroke();
    }
    bctx.restore();
  }
  if (S.layers.water && WP.length){
    /* only show basins big enough to read at this zoom */
    const minA = z <= 9 ? 0.6 : z === 10 ? 0.2 : z === 11 ? 0.06 : 0;
    const ring = a => {
      bctx.moveTo(a[0], a[1]);
      for (let j = 1; j < a.length/2; j++) bctx.lineTo(a[j*2], a[j*2+1]);
      bctx.closePath();
    };
    /* permanent natural lakes: filled, because there really is water in them */
    bctx.fillStyle = pal().water;
    bctx.strokeStyle = pal().waterEdge;
    bctx.lineWidth = 0.8;
    bctx.beginPath();
    for (const a of WP) if (a.wet && a.length >= 6 && a.km2 >= minA) ring(a);
    bctx.fill(); bctx.stroke();
    /* everything else is a basin whose contents this map does not know:
       reservoirs, winter-fill ponds, evaporation and sewage basins. The
       outline is real; the water would be an invention. */
    bctx.fillStyle = pal().dryWater;
    bctx.strokeStyle = pal().dryWaterEdge;
    bctx.lineWidth = 1;
    bctx.setLineDash([4, 3]);
    bctx.beginPath();
    for (const a of WP) if (!a.wet && a.length >= 6 && a.km2 >= minA) ring(a);
    bctx.fill(); bctx.stroke();
    bctx.setLineDash([]);
  }
  bctx.lineCap = "round"; bctx.lineJoin = "round";
  for (let gi = 0; gi < NCLASS; gi++){
    if (!groups[gi].length) continue;
    path(bctx, groups[gi]);
    bctx.globalAlpha = gi === CLS_UNKNOWN ? 0.34 : gi === CLS_DRY ? 0.68
                     : gi === CLS_UNVER ? 0.72 : 0.78;
    bctx.strokeStyle = classCol(gi);
    bctx.lineWidth = (gi === CLS_UNKNOWN || gi === CLS_DRY) ? Math.max(0.75, (z-6)*0.34)
                   : gi === CLS_UNVER ? Math.max(1.0, (z-6)*0.42)
                   : widOf(QMID[gi], z);
    bctx.setLineDash(classDash(gi));
    bctx.stroke();
    bctx.setLineDash([]);
  }
  bctx.globalAlpha = 1;
  drawDams(bctx, z);
  drawCrossings(bctx, z);
  drawTransitions(bctx, z);
  drawNames(bctx, z);
}

/* A river changes state at most once along its length, and this is where.
   An open ring rather than a filled mark: it is a boundary on the line, not
   a thing sitting on the ground. */
function drawTransitions(c, z){
  if (!S.layers.trans || !TP.length || z < 9) return;
  const rr = z >= 12 ? 5.5 : 4.5;
  for (const p of TP){
    if (p[0] < -10 || p[0] > VW+10 || p[1] < -10 || p[1] > VH+10) continue;
    c.beginPath();
    c.arc(p[0], p[1], rr, 0, Math.PI*2);
    c.lineWidth = 2.4; c.strokeStyle = pal().halo; c.globalAlpha = 0.9; c.stroke();
    c.lineWidth = 1.5; c.strokeStyle = pal().label; c.globalAlpha = 1; c.stroke();
  }
  c.globalAlpha = 1;
}

/* a small diamond wherever a watercourse meets a boundary */
function drawCrossings(c, z){
  if (!S.layers.crossings || !XP.length) return;
  const s = z >= 11 ? 6 : z >= 9 ? 5 : 4;
  for (const p of XP){
    if (p[0] < -10 || p[0] > VW+10 || p[1] < -10 || p[1] > VH+10) continue;
    c.beginPath();
    c.moveTo(p[0], p[1]-s); c.lineTo(p[0]+s, p[1]);
    c.lineTo(p[0], p[1]+s); c.lineTo(p[0]-s, p[1]);
    c.closePath();
    c.fillStyle = pal().cross;
    c.globalAlpha = 0.95; c.fill();
    c.lineWidth = 1.2; c.strokeStyle = pal().halo; c.globalAlpha = 0.9; c.stroke();
  }
  c.globalAlpha = 1;
}

function draw(now){
  requestAnimationFrame(draw);
  const z = map.getZoom();
  if (baseDirty){ classify(z); drawBase(z); baseDirty = false; }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, cvs.width, cvs.height);
  ctx.drawImage(base, 0, 0);
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  const off = ((now - t0) / 1000) * 26 * S.speed;
  const anomOn = S.layers.anom;

  ctx.lineCap = "round"; ctx.lineJoin = "round";
  if (S.speed > 0){
    for (let gi = CLS_QLO; gi <= CLS_QHI; gi++){
      if (!groups[gi].length) continue;
      const w = widOf(QMID[gi], z);
      const dash = Math.max(3, w * 2.4), gap = Math.max(9, w * 8);
      path(ctx, groups[gi]);
      ctx.setLineDash([dash, gap]);
      ctx.lineDashOffset = -off % (dash + gap);
      ctx.globalAlpha = 0.95;
      ctx.lineWidth = w * 1.05;
      ctx.strokeStyle = classCol(gi);
      ctx.stroke();
    }
  }
  ctx.setLineDash([]); ctx.globalAlpha = 1;

  /* flow vs normal overlay */
  if (anomOn && S.anom.size){
    for (const [i, p] of S.anom){
      const b = BB2[i];
      if (!b || b[2] < -40 || b[0] > VW+40 || b[3] < -40 || b[1] > VH+40) continue;
      const a = P[i], n = a.length/2;
      ctx.beginPath(); ctx.moveTo(a[0], a[1]);
      for (let j = 1; j < n; j++) ctx.lineTo(a[j*2], a[j*2+1]);
      ctx.strokeStyle = anomColour(p);
      ctx.lineWidth = Math.max(2.4, widOf(qOf(i), z) * 1.5);
      ctx.globalAlpha = 0.9;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  /* hover / selection highlight — the whole named river, not one fragment */
  const hi = S.hover >= 0 ? S.hover : (S.selKind === "reach" ? S.sel : -1);
  if (hi >= 0 && P[hi]){
    ctx.strokeStyle = "#ffd24a";
    ctx.lineWidth = Math.max(2.5, widOf(qOf(hi), z) * 1.8);
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    for (const i of groupOf(hi)){
      const a = P[i]; if (!a) continue;
      const b = BB2[i];
      if (!b || b[2] < -60 || b[0] > VW+60 || b[3] < -60 || b[1] > VH+60) continue;
      const n = a.length/2;
      ctx.moveTo(a[0], a[1]);
      for (let j = 1; j < n; j++) ctx.lineTo(a[j*2], a[j*2+1]);
    }
    ctx.stroke(); ctx.globalAlpha = 1;
  }

}

function drawDams(c, z){
  if (!(S.layers.water && z >= 9)) return;
  c.fillStyle = pal().dam; c.globalAlpha = 0.85;
  for (const p of DP){
    if (p[0] < -10 || p[0] > VW+10 || p[1] < -10 || p[1] > VH+10) continue;
    const s = 4;
    c.beginPath(); c.moveTo(p[0], p[1]-s); c.lineTo(p[0]+s, p[1]+s*0.8);
    c.lineTo(p[0]-s, p[1]+s*0.8); c.closePath(); c.fill();
  }
  c.globalAlpha = 1;
}

function drawNames(ctx, z){
  if (S.layers.names && z >= 8){
    const minKm = z >= 12 ? 0.6 : z >= 11 ? 1.5 : z >= 10 ? 3 : z >= 9 ? 7 : 14;
    ctx.font = "600 11px " + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const placed = [];
    for (let i = 0; i < S.reaches.length; i++){
      const r = S.reaches[i];
      if (r.km < minKm) continue;
      const nm = LANG === "he" ? (r.he || r.en) : (r.en || r.he);
      if (!nm) continue;
      const b = BB2[i];
      if (!b || b[2] < 0 || b[0] > VW || b[3] < 0 || b[1] > VH) continue;
      const a = P[i], n = a.length/2, m = Math.floor(n/2);
      const x = a[m*2], y = a[m*2+1];
      if (x < 40 || x > VW-40 || y < 20 || y > VH-20) continue;
      let skip = false;
      for (const p of placed) if (Math.abs(p[0]-x) < 70 && Math.abs(p[1]-y) < 15){ skip = true; break; }
      if (skip) continue;
      placed.push([x, y]);
      const m2 = Math.min(n-1, m+1);
      let ang = Math.atan2(a[m2*2+1]-y, a[m2*2]-x);
      if (ang > Math.PI/2) ang -= Math.PI; if (ang < -Math.PI/2) ang += Math.PI;
      ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
      ctx.lineWidth = 3; ctx.strokeStyle = pal().halo;
      ctx.strokeText(nm, 0, -8); ctx.fillStyle = pal().label; ctx.fillText(nm, 0, -8);
      ctx.restore();
    }
  }
}

/* ---------- named rivers ----------
   The official layer ships each river as many separate line features, so
   hovering one fragment should light up, and report on, the whole river. */
function nameKey(r){
  const k = (r.he || "") + "\u0001" + (r.en || "");
  return k === "\u0001" ? null : k;
}
function buildGroups(){
  S.groups = new Map();
  for (let i = 0; i < S.reaches.length; i++){
    const k = nameKey(S.reaches[i]);
    if (!k) continue;
    let a = S.groups.get(k);
    if (!a){ a = []; S.groups.set(k, a); }
    a.push(i);
  }
  /* The official layer chops a river into kilometre-long features, so
     deciding what to draw at country zoom by segment length would erase
     almost the whole network. Judge each segment by the river it belongs to. */
  for (const r of S.reaches) r.groupKm = r.km;
  for (const list of S.groups.values()){
    let tot = 0;
    for (const i of list) tot += S.reaches[i].km;
    for (const i of list) S.reaches[i].groupKm = tot;
  }
}
function groupOf(i){
  const k = nameKey(S.reaches[i]);
  return k && S.groups.has(k) ? S.groups.get(k) : [i];
}
function groupStats(i){
  const list = groupOf(i);
  let km = 0, hi = null, lo = null, best = -1, bestQ = -1;
  for (const j of list){
    const r = S.reaches[j];
    km += r.km;
    const q = qOf(j);
    if (q != null && q > bestQ){ bestQ = q; best = j; }
    if (r.hiEl != null && (hi == null || r.hiEl > hi)) hi = r.hiEl;
    if (r.loEl != null && (lo == null || r.loEl < lo)) lo = r.loEl;
  }
  return { n:list.length, km:km, hi:hi, lo:lo, outlet: best >= 0 ? best : i, q: bestQ >= 0 ? bestQ : null };
}

/* ---------- picking ---------- */
function pick(x, y){
  const k = Math.floor(x/CELLPX) + ":" + Math.floor(y/CELLPX);
  const cand = GRIDIDX.get(k);
  if (!cand) return -1;
  let best = -1, bestD = 14 * 14;
  for (const i of cand){
    const a = P[i], n = a.length/2;
    for (let j = 1; j < n; j++){
      const d = seg2(x, y, a[(j-1)*2], a[(j-1)*2+1], a[j*2], a[j*2+1]);
      if (d < bestD){ bestD = d; best = i; }
    }
  }
  return best;
}
/* which water polygon, if any, is under the cursor — smallest wins, so a
   reservoir drawn inside a bigger outline is still reachable */
function pickWater(x, y){
  if (!S.layers.water) return -1;
  let best = -1, bestA = Infinity;
  for (let i = 0; i < WP.length; i++){
    const a = WP[i], n = a.length/2;
    if (n < 3 || a.km2 >= bestA) continue;
    let inside = false;
    for (let j = 0, k = n-1; j < n; k = j++){
      const xj = a[j*2], yj = a[j*2+1], xk = a[k*2], yk = a[k*2+1];
      if ((yj > y) !== (yk > y) && x < (xk-xj) * (y-yj) / (yk-yj) + xj) inside = !inside;
    }
    if (inside){ best = i; bestA = a.km2; }
  }
  return best;
}

function seg2(px, py, x1, y1, x2, y2){
  const dx = x2-x1, dy = y2-y1;
  const L2 = dx*dx + dy*dy;
  let t = L2 ? ((px-x1)*dx + (py-y1)*dy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = x1 + t*dx - px, ey = y1 + t*dy - py;
  return ex*ex + ey*ey;
}

/* ---------- radar overlay ----------
   Painted under the rivers, over the basemap: what the radar is seeing now. */
map.createPane("radarPane");
map.getPane("radarPane").style.zIndex = 350;
map.getPane("radarPane").style.opacity = 0.62;
let radarLayer = null;
function buildRadar(){
  if (radarLayer){ map.removeLayer(radarLayer); radarLayer = null; }
  const url = radarTileUrl(RADAR && RADAR.latest);
  if (!url) return;
  radarLayer = L.tileLayer(url, { pane:"radarPane", maxZoom:12, opacity:1,
    attribution:'Radar: <a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a>' });
  if (S.layers.radar) radarLayer.addTo(map);
}

/* ---------- springs ----------
   Sized by measured discharge, because the Dan at 7,437 l/s and a 5 l/s
   seep are not the same fact. Hollow, so they read as a source on the line
   rather than a station beside it. */
map.createPane("springPane");
map.getPane("springPane").style.zIndex = 617;
const springRenderer = L.canvas({ pane: "springPane", padding: 0.3 });
const springLayer = L.layerGroup();
/* At country zoom, 383 springs is a green smear over the Galilee. Rather than
   bundle a clustering library into a file that has no dependencies, show the
   sources that matter at the scale you are looking at: the Dan at national
   zoom, every seep at street zoom. A cluster bubble would tell you there are
   forty springs here; this tells you which one is the Dan. */
function springMinLs(z){
  return z <= 8 ? 100 : z === 9 ? 40 : z === 10 ? 20 : z === 11 ? 5 : 0;
}
function buildSprings(){
  springLayer.clearLayers();
  const list = springsList();
  const floor = springMinLs(map.getZoom());
  list.forEach((s, idx) => {
    const v = s[10] != null ? s[10] : s[7];
    if (v == null || v < floor) return;
    const r = v >= 500 ? 9 : v >= 100 ? 7 : v >= 20 ? 5.5 : v >= 5 ? 4.2 : 3.2;
    const live = springLive(s);
    L.circleMarker([s[2], s[1]], {
      renderer: springRenderer, radius: r,
      color: live ? "#3ec9a7" : "#7d8890",
      weight: live ? 2 : 1.2, opacity: 0.95,
      fillColor: "#3ec9a7", fillOpacity: live ? 0.18 : 0.06
    }).on("click", e => { L.DomEvent.stop(e); showSpring(idx); })
      .on("mouseover", e => {
        const nm = LANG === "he" ? (s[3] || s[4]) : (s[4] || s[3]);
        showTip(e.originalEvent, "<b>" + esc(nm) + "</b>" +
          '<div class="q"><bdi>' + (v == null ? "\u2014" : v.toFixed(1) + " l/s") + "</bdi></div>" +
          '<div class="m">' + esc(T("sp_layer")) + "</div>");
        overStation = true;
      })
      .on("mouseout", () => { hideTip(); overStation = false; })
      .addTo(springLayer);
  });
  if (S.layers.springs) springLayer.addTo(map);
}

/* ---------- pollution sampling points ---------- */
map.createPane("sampPane");
map.getPane("sampPane").style.zIndex = 615;
const sampRenderer = L.canvas({ pane: "sampPane", padding: 0.3 });
const samplingLayer = L.layerGroup();
function buildSampling(){
  samplingLayer.clearLayers();
  S.sampling.forEach((p, idx) => {
    const m = L.circleMarker([p.lat, p.lon], {
      radius: 4.6, color: "rgba(10,12,14,.9)", weight: 1.4,
      fillColor: "#3ec93e", fillOpacity: .95, renderer: sampRenderer
    });
    m.on("click", () => showSampling(idx));
    m.on("mouseover", ev => {
      overStation = true;
      showTip(ev.originalEvent, "<b>" + esc(p.point) + "</b>" +
        '<div class="m">' + T("samp_of") + " " + esc(p.stream) + "</div>");
    });
    m.on("mouseout", () => { overStation = false; hideTip(); });
    samplingLayer.addLayer(m);
  });
}

/* ---------- gauging stations ---------- */
map.createPane("stationPane");
map.getPane("stationPane").style.zIndex = 620;
const stRenderer = L.canvas({ pane: "stationPane", padding: 0.3 });
const stationLayer = L.layerGroup();
let overStation = false;
function nameOf(o){ return LANG === "he" ? (o.he || o.en || "") : (o.en || o.he || ""); }
function buildStations(){
  stationLayer.clearLayers();
  STATIONS.s.forEach((s, idx) => {
    const m = L.circleMarker([s[3], s[4]], {
      radius: 3.4, color: "rgba(13,15,17,.9)", weight: 1.3,
      fillColor: "#e0ae3a", fillOpacity: .9, renderer: stRenderer
    });
    m.on("click", () => showStation(idx));
    m.on("mouseover", ev => {
      overStation = true;
      const nm = LANG === "he" ? s[1] : (s[2] || s[1]);
      showTip(ev.originalEvent, "<b>" + esc(nm) + '</b><div class="m">' + T("st_id") + " " + s[0] + "</div>");
    });
    m.on("mouseout", () => { overStation = false; hideTip(); });
    stationLayer.addLayer(m);
  });
}

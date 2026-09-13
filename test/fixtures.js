/* Synthetic stand-ins for the live APIs, so the app can be exercised
   inside a sandbox that has no outbound network. Shapes copied from the
   real responses verified against overpass-api.de and open-meteo.com. */

function line(lon, lat, dlon, dlat, n){
  const g = [];
  for (let i = 0; i < n; i++)
    g.push({ lat: +(lat + dlat*i/n + Math.sin(i/2)*0.004).toFixed(6),
             lon: +(lon + dlon*i/n + Math.cos(i/3)*0.004).toFixed(6) });
  return g;
}
let id = 1000;
function way(nameHe, nameEn, waterway, intermittent, geom){
  return { type:"way", id:++id,
    tags:{ waterway, name:nameHe, "name:he":nameHe, "name:en":nameEn,
           intermittent: intermittent ? "yes" : undefined },
    geometry: geom };
}

const RIVERS = { version:0.6, elements:[
  way("נחל הירקון","Nahal Yarkon","river",false, line(34.79,32.10, 0.16, 0.02, 40)),
  way("נחל הירקון","Nahal Yarkon","river",false, line(34.95,32.12, 0.10, 0.01, 25)),
  way("נחל איילון","Nahal Ayalon","river",true,  line(34.83,31.95, 0.09, 0.16, 32)),
  way("נחל אלכסנדר","Nahal Alexander","river",false, line(34.87,32.40, 0.20, 0.01, 30)),
  way("נחל חדרה","Nahal Hadera","river",true,  line(34.90,32.46, 0.22,-0.02, 28)),
  way("נחל קישון","Nahal Qishon","river",false, line(35.20,32.62,-0.28, 0.13, 34)),
  way("נהר הירדן","Jordan River","river",false, line(35.62,33.10,-0.06,-0.60, 60)),
  way("נחל שורק","Nahal Soreq","river",true,  line(35.10,31.79,-0.45,-0.05, 45)),
  way("נחל לכיש","Nahal Lakhish","river",true,  line(34.90,31.62,-0.23, 0.13, 30)),
  way("נחל בשור","Nahal Besor","river",true,  line(34.90,31.10,-0.40, 0.28, 50)),
  /* two stubs ~40 km apart inside one drainage basin, as the real Water
     Authority layer has Nahal Paran: 6 features, 24.5 km, for a 150 km wadi */
  way("נחל פארן","Nahal Paran","river",true,  line(34.72,30.30, 0.03, 0.015, 6)),
  way("נחל פארן","Nahal Paran","river",true,  line(35.08,30.53, 0.05, 0.03, 8)),
  way("נחל צין","Nahal Zin","river",true,  line(34.80,30.80, 0.55, 0.10, 40)),
  way("נחל דן","Nahal Dan","stream",false, line(35.63,33.24,-0.03,-0.05, 12)),
  way("נחל שניר","Nahal Senir","stream",false, line(35.60,33.28,-0.05,-0.08, 14)),
  way("נחל תנינים","Nahal Taninim","stream",false, line(34.92,32.55, 0.12, 0.02, 16)),
  way("נחל עמוד","Nahal Ammud","stream",true,  line(35.50,32.95,-0.03,-0.20, 20)),
  way("נחל חרוד","Nahal Harod","stream",true,  line(35.30,32.55, 0.22,-0.03, 18)),
  way("נחל ערוגות","Nahal Arugot","stream",true,  line(35.15,31.45, 0.20, 0.01, 15)),
  way("תעלת אשלים","Ashalim Canal","canal",false, line(35.20,31.05, 0.10,-0.02, 10)),
  /* cross-border: Hasbani from Lebanon, Yarmouk from Syria/Jordan, El-Arish from Sinai */
  way("נחל שניר (חצבאני)","Hasbani","river",false, line(35.62,33.42,-0.02,-0.32, 24)),
  way("ירמוך","Yarmouk","river",false, line(36.10,32.72,-0.55,-0.06, 30)),
  way("ואדי אל־עריש","Wadi El-Arish","river",true, line(33.80,30.10, 0.90, 0.55, 40)),
  /* purely foreign: must be dropped, they never come near Israel */
  way("نهر بردى","Barada (Syria only)","river",false, line(36.45,33.60, 0.20, 0.10, 18)),
  way("وادي فيران","Wadi Feiran (Sinai only)","river",true, line(33.70,29.20, 0.25,-0.15, 16)),
  way("نهر الزرقاء","Zarqa (Jordan only)","river",false, line(36.35,32.10, 0.25, 0.12, 20))
]};

const WATER = { version:0.6, elements:[
  { type:"way", id:9001, tags:{ natural:"water", water:"lake", intermittent:"no", salt:"no", name:"ים כנרת", "name:en":"Sea of Galilee" },
    geometry:[{lat:32.90,lon:35.53},{lat:32.90,lon:35.65},{lat:32.72,lon:35.63},
              {lat:32.70,lon:35.52},{lat:32.82,lon:35.50},{lat:32.90,lon:35.53}] },
  { type:"way", id:9007, tags:{ natural:"water", name:"מאגר בזלת" },
    geometry:[{lat:32.90,lon:35.75},{lat:32.90,lon:35.80},{lat:32.86,lon:35.80},
              {lat:32.86,lon:35.75},{lat:32.90,lon:35.75}] },
  { type:"way", id:9005, tags:{ natural:"water", water:"reservoir", intermittent:"yes", name:"מאגר עונתי" },
    geometry:[{lat:31.30,lon:34.60},{lat:31.30,lon:34.66},{lat:31.26,lon:34.66},
              {lat:31.26,lon:34.60},{lat:31.30,lon:34.60}] },
  { type:"way", id:9006, tags:{ landuse:"salt_pond", name:"בריכות אידוי" },
    geometry:[{lat:30.98,lon:35.32},{lat:30.98,lon:35.40},{lat:30.92,lon:35.40},
              {lat:30.92,lon:35.32},{lat:30.98,lon:35.32}] },
  { type:"way", id:9002, tags:{ landuse:"reservoir", name:"מאגר כפר ברוך" },
    geometry:[{lat:32.68,lon:35.20},{lat:32.68,lon:35.24},{lat:32.65,lon:35.24},
              {lat:32.65,lon:35.20},{lat:32.68,lon:35.20}] },
  { type:"node", id:9003, lat:32.60, lon:35.18, tags:{ waterway:"dam", name:"סכר" } },
  { type:"node", id:9004, lat:31.80, lon:35.02, tags:{ waterway:"dam", name:"סכר בית זית" } }
]};

function floodFor(n){
  const days = [];
  const base = Date.now() - 7*864e5;
  for (let i = 0; i < 15; i++) days.push(new Date(base + i*864e5).toISOString().slice(0,10));
  const out = [];
  for (let k = 0; k < n; k++){
    /* late-summer Israel: most wadis are dry, a handful still run */
    const scale = [0,0,0,0,0.01,0,0,0.18,0,0,0.6,0,3.4,0,0,12,0,0,0,55][k % 20];
    out.push({ latitude:32, longitude:35, daily:{ time:days,
      river_discharge: days.map((_,i)=> +(scale*(0.85+0.35*Math.sin(i/2+k))).toFixed(3)) } });
  }
  return out;
}
function historyFor(n, years){
  years = years || 20;
  const t = [];
  const start = Date.now() - years*365.25*864e5;
  for (let i = 0; i < years*365; i++)
    t.push(new Date(start + i*864e5).toISOString().slice(0,10));
  const one = k => {
    const scale = [0.02, 0.4, 3.1, 0.15, 12, 0.8, 0.005, 2.2][k % 8];
    const q = t.map((d,i) => {
      /* Mediterranean regime: wet Dec-Mar, effectively nothing in Aug-Sep */
      const mo = +d.slice(5,7);
      const seas = (mo <= 3 || mo >= 12) ? 1 : (mo <= 5 || mo >= 10) ? 0.28 : 0.02;
      return +(scale * seas * (0.7 + 0.6*Math.abs(Math.sin(i/37 + k)))).toFixed(4);
    });
    return { latitude:32, longitude:35, daily:{ time:t, river_discharge:q } };
  };
  if (!n || n === 1) return one(0);
  const out = [];
  for (let k = 0; k < n; k++) out.push(one(k));
  return out;
}

/* ---- ArcGIS stand-ins ---- */
function agsRivers(offset, count){
  const names = [["נחל הירקון","Nakhal ha-Yarkon"],["נחל אלכסנדר","Nakhal Alexander"],
    ["נחל שורק","Nakhal Sorek"],["נחל לכיש","Nakhal Lakhish"],["נחל קישון","Nakhal Qishon"],
    ["ירדן","Jordan"],["נחל בשור","Nakhal Besor"],["",""],["",""],["",""]];
  const feats = [];
  const total = 2600;
  for (let k = offset; k < Math.min(offset + count, total); k++){
    const nm = names[k % names.length];
    const lat0 = 29.7 + (k % 130) * 0.028, lon0 = 34.5 + ((k*7) % 40) * 0.033;
    const coords = [];
    for (let i = 0; i < 8; i++)
      coords.push([+(lon0 + i*0.012 + Math.sin(k+i)*0.002).toFixed(5),
                   +(lat0 - i*0.004 + Math.cos(k+i)*0.002).toFixed(5)]);
    feats.push({ type:"Feature", properties:{ RIVERNAME:nm[0], ENGLISH:nm[1], LENGTH:9.9 },
                 geometry:{ type:"LineString", coordinates:coords } });
  }
  return { type:"FeatureCollection", features:feats };
}
const AGS_SAMPLING = { type:"FeatureCollection", features:[
  { type:"Feature", properties:{OBJECTID:1,"נחל":"ירדן","נקודת_דיגום":"גשר הפקק"},
    geometry:{type:"Point",coordinates:[35.6294,33.0403]} },
  { type:"Feature", properties:{OBJECTID:2,"נחל":"קישון","נקודת_דיגום":"גשר קרית חרושת"},
    geometry:{type:"Point",coordinates:[35.0990,32.7420]} },
  { type:"Feature", properties:{OBJECTID:3,"נחל":"אלכסנדר","נקודת_דיגום":"בית יצחק"},
    geometry:{type:"Point",coordinates:[34.9200,32.3900]} }
]};
/* Daily precipitation, 21 days back and 7 forward, matching the live shape.
   Deliberately mixed: a third of the cells have had real rain, the rest have
   had none, so the evidence pass has all three outcomes to produce. */
function rainFor(n){
  const t = [];
  const base = Date.now() - 21*864e5;
  for (let i = 0; i < 28; i++) t.push(new Date(base + i*864e5).toISOString().slice(0,10));
  const one = k => ({ latitude:32, longitude:35, daily:{ time:t,
    precipitation_sum: t.map((_, i) => (k % 3 === 0 && i > 12 && i < 18) ? 4.5 : 0) } });
  if (!n || n === 1) return one(0);
  const out = [];
  for (let k = 0; k < n; k++) out.push(one(k));
  return out;
}

/* RainViewer's frame index: thirteen frames, ten minutes apart, matching the
   live shape. The tiles themselves are served opaque by the router, so every
   sampled pixel reads as echo — which is what makes the radar path testable. */
/* Drainage basins in the shape govmap's WFS returns them: four nested
   catchments where 12 and 13 drain into 11, and 11 drains into 10. The graph
   is the point — a reach in basin 13 must see rain that fell in basin 12. */
function basinPoly(x0, y0, x1, y1){
  return [[[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]];
}
const BASINS = { type:"FeatureCollection", features:[
  { type:"Feature", properties:{ BASIN_CODE:10, DRAIN_TO:0,  FNAME:"מוצא לים", LATIN_NAME:"Outlet", ORIG_AREA:900 },
    geometry:{ type:"Polygon", coordinates: basinPoly(34.60, 32.40, 34.95, 32.95) } },
  { type:"Feature", properties:{ BASIN_CODE:11, DRAIN_TO:10, FNAME:"קישון תחתון", LATIN_NAME:"Lower Qishon", ORIG_AREA:640 },
    geometry:{ type:"Polygon", coordinates: basinPoly(34.95, 32.40, 35.25, 32.95) } },
  { type:"Feature", properties:{ BASIN_CODE:12, DRAIN_TO:11, FNAME:"קישון עליון", LATIN_NAME:"Upper Qishon", ORIG_AREA:410 },
    geometry:{ type:"Polygon", coordinates: basinPoly(35.25, 32.40, 35.60, 32.95) } },
  { type:"Feature", properties:{ BASIN_CODE:13, DRAIN_TO:11, FNAME:"חרוד", LATIN_NAME:"Harod", ORIG_AREA:250 },
    geometry:{ type:"Polygon", coordinates: basinPoly(34.60, 30.20, 35.60, 32.40) } }
]};

/* The national stream network as govmap returns it for one name query: a
   single connected watercourse, ACC_LEN rising strictly toward the mouth,
   plus one decoy far away that carries the same name and must be dropped. */
function netFor(name){
  if (!name) return { type:"FeatureCollection", features:[] };
  /* Nahal Paran, at fixture scale but with the real shape of the problem.

     The official layer carries two stubs 40 km apart; the national network
     carries the whole wadi — but it carries it across five stream orders,
     3 through 7, because Strahler order rises downstream. It also carries
     three order-0 stubs and one order-2 fragment sitting off the line, and
     some segments digitised against the flow. Keeping only the highest order
     gives the bottom 61 km; keeping every order lets the stubs sort into the
     middle of the walk and tear it in two. The fixture reproduces all three
     so the test fails if any of them comes back. */
  if (name.indexOf("פארן") >= 0){
    const stages = [
      /* ord, from [lon,lat], to [lon,lat], segments */
      [3, [34.650, 29.577], [34.687, 29.964], 25],
      [4, [34.687, 29.964], [34.703, 30.026],  1],
      [5, [34.703, 30.026], [34.725, 30.094], 20],
      [6, [34.725, 30.094], [34.769, 30.188], 15],
      [7, [34.769, 30.188], [35.162, 30.397], 30]
    ];
    const feats = [];
    let acc = 1200, uid = 800000;
    for (const [ord, A, B, n] of stages){
      for (let i = 1; i <= n; i++){
        const t0 = (i-1)/n, t1 = i/n;
        let c = [[A[0] + (B[0]-A[0])*t0, A[1] + (B[1]-A[1])*t0],
                 [A[0] + (B[0]-A[0])*t1, A[1] + (B[1]-A[1])*t1]];
        if (i % 4 === 0) c = c.slice().reverse();       /* digitised backwards */
        acc += 2400;
        feats.push({ type:"Feature",
          properties:{ UNIQ_ID: ++uid, PARENT: uid-1, STRM_ORDER: ord,
                       HYDRO_NET: 51, FNAME:"נחל פארן", ACC_LEN: acc },
          geometry:{ type:"LineString", coordinates: c } });
      }
    }
    /* the noise: short pieces of the wrong order, with ACC_LEN that lands them
       mid-walk. Under one percent of the length, so they must be dropped. */
    for (let i = 0; i < 3; i++)
      feats.push({ type:"Feature",
        properties:{ UNIQ_ID: ++uid, PARENT: 0, STRM_ORDER: 0, HYDRO_NET: 51,
                     FNAME:"נחל פארן", ACC_LEN: 60000 + i*100 },
        geometry:{ type:"LineString",
                   coordinates: [[34.714 + i*0.001, 30.103], [34.716 + i*0.001, 30.110]] } });
    feats.push({ type:"Feature",
      properties:{ UNIQ_ID: ++uid, PARENT: 0, STRM_ORDER: 2, HYDRO_NET: 51,
                   FNAME:"נחל פארן", ACC_LEN: 90000 },
      geometry:{ type:"LineString", coordinates: [[35.021, 30.318], [35.023, 30.320]] } });
    return { type:"FeatureCollection", features: feats };
  }
  const src = RIVERS.elements.find(e => (e.tags.name || "").indexOf(name) >= 0);
  if (!src) return { type:"FeatureCollection", features:[] };
  const g = src.geometry;
  const feats = [];
  for (let i = 1; i < g.length; i++){
    feats.push({ type:"Feature",
      properties:{ UNIQ_ID: 900000 + i, PARENT: 900000 + i - 1, STRM_ORDER: 5,
                   HYDRO_NET: 51, FNAME: src.tags.name,
                   ACC_LEN: i * 900 },      /* metres, rising downstream */
      geometry:{ type:"LineString",
                 coordinates: [[g[i-1].lon, g[i-1].lat], [g[i].lon, g[i].lat]] } });
  }
  /* a same-named channel 200 km away: buildSpine must not weld it on */
  for (let i = 1; i <= 5; i++)
    feats.push({ type:"Feature",
      properties:{ UNIQ_ID: 950000 + i, PARENT: 0, STRM_ORDER: 2, HYDRO_NET: 51,
                   FNAME: src.tags.name, ACC_LEN: 500000 + i * 900 },
      geometry:{ type:"LineString",
                 coordinates: [[36.4 + i*0.01, 29.6], [36.4 + i*0.01 + 0.01, 29.61]] } });
  return { type:"FeatureCollection", features: feats };
}

function radarIndex(){
  const now = Math.floor(Date.now()/1000/600)*600;
  const past = [];
  for (let i = 12; i >= 0; i--)
    past.push({ time: now - i*600, path: "/v2/radar/" + (now - i*600) });
  return { version: "2.0", generated: now,
           host: "https://tilecache.rainviewer.com",
           radar: { past: past, nowcast: [] } };
}

function elevationFor(n){
  const e = [];
  for (let i = 0; i < n; i++) e.push(Math.round(200 + 300*Math.sin(i/3)));
  return { elevation:e };
}

module.exports = { RIVERS, WATER, BASINS, netFor, floodFor, historyFor, rainFor, radarIndex, agsRivers, AGS_SAMPLING, elevationFor };



/* ============================================================
   Radar — rain seen, not rain modelled
   ------------------------------------------------------------
   Every rain figure on this map so far has been modelled: daily
   totals from Open-Meteo, good for "has this catchment been wet
   lately" and useless for the thing an Israeli wadi actually
   does. A Negev channel goes from dry bed to flood and back
   inside a day. A fourteen-day total cannot see that, and by the
   time it can, the water has gone.

   RainViewer composites weather radar worldwide and publishes
   the frame index openly — no key, browser-readable. Thirteen
   frames covering the past two hours, one every ten minutes.
   That is an observation, not a forecast, and for a flash flood
   it is the strongest evidence this map can get.

   So it enters the ladder above modelled rain: a reach with
   radar echo over its catchment right now is flowing, and the
   panel says the map watched it happen rather than inferred it.
   Radar is also a layer you can simply look at.
   ============================================================ */
const RADAR_INDEX = "https://api.rainviewer.com/public/weather-maps.json";
const RADAR_DBZ_MIN = 12;      /* below this is drizzle or ground clutter */

let RADAR = null;              /* { host, frames:[{time,path}], latest } */

async function fetchRadarIndex(){
  try{
    const r = await fetchWithTimeout(RADAR_INDEX, {}, 15000);
    if (!r.ok) throw new Error("HTTP " + r.status);
    const j = await r.json();
    const past = (j.radar && j.radar.past) || [];
    const now  = (j.radar && j.radar.nowcast) || [];
    if (!past.length) throw new Error("no frames");
    RADAR = { host: j.host, past: past, nowcast: now,
              latest: past[past.length - 1],
              from: past[0].time, to: past[past.length - 1].time };
    return RADAR;
  }catch(e){ RADAR = null; return null; }
}

/* RainViewer serves 256 px tiles: {host}{path}/{size}/{z}/{x}/{y}/{scheme}/{opts}.png
   scheme 4 is the "Universal Blue" ramp; 1_1 means smoothed, with snow shown. */
function radarTileUrl(frame){
  if (!RADAR || !frame) return null;
  return RADAR.host + frame.path + "/256/{z}/{x}/{y}/4/1_1.png";
}

/* ---------- radar as evidence ----------
   The tiles are pictures, not numbers, so the map reads them the only
   honest way available to it: it samples the rendered tile at the reach's
   own position and asks whether that pixel carries echo. A coloured pixel
   in a radar composite means the radar saw something there. Transparent
   means it did not.

   This is deliberately coarse. It answers "is there rain over this
   catchment right now", which is the question, and nothing finer. */
const radarCache = new Map();          /* tileKey -> ImageData | null */
let radarCanvas = null;

function radarTileKey(z, x, y){ return z + "/" + x + "/" + y; }

function lonLatToTile(lon, lat, z){
  const n = Math.pow(2, z);
  const x = (lon + 180) / 360 * n;
  const latR = lat * Math.PI / 180;
  const y = (1 - Math.log(Math.tan(latR) + 1/Math.cos(latR)) / Math.PI) / 2 * n;
  return { x: Math.floor(x), y: Math.floor(y),
           px: Math.floor((x % 1) * 256), py: Math.floor((y % 1) * 256) };
}

async function radarTile(z, x, y){
  const k = radarTileKey(z, x, y);
  if (radarCache.has(k)) return radarCache.get(k);
  const url = radarTileUrl(RADAR && RADAR.latest);
  if (!url){ radarCache.set(k, null); return null; }
  const src = url.replace("{z}", z).replace("{x}", x).replace("{y}", y);
  const data = await new Promise(res => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try{
        if (!radarCanvas){
          radarCanvas = document.createElement("canvas");
          radarCanvas.width = radarCanvas.height = 256;
        }
        const c = radarCanvas.getContext("2d", { willReadFrequently: true });
        c.clearRect(0, 0, 256, 256);
        c.drawImage(img, 0, 0);
        res(c.getImageData(0, 0, 256, 256));
      }catch(e){ res(null); }        /* tainted canvas: give up quietly */
    };
    img.onerror = () => res(null);
    img.src = src;
  });
  radarCache.set(k, data);
  return data;
}

/* Is the radar showing rain within about 5 km of this point right now? */
async function radarAt(lon, lat){
  if (!RADAR) return null;
  const Z = 7;                                  /* ~1 km per pixel at this latitude */
  const t = lonLatToTile(lon, lat, Z);
  const img = await radarTile(Z, t.x, t.y);
  if (!img) return null;
  let hit = 0, seen = 0;
  const R = 3;                                  /* a small neighbourhood, not one pixel */
  for (let dy = -R; dy <= R; dy++)
    for (let dx = -R; dx <= R; dx++){
      const px = t.px + dx, py = t.py + dy;
      if (px < 0 || px > 255 || py < 0 || py > 255) continue;
      const i = (py * 256 + px) * 4;
      seen++;
      if (img.data[i + 3] > 40) hit++;          /* any non-transparent echo */
    }
  if (!seen) return null;
  return { frac: +(hit / seen).toFixed(3), wet: hit > 0, at: RADAR.latest.time };
}


/* Sample the radar once per model cell — the tiles are shared, so a whole
   country costs a handful of image loads. Only meaningful for today: the
   composite is two hours old at most, and says nothing about last Tuesday. */
async function assignRadar(cells){
  S.radar = new Map();
  if (!RADAR) return 0;
  let wet = 0;
  for (const c of cells){
    const p = cellCenter(c);
    const v = await radarAt(p[1], p[0]);
    if (v){ S.radar.set(c, v); if (v.wet) wet++; }
  }
  return wet;
}

function radarFor(cellK){
  if (!S.radar || S.dayIdx !== S.todayIdx) return null;
  return S.radar.get(cellK) || null;
}

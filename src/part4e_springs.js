

/* ============================================================
   Springs — where water enters a channel without rain
   ------------------------------------------------------------
   The map kept asking the wrong question of the summer. It knew
   the sky was dry and it knew what the gauges measured, but it
   had no account of the thing that actually keeps an Israeli
   stream running in September: a source putting water into it.

   The Hydrological Service registers 679 springs and publishes
   112,597 individual measured discharges for them, in litres per
   second, through data.gov.il. Aggregated per spring that gives
   a mean, a July-September mean, a latest reading and the share
   of measurements that found any water at all.

   The largest are not marginal. The Dan springs average 7,437
   l/s — seven and a half cubic metres a second, in summer as
   much as in winter. Banias 1,989. Zuqim on the Dead Sea shore
   1,895. Wazani 1,436. Taninim 739. Na'aman 654. These are why
   the Jordan, the Taninim and the Na'aman run through a rainless
   August, and a map that omits them has to call that flow
   unverified for want of an explanation it could have had.

   So a spring with real summer discharge counts as evidence, the
   same way a perennial gauge does, and it carries downstream:
   below a live source, water is expected.
   ============================================================ */
const SPRING_NEAR_KM = 2.0;    /* how close a source has to be to feed a reach */
const SPRING_MIN_LS  = 5;      /* five litres a second — a visible source */

let SPRING_GRID = null;
const SP_CELL = 0.05;

function springsList(){ return (typeof SPRINGS !== "undefined" && SPRINGS.sp) ? SPRINGS.sp : []; }

/* Only springs that actually run in summer are treated as evidence for
   summer flow. A winter-only spring explains nothing in September. */
function springLive(s){
  const summer = s[10], mean = s[7];
  const v = summer != null ? summer : mean;
  return v != null && v >= SPRING_MIN_LS;
}

function springIndex(){
  if (SPRING_GRID) return SPRING_GRID;
  SPRING_GRID = new Map();
  const list = springsList();
  for (let i = 0; i < list.length; i++){
    const s = list[i];
    if (!springLive(s)) continue;
    const cx = Math.round(s[1]/SP_CELL), cy = Math.round(s[2]/SP_CELL);
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++){
      const k = (cx+dx) + "_" + (cy+dy);
      let a = SPRING_GRID.get(k); if (!a){ a = []; SPRING_GRID.set(k, a); }
      a.push(i);
    }
  }
  return SPRING_GRID;
}

/* the strongest live spring within reach of this stretch of channel */
function springFor(r){
  const idx = springIndex();
  const list = springsList();
  let best = null, bestV = 0;
  const step = Math.max(1, Math.floor(r.g.length / 8));
  for (let j = 0; j < r.g.length; j += step){
    const p = r.g[j];
    const cand = idx.get(Math.round(p[0]/SP_CELL) + "_" + Math.round(p[1]/SP_CELL));
    if (!cand) continue;
    for (const si of cand){
      const s = list[si];
      const km = kmBetween(p, [s[1], s[2]]);
      if (km > SPRING_NEAR_KM) continue;
      const v = s[10] != null ? s[10] : s[7];
      if (v > bestV){ bestV = v; best = { i: si, s: s, km: +km.toFixed(2), ls: v }; }
    }
  }
  return best;
}

function assignSprings(){
  let n = 0;
  for (const r of S.reaches){
    r.spring = springFor(r);
    if (r.spring) n++;
  }
  return n;
}

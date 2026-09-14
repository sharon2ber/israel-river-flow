

/* ============================================================
   Where a river's drawn line actually ends
   ------------------------------------------------------------
   "The river suddenly ends and does not reach the sea" is a fair
   thing to notice and a bad thing for a map to leave unexplained.
   There are three ways it happens here, and they are different
   problems wearing the same face:

     1. the source stops. The Water Authority ships each river as
        separate line features that mostly do not join — only 611
        of 15,106 endpoints touch — so a river can simply have no
        feature for its last kilometre
     2. the river was split. Segments more than 3 km apart are
        treated as different watercourses, because a shared name
        is not proof of continuity. A real gap in the source data
        therefore severs the river, and the lower half is judged
        on its own
     3. the lower half has no model data. A chain whose cells are
        mostly empty is drawn as "no data" — a faint dotted line,
        which at a glance reads as nothing at all

   Rather than guess which, this measures all three per river and
   says so: how many pieces the river was cut into, the largest
   gap between them, and how far the downstream end sits from the
   coastline. The coast is Natural Earth's, taken as the part of
   Israel's outline that is not a land boundary — 36 points from
   Rosh Hanikra to Gaza, and two more at Eilat.
   ============================================================ */
const OUTLET_NEAR_KM = 2;      /* closer than this counts as reaching the sea */
const OUTLET_LOW_M   = 40;     /* and it has to be low enough to be an outlet */

function segDistKm(px, py, ax, ay, bx, by){
  /* degrees are not metres; scale longitude by the latitude before measuring */
  const k = Math.cos(py * Math.PI/180);
  const AX = (ax-px)*k, AY = ay-py, BX = (bx-px)*k, BY = by-py;
  const dx = BX-AX, dy = BY-AY;
  const L2 = dx*dx + dy*dy;
  let t = L2 ? -(AX*dx + AY*dy) / L2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const ex = AX + t*dx, ey = AY + t*dy;
  return Math.sqrt(ex*ex + ey*ey) * 111.32;
}
function distToCoastKm(lon, lat){
  let best = Infinity;
  for (const line of COAST)
    for (let i = 1; i < line.length; i++){
      const d = segDistKm(lon, lat, line[i-1][0], line[i-1][1], line[i][0], line[i][1]);
      if (d < best) best = d;
    }
  return best;
}
function kmBetween(a, b){
  const k = Math.cos(a[1] * Math.PI/180);
  const dx = (b[0]-a[0])*k, dy = b[1]-a[1];
  return Math.sqrt(dx*dx + dy*dy) * 111.32;
}

/* Walk one named river from headwater to mouth across all the pieces it was
   cut into, and report what happened to it. */
function riverTrace(i){
  /* the same grouping the reliability pass used: network id where the
     national layer knows this river, name where it does not */
  const ck = chainKey(S.reaches[i]);
  const grp = [];
  for (let k = 0; k < S.reaches.length; k++)
    if (chainKey(S.reaches[k]) === ck) grp.push(k);
  if (!grp.length) grp.push(i);
  const el = S.cellEl || {};
  const elOf = r => (r.cell != null && el[r.cell] != null) ? el[r.cell] : null;
  const accOf = k => S.reaches[k].spine ? S.reaches[k].spine.acc : null;
  const useAcc = grp.filter(k => accOf(k) != null).length >= Math.max(2, grp.length * 0.6);

  /* the same order too */
  const order = grp.slice().sort((a, b) => {
    if (useAcc){
      const aa = accOf(a), ab = accOf(b);
      if (aa != null && ab != null) return aa - ab;
      if (aa == null) return 1;
      if (ab == null) return -1;
    }
    const ea = elOf(S.reaches[a]), eb = elOf(S.reaches[b]);
    if (ea == null && eb == null) return 0;
    if (ea == null) return 1;
    if (eb == null) return -1;
    return eb - ea;
  });

  const steps = [];
  let maxGap = 0, gapAt = null;
  for (let k = 0; k < order.length; k++){
    const idx = order[k], r = S.reaches[idx];
    const end = r.g[r.g.length-1];
    let gap = null;
    if (k + 1 < order.length){
      const nx = S.reaches[order[k+1]];
      gap = +Math.min(kmBetween(end, nx.g[0]), kmBetween(end, nx.g[nx.g.length-1])).toFixed(2);
      if (gap > maxGap){ maxGap = gap; gapAt = k; }
    }
    steps.push({
      i: idx, km: r.km, chain: r.chain,
      cell: r.cell || null, el: elOf(r),
      q: r.qShow, conf: r.conf, ev: r.ev, why: r.evWhy,
      rain: r.rain ? r.rain.mm : null, rainUp: r.rainUp,
      acc: accOf(idx),
      reg: r.reg && r.reg.rec ? r.reg.rec.c : null,
      gauge: r.reg && r.reg.rec ? (LANG === "he" ? r.reg.rec.siteHe : r.reg.rec.siteEn) : null,
      trans: !!r.trans, gap: gap,
      end: end
    });
  }

  const chains = new Set(order.map(k => S.reaches[k].chain).filter(c => c >= 0));
  const last = steps.length ? steps[steps.length-1] : null;
  const lowEl = last ? last.el : null;
  const dCoast = last ? +distToCoastKm(last.end[0], last.end[1]).toFixed(2) : null;
  const nodata = steps.filter(s => s.ev === EV_NODATA).length;

  /* Where the national network says this river ends, if it knows it. The
     distance between that and where our line stops is the honest measure of
     what is missing, and beats guessing from the coastline. */
  const sp = S.reaches[i].spine ? S.reaches[i].spine.sp : null;
  const mouthGap = (sp && sp.mouth && last)
    ? +kmBetween(last.end, sp.mouth).toFixed(2) : null;

  return {
    name: LANG === "he" ? (S.reaches[i].he || S.reaches[i].en) : (S.reaches[i].en || S.reaches[i].he),
    n: steps.length, steps: steps,
    ordBy: useAcc ? "acc" : "elev",
    net: sp ? sp.net : null, ord: sp ? sp.ord : null,
    netKm: sp ? sp.km : null, mouth: sp ? sp.mouth : null, mouthGap: mouthGap,
    pieces: chains.size || 1,
    maxGap: +maxGap.toFixed(2), gapAt: gapAt,
    coastKm: dCoast,
    /* it looks like an outlet — low, and near the sea — but the line stops short */
    endsShort: dCoast != null && dCoast > OUTLET_NEAR_KM && dCoast < 25 &&
               (lowEl == null || lowEl <= OUTLET_LOW_M),
    nodata: nodata
  };
}


/* ============================================================
   Network audit — the same fault, everywhere it occurs
   ------------------------------------------------------------
   Nahal Paran was reported as drawn in disconnected pieces. It
   was, and so were others, for reasons that had nothing to do
   with Paran: a river was cut into chains wherever its mapped
   features were more than 3 km apart, and each chain was then
   judged and coloured on its own. In the Negev, where the
   official layer is sparse, that happens constantly.

   Fixing one river by hand is not a fix. This walks every named
   watercourse and scores it on the three ways this map can make
   a continuous river look broken:

     pieces   how many separate chains it was cut into
     gap      the largest distance between consecutive segments
     breaks   how many times the drawn state changes along it,
              which is what a reader actually sees as a break

   The worst offenders are listed in About, recomputed on every
   load, so a regression shows up as a number rather than as a
   complaint.
   ============================================================ */
function networkAudit(limit){
  const groups = new Map();
  for (let i = 0; i < S.reaches.length; i++){
    const r = S.reaches[i];
    const nm = nameOf(r);
    if (!nm) continue;
    let a = groups.get(nm); if (!a){ a = []; groups.set(nm, a); }
    a.push(i);
  }
  const rows = [];
  for (const [nm, list] of groups){
    if (list.length < 3) continue;
    const chains = new Set(list.map(i => chainKey(S.reaches[i]) || "-"));
    const el = S.cellEl || {};
    const accOf = k => S.reaches[k].spine ? S.reaches[k].spine.acc : null;
    const useAcc = list.filter(k => accOf(k) != null).length >= Math.max(2, list.length * 0.6);
    const order = list.slice().sort((a, b) => {
      if (useAcc){
        const aa = accOf(a), ab = accOf(b);
        if (aa != null && ab != null) return aa - ab;
      }
      const ea = el[S.reaches[a].cell], eb = el[S.reaches[b].cell];
      if (ea == null && eb == null) return 0;
      if (ea == null) return 1;
      if (eb == null) return -1;
      return eb - ea;
    });
    let maxGap = 0, breaks = 0, prev = null;
    for (let k = 0; k < order.length; k++){
      const r = S.reaches[order[k]];
      if (k){
        const a = S.reaches[order[k-1]];
        const g = Math.min(
          kmBetween(a.g[a.g.length-1], r.g[0]),
          kmBetween(a.g[a.g.length-1], r.g[r.g.length-1]));
        if (g > maxGap) maxGap = g;
      }
      if (prev !== null && r.cls !== prev) breaks++;
      prev = r.cls;
    }
    rows.push({ name: nm, n: list.length, pieces: chains.size,
                gap: +maxGap.toFixed(1), breaks: breaks,
                sparse: list.filter(i => S.reaches[i].sparse).length,
                nodata: list.filter(i => S.reaches[i].ev === EV_NODATA).length });
  }
  /* rank by how broken a reader would find it, not by any one number */
  rows.sort((a, b) => (b.pieces * 3 + b.breaks) - (a.pieces * 3 + a.breaks));
  return { rivers: rows.length,
           fragmented: rows.filter(r => r.pieces > 1).length,
           broken: rows.filter(r => r.breaks > 2).length,
           worst: rows.slice(0, limit || 10) };
}

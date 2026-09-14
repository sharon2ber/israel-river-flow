

/* ============================================================
   Filling what the source leaves out
   ------------------------------------------------------------
   Nahal Paran was reported as drawn in disconnected pieces. It
   was, and no grouping rule could have fixed it, because the
   geometry is not there to group. The Water Authority's national
   layer carries Nahal Paran as six features totalling 24.5 km,
   for a wadi that runs about 150, with a 30 km hole in the
   middle and an 11 km hole after it.

   That is not a Paran quirk. Walking all 7,914 features of that
   layer: of 398 named rivers, 81 — one in five — have a break of
   more than 3 km. Nahal Be'er, Hor, Kama and Yahel are two
   fragments each. The Jordan has six breaks over 3 km. Zin has
   five.

   Israel's national stream network has the same rivers whole.
   Paran there is 409 segments and 144 km, spanning the entire
   wadi. So where the official layer has a hole inside one
   drainage basin, the map now goes and gets the missing channel:
   the river is fetched by name, its main stem taken, merged in
   ACC_LEN order into one continuous line, and only the parts
   that fall in the hole are added — anything already drawn is
   left alone.

   A break between two basins is left exactly as it is. Two wadis
   sharing a name in different catchments are two wadis, and
   welding them was the bug that made clustering necessary in the
   first place.
   ============================================================ */
const GAP_KM = 3.0;              /* a hole worth filling */
const GAP_CHUNK_KM = 2.0;        /* fill added at the same grain as a reach */
const GAP_COVERED = 0.004;       /* ~400 m: near an existing line, so not a hole */
const GAP_TTL = 90 * 864e5;

/* Named rivers whose mapped geometry has a hole inside a single basin. */
function riverGaps(){
  const by = new Map();
  for (let i = 0; i < S.reaches.length; i++){
    const r = S.reaches[i];
    const he = riverNameHe(r);
    if (!he) continue;
    const b = (r.basin != null && S.basins[r.basin]) ? S.basins[r.basin].code : "?";
    const k = he + "|" + b;
    let a = by.get(k); if (!a){ a = { he: he, basin: b, idx: [] }; by.set(k, a); }
    a.idx.push(i);
  }
  const out = [];
  for (const g of by.values()){
    if (g.idx.length < 2) continue;
    /* nearest-neighbour walk: the largest step is the hole */
    const segs = g.idx.map(i => S.reaches[i]);
    const used = new Array(segs.length).fill(false);
    let cur = 0; used[0] = true;
    let worst = 0;
    for (let s = 1; s < segs.length; s++){
      let best = -1, bd = Infinity;
      for (let j = 0; j < segs.length; j++){
        if (used[j]) continue;
        const A = segs[cur], B = segs[j];
        const d = Math.min(
          kmBetween(A.g[A.g.length-1], B.g[0]),
          kmBetween(A.g[A.g.length-1], B.g[B.g.length-1]),
          kmBetween(A.g[0], B.g[0]),
          kmBetween(A.g[0], B.g[B.g.length-1]));
        if (d < bd){ bd = d; best = j; }
      }
      if (best < 0) break;
      used[best] = true;
      if (bd > worst) worst = bd;
      cur = best;
    }
    if (worst > GAP_KM)
      out.push({ he: g.he, basin: g.basin, gap: +worst.toFixed(1), n: g.idx.length });
  }
  out.sort((a, b) => b.gap - a.gap);
  return out;
}

/* Main stem of one river from the national network, as one ordered line.
   The ordering, the stub filtering and the flipping all live in netStem —
   the spine and the gap fill are then two readings of the same stem, which
   is what stops them disagreeing about where a river runs. */
function mergeMainStem(feats, wantHe){
  const st = netStem(feats, wantHe);
  return st && st.path.length > 3 ? st.path : null;
}

/* Cut a long line into reach-sized pieces, dropping any piece that runs where
   the map already has a channel. */
function chunkNewLine(path, idx, he, en){
  const out = [];
  let cur = [path[0]], run = 0;
  const flush = () => {
    if (cur.length < 2) return;
    const s = rdp(cur, 0.0005);
    if (s.length < 2) return;
    let hit = 0, n = 0;
    const step = Math.max(1, Math.floor(s.length / 6));
    for (let i = 0; i < s.length; i += step){
      n++;
      const cx = Math.round(s[i][0]/GAP_COVERED), cy = Math.round(s[i][1]/GAP_COVERED);
      let found = false;
      for (let dx = -1; dx <= 1 && !found; dx++)
        for (let dy = -1; dy <= 1 && !found; dy++)
          if (idx.has((cx+dx) + "_" + (cy+dy))) found = true;
      if (found) hit++;
    }
    if (n && hit / n >= 0.6) return;           /* already drawn here */
    out.push({ he: he, en: en, g: s, wt: 1, it: 0, src: 2,
               km: +lenKm(s).toFixed(2) });
  };
  for (let i = 1; i < path.length; i++){
    run += kmBetween(path[i-1], path[i]);
    cur.push(path[i]);
    if (run >= GAP_CHUNK_KM){ flush(); cur = [path[i]]; run = 0; }
  }
  flush();
  return out;
}

async function fillOneGap(he, idx){
  const key = "gapfill_" + he;
  const c = await cacheGet(key);
  if (c && c.at && c.v === 2 && Date.now() - c.at < GAP_TTL) return c.add || [];
  let add = [];
  const feats = await riverNet(he);          /* shared with the spine pass */
  if (feats){
    await spineFromFeats(he, feats);         /* one query answers both */
    const path = mergeMainStem(feats, he);
    if (path){
      const en = (S.reaches.find(x => riverNameHe(x) === he) || {}).en || "";
      add = chunkNewLine(path, idx, "\u05e0\u05d7\u05dc " + he, en);
    }
    await cacheSet(key, { at: Date.now(), v: 2, add: add });
  }
  return add;
}

/* Work through the holes, worst first, and stop at a budget. */
async function fillGaps(limit, onProgress){
  const gaps = riverGaps();
  if (!gaps.length) return { rivers: 0, added: 0, gaps: 0 };
  const idx = officialIndex(S.reaches);
  const todo = gaps.slice(0, limit || 120);
  let added = 0, rivers = 0;
  for (let i = 0; i < todo.length; i++){
    const add = await fillOneGap(todo[i].he, idx);
    if (add.length){
      for (const a of add){ S.reaches.push(a); added++; }
      rivers++;
      for (const a of add) for (const p of a.g)
        idx.add(Math.round(p[0]/GAP_COVERED) + "_" + Math.round(p[1]/GAP_COVERED));
    }
    if (onProgress) onProgress((i + 1) / todo.length, todo[i].he);
    await sleep(250);
  }
  return { rivers: rivers, added: added, gaps: gaps.length };
}

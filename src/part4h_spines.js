

/* ============================================================
   The network's own order, instead of our guess at it
   ------------------------------------------------------------
   Two things this map inferred badly, and one source that states
   them outright.

   Order. Headwater-to-mouth came from sorting by the elevation
   of a 5 km model cell. Terrain is not the channel, and a coarse
   cell is not terrain. Israel's national stream layer carries
   ACC_LEN: the distance water has already travelled along the
   network when it reaches a segment. Measured, and increasing
   strictly toward the mouth — checked on the Kishon, whose
   lowest ACC_LEN sits in the upper Jezreel Valley and whose
   highest sits in Haifa Bay.

   Grouping. Which segments are one river was decided by matching
   names and clustering anything within 3 km, which is why the
   Yarkon arrived as forty-five pieces with a 356 km "gap".

   A caution learned the hard way: HYDRO_NET is not a river id.
   Nearly every watercourse in the country carries net 51 — it
   identifies a hydrological system, not a stream — so grouping
   by it would merge Israel into one chain. What does identify a
   river is its spine: fetch the national network for one name,
   keep the largest spatially connected run of it, and a reach
   either projects onto that line or does not.

   The layer is a million and a half segments, far too large to
   carry or to fetch whole, and a name query costs a few seconds.
   So spines are fetched per river — the big ones in the
   background after the map is up, any river the moment you open
   its trace — and cached. Rivers without one keep the old
   behaviour and say so.
   ============================================================ */
const SPINE_NEAR_KM = 4.0;      /* a reach further out is a different river */
const SPINE_PTS = 40;
const SPINE_TTL = 90 * 864e5;   /* the national network does not move */
const STEM_JOIN_KM = 3.0;       /* a jump wider than this ends a run */
const STEM_DETOUR_KM = 2.0;     /* how far off the channel a piece may sit and still belong */
const STEM_CUT_KM = 12;         /* a jump this far is two wadis, not one river */

const spines = [];              /* built or restored this session */
const spineByName = new Map();  /* normalised name -> index into spines */
const spinePending = new Map();

/* ------------------------------------------------------------
   One river's main stem, from raw national-network features.

   Two mistakes were made here and both broke Nahal Paran.

   The first was to keep only the highest Strahler order. Order
   rises downstream, so the maximum is the river's lowest reach
   and nothing above it: for Paran that is 61 km of a 143 km
   wadi, and the official segment at 34.71/30.12 falls outside it
   entirely. Paran is carried at orders 3 through 7 —
   49 km / 10 / 9 / 15 / 61 — and all five are the same channel.
   So no order is dropped.

   The second was to trust ACC_LEN as the only ordering. It is
   the right ordering almost everywhere, and it is measured
   rather than guessed, but a handful of segments carry a value
   that does not belong to where they sit — Paran has three
   order-0 stubs and an order-2 fragment whose ACC_LEN lands them
   in the middle of the walk. Sorting blindly then jumps out to
   the stub and back, and the line tears: 88.6 km and 37.7 km of
   nothing.

   Dropping short stream orders fixed Paran and only Paran; the
   same noise at a different length got straight through. So the
   ordering is repaired rather than filtered. Walk in ACC_LEN
   order, flipping any segment digitised against the flow. Break
   the walk wherever it jumps more than three kilometres. Take
   the longest piece as the trunk, and offer every other piece
   back to it whole, at the cheapest place it fits — cheap
   meaning it lies along the channel there, however wide the hole
   it fills, which is what lets a sparsely mapped wadi keep its
   real gaps while a stub sitting off to the side is left out.

   Whole pieces rather than single segments, because Paran's
   three strays sit side by side in the ordering: each one's
   neighbour is the next stray, so not one of them looks out of
   place on its own.

   ------------------------------------------------------------ */
function netStem(feats, wantHe){
  const want = regNorm(wantHe);
  const exact = [], loose = [];
  for (const f of feats){
    const p = f.properties || {}, g = f.geometry;
    if (!g || !g.coordinates) continue;
    const nm = regNorm(p.FNAME || "");
    if (!nm) continue;
    const same = nm === want;
    if (!same && nm.indexOf(want) < 0 && want.indexOf(nm) < 0) continue;
    const acc = +p.ACC_LEN, ord = +p.STRM_ORDER || 0;
    const lines = g.type === "MultiLineString" ? g.coordinates : [g.coordinates];
    for (const line of lines){
      if (!line || line.length < 2) continue;
      const c = [];
      for (const q of line) c.push([+q[0], +q[1]]);
      (same ? exact : loose).push({ acc: isFinite(acc) ? acc / 1000 : 0, ord: ord, c: c });
    }
  }
  const rows = exact.length >= 2 ? exact : exact.concat(loose);
  if (rows.length < 2) return null;
  rows.sort((a, b) => a.acc - b.acc);

  const head = s => s.c[0], tail = s => s.c[s.c.length-1];

  /* walk downstream, flipping anything digitised backwards */
  const seq = [];
  for (const s of rows){
    let c = s.c;
    if (seq.length){
      const last = tail(seq[seq.length-1]);
      if (kmBetween(last, c[c.length-1]) < kmBetween(last, c[0])) c = c.slice().reverse();
    }
    seq.push({ acc: s.acc, ord: s.ord, c: c });
  }
  if (seq.length > 1){                                  /* the first one has no predecessor */
    const n = head(seq[1]);
    if (kmBetween(head(seq[0]), n) < kmBetween(tail(seq[0]), n)) seq[0].c = seq[0].c.slice().reverse();
  }

  /* Break the walk wherever it jumps, and see what the pieces are.

     A single bad ACC_LEN cannot be caught one segment at a time, because
     Paran's three stray stubs sit next to each other in the ordering and each
     one's neighbour is the next stub, so none of them looks like a detour.
     Broken into runs they are obvious: a 600 m run standing between two long
     ones. So the longest run is taken as the trunk, and every other run is
     offered back to it whole, at the cheapest place it fits — cheap meaning
     it lies along the channel there, however wide the hole it fills. A run
     that fits nowhere cheaply is not part of this river and is left out. */
  const runs = [];
  let cur = [];
  for (let i = 0; i < seq.length; i++){
    if (cur.length && kmBetween(tail(seq[i-1]), head(seq[i])) > STEM_JOIN_KM){ runs.push(cur); cur = []; }
    cur.push(seq[i]);
  }
  if (cur.length) runs.push(cur);
  const runKm = r => {
    let L = 0;
    for (const s of r) for (let i = 1; i < s.c.length; i++) L += kmBetween(s.c[i-1], s.c[i]);
    return L;
  };
  runs.sort((a, b) => runKm(b) - runKm(a));
  let trunk = runs.shift();
  if (!trunk) return null;

  for (let round = 0; round < 3 && runs.length; round++){
    const left = [];
    let joined = false;
    for (const r of runs){
      const rev = r.slice().reverse().map(s => ({ acc: s.acc, ord: s.ord, c: s.c.slice().reverse() }));
      let at = -1, cost = Infinity, pick = null;
      for (let i = 0; i <= trunk.length; i++){
        const P = i > 0 ? tail(trunk[i-1]) : null;
        const N = i < trunk.length ? head(trunk[i]) : null;
        const limit = (P && N) ? STEM_DETOUR_KM : STEM_CUT_KM;
        for (const cand of [r, rev]){
          const a = head(cand[0]), b = tail(cand[cand.length-1]);
          const c = P && N ? kmBetween(P, a) + kmBetween(b, N) - kmBetween(P, N)
                  : P ? kmBetween(P, a) : N ? kmBetween(b, N) : 0;
          if (c <= limit && c < cost){ cost = c; at = i; pick = cand; }
        }
      }
      if (pick){ trunk = trunk.slice(0, at).concat(pick, trunk.slice(at)); joined = true; }
      else left.push(r);
    }
    runs.length = 0;
    for (const r of left) runs.push(r);
    if (!joined) break;
  }

  const best = trunk;
  if (best.length < 2) return null;

  const path = [], acc = [], ords = new Set();
  for (const s of best){
    ords.add(s.ord);
    for (const p of s.c)
      if (!path.length || kmBetween(path[path.length-1], p) > 0.005){ path.push(p); acc.push(s.acc); }
  }
  if (path.length < 4) return null;
  let gap = 0;
  for (let i = 1; i < best.length; i++)
    gap = Math.max(gap, kmBetween(best[i-1].c[best[i-1].c.length-1], best[i].c[0]));
  let km = 0;
  for (let i = 1; i < path.length; i++) km += kmBetween(path[i-1], path[i]);
  return { path: path, acc: acc, n: best.length, km: +km.toFixed(2),
           gap: +gap.toFixed(2), dropped: rows.length - best.length,
           ord: Math.max.apply(null, Array.from(ords)),
           orders: Array.from(ords).sort((a, b) => a - b) };
}

/* A spine is that stem thinned to a handful of points, each carrying the
   accumulated length at that place. A reach either projects onto it or does
   not — two wadis of the same name are two wadis. */
function buildSpine(feats, wantHe){
  const st = netStem(feats, wantHe);
  if (!st || st.path.length < 4) return null;
  const N = Math.min(SPINE_PTS, st.path.length);
  const pts = [];
  for (let i = 0; i < N; i++){
    const j = Math.round(i * (st.path.length - 1) / (N - 1));
    pts.push([+st.path[j][0].toFixed(4), +st.path[j][1].toFixed(4), +st.acc[j].toFixed(2)]);
  }
  const end = st.path[st.path.length-1];
  return { he: wantHe, ord: st.ord, km: st.km, n: st.n,
           mouth: [+end[0].toFixed(4), +end[1].toFixed(4)], pts: pts };
}

/* One name, one query. The spine and the gap fill both need the same
   features, and a name query against a million-and-a-half-segment layer costs
   several seconds, so the answer is held for the session — long enough for the
   two passes that use it, and never written to disk, where it would be tens of
   megabytes. */
const netMemo = new Map();
async function riverNet(nameHe){
  if (netMemo.has(nameHe)) return netMemo.get(nameHe);
  const p = (async () => {
    try{
      const url = wfsUrl("opendata:nechalim1",
        "&count=4000&CQL_FILTER=" + encodeURIComponent("FNAME LIKE '%" + nameHe + "%'"));
      const r = await fetchWithTimeout(url, {}, 45000);
      if (!r.ok) return null;
      const j = await r.json();
      return j.features || null;
    }catch(e){ return null; }
  })();
  netMemo.set(nameHe, p);
  if (netMemo.size > 24) netMemo.delete(netMemo.keys().next().value);
  return p;
}

/* Build, cache and register a spine from features already in hand — so the gap
   fill and the spine pass cost one query between them, not two. */
async function spineFromFeats(nameHe, feats){
  const k = regNorm(nameHe);
  if (spineByName.has(k)) return spines[spineByName.get(k)] || null;
  const sp = feats ? buildSpine(feats, nameHe) : null;
  if (feats) await cacheSet("spine_" + nameHe, { at: Date.now(), v: 2, sp: sp });
  if (sp) registerSpine(sp); else spineByName.set(k, -1);
  return sp;
}

async function fetchSpine(nameHe){
  const key = "spine_" + nameHe;
  const c = await cacheGet(key);
  if (c && c.at && c.v === 2 && Date.now() - c.at < SPINE_TTL) return c.sp;   /* may be null: a known miss */
  const feats = await riverNet(nameHe);
  const sp = feats ? buildSpine(feats, nameHe) : null;
  if (feats) await cacheSet(key, { at: Date.now(), v: 2, sp: sp });
  return sp;
}

function registerSpine(sp){
  if (!sp) return -1;
  const i = spines.push(sp) - 1;
  spineByName.set(regNorm(sp.he), i);
  return i;
}

/* the plain Hebrew name of the river a reach belongs to */
function riverNameHe(r){
  const he = (r.he || "").trim();
  if (!he) return null;
  return he.replace(/^(נחל|נהר|ואדי)\s+/, "").trim() || null;
}

async function ensureSpine(r){
  const nm = riverNameHe(r);
  if (!nm) return null;
  const k = regNorm(nm);
  if (spineByName.has(k)) return spines[spineByName.get(k)];
  if (spinePending.has(k)) return spinePending.get(k);
  const p = fetchSpine(nm).then(sp => {
    spinePending.delete(k);
    if (sp) registerSpine(sp);
    else spineByName.set(k, -1);          /* remember the miss */
    return sp;
  });
  spinePending.set(k, p);
  return p;
}

function projectOnSpine(sp, lon, lat){
  let best = null, bestKm = Infinity;
  for (const p of sp.pts){
    const km = kmBetween([lon, lat], [p[0], p[1]]);
    if (km < bestKm){ bestKm = km; best = p; }
  }
  return best ? { acc: best[2], km: +bestKm.toFixed(2) } : null;
}

function spineFor(r){
  const nm = riverNameHe(r);
  if (!nm) return null;
  const i = spineByName.get(regNorm(nm));
  if (i == null || i < 0) return null;
  const sp = spines[i];
  const m = r.g[Math.floor(r.g.length/2)];
  const pr = projectOnSpine(sp, m[0], m[1]);
  if (!pr || pr.km > SPINE_NEAR_KM) return null;
  return { i: i, sp: sp, acc: pr.acc, km: pr.km };
}

function assignSpines(){
  let n = 0;
  for (const r of S.reaches){
    r.spine = spineFor(r);
    if (r.spine) n++;
  }
  return n;
}

/* A reach's chain, best evidence first. Never HYDRO_NET — that is a system,
   not a river.

     spine   the national network recognised this reach as part of a river
     name + basin   same name, same drainage basin. This is the rule that
             fixes Nahal Paran: a Negev wadi is mapped sparsely, so the real
             gaps between its features run to tens of kilometres, and the old
             3 km clustering cut it into a dozen chains that were then judged
             separately and drawn differently. A gap inside one catchment is
             a gap in the mapping, not a different river. Two wadis of the
             same name in different basins stay separate, which was the
             reason clustering existed in the first place.
     name    only where no basin is known; falls back to 3 km clustering.
*/
function chainKey(r){
  if (r.spine) return "sp:" + r.spine.i;
  const k = nameKey(r);
  if (!k) return null;
  if (r.basin != null && S.basins && S.basins[r.basin])
    return "nb:" + k + "|" + S.basins[r.basin].code;
  return "nm:" + k;
}

/* After the map is up, quietly fetch the national network for the rivers that
   need it most.

   This used to rank by reach count, which is why Nahal Paran never got one:
   the official layer carries it as six features, so it sat far down a list
   headed by rivers that were already drawn whole. Need is the opposite of
   that. A river broken into pieces is exactly the river whose spine would
   join them, so the ones with the worst holes go first, and only then the
   ones simply made of the most reaches. */
async function loadTopSpines(limit){
  const count = new Map();
  for (const r of S.reaches){
    const nm = riverNameHe(r);
    if (!nm) continue;
    count.set(nm, (count.get(nm) || 0) + 1);
  }
  const rank = new Map();
  if (typeof riverGaps === "function"){
    let g = [];
    try{ g = riverGaps(); }catch(e){ g = []; }
    for (const x of g) rank.set(x.he, Math.max(rank.get(x.he) || 0, x.gap));
  }
  const names = Array.from(count.keys()).sort((a, b) => {
    const ga = rank.get(a) || 0, gb = rank.get(b) || 0;
    if (ga !== gb) return gb - ga;
    return (count.get(b) || 0) - (count.get(a) || 0);
  }).slice(0, limit || 40);
  let got = 0;
  for (const nm of names){
    if (spineByName.has(regNorm(nm))) continue;
    const sp = await fetchSpine(nm);
    if (sp){ registerSpine(sp); got++; }
    await sleep(300);
  }
  return got;
}

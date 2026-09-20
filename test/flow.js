/* ============================================================
   The evidence ladder — what makes this map say "flowing"
   ------------------------------------------------------------
   reachState() is the single most consequential function in the
   project. It decides, for one reach on one day, which of five
   things the map tells the reader:

     EV_NODATA   the model has nothing here
     EV_DRY      the model says effectively no water
     EV_FLOW     water, and something corroborates it
     EV_UNVER    the model claims water and nothing supports it
     EV_STOPPED  the model claims water and the record contradicts it

   The rungs are ordered deliberately, and the order is the thing
   worth protecting: an observation outranks a model, a model
   outranks a long-run average, and an ephemeral channel with no
   rain behind it is not flowing however confident GloFAS is. A
   change that quietly promotes "unverified" to "flowing" is the
   regression this file exists to catch.

   The functions are pulled out of the built file rather than
   re-implemented, so this tests what actually ships.
   ============================================================ */
const ENV = require("./env");

const flow = ENV.extract(
  /const EV_NODATA[\s\S]*?\n}\n/,
  ["EV_NODATA", "EV_DRY", "EV_FLOW", "EV_UNVER", "EV_STOPPED", "reachState"],
  ["DRY_Q", "RAIN_MM", "R_PER"]);

const cls = ENV.extract(
  /const BINS = \[[\s\S]*?const NCLASS = \d+;/,
  ["classOf", "DRY_Q", "BINS", "CLS_UNKNOWN", "CLS_DRY", "CLS_QHI"]);

let bad = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log((ok ? "ok  " : "FAIL"), name.padEnd(52),
              ok ? "" : "got " + JSON.stringify(got) + " wanted " + JSON.stringify(want));
};

/* A reach carrying nothing but the regime class we want to exercise.
   reg.rec.c is the measured class: P perennial, N near-perennial,
   S seasonal, R rare. `it` marks a channel OSM calls intermittent. */
const reach = (o = {}) => ({
  reg: o.regime ? { rec: { c: o.regime } } : null,
  radar: o.radarWet ? { wet: 1 } : null,
  spring: o.spring ? { ls: 30 } : null,
  it: o.intermittent ? 1 : 0
});

const ev = (r, q, rain, opts = {}) =>
  flow.reachState(r, q, rain, !!opts.perennialUp, !!opts.springUp, !!opts.radarUp).ev;
const why = (r, q, rain, opts = {}) =>
  flow.reachState(r, q, rain, !!opts.perennialUp, !!opts.springUp, !!opts.radarUp).why;

console.log("\n-- no data and dry, which nothing may override --");
check("null discharge is no data", ev(reach(), null, 50), flow.EV_NODATA);
check("NaN discharge is no data", ev(reach(), NaN, 50), flow.EV_NODATA);
check("below the dry threshold is dry", ev(reach(), 0.001, 200), flow.EV_DRY);
check("dry wins over radar", ev(reach({ radarWet: 1 }), 0.001, 200), flow.EV_DRY);
check("dry wins over a perennial gauge", ev(reach({ regime: "P" }), 0.001, 200), flow.EV_DRY);
check("the dry threshold is 0.01 m3/s", cls.DRY_Q, 0.01);
check("exactly at the threshold is not dry", ev(reach(), 0.01, 50), flow.EV_FLOW);

console.log("\n-- observation outranks every model --");
check("radar on this reach means flowing", why(reach({ radarWet: 1 }), 5, 0), "radar");
check("radar upstream means flowing", why(reach(), 5, 0, { radarUp: 1 }), "radarup");
check("radar beats a rare regime", ev(reach({ regime: "R", radarWet: 1 }), 5, 0), flow.EV_FLOW);

console.log("\n-- the rain check, which is what stops invented water --");
check("no rain data at all is unverified", ev(reach(), 5, null), flow.EV_UNVER);
check("rain at the threshold corroborates", why(reach(), 5, 5), "rain");
check("rain below the threshold does not", why(reach(), 5, 4.9) !== "rain", true);
check("a rare wadi with no rain is overruled", ev(reach({ regime: "R" }), 40, 0), flow.EV_STOPPED);
check("a seasonal wadi with no rain is overruled", ev(reach({ regime: "S" }), 40, 0), flow.EV_STOPPED);
check("an intermittent channel with no rain is overruled",
      ev(reach({ intermittent: 1 }), 40, 0), flow.EV_STOPPED);
check("rain rescues the same rare wadi", ev(reach({ regime: "R" }), 40, 20), flow.EV_FLOW);

console.log("\n-- a measured source keeps a stream running without rain --");
check("a spring on the reach means flowing", why(reach({ spring: 1 }), 5, 0), "spring");
check("a spring upstream means flowing", why(reach(), 5, 0, { springUp: 1 }), "spring");
check("a spring outranks a rare regime", ev(reach({ regime: "R", spring: 1 }), 5, 0), flow.EV_FLOW);
check("a perennial gauge means flowing", why(reach({ regime: "P" }), 5, 0), "perennial");
check("a perennial source upstream means flowing",
      why(reach(), 5, 0, { perennialUp: 1 }), "perennial");

console.log("\n-- the honest middle: near-perennial and unclassified --");
check("near-perennial without rain stays unverified",
      ev(reach({ regime: "N" }), 5, 0), flow.EV_UNVER);
check("near-perennial says why it is unsure",
      why(reach({ regime: "N" }), 5, 0), "nearperennial");
check("an unclassified reach without rain stays unverified",
      ev(reach(), 5, 0), flow.EV_UNVER);

console.log("\n-- discharge classes, which drive colour and width --");
check("no value is the unknown class", cls.classOf(null), cls.CLS_UNKNOWN);
check("under the dry threshold is the dry class", cls.classOf(0.005), cls.CLS_DRY);
check("a Negev flood lands in the top class", cls.classOf(1155), cls.CLS_QHI);
check("classes rise monotonically with discharge",
      [0.02, 0.2, 1, 10, 100].map(cls.classOf).every((v, i, a) => i === 0 || v >= a[i-1]), true);
check("five bins scaled to Israeli hydrology", cls.BINS, [0.05, 0.5, 2, 20]);

console.log(bad ? "\n" + bad + " FAILED" : "\nall pass");
process.exit(bad ? 1 : 0);

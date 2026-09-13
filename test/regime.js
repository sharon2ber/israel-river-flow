/* The measured flow regime, and whether a reach finds the right gauge.

   Every expectation here is checked against data/regime.json, which is built
   from the Hydrological Service's own daily discharge record — so if the
   source changes shape, this fails rather than quietly mis-classifying. */
const fs = require("fs");
const path = require("path");
const REGIME = JSON.parse(fs.readFileSync(path.join(__dirname, "../data/regime.json"), "utf8"));
const src = fs.readFileSync(path.join(__dirname, "../dist/river_flow_israel.html"), "utf8");

const block = src.match(/const REG_NEAR_KM[\s\S]*?\nfunction assignRegimes/)[0]
                 .replace(/\nfunction assignRegimes$/, "");
const api = new Function("REGIME",
  block.replace(/^const /gm, "var ").replace(/^let /gm, "var ") +
  "; return { regNorm:regNorm, regimeFor:regimeFor, haverKm:haverKm };")(REGIME);

let bad = 0;
const check = (name, got, want) => {
  const ok = got === want;
  if (!ok) bad++;
  console.log((ok ? "ok  " : "FAIL"), name.padEnd(46), String(got).padEnd(14), ok ? "" : "(wanted " + want + ")");
};

/* --- the source itself --- */
const counts = REGIME.st.reduce((m, r) => { m[r[5]] = (m[r[5]] || 0) + 1; return m; }, {});
check("stations in the record", REGIME.st.length, 154);
check("perennial", counts.P, 19);
check("near-perennial", counts.N, 27);
check("seasonal", counts.S, 76);
check("rare", counts.R, 17);
check("period", REGIME.period, "hydrological years 2000/01 – 2023/24");

/* --- name normalisation --- */
check("regNorm 'נחל הירקון'", api.regNorm("נחל הירקון"), "הירקון");
check("regNorm 'Nakhal Alexander'", api.regNorm("Nakhal Alexander"), "alexander");
check("regNorm \"Nahal Ein Gedi\"", api.regNorm("Nahal Ein Gedi"), "ein gedi");
check("regNorm 'Wadi Qana'", api.regNorm("Wadi Qana"), "qana");

/* --- a reach finds the gauge on its own stream ---
   Coordinates are real: each is a point on the named watercourse. */
const reach = (he, en, lat, lon) =>
  ({ he: he, en: en, g: [[lon - 0.01, lat], [lon, lat], [lon + 0.01, lat]] });

const cases = [
  ["Yarqon at Tel Aviv",        reach("", "Nakhal Yarqon",   32.10, 34.83), "P"],
  ["Jordan below Sede Nehemya", reach("", "Jordan",          33.18, 35.61), "P"],
  ["Dan in the reserve",        reach("", "Nahal Dan",       33.24, 35.65), "P"],
  ["Alexander at Elyashiv",     reach("", "Nakhal Alexander",32.39, 34.94), "P"],
  ["Qishon at the quarry",      reach("", "Nakhal Qishon",   32.72, 35.09), "P"],
  ["Timna above Eilat",         reach("", "Nahal Timna",     29.79, 34.97), "R"],
  ["Shelomo at Eilat",          reach("", "Nahal Shelomo",   29.55, 34.94), "R"],
  /* Zin at Masos carries water in 83% of years — seasonal, not rare. The
     rare classification belongs to the waterfall gauge alone, which is why
     the regime follows the gauge and not the name. */
  ["Zin at Masos",              reach("", "Nahal Zin",       30.80, 34.95), "S"],
  ["Besor at Re'im",            reach("", "Nahal Besor",     31.38, 34.45), "R"],
  ["Lakhish",                   reach("", "Nahal Lakhish",   31.60, 34.60), "N"]
];
for (const [label, r, want] of cases){
  const g = api.regimeFor(r);
  check(label, g && g.rec ? g.rec.c : null, want);
}

/* one stream, two regimes, and the map must not flatten them */
const zin = REGIME.st.filter(r => (r[12] || "").toUpperCase().includes("ZIN"));
check("Zin has gauges of more than one class",
      new Set(zin.map(r => r[5])).size > 1, true);
check("the Zin waterfall gauge is the rare one",
      (zin.find(r => /WATERFALL/i.test(r[12]) && !/UPSTREAM/i.test(r[12])) || [])[5], "R");

/* --- and does not invent one where there is no gauge --- */
const none = api.regimeFor(reach("", "Barada", 33.51, 36.30));
check("a stream with no gauge stays unknown", none, null);
const unnamed = api.regimeFor(reach("", "", 31.5, 34.9));
check("an unnamed reach stays unknown", unnamed, null);

/* --- the nearest gauge wins, not just any gauge of that name --- */
const upper = api.regimeFor(reach("", "Jordan", 33.18, 35.61));
const lower = api.regimeFor(reach("", "Jordan", 31.85, 35.55));
check("Jordan matches different gauges up and down", upper.rec.id !== lower.rec.id, true);

console.log(bad ? "\n" + bad + " FAILED" : "\nall pass");
process.exit(bad ? 1 : 0);

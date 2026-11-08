/* ============================================================
   Measured discharge — the baker and the rules for using it
   ------------------------------------------------------------
   Everything here runs on SYNTHETIC data: invented stations with
   invented names, generated into a temp folder. No real reading,
   and no credential of any kind, belongs in this file or in
   test/fixtures.

   Two halves.

   1. scripts/build_measured.py turns the collector's store into
      data/measured.json. What must survive: a missing value stays
      missing (never zero), time is UTC, a frozen sensor is flagged,
      an unusable row is dropped rather than guessed at.

   2. measuredFor() decides, at viewing time, whether a baked
      reading may speak for a reach. Every rule fails toward "no
      measurement". The test that matters most is the long reach:
      if one gauge can vouch for a whole river the design is broken
      even when every other assertion passes.
   ============================================================ */
const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawnSync } = require("child_process");
const ENV = require("./env");

let bad = 0;
const check = (name, got, want) => {
  const ok = JSON.stringify(got) === JSON.stringify(want);
  if (!ok) bad++;
  console.log((ok ? "ok  " : "FAIL"), name.padEnd(60),
              ok ? "" : "got " + JSON.stringify(got) + " wanted " + JSON.stringify(want));
};

/* ---------- 1. the baker ---------- */
const NOW = Date.parse("2026-11-08T12:00:00Z");
const STEP = 10 * 60 * 1000;
const utc = ms => new Date(ms).toISOString().slice(0, 16).replace("T", " ");
const local = ms => utc(ms + 2 * 3600 * 1000);          /* the service's fixed UTC+2 field */

const rows = [];
function station(cat, nameEn, nameHe, lat, lon, readings){
  for (const [ms, flow, level] of readings)
    rows.push({ catId: cat, measurePointId: cat + 1, nameEn, nameHe, lat, lon,
                basinNameEn: "Testbasin", timeUtc: utc(ms), timeIsraelWinterUtcPlus2: local(ms),
                level: level === undefined ? 0.5 : level, flow, measureUnit: null });
}
const run = (endMs, n, f, stepMs = STEP) =>
  Array.from({ length: n }, (_, i) => { const t = endMs - (n - 1 - i) * stepMs; return [t, f(i, t)]; });

const LAST = NOW - STEP;                                  /* 11:50 */
station(1001, "Testwadi-Upper", "טסט-עליון", 32.0, 35.01, run(LAST, 40, i => 1 + i * 0.01));
station(1002, "Frozenwadi-Mid", "קפוא-אמצע", 32.5, 35.2, run(LAST, 40, () => 7.51));
station(1003, "Dryzero-Gate", "יבש-שער", 31.5, 34.9, run(LAST, 40, () => 0));
const gappy = run(LAST - 3 * STEP, 20, i => 2 + i * 0.1);   /* valid until 11:20 */
gappy.push([LAST - 2 * STEP, "no data"], [LAST - STEP, "NA"], [LAST, "no data"]);
station(1004, "Gappy-Site", "חסר-אתר", 32.2, 35.3, gappy);
station(1005, "Nodata-Only", "אין-נתון", 32.3, 35.4, run(LAST, 10, () => "no data"));
station(1006, "Silent-Old", "שקט-ישן", 32.4, 35.5, run(NOW - 49 * 3600e3, 6, () => 3));
station(1007, "Short-Run", "קצר-ריצה", 32.6, 35.6, run(LAST, 35, () => 5));
station(1008, "Burst-Same", "פרץ-זהה", 32.7, 35.7, run(LAST, 36, () => 5, 60 * 1000));
rows.push({ catId: 1001, nameEn: "Testwadi-Upper", timeUtc: "no data", flow: 99, level: 9 });
rows.push(Object.assign({}, rows[39], { flow: 123 }));      /* same (catId,timeUtc) as 1001's latest reading */

const dir = fs.mkdtempSync(path.join(os.tmpdir(), "measured-test-"));
const store = path.join(dir, "measurements.ndjson");
const out = path.join(dir, "measured.json");
fs.writeFileSync(store, rows.map(r => JSON.stringify(r)).join("\n") + "\n");

const script = path.resolve(__dirname, "../scripts/build_measured.py");
let res = null, PY = null;
for (const py of ["python", "python3"]){
  res = spawnSync(py, [script, "--store", store, "--out", out, "--now", "2026-11-08T12:00:00Z"],
                  { encoding: "utf-8" });
  if (!res.error){ PY = py; break; }
}
if (!res || res.status !== 0){
  console.error("build_measured.py failed:\n" + (res && (res.stderr || res.error)));
  process.exit(1);
}
const M = JSON.parse(fs.readFileSync(out, "utf8"));
const by = id => M.st.find(s => s.id === id);

console.log("\n-- baking the store --");
check("stations with no usable flow, or silent over 48 h, are left out",
      M.st.map(s => s.id), [1001, 1002, 1003, 1004, 1007, 1008]);
check("the latest reading is kept, in UTC", by(1001).tq, "2026-11-08T11:50:00Z");
check("the service's fixed-UTC+2 field is not used", by(1001).tq.slice(11, 13), "11");
check("the first row for a (catId,time) wins; a later duplicate does not", by(1001).q, 1.39);
check("a row whose timestamp is 'no data' is dropped, not placed", by(1001).q !== 99, true);
check("a station whose latest rows are 'no data' keeps its last real flow",
      by(1004).q, 3.9);
check("that reading keeps its own timestamp, not the latest row's",
      by(1004).tq, "2026-11-08T11:20:00Z");
check("a real zero stays zero", by(1003).q, 0);
check("zero is not missing: a flat dry channel is not flagged frozen", by(1003).fz, 0);
check("an hour with nothing collected is null in the series, never 0",
      by(1004).s[35], null);
check("the series is one value per hour", by(1001).s.length, M.grid.n);
check("the last collected hour carries a value", by(1001).s[34] !== null, true);
check("level rides along with its own time", [by(1001).h, by(1001).tl], [0.5, "2026-11-08T11:50:00Z"]);

console.log("\n-- the frozen sensor --");
check("36 identical positive flows over 6 h is flagged", by(1002).fz, 1);
check("35 identical flows is not (boundary)", by(1007).fz, 0);
check("36 identical flows within an hour is not (span)", by(1008).fz, 0);
check("a varying flow is not flagged", by(1001).fz, 0);

check("an empty store bakes an empty file, not a crash", (() => {
  const e = path.join(dir, "empty.ndjson"), eo = path.join(dir, "empty.json");
  fs.writeFileSync(e, "");
  const r = spawnSync(PY, [script, "--store", e, "--out", eo], { encoding: "utf-8" });
  return r.status === 0 && JSON.parse(fs.readFileSync(eo, "utf8")).st.length === 0;
})(), true);
check("a missing store writes nothing and says so", (() => {
  const r = spawnSync(PY, [script, "--store", path.join(dir, "nope"), "--out", path.join(dir, "nope.json")],
                      { encoding: "utf-8" });
  return r.status !== 0 && !fs.existsSync(path.join(dir, "nope.json"));
})(), true);

/* ---------- 2. the rules for using a reading ---------- */
const src = ENV.distSource();
const grab = re => { const m = src.match(re); if (!m){ console.error("not found in dist: " + re); process.exit(1); } return m[0]; };
const code = "var MEASURED = null;   /* the baked file, as if it never loaded */\n" + ENV.constants(["MEAS_MAX_AGE_MIN", "MEAS_FUTURE_SLACK_MIN", "MEAS_SNAP_KM", "MEAS_MAX_REACH_KM"]) + "\n"
  + grab(/function regNorm[\s\S]*?\n}\n/) + "\n"
  + grab(/function measStream[\s\S]*?function measuredFor[\s\S]*?\n}\n/);
const M2 = new Function(code + "; return { measuredFor, MEAS_MAX_AGE_MIN, MEAS_FUTURE_SLACK_MIN, MEAS_SNAP_KM, MEAS_MAX_REACH_KM };")();

const TODAY = "2026-11-08";
const KM_LAT = 1 / 110.57;                               /* degrees of latitude per km */
const gauge = (o = {}) => Object.assign(
  { id: 1, en: "Testwadi-Upper", he: "טסט-עליון", lat: 32.0, lon: 35.01,
    tq: "2026-11-08T11:50:00Z", q: 2.5, h: 0.4, fz: 0 }, o);
const data = (...st) => ({ st });
const reachOf = (o = {}) => Object.assign(
  { en: "Nahal Testwadi", he: "נחל טסט", g: [[35.00, 32.0], [35.02, 32.0]] }, o);   /* ~1.9 km */
const mf = (r, d, o = {}) => M2.measuredFor(r, o.now || NOW, o.date || TODAY, d);
const ago = min => new Date(NOW - min * 60000).toISOString().replace(".000", "");

console.log("\n-- the thresholds are the ones documented --");
check("a reading is good for 180 minutes", M2.MEAS_MAX_AGE_MIN, 180);
check("a gauge speaks for reaches within 1.5 km", M2.MEAS_SNAP_KM, 1.5);
check("a reach longer than 6 km is too long for one point", M2.MEAS_MAX_REACH_KM, 6);

console.log("\n-- a reading must be fresh, today, and real --");
check("a fresh reading on the same stream counts", mf(reachOf(), data(gauge())).q, 2.5);
check("it reports how old it is", mf(reachOf(), data(gauge())).ageMin, 10);
check("a reading exactly at the age limit still counts",
      mf(reachOf(), data(gauge({ tq: ago(M2.MEAS_MAX_AGE_MIN) }))) !== null, true);
check("one minute past the limit does not",
      mf(reachOf(), data(gauge({ tq: ago(M2.MEAS_MAX_AGE_MIN + 1) }))), null);
check("a reading from 40 hours ago is not evidence about now",
      mf(reachOf(), data(gauge({ tq: ago(40 * 60) }))), null);
check("a reading stamped in the future does not count",
      mf(reachOf(), data(gauge({ tq: ago(-30) }))), null);
check("a few minutes of clock skew is tolerated",
      mf(reachOf(), data(gauge({ tq: ago(-5) }))) !== null, true);
check("a frozen sensor is no measurement",
      mf(reachOf(), data(gauge({ fz: 1 }))), null);
check("a missing flow is no measurement", mf(reachOf(), data(gauge({ q: null }))), null);
check("a measured zero IS a measurement", (mf(reachOf(), data(gauge({ q: 0 }))) || {}).q, 0);
check("yesterday's map does not get this morning's reading",
      mf(reachOf(), data(gauge()), { date: "2026-11-07" }), null);
check("tomorrow's map does not either",
      mf(reachOf(), data(gauge()), { date: "2026-11-09" }), null);
check("no baked data is no measurement", mf(reachOf(), { st: [] }), null);
check("a baked file that never loaded is no measurement", mf(reachOf(), null) , null);

console.log("\n-- same stream, and close --");
check("a nearer gauge on a different stream does not count",
      mf(reachOf(), data(gauge({ en: "Otherwadi-Upper", he: "אחר-עליון" }))), null);
check("only the part before the hyphen names the stream",
      mf(reachOf({ en: "Upper", he: "עליון" }), data(gauge())), null);
check("the Hebrew name alone is enough",
      mf(reachOf({ en: undefined }), data(gauge({ en: undefined }))) !== null, true);
check("the English name alone is enough",
      mf(reachOf({ he: undefined }), data(gauge({ he: undefined }))) !== null, true);
check("a reach with no name is never credited",
      mf(reachOf({ en: undefined, he: undefined }), data(gauge())), null);
check("a gauge 1 km off the line, on the stream, counts",
      mf(reachOf(), data(gauge({ lat: 32.0 + 1.0 * KM_LAT }))) !== null, true);
check("a gauge 2 km off the line does not",
      mf(reachOf(), data(gauge({ lat: 32.0 + 2.0 * KM_LAT }))), null);
check("with two gauges the nearer one speaks",
      mf(reachOf(), data(gauge({ id: 1, q: 9, lat: 32.0 + 1.2 * KM_LAT }),
                         gauge({ id: 2, q: 4, lat: 32.0 + 0.2 * KM_LAT }))).q, 4);
check("a stale near gauge does not shadow a fresh farther one",
      mf(reachOf(), data(gauge({ id: 1, q: 9, tq: ago(500) }),
                         gauge({ id: 2, q: 4, lat: 32.0 + 1.2 * KM_LAT }))).q, 4);

console.log("\n-- a point does not vouch for a whole river --");
const longReach = reachOf({ g: [[35.00, 32.0], [35.10, 32.0], [35.20, 32.0]] });    /* ~19 km */
check("a long reach is not credited, though the gauge sits on it",
      mf(longReach, data(gauge({ lon: 35.01 }))), null);
check("the same gauge still speaks for a short reach",
      mf(reachOf(), data(gauge({ lon: 35.01 }))) !== null, true);

fs.rmSync(dir, { recursive: true, force: true });
console.log(bad ? "\n" + bad + " FAILED" : "\nall pass");
process.exit(bad ? 1 : 0);

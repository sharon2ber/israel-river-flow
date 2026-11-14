/* Overpass failure modes: total outage, partial outage, and recovery. */
const { chromium } = require("playwright");
const path = require("path");
const F = require("./fixtures");
const ENV = require("./env");

const CLEAR_TILE = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const TILE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64");
const FILE = ENV.distUrl();

/* split the fixture rivers across bands by latitude so each band returns some */
function bandOf(body){
  const m = body.match(/river"\]\(([\d.]+),([\d.]+),([\d.]+),([\d.]+)\)/);
  if (!m) return null;
  return { s: +m[1], n: +m[3] };
}
function riversFor(bb){
  if (!bb) return F.RIVERS;
  const els = F.RIVERS.elements.filter(e => {
    const lat = e.geometry[0].lat;
    return lat >= bb.s && lat < bb.n;
  });
  return { version: 0.6, elements: els };
}

async function run(name, plan, opts){
  opts = opts || {};
  const browser = await chromium.launch(ENV.launchOptions());
  const page = await browser.newPage({ viewport: { width: 1280, height: 820 } });
  const errors = [];
  page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
  page.on("console", m => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });

  let overpassCalls = 0;
  await page.route("**/*", async route => {
    const url = route.request().url();
    if (url.startsWith("file://")) return route.continue();
    if (url.includes("basemaps.cartocdn.com"))
      return route.fulfill({ status: 200, contentType: "image/png", body: TILE });
    if (url.includes("overpass") || url.includes("interpreter")) {
      const body = decodeURIComponent(route.request().postData() || "");
      const isWater = body.includes("natural");
      const n = ++overpassCalls;
      const verdict = plan(n, body, isWater);
      if (verdict === "fail")   return route.fulfill({ status: 429, body: "too many requests" });
      if (verdict === "remark") return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify({ version: 0.6, remark: "runtime error: Query timed out", elements: [] }) });
      if (verdict === "dead")   return route.abort("failed");
      if (verdict === "hang")   return new Promise(() => {});      /* accepts the connection, never answers */
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(isWater ? F.WATER : riversFor(bandOf(body))) });
    }
    if (url.includes("israel_rivers")) {
      if (plan(0, "AGS", false) === "no-ags") return route.abort("failed");
      const off = +(url.match(/resultOffset=(\d+)/) || [0,0])[1];
      const cnt = +(url.match(/resultRecordCount=(\d+)/) || [0,2000])[1];
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(F.agsRivers(off, cnt)) });
    }
    if (url.includes("NehalimDigum")) {
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(F.AGS_SAMPLING) });
    }
    if (url.includes("/v1/elevation")) {
      const n = (url.match(/latitude=([^&]*)/)[1] || "").split(",").length;
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(F.elevationFor(n)) });
    }
    if (url.includes("arcgisonline.com") || url.includes("opentopomap.org")) {
      const clear = /Reference|Boundaries_and_Places|only_labels/.test(url);
      return route.fulfill({ status: 200, contentType: "image/png", body: clear ? CLEAR_TILE : TILE });
    }
    if (url.includes("flood-api")) {
      if (url.includes("start_date"))
        return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(F.historyFor()) });
      const c = (url.match(/latitude=([^&]*)/)[1] || "").split(",").length;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(F.floodFor(c)) });
    }
    return route.fulfill({ status: 204, body: "" });
  });

  await page.goto(FILE, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(200);
  await page.evaluate(() => { try { indexedDB.deleteDatabase("riverflow_il"); } catch(e){} });
  const t0 = Date.now();
  await page.goto(FILE, { waitUntil: "domcontentloaded" });

  const settled = await page.waitForFunction(() => {
    const b = document.querySelector("#boot");
    if (!b || b.classList.contains("done")) return "map";
    if (document.querySelector("#bmsg button")) return "error-ui";
    return false;
  }, { timeout: 90000 }).then(h => h.jsonValue()).catch(() => "timeout");

  const msToMap = Date.now() - t0;
  await page.waitForTimeout(800);
  const out = { name, settled, overpassCalls, msToMap };
  if (opts.fill){
    /* OpenStreetMap's reaches arrive behind the map; wait for them, then check they
       were brought up to the same standard as the rest (a cell, and an evidence state). */
    out.filled = await page.waitForFunction(n => S.reaches.length >= n, opts.fill, { timeout: 60000 })
      .then(() => true).catch(() => false);
    /* reservoirs and dams are fetched after the reaches have been brought up to standard,
       so when they appear the catch-up is over */
    out.waterAfter = await page.waitForFunction(() => S.water.polys.length + S.water.dams.length, null, { timeout: 60000 })
      .then(h => h.jsonValue()).catch(() => 0);
    await page.waitForTimeout(1500);
    out.unprocessed = await page.evaluate(() =>
      S.reaches.filter(r => !r.cell || r.ev === undefined || r.ev === null).length);
    out.unflowed = await page.evaluate(() => S.reaches.filter(r => !S.flow.has(r.cell)).length);
  }
  out.reaches = await page.evaluate(() => S.reaches.length).catch(() => -1);
  out.banner  = await page.evaluate(() => { const b = document.querySelector("#banner"); return b ? b.innerText.trim() : ""; });
  out.bootMsg = await page.evaluate(() => { const b = document.querySelector("#bmsg"); return b ? b.innerText.trim().slice(0, 200) : ""; });
  await page.screenshot({ path: "shots/r-" + name + ".png" });

  if (settled === "error-ui"){
    /* the "continue without rivers" escape hatch must give a usable map */
    const btns = await page.$$("#bmsg button");
    await btns[btns.length - 1].click();
    await page.waitForTimeout(1200);
    out.afterContinue = await page.evaluate(() => {
      const b = document.querySelector("#boot");
      return { bootGone: !b || b.classList.contains("done"),
               stations: document.querySelectorAll("canvas").length,
               stat: (document.querySelector("#stat") || {}).innerText || "" };
    });
    await page.screenshot({ path: "shots/r-" + name + "-continue.png" });
  }
  out.errors = errors;
  await browser.close();
  return out;
}

(async () => {
  const results = [];
  /* ONLY=all-ok|hung npm run test:resilience runs just the scenarios whose name matches (for debugging) */
  const only = process.env.ONLY ? new RegExp(process.env.ONLY) : null;
  const go = (name, plan, opts) => only && !only.test(name) ? Promise.resolve(null) : run(name, plan, opts);
  results.push(await go("all-ok", () => "ok", { fill: 2623 }));
  /* Overpass accepts every request and never answers: the map must still open, quickly,
     on the official layer, and say that the rest is on its way. */
  results.push(await go("hung-overpass", () => "hang"));
  results.push(await go("partial", (n, body, isWater) =>
    (!isWater && (n === 2 || n === 4)) ? "fail" : "ok"));
  results.push(await go("total-outage", (n, body, isWater) => isWater ? "ok" : "dead"));
  results.push(await go("remarks", (n, body, isWater) => isWater ? "ok" : (n < 12 ? "remark" : "ok")));
  /* the official layer down, OSM healthy: the map must fall back cleanly */
  results.push(await go("no-official", (n, body) => body === "AGS" ? "no-ags" : "ok"));
  results.splice(0, results.length, ...results.filter(Boolean));
  console.log(JSON.stringify(results, null, 1));

  /* What resilience means here: a failing source must degrade the map, never
     break it. Every scenario has to finish booting and leave the reader with
     something honest on screen — so no scenario may raise a page error, and
     the only one allowed to draw nothing is the one where every river source
     is dead, which is supposed to offer "continue without rivers" instead. */
  /* A blocked request logs a console error in the browser, and blocking
     requests is the entire point of these scenarios — so network noise is
     expected and ignored. What must never happen is an uncaught exception:
     that is the map breaking rather than degrading. */
  const realFailure = e => e.startsWith("PAGEERROR:") || e.includes("PAGE CRASHED");
  let bad = 0;
  for (const r of results){
    const thrown = (r.errors || []).filter(realFailure);
    const noErrors = thrown.length === 0;
    if (!noErrors) bad++;
    console.log((noErrors ? "ok  " : "FAIL"), (r.name || "?").padEnd(20),
                "uncaught=" + thrown.length + (noErrors ? "" : " " + thrown[0].slice(0, 90)));
    if (r.name !== "total-outage"){
      const drew = (r.reaches || 0) > 0;
      if (!drew) bad++;
      console.log((drew ? "ok  " : "FAIL"), (r.name + " drew a network").padEnd(20),
                  "reaches=" + (r.reaches || 0));
    }
  }
  /* First visit: the map must not wait for OpenStreetMap. */
  const byName = n => results.find(r => r.name === n) || {};
  const A = byName("all-ok"), H = byName("hung-overpass");
  const expect = (label, ok, detail) => {
    if (!ok) bad++;
    console.log((ok ? "ok  " : "FAIL"), label.padEnd(46), ok ? "" : detail);
  };
  expect("hung Overpass: the map opens anyway", H.settled === "map", "settled=" + H.settled);
  expect("... well inside what waiting would cost", H.msToMap < 60000, "took " + H.msToMap + " ms");
  expect("... on the official layer", H.reaches === 2600, "reaches=" + H.reaches);
  expect("... saying the rest is on its way", /OpenStreetMap/.test(H.banner || ""), "banner=" + JSON.stringify(H.banner));
  expect("healthy Overpass: reaches arrive behind the map", A.filled === true, "filled=" + A.filled);
  expect("... each with a cell and an evidence state", A.unprocessed === 0, "unprocessed=" + A.unprocessed);
  expect("... and the model has been asked about them", A.unflowed === 0, "unflowed=" + A.unflowed);
  expect("... and reservoirs and dams arrive too", A.waterAfter > 0, "water=" + A.waterAfter);
  console.log(bad ? "\n" + bad + " FAILED" : "\nall scenarios pass");
  process.exit(bad ? 1 : 0);
})();

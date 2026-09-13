/* Overpass failure modes: total outage, partial outage, and recovery. */
const { chromium } = require("playwright");
const path = require("path");
const F = require("./fixtures");

const CLEAR_TILE = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const TILE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64");
const EXE = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const FILE = "file://" + path.resolve(__dirname, "../dist/river_flow_israel.html");

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

async function run(name, plan){
  const browser = await chromium.launch({ executablePath: EXE });
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
  await page.goto(FILE, { waitUntil: "domcontentloaded" });

  const settled = await page.waitForFunction(() => {
    const b = document.querySelector("#boot");
    if (!b || b.classList.contains("done")) return "map";
    if (document.querySelector("#bmsg button")) return "error-ui";
    return false;
  }, { timeout: 90000 }).then(h => h.jsonValue()).catch(() => "timeout");

  await page.waitForTimeout(800);
  const out = { name, settled, overpassCalls };
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
  results.push(await run("all-ok", () => "ok"));
  results.push(await run("partial", (n, body, isWater) =>
    (!isWater && (n === 2 || n === 4)) ? "fail" : "ok"));
  results.push(await run("total-outage", (n, body, isWater) => isWater ? "ok" : "dead"));
  results.push(await run("remarks", (n, body, isWater) => isWater ? "ok" : (n < 12 ? "remark" : "ok")));
  /* the official layer down, OSM healthy: the map must fall back cleanly */
  results.push(await run("no-official", (n, body) => body === "AGS" ? "no-ags" : "ok"));
  console.log(JSON.stringify(results, null, 1));
})();

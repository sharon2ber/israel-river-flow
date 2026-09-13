const { chromium } = require("playwright");
const path = require("path");
const F = require("./fixtures");

const CLEAR_TILE = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=", "base64");
const TILE = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAACAElEQVR42u3TQQkAAAgEwcsggv2b+jaDA5NgYVM98FYkwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAABlABA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwABgADAAGAAMAAYAA4ABwAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABsAAKmAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAwABgADgAHAAGAAMAAYAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGAAOAAcAAYAAwABgADAAGgGsBmuQDlFW02IAAAAAASUVORK5CYII=",
  "base64");

(async () => {
  const browser = await chromium.launch({ executablePath: "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell" });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });

  const errors = [], warns = [];
  page.on("pageerror", e => errors.push("PAGEERROR: " + e.message));
  page.on("crash", () => errors.push("PAGE CRASHED"));
  page.on("framenavigated", f => { if (f === page.mainFrame()) console.error("NAV ->", f.url()); });
  page.on("console", m => {
    if (m.type() === "error") errors.push("CONSOLE: " + m.text());
    else if (m.type() === "warning") warns.push(m.text());
  });

  await page.route("**/*", async route => {
    const url = route.request().url();
    if (url.startsWith("file://")) return route.continue();
    if (url.includes("basemaps.cartocdn.com"))
      return route.fulfill({ status: 200, contentType: "image/png", body: TILE });
    if (url.includes("overpass")) {
      const body = route.request().postData() || "";
      const isWater = body.includes("natural") || body.includes("reservoir");
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(isWater ? F.WATER : F.RIVERS) });
    }
    if (url.includes("israel_rivers")) {
      const off = +(url.match(/resultOffset=(\d+)/) || [0,0])[1];
      const cnt = +(url.match(/resultRecordCount=(\d+)/) || [0,2000])[1];
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(F.agsRivers(off, cnt)) });
    }
    if (url.includes("NehalimDigum")) {
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(F.AGS_SAMPLING) });
    }
    if (url.includes("open.govmap.gov.il")) {
      if (url.includes("nechalim1")) {
        const m = url.match(/FNAME(?:%20|\+| )LIKE(?:%20|\+| )(?:'|%27)?%25(.*?)%25/);
        const nm = m ? decodeURIComponent(m[1]) : "";
        return route.fulfill({ status: 200, contentType: "application/json",
          body: JSON.stringify(F.netFor(nm)) });
      }
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(F.BASINS) });
    }
    if (url.includes("rainviewer.com/public/weather-maps.json")) {
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(F.radarIndex()) });
    }
    if (url.includes("tilecache.rainviewer.com")) {
      /* echo over some tiles and not others, so the evidence pass has to
         actually distinguish a wet catchment from a dry one */
      const m = url.match(/\/256\/(\d+)\/(\d+)\/(\d+)\//);   /* size / z / x / y */
      const wet = m && (+m[3] % 2 === 0);
      return route.fulfill({ status: 200, contentType: "image/png",
        body: wet ? TILE : CLEAR_TILE });
    }
    if (url.includes("/v1/forecast")) {
      const n = (url.match(/latitude=([^&]*)/)[1] || "").split(",").length;
      return route.fulfill({ status: 200, contentType: "application/json",
        body: JSON.stringify(F.rainFor(n)) });
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
      if (url.includes("start_date")) {
        const n = (url.match(/latitude=([^&]*)/)[1] || "").split(",").length;
        const yrs = /2019|201\d/.test(url) ? 20 : 10;
        return route.fulfill({ status: 200, contentType: "application/json",
          body: JSON.stringify(F.historyFor(n, n > 1 ? 10 : 20)) });
      }
      const n = (url.match(/latitude=([^&]*)/)[1] || "").split(",").length;
      return route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(F.floodFor(n)) });
    }
    return route.fulfill({ status: 204, body: "" });
  });

  const file = "file://" + path.resolve(__dirname, "../dist/river_flow_israel.html");
  await page.goto(file, { waitUntil: "domcontentloaded" });

  await page.waitForFunction(() => {
    const b = document.querySelector("#boot");
    return !b || b.classList.contains("done");
  }, { timeout: 45000 }).catch(() => errors.push("BOOT: overlay never cleared"));

  await page.waitForTimeout(1500);

  const stat = await page.textContent("#stat").catch(() => "");
  const state = await page.evaluate(() => ({
    reaches: S.reaches.length,
    withFlow: S.reaches.filter((_, i) => qOf(i) != null).length,
    times: S.times.length, dayIdx: S.dayIdx,
    stations: STATIONS.s.length,
    waterPolys: S.water.polys.length, dams: S.water.dams.length,
    borders: S.borders.length, crossings: S.crossings.length,
    osmKept: S.reaches.filter(r => r.src === 0).map(r => r.en || r.he),
    borderPairs: Array.from(new Set(S.crossings.map(c => c.a + "-" + c.b))),
    crossSample: S.crossings.slice(0,4).map(c => [c.en || c.he, c.a + "-" + c.b, c.cls]),
    conf: [0,1,2].map(k => S.reaches.filter(r => r.conf === k).length),
    ev: [EV_NODATA, EV_DRY, EV_FLOW, EV_UNVER, EV_STOPPED]
          .map(k => S.reaches.filter(r => r.ev === k).length),
    rainCells: S.rain.size,
    regimeMatched: S.reaches.filter(r => r.reg && r.reg.rec).length,
    regimeClasses: S.reaches.reduce((m, r) => {
      const c = r.reg && r.reg.rec ? r.reg.rec.c : "-"; m[c] = (m[c]||0)+1; return m; }, {}),
    /* the whole point: a river may change state once along its length, never
       flicker. Count the flips along every connected chain. */
    flips: (() => {
      let worst = 0, chainsWithFlip = 0, total = 0;
      for (const ch of S.chains){
        let prev = null, flips = 0;
        for (const i of ch){
          const f = S.reaches[i].ev === EV_FLOW;
          if (prev !== null && f !== prev) flips++;
          prev = f;
        }
        total++;
        if (flips > worst) worst = flips;
        if (flips > 1) chainsWithFlip++;
      }
      return { chains: total, worstFlips: worst, chainsOverOne: chainsWithFlip };
    })(),
    transMarks: S.reaches.filter(r => r.trans).length,
    groups: document.querySelectorAll("#ctl .grp").length,
    audit: (() => { const a = networkAudit(6);
      return { rivers: a.rivers, fragmented: a.fragmented, broken: a.broken,
               worst: a.worst.map(r => [r.name, r.pieces, r.breaks, r.gap]) }; })(),
    spines: { built: spines.length, matched: S.reaches.filter(r => r.spine).length,
              ordAcc: S.reaches.filter(r => r.ordBy === "acc").length },
    basins: { n: S.basins.length, assigned: S.reaches.filter(r => r.basin != null).length,
              cells: S.basinCells ? S.basinCells.size : 0,
              withCatchRain: S.reaches.filter(r => r.catch).length,
              graph: S.basinUp ? Math.max(...Array.from(S.basinUp.values()).map(a => a.length)) : 0 },
    radar: { indexed: !!RADAR, cells: S.radar ? S.radar.size : 0,
             byRadar: S.reaches.filter(r => r.evWhy === "radar" || r.evWhy === "radarup").length },
    springs: { total: springsList().length,
               live: springsList().filter(springLive).length,
               fed: S.reaches.filter(r => r.spring).length,
               bySpring: S.reaches.filter(r => r.evWhy === "spring").length,
               markers: springLayer.getLayers().length },
    disagree: { over: S.reaches.filter(r => r.dis > 0).length,
                under: S.reaches.filter(r => r.dis < 0).length },
    waterKinds: S.water.polys.reduce((m, w) => { m[w.k] = (m[w.k]||0)+1; return m; }, {}),
    waterFilled: S.water.polys.filter(w => w.wet).length,
    canvas: [document.querySelector("canvas.riv").width, document.querySelector("canvas.riv").height],
    markers: document.querySelectorAll("path.leaflet-interactive").length
  }));

  await page.screenshot({ path: "shots/01-en.png" });

  // hover a river
  await page.mouse.move(700, 430);
  await page.waitForTimeout(400);
  await page.mouse.move(702, 431);
  await page.waitForTimeout(500);
  const tipVisible = await page.evaluate(() => getComputedStyle(document.querySelector("#tip")).display);
  await page.screenshot({ path: "shots/02-hover.png" });

  // click a river via API to guarantee a hit, then screenshot the detail panel
  await page.evaluate(() => { showReach(0); });
  await page.waitForTimeout(1200);
  const infoText = await page.textContent("#info");
  await page.screenshot({ path: "shots/03-detail.png" });

  // toggles — open every layer group first, some now start collapsed
  await page.evaluate(() => {
    document.querySelectorAll("#ctl .grp:not(.open) .ghead").forEach(h => h.click());
  });
  await page.waitForTimeout(200);
  await page.click('label[data-k="names"]');
  await page.click('label[data-k="anom"]');
  await page.waitForTimeout(2500);
  await page.screenshot({ path: "shots/04-names-anom.png" });

  // station click
  await page.evaluate(() => { showStation(18); });
  await page.waitForTimeout(300);
  const stTxt = await page.textContent("#info");

  // search
  await page.fill("#q", "yarkon");
  await page.waitForTimeout(300);
  const searchHits = await page.evaluate(() => document.querySelectorAll("#qres button").length);
  await page.screenshot({ path: "shots/05-search.png" });

  // day slider
  await page.evaluate(() => {
    const d = document.querySelector("#day"); d.value = "5";
    d.dispatchEvent(new Event("input"));
  });
  await page.waitForTimeout(300);
  const dayLabel = await page.textContent("#dayv");

  // basemap picker: open it and switch to the hillshade
  await page.click("#basebtn");
  await page.waitForTimeout(400);
  await page.screenshot({ path: "shots/10-basemenu.png" });
  await page.click('.bopt[data-b="hill"]');
  await page.waitForTimeout(900);
  const surf = await page.evaluate(() => [SURF, document.body.dataset.surf, S.basemap]);
  await page.screenshot({ path: "shots/11-hillshade.png" });
  await page.click('.bopt[data-b="dark"]');
  await page.waitForTimeout(500);
  await page.click("#basebtn");

  // Hebrew
  await page.click('#langseg button[data-lang="he"]');
  await page.waitForTimeout(900);
  const dir = await page.evaluate(() => document.documentElement.dir);
  await page.screenshot({ path: "shots/06-he.png" });

  // about
  await page.click("#aboutbtn");
  await page.waitForTimeout(500);
  await page.screenshot({ path: "shots/07-about-he.png" });

  const baked = await page.evaluate(() => VALID && ({ n: VALID.n, when: VALID.when,
    within3: VALID.within3, rho: VALID.rho, live: !!VALID.live,
    verdictLen: (document.querySelector("#verbox") || {}).textContent.length }));
  await page.evaluate(() => { const b = document.querySelector("#cmpbox");
    if (b) b.scrollIntoView({ block: "center" }); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "shots/15-compare.png" });
  await page.evaluate(() => { const b = document.querySelector("#verbox");
    if (b) b.scrollIntoView({ block: "center" }); });
  await page.waitForTimeout(300);
  await page.screenshot({ path: "shots/13-baked.png" });

  // verification: run the model-vs-gauge check from the About panel
  await page.evaluate(() => { VAL_GAP = 40; });   /* the live pacing is 66 s a call */
  await page.click("#verrun");
  await page.waitForFunction(() => !!document.querySelector("#vertable"), { timeout: 90000 })
    .catch(() => errors.push("VERIFY: never produced a table"));
  const verify = await page.evaluate(() => VALID && ({
    n: VALID.n, attempted: VALID.attempted, failed: VALID.failed,
    within2: VALID.within2, within3: VALID.within3,
    medianRatio: VALID.medianRatio, rho: VALID.rho,
    seasonal: VALID.seasonal, summerDry: VALID.summerDry
  }));
  await page.screenshot({ path: "shots/12-verify.png" });
  await page.click("#aboutx");

  // gap filling: a river the official layer leaves with a hole must be
  // completed from the national network, and only where the hole is
  const gapfill = await page.evaluate(async () => {
    const paranBefore = S.reaches.filter(r => /פארן/.test(r.he || "")).length;
    const gapsBefore = riverGaps().filter(g => /פארן/.test(g.he));
    const res = await fillGaps(6);
    assignCells(); buildGroups(); reset();
    const paranAfter = S.reaches.filter(r => /פארן/.test(r.he || ""));
    /* the stem itself: one continuous line over every order the river is
       carried at, with the stubs dropped and the backwards segments flipped */
    const feats = await (await fetch("https://open.govmap.gov.il/geoserver/opendata/wfs?typeNames=nechalim1&CQL_FILTER=FNAME%20LIKE%20%27%25\u05e4\u05d0\u05e8\u05df%25%27")).json();
    const st = netStem(feats.features || [], "\u05e4\u05d0\u05e8\u05df");
    const lats = st ? st.path.map(p => p[1]) : [];
    return { gapsFound: res.gaps, rivers: res.rivers, added: res.added,
             paranBefore: paranBefore, paranAfter: paranAfter.length,
             paranGapBefore: gapsBefore.length ? gapsBefore[0].gap : null,
             fromNetwork: paranAfter.filter(r => r.src === 2).length,
             paranKm: +paranAfter.reduce((s, r) => s + r.km, 0).toFixed(1),
             stemOrders: st ? st.orders : null,
             stemKm: st ? st.km : null,
             stemSegs: st ? st.n : null, stemDropped: st ? st.dropped : null,
             stemWorstJoinKm: st ? st.gap : null,
             stemLat: st ? [+Math.min.apply(null,lats).toFixed(3),
                            +Math.max.apply(null,lats).toFixed(3)] : null };
  });

  // the comparison against the measured record must be present in About
  const compare = await page.evaluate(() => {
    const rep = regimeReport();
    return { matched: rep.matched, over: rep.over.length, under: rep.under.length,
             byClass: rep.byClass,
             boxLen: (document.querySelector("#cmpbox") || {}).textContent.length || 0 };
  });

  // a reach on a rare or seasonal stream with no rain must read dry, not blue
  const overruled = await page.evaluate(() => {
    const i = S.reaches.findIndex(r => r.evWhy === "rare" || r.evWhy === "seasonal");
    if (i < 0) return null;
    showReach(i);
    return { why: S.reaches[i].evWhy, ev: S.reaches[i].ev, cls: S.reaches[i].cls,
             shown: shownQ(i),
             panel: document.querySelector("#info").textContent.replace(/\s+/g," ").slice(0,150) };
  });
  // a perennial stream with no rain must read flowing, not unverified
  const perennial = await page.evaluate(() => {
    const i = S.reaches.findIndex(r => r.evWhy === "perennial");
    if (i < 0) return null;
    return { ev: S.reaches[i].ev, cls: S.reaches[i].cls, name: S.reaches[i].en || S.reaches[i].he };
  });

  // a spring must be clickable and say what it measures
  const spring = await page.evaluate(() => {
    const i = springsList().findIndex(s => (s[10] != null ? s[10] : s[7]) > 500);
    if (i < 0) return null;
    showSpring(i);
    return { name: springsList()[i][3],
             panel: document.querySelector("#info").textContent.replace(/\s+/g," ").slice(0,140) };
  });

  // the national network must actually re-order a river when it arrives
  const spine = await page.evaluate(async () => {
    const i = S.reaches.findIndex(r => (S.groups.get(nameKey(r)) || []).length > 4 && riverNameHe(r));
    if (i < 0) return null;
    const before = { pieces: riverTrace(i).pieces, ordBy: riverTrace(i).ordBy };
    const sp = await ensureSpine(S.reaches[i]);
    assignSpines(); reliabilityPass();
    /* trace a reach the network actually recognised: in the fixture the
       official-layer geometry is synthetic, so only part of a named group
       lands near the real line */
    const k = S.reaches.findIndex(r => r.spine);
    const t = k >= 0 ? riverTrace(k) : null;
    return { river: riverNameHe(S.reaches[i]),
             spinePts: sp ? sp.pts.length : 0, spineKm: sp ? sp.km : null,
             spineRuns: sp ? sp.n : 0, decoyDropped: sp ? sp.n < 44 : null,
             before: before,
             after: t ? { pieces: t.pieces, ordBy: t.ordBy, n: t.n,
                          accFirst: t.steps[0].acc, accLast: t.steps[t.steps.length-1].acc,
                          mouthGap: t.mouthGap } : null,
             matched: S.reaches.filter(r => r.spine).length,
             ordAcc: S.reaches.filter(r => r.ordBy === "acc").length };
  });

  // the trace view must open and explain a river end to end
  const trace = await page.evaluate(async () => {
    const i = S.reaches.findIndex(r => (r.en || r.he) && (S.groups.get(nameKey(r)) || []).length > 4);
    if (i < 0) return null;
    await showTrace(i);
    const t = riverTrace(i);
    return { name: t.name, n: t.n, pieces: t.pieces, maxGap: t.maxGap,
             coastKm: t.coastKm, endsShort: t.endsShort, nodata: t.nodata,
             ordBy: t.ordBy,
             rows: document.querySelectorAll("#trtable tbody tr").length,
             open: document.querySelector("#trace").classList.contains("show") };
  });
  await page.screenshot({ path: "shots/16-trace.png" });
  await page.evaluate(() => { document.querySelector("#tracex").click(); });

  // the coastline must actually be usable for distance
  const coast = await page.evaluate(() => ({
    lines: COAST.length,
    telAvivBeach: +distToCoastKm(34.7480, 32.0900).toFixed(1),
    jerusalem:    +distToCoastKm(35.2137, 31.7683).toFixed(1),
    haifaPort:    +distToCoastKm(35.0000, 32.8200).toFixed(1)
  }));

  // a basin must be clickable and must say it is not known to hold water
  const basin = await page.evaluate(() => {
    const i = S.water.polys.findIndex(w => !w.wet);
    if (i < 0) return null;
    showWater(i);
    return { kind: S.water.polys[i].k, tags: S.water.polys[i].tg,
             panel: document.querySelector("#info").textContent.replace(/\s+/g, " ").slice(0, 200) };
  });

  // an unverified reach must say so rather than show a number as fact
  const unver = await page.evaluate(() => {
    const i = S.reaches.findIndex(r => r.ev === EV_UNVER);
    if (i < 0) return null;
    showReach(i);
    return document.querySelector("#info").textContent.replace(/\s+/g, " ").slice(0, 260);
  });
  await page.screenshot({ path: "shots/14-unverified.png" });

  // station panel should carry the per-gauge model-vs-measured pair
  await page.evaluate(() => { showStation(18); });
  await page.waitForTimeout(600);
  const vmodel = await page.textContent("#vmodel").catch(() => "");

  // the map must pan anywhere, not be fenced into Israel
  await page.evaluate(() => { map.setView([48.86, 2.35], 6); });
  await page.waitForTimeout(900);
  const away = await page.evaluate(() => [map.getCenter().lat.toFixed(2), map.getCenter().lng.toFixed(2)]);
  await page.click("#homebtn");
  await page.waitForTimeout(900);
  const backHome = await page.evaluate(() => [map.getCenter().lat.toFixed(2), map.getCenter().lng.toFixed(2), map.getZoom()]);

  // pruning: foreign-only streams must not survive
  const pruned = await page.evaluate(() => {
    const names = S.reaches.map(r => r.en || r.he);
    return ["Barada (Syria only)","Wadi Feiran (Sinai only)","Zarqa (Jordan only)"]
      .filter(n => names.includes(n));
  });
  if (pruned.length) errors.push("PRUNE: foreign streams kept -> " + pruned.join(", "));
  const crossKept = await page.evaluate(() => {
    const names = S.reaches.map(r => r.en || r.he);
    return ["Hasbani","Yarmouk","Wadi El-Arish"].filter(n => !names.includes(n));
  });
  if (crossKept.length) errors.push("PRUNE: cross-border streams dropped -> " + crossKept.join(", "));

  // zoom in
  await page.waitForTimeout(600);
  try { await page.evaluate(() => { map.setView([32.10, 34.88], 12); }); }
  catch(e){ errors.push("ZOOM STEP: " + e.message); }
  await page.waitForTimeout(1200);
  await page.screenshot({ path: "shots/08-zoom-he.png" });

  // reload to prove the cache path works
  await page.goto(file, { waitUntil: "domcontentloaded" });
  const t0 = Date.now();
  await page.waitForFunction(() => {
    const b = document.querySelector("#boot"); return !b || b.classList.contains("done");
  }, { timeout: 30000 }).catch(() => errors.push("BOOT2: cached boot never cleared"));
  const warmMs = Date.now() - t0;
  await page.waitForTimeout(800);
  await page.screenshot({ path: "shots/09-warm.png" });

  console.log(JSON.stringify({ stat, state, tipVisible,
    infoHas: infoText.slice(0, 120), stationHas: stTxt.slice(0, 120),
    searchHits, dayLabel, dir, surf, baked, verify, vmodel, compare, overruled, perennial, spring, spine, gapfill, trace, coast, basin, unver, away, backHome, pruned,
    warmMs, errors, warns: warns.slice(0,5) }, null, 2));
  await browser.close();
})();

/* ============================================================
   Typical annual rainfall — the baker, the lookup, and the fence
   ------------------------------------------------------------
   Everything here runs on a SYNTHETIC raster written by this test.
   The real layer (the Israel Meteorological Service's 1991-2020
   mean, via the Ministry's Climate Risk Portal) is never needed to
   run it, and is never committed: a check below fails if a raster
   file turns up in the repository.

   Three halves.

   1. scripts/build_rain_normal.py reads a GeoTIFF and writes block
      means on the map's 0.05 degree grid. What must hold: the right
      cell gets the right number (checked against the definition of
      Israel TM, not against the script's own maths), a file it does
      not understand is refused rather than decoded wrongly, and a
      wrong-looking result is not written.

   2. rainNormalFor() is the lookup the panel uses. Every doubt
      returns null, so the panel shows nothing rather than a guess.

   3. The fence. This number is context, not evidence. Nothing in
      the evidence ladder may read it, the credit must stand beside
      it wherever it is shown, and the shipped data must say plainly
      that it is processed.
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
  console.log((ok ? "ok  " : "FAIL"), name.padEnd(64),
              ok ? "" : "got " + JSON.stringify(got) + " wanted " + JSON.stringify(want));
};

const ROOT = path.resolve(__dirname, "..");
const script = path.join(ROOT, "scripts", "build_rain_normal.py");

/* ---------- a minimal GeoTIFF writer (classic TIFF, little endian, float32) ---------- */
function makeTiff(o){
  const { w, h, vals, tiled = false, tw = 16, th = 16, east, north, px = 400,
          epsg = null, nodata = null, compression = 1 } = o;
  const parts = []; let pos = 8;
  const put = buf => {
    const off = pos; parts.push(buf); pos += buf.length;
    if (pos % 2){ parts.push(Buffer.alloc(1)); pos++; }
    return off;
  };
  const offs = [], cnts = [];
  if (!tiled){
    const rps = 8;
    for (let y = 0; y < h; y += rps){
      const rows = Math.min(rps, h - y), b = Buffer.alloc(rows * w * 4);
      for (let r = 0; r < rows; r++) for (let x = 0; x < w; x++) b.writeFloatLE(vals[(y + r) * w + x], (r * w + x) * 4);
      offs.push(put(b)); cnts.push(b.length);
    }
  } else {
    for (let ty = 0; ty < Math.ceil(h / th); ty++) for (let tx = 0; tx < Math.ceil(w / tw); tx++){
      const b = Buffer.alloc(tw * th * 4);
      for (let r = 0; r < th; r++) for (let c = 0; c < tw; c++){
        const x = tx * tw + c, y = ty * th + r;
        if (x < w && y < h) b.writeFloatLE(vals[y * w + x], (r * tw + c) * 4);
      }
      offs.push(put(b)); cnts.push(b.length);
    }
  }
  const enc = { 3: [2, (b, v, i) => b.writeUInt16LE(v, i * 2)], 4: [4, (b, v, i) => b.writeUInt32LE(v, i * 4)],
                12: [8, (b, v, i) => b.writeDoubleLE(v, i * 8)] };
  const tags = [];
  const num = (tag, type, arr) => tags.push([tag, type, arr.length, (() => {
    const [sz, wr] = enc[type], b = Buffer.alloc(arr.length * sz); arr.forEach((v, i) => wr(b, v, i)); return b; })()]);
  num(256, 4, [w]); num(257, 4, [h]); num(258, 3, [32]); num(259, 3, [compression]);
  num(262, 3, [1]); num(277, 3, [1]); num(284, 3, [1]); num(339, 3, [3]);
  if (tiled){ num(322, 4, [tw]); num(323, 4, [th]); num(324, 4, offs); num(325, 4, cnts); }
  else { num(273, 4, offs); num(278, 4, [8]); num(279, 4, cnts); }
  num(33550, 12, [px, px, 0]);
  num(33922, 12, [0, 0, 0, east, north, 0]);                 /* raster corner (0,0) sits at (east, north) */
  if (epsg != null) num(34735, 3, [1, 1, 0, 2, 1024, 0, 1, 1, 3072, 0, 1, epsg]);
  if (nodata != null) tags.push([42113, 2, String(nodata).length + 1, Buffer.from(String(nodata) + "\0", "latin1")]);
  tags.sort((a, b) => a[0] - b[0]);
  const entries = tags.map(([tag, type, cnt, buf]) => {
    const e = Buffer.alloc(12);
    e.writeUInt16LE(tag, 0); e.writeUInt16LE(type, 2); e.writeUInt32LE(cnt, 4);
    if (buf.length <= 4) buf.copy(e, 8); else e.writeUInt32LE(put(buf), 8);
    return e;
  });
  if (pos % 2){ parts.push(Buffer.alloc(1)); pos++; }
  const ifdOff = pos;
  const ifd = Buffer.alloc(2 + 12 * entries.length + 4);
  ifd.writeUInt16LE(entries.length, 0);
  entries.forEach((e, i) => e.copy(ifd, 2 + 12 * i));
  const head = Buffer.alloc(8);
  head.write("II", 0, "latin1"); head.writeUInt16LE(42, 2); head.writeUInt32LE(ifdOff, 4);
  return Buffer.concat([head, ...parts, ifd]);
}

/* ---------- run the baker ---------- */
let PY = null;
for (const py of ["python", "python3"]){
  const r = spawnSync(py, ["-I", "-c", "print(1)"], { encoding: "utf-8" });
  if (!r.error && r.status === 0){ PY = py; break; }
}
if (!PY){ console.error("no python on PATH"); process.exit(1); }
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "rainnormal-test-"));
const bake = (name, buf, extra = []) => {
  const f = path.join(dir, name + ".tif"), out = path.join(dir, name + ".json");
  fs.writeFileSync(f, buf);
  const r = spawnSync(PY, ["-I", script, f, "--out", out, ...extra], { encoding: "utf-8" });
  return { r, out, json: fs.existsSync(out) ? JSON.parse(fs.readFileSync(out, "utf-8")) : null };
};

console.log("-- Israel TM, checked against its definition --");
const itm = spawnSync(PY, ["-I", "-c", [
  "import importlib.util, json",
  "s = importlib.util.spec_from_file_location('b', r'" + script + "'); b = importlib.util.module_from_spec(s); s.loader.exec_module(b)",
  "o = b.itm_forward(31.7343936111, 35.2045169444)",
  "i = b.itm_inverse(219529.584, 626907.390)",
  "w = 0",
  "for la in (29.5, 30.7, 31.8, 32.9, 33.3):",
  "    for lo in (34.3, 34.9, 35.2, 35.6, 35.9):",
  "        e, n = b.itm_forward(la, lo); a, c = b.itm_inverse(e, n); w = max(w, abs(a - la), abs(c - lo))",
  /* the meridian arc, integrated here by Simpson's rule rather than taken from the script */
  "import math",
  "a, f = 6378137.0, 1 / 298.257222101; e2 = f * (2 - f)",
  "def arc(p0, p1, n=4000):",
  "    h = (p1 - p0) / n; t = 0",
  "    for k in range(n + 1):",
  "        p = p0 + k * h; wt = 1 if k in (0, n) else (4 if k % 2 else 2)",
  "        t += wt * a * (1 - e2) / (1 - e2 * math.sin(p) ** 2) ** 1.5",
  "    return t * h / 3",
  "la0 = math.radians(31.7343936111); la1 = la0 + math.radians(1.0)",
  "n0 = b.itm_forward(31.7343936111, 35.2045169444)[1]; n1 = b.itm_forward(math.degrees(la1), 35.2045169444)[1]",
  "print(json.dumps({'o': o, 'i': i, 'w': w, 'k': (n1 - n0) / arc(la0, la1)}))"].join("\n")], { encoding: "utf-8" });
const M = JSON.parse(itm.stdout);
check("the grid's origin maps to its false easting and northing",
      [Math.round(M.o[0] * 1000), Math.round(M.o[1] * 1000)], [219529584, 626907390]);
check("and back to the defined latitude and longitude",
      [Math.round(M.i[0] * 1e8), Math.round(M.i[1] * 1e8)], [3173439361, 3520451694]);
check("a round trip across Israel stays within a millimetre", M.w < 1e-8, true);
check("along the central meridian, northings grow by the arc length times 1.0000067",
      Math.abs(M.k - 1.0000067) < 1e-9, true);          /* the arc is integrated here, not taken from the script */

console.log("\n-- a synthetic raster around the grid's origin --");
/* 60 x 60 pixels of 400 m centred on ITM (219529.584, 626907.390), whose latitude and longitude
   are defined, not computed: 31.7343936 N, 35.2045169 E. That point lies in the 0.05-degree cell
   centred 31.75 N, 35.20 E, which is index (635, 704). A small hot block of 900 sits on it in an
   otherwise uniform field of 400, so the hottest cell must be that one, whatever else is wrong. */
const W = 60, H = 60, EAST = 219529.584 - 12000, NORTH = 626907.390 + 12000;
const field = (hot = true) => {
  const v = new Float32Array(W * H).fill(400);
  if (hot) for (let r = 28; r < 33; r++) for (let c = 28; c < 33; c++) v[r * W + c] = 900;
  return v;
};
const base = { w: W, h: H, east: EAST, north: NORTH, epsg: 2039 };
const geo = json => {
  const cells = {};
  json.mm.forEach((v, i) => { if (v != null) cells[(json.iy0 + Math.floor(i / json.cols)) + "_" + (json.ix0 + (i % json.cols))] = v; });
  return cells;
};
const A = bake("striped", makeTiff(Object.assign({ vals: field() }, base)), ["--force"]);
const B = bake("tiled", makeTiff(Object.assign({ vals: field(), tiled: true }, base)), ["--force"]);
check("the baker runs on a striped raster", A.r.status, 0);
check("and on a tiled one (the real layer is tiled)", B.r.status, 0);
check("striped and tiled rasters give the same numbers", A.json && B.json && A.json.mm, B.json && B.json.mm);
const cells = geo(A.json);
const hottest = Object.keys(cells).sort((a, b) => cells[b] - cells[a])[0];
check("the hot spot lands in the cell that contains the grid's origin", hottest, "635_704");
check("its neighbours are untouched, 400 exactly",
      ["635_703", "635_705", "634_704", "636_704"].map(k => cells[k]), [400, 400, 400, 400]);
check("the hot cell is a blend: above 400, below 900", cells["635_704"] > 400 && cells["635_704"] < 900, true);

console.log("\n-- a pixel is judged by its centre, not its corner --");
/* Two single hot pixels, each placed so its CENTRE is 100 m inside one cell and its corner (200 m
   away) would be in the next. One sits just east of the 35.225 E cell edge, one just south of the
   31.775 N edge. Cell membership is worked out from the pixel centre with the baker's own inverse,
   which the section above has already pinned to the definition of Israel TM. */
const edge = JSON.parse(spawnSync(PY, ["-I", "-c", [
  "import importlib.util, json",
  "s = importlib.util.spec_from_file_location('b', r'" + script + "'); b = importlib.util.module_from_spec(s); s.loader.exec_module(b)",
  "eb = b.itm_forward(31.75, 35.225)[0]; nb = b.itm_forward(31.775, 35.20)[1]",
  "east = eb + 100 - 40.5 * 400; north = nb - 100 + 20.5 * 400",
  "def cell(r, c):",
  "    la, lo = b.itm_inverse(east + (c + 0.5) * 400, north - (r + 0.5) * 400)",
  "    return str(round(la / 0.05)) + '_' + str(round(lo / 0.05))",
  "print(json.dumps({'east': east, 'north': north, 'A': cell(30, 40), 'B': cell(20, 20)}))"].join("\n")],
  { encoding: "utf-8" }).stdout);
const ev = new Float32Array(W * H).fill(400);
ev[30 * W + 40] = 900;                                   /* A: just east of a cell's east edge  */
ev[20 * W + 20] = 900;                                   /* B: just south of a cell's north edge */
const E = bake("edge", makeTiff({ w: W, h: H, vals: ev, east: edge.east, north: edge.north, epsg: 2039 }), ["--force"]);
const ec = geo(E.json);
const [ay, ax] = edge.A.split("_").map(Number), [by, bx] = edge.B.split("_").map(Number);
check("pixel A's centre cell is where it should be (east of 35.225 E)", edge.A, "635_705");
check("pixel B's centre cell is where it should be (south of 31.775 N)", edge.B, "635_703");
check("pixel A raises the cell holding its centre", ec[edge.A] > 400, true);
check("and leaves the cell holding its corner alone", ec[ay + "_" + (ax - 1)], 400);
check("pixel B raises the cell holding its centre", ec[edge.B] > 400, true);
check("and leaves the cell holding its corner alone", ec[(by + 1) + "_" + bx], 400);

console.log("\n-- the file it writes --");
const J = A.json;
check("version, unit and period are stated", [J.v, J.unit, J.period, J.step], [1, "mm/yr", "1991-2020", 0.05]);
check("it says it is processed, in so many words", /NOT the original values/.test(J.what), true);
check("it names the Israel Meteorological Service", /Israel Meteorological Service/.test(J.credit), true);
check("values are whole numbers or null", J.mm.every(v => v === null || Number.isInteger(v)), true);
check("the array is rows x cols", J.mm.length, J.rows * J.cols);
check("the output is small: a grid, not a raster", fs.statSync(A.out).size < 20000, true);

console.log("\n-- what it refuses --");
const noForce = bake("noforce", makeTiff(Object.assign({ vals: field() }, base)));
check("a result that fails the known-places check is not written", [noForce.r.status !== 0, noForce.json], [true, null]);
check("and the refusal says why", /outside a plausible range|outside the expected range/.test(noForce.r.stdout + noForce.r.stderr), true);
const comp = bake("comp", makeTiff(Object.assign({ vals: field(), compression: 5 }, base)), ["--force"]);
check("a compressed raster is refused, nothing written", [comp.r.status !== 0, comp.json], [true, null]);
check("with the reason named", /compress/i.test(comp.r.stderr), true);
const wrong = bake("wrong", makeTiff(Object.assign({ vals: field() }, base, { epsg: 4326 })), ["--force"]);
check("a file that declares another CRS is not reinterpreted", [wrong.r.status !== 0, wrong.json], [true, null]);
const undecl = bake("undecl", makeTiff(Object.assign({ vals: field() }, base, { epsg: null })), ["--force"]);
check("an undeclared CRS is accepted, and says it assumed one", [undecl.r.status, /assum/i.test(undecl.r.stdout)], [0, true]);
check("garbage is refused, nothing written", (() => {
  const g = bake("garbage", Buffer.from("not a tiff at all"), ["--force"]);
  return [g.r.status !== 0, g.json];
})(), [true, null]);

console.log("\n-- missing is not a number --");
const holes = field(false);
for (let r = 0; r < H; r++) for (let c = 0; c < W; c++){
  if (c < 20) holes[r * W + c] = -9999;               /* declared nodata */
  else if (c < 28) holes[r * W + c] = NaN;            /* NaN */
  else if (c < 34) holes[r * W + c] = 3.4e38;         /* an undeclared fill value */
}
const H0 = bake("holes", makeTiff(Object.assign({ vals: holes }, base, { nodata: -9999 })), ["--force"]);
const hc = geo(H0.json);
/* Columns 0-33 hold -9999 (declared nodata), NaN and 3.4e38 (an undeclared fill value). Column 34
   onward is real: that begins about 1.6 km east of the origin, so cell 704 (35.175-35.225 E) has only
   a sliver of real pixels and cells 703 and west have none. */
const hcIx = Object.keys(hc).map(k => +k.split("_")[1]);
check("something real survives", Object.keys(hc).length > 5, true);
check("no cell over nodata, NaN or a fill value is emitted", Math.min(...hcIx) >= 704, true);
check("and the cells that are emitted read exactly 400, uncontaminated", Object.values(hc).every(v => v === 400), true);
check("a sliver of real pixels (under the minimum) is not enough for a number", hc["635_704"] === undefined, true);

/* ---------- 2. the lookup ---------- */
console.log("\n-- the lookup in the map --");
const src = ENV.distSource();
const grab = re => { const m = src.match(re); if (!m){ console.error("not found in dist: " + re); process.exit(1); } return m[0]; };
const fixture = { v: 1, unit: "mm/yr", period: "1991-2020", step: 0.05, iy0: 633, ix0: 702, rows: 3, cols: 4,
  mm: [100, 200, null, 400,   510, 520, 530, 540,   610, 0, -5, 900] };
const L = new Function("var RAINNORM = " + JSON.stringify(fixture) + ";\n" + ENV.constants(["GRID"]) + "\n" +
  grab(/function rainNormalFor[\s\S]*?\n}\n/) + "; return { rainNormalFor };")().rainNormalFor;
const use = (cell, d) => { const v = L(cell, d); return v && v.mm; };
check("a cell inside the grid returns its value", use("633_702"), 100);
check("row-major order: second row, second column", use("634_703"), 520);
check("the last cell", use("635_705"), 900);
check("it carries the period for the credit line", L("633_702").period, "1991-2020");
check("a cell north of the grid has no number", use("636_703"), null);
check("a cell south of the grid has no number", use("632_703"), null);
check("a cell west of the grid has no number (not the previous row's last cell)", use("634_701"), null);
check("a cell east of the grid has no number (not the next row's first cell)", use("634_706"), null);
check("a null cell has no number", use("633_704"), null);
check("zero is not a rainfall normal", use("635_703"), null);
check("a negative value is not one either", use("635_704"), null);
check("no cell at all", [use(null), use(undefined), use(5)], [null, null, null]);
check("a malformed key", [use("634"), use("634_703_1"), use("a_b"), use("634.5_703")], [null, null, null, null]);
const bent = (k, v) => use("634_703", Object.assign({}, fixture, { [k]: v }));
check("a different version is not trusted", bent("v", 2), null);
check("a different unit is not trusted", bent("unit", "in/yr"), null);
check("a different grid step is not trusted", bent("step", 0.1), null);
check("a length shorter than rows x cols is not trusted", bent("mm", [1, 2, 3]), null);
check("a length longer than rows x cols is not trusted", bent("mm", fixture.mm.concat([999, 999])), null);
check("a string in a cell is not a number", use("634_703", Object.assign({}, fixture, { mm: fixture.mm.map(() => "520") })), null);
check("the empty baked file gives nothing",
      use("634_703", { v: 1, unit: "mm/yr", period: "1991-2020", step: 0.05, iy0: 0, ix0: 0, rows: 0, cols: 0, mm: [] }), null);
const Lnone = new Function("var RAINNORM = null;\n" + ENV.constants(["GRID"]) + "\n" +
  grab(/function rainNormalFor[\s\S]*?\n}\n/) + "; return rainNormalFor;")();
check("no baked file at all (null) gives nothing", Lnone("634_703"), null);
check("no argument means the page's own baked file", L("634_703").mm, 520);

/* ---------- 3. the fence ---------- */
console.log("\n-- context, not evidence --");
for (const fn of ["reachState", "evidencePass", "reliabilityPass", "measuredFor"]){
  const code = grab(new RegExp("function " + fn + "\\b[\\s\\S]*?\\n}\\n"));
  check(fn + " does not read the rainfall normal", /rainNormal|RAINNORM|rain_normal/i.test(code), false);
}
check("the lookup is called in exactly one place: the panel",
      (src.match(/rainNormalFor\(/g) || []).length, 2);               /* the definition and the one call */
const panel = src.match(/if \(rn\)\{[\s\S]*?\n  \}\n/);
check("wherever the number is shown, the credit note is shown with it",
      !!panel && /ev_normal_val/.test(panel[0]) && /ev_normal_note/.test(panel[0]), true);
check("the English note says processed, not original, and names the Service",
      /Processed by this map, not the original values/.test(src) && /ev_normal_note:"[^"]*Israel Meteorological Service/.test(src), true);
check("the Hebrew note says the same",
      /ev_normal_note:"[^"]*השירות המטאורולוגי הישראלי[^"]*ואינו הערכים המקוריים/.test(src), true);
check("About states the Service bears no responsibility and is not a party (EN)",
      /not the original published values/.test(src) && /not a party to its publication/.test(src), true);
check("About states it in Hebrew too", /ואינו צד לפרסומה/.test(src) && /ולא הערכים המקוריים שפורסמו/.test(src), true);
const notice = fs.readFileSync(path.join(ROOT, "NOTICE.md"), "utf-8");
check("NOTICE.md says the layer file is not in the repository", /not\*\* in this repository/.test(notice), true);

const shipped = JSON.parse(fs.readFileSync(path.join(ROOT, "data", "rain_normal.json"), "utf-8"));
check("the shipped data says it is processed and credits the Service",
      [/NOT the original values/.test(shipped.what), /Israel Meteorological Service/.test(shipped.credit)], [true, true]);
check("the shipped data is a well-formed grid (or honestly empty)",
      shipped.v === 1 && shipped.unit === "mm/yr" && shipped.period === "1991-2020" && shipped.step === 0.05 &&
      shipped.mm.length === shipped.rows * shipped.cols &&
      shipped.mm.every(v => v === null || (Number.isInteger(v) && v >= 5 && v <= 2500)), true);

const walk = d => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => {
  if ([".git", "node_modules", "dist", ".boost"].includes(e.name)) return [];
  const p = path.join(d, e.name);
  return e.isDirectory() ? walk(p) : [p];
});
const rasters = walk(ROOT).filter(p => /\.(tif|tiff|tfw|ovr|aux\.xml)$|\.zip$/i.test(p));
check("no raster or zip from the Ministry is in the repository", rasters.map(p => path.relative(ROOT, p)), []);

fs.rmSync(dir, { recursive: true, force: true });
console.log(bad ? "\n" + bad + " FAILED" : "\nall pass");
process.exit(bad ? 1 : 0);

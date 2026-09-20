/* ============================================================
   Build integrity
   ------------------------------------------------------------
   The deliverable is one HTML file that opens from a download
   folder with no network at all. That property is easy to break
   by accident — one <script src>, one stylesheet link, one
   forgotten placeholder — and nothing else in the suite would
   notice, because the Playwright tests serve the file from disk
   and stub every host anyway.
   ============================================================ */
const fs = require("fs");
const path = require("path");
const ENV = require("./env");

const src = ENV.distSource();
let bad = 0;
const check = (name, ok, detail) => {
  if (!ok) bad++;
  console.log((ok ? "ok  " : "FAIL"), name.padEnd(52), ok ? "" : detail || "");
};

check("the built file is a complete document",
      /^<!DOCTYPE html>/i.test(src.trim()) && /<\/html>\s*$/i.test(src.trim()));

check("it carries the AGPL notice and a source link",
      /GNU Affero General Public License/i.test(src) &&
      src.includes("github.com/sharon2ber/israel-river-flow"));

/* Nothing may be loaded from the network at start-up: no external script,
   stylesheet or font. Tile and API URLs live in strings and are fetched only
   when the reader is online, which is the intended behaviour. */
check("no external <script src>", !/<script[^>]+src=/i.test(src),
      (src.match(/<script[^>]+src=[^>]*>/i) || [""])[0]);
check("no external stylesheet link",
      !/<link[^>]+rel=["']?stylesheet/i.test(src),
      (src.match(/<link[^>]+rel=["']?stylesheet[^>]*>/i) || [""])[0]);

/* Every placeholder build.py substitutes must be gone. A leftover one means
   a data file failed to inline and the map ships without it. */
const PLACEHOLDERS = ["/*LEAFLET_CSS*/", "/*LEAFLET_JS*/", "/*STATIONS*/", "/*BORDERS*/",
                      "/*EXTENT*/", "/*VALIDATION*/", "/*REGIME*/", "/*COAST*/", "/*SPRINGS*/"];
for (const ph of PLACEHOLDERS)
  check("placeholder substituted: " + ph, !src.includes(ph));

check("Leaflet was inlined", src.includes("Leaflet") && /L\.map\s*\(/.test(src));

/* The baked datasets have to arrive as real data, not empty arrays. */
const countIn = re => (src.match(re) || []).length;
check("gauging stations are baked in", /const STATIONS\s*=\s*\{[\s\S]{100,}/.test(src));
check("the flow regime is baked in", /const REGIME\s*=\s*\{[\s\S]{100,}/.test(src));
check("springs are baked in", /const SPRINGS\s*=\s*\{[\s\S]{100,}/.test(src));
check("the coastline is baked in", /const COAST\s*=\s*\[[\s\S]{50,}/.test(src));

/* Every part listed in build.py must have made it in. Reading the build
   script rather than a hard-coded list keeps this honest when parts are
   added or reordered. */
const build = fs.readFileSync(path.join(__dirname, "../build.py"), "utf8");
const parts = (build.match(/"part[^"]+\.(?:js|html)"/g) || []).map(s => s.replace(/"/g, ""));
check("build.py lists the source parts", parts.length > 5, parts.length + " found");
for (const f of parts){
  const head = fs.readFileSync(path.join(__dirname, "../src", f), "utf8")
                 .split("\n").find(l => l.trim().length > 12 && !/^<!/.test(l.trim()));
  if (!head) continue;
  check("included: " + f, src.includes(head.trim().slice(0, 40)));
}

const kb = Math.round(Buffer.byteLength(src) / 1024);
check("the file stays a single reasonable download (" + kb + " KB)", kb > 200 && kb < 4096, kb);

console.log(bad ? "\n" + bad + " FAILED" : "\nall pass");
process.exit(bad ? 1 : 0);

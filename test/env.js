/* ============================================================
   Shared test environment
   ------------------------------------------------------------
   Two things every test file here needs, and both of them used
   to be wrong in a way that only showed up on someone else's
   machine.

   The browser. The Playwright tests used to hard-code the
   Chromium path of the container this project was written in.
   That path does not exist anywhere else, so `npm test` failed
   immediately for every contributor. Resolution order now:
   PLAYWRIGHT_EXECUTABLE_PATH if you set it, then the container
   path if it happens to exist, then nothing — which lets
   Playwright find the browser it installed itself, the normal
   case after `npx playwright install chromium`.

   The build artifact. Every test reads dist/river_flow_israel.html,
   because that is the thing that actually ships: the tests check
   the assembled file, not the parts. Miss the build step and you
   used to get a raw ENOENT stack trace. Now you get told to run
   the build.
   ============================================================ */
const fs = require("fs");
const path = require("path");

const DIST = path.resolve(__dirname, "../dist/river_flow_israel.html");

const CONTAINER_CHROMIUM =
  "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";

/* Options for chromium.launch(). Empty object = let Playwright choose, which
   is what you want on a normal developer machine. */
function launchOptions(){
  const exe = process.env.PLAYWRIGHT_EXECUTABLE_PATH ||
              (fs.existsSync(CONTAINER_CHROMIUM) ? CONTAINER_CHROMIUM : null);
  return exe ? { executablePath: exe } : {};
}

function distPath(){
  if (!fs.existsSync(DIST)){
    console.error(
      "\ndist/river_flow_israel.html is missing.\n" +
      "The tests check the built file, not the parts under src/.\n" +
      "Run the build first:\n\n    npm run build\n");
    process.exit(1);
  }
  return DIST;
}

function distSource(){ return fs.readFileSync(distPath(), "utf8"); }

function distUrl(){ return "file://" + distPath(); }

/* Lift the real declarations of some top-level constants out of the built
   file. A unit test that needs DRY_Q should use the project's DRY_Q, not a
   copy of the number — otherwise changing the threshold silently changes the
   behaviour and the test still passes. */
function constants(names){
  const src = distSource();
  const out = [];
  for (const n of names){
    const m = src.match(new RegExp("^const " + n + "\\s*=[\\s\\S]*?;", "m"));
    if (!m){
      console.error("\nCould not find `const " + n + "` in dist/. Was it renamed?\n");
      process.exit(1);
    }
    out.push(m[0].replace(/^const /, "var "));
  }
  return out.join("\n");
}

/* Pull one block of real source out of the built file and evaluate it, so a
   unit test exercises the code that ships rather than a copy of it.
   `needs` names any top-level constants the block refers to but does not
   itself declare; their real declarations are prepended. */
function extract(re, exportNames, needs){
  const m = distSource().match(re);
  if (!m){
    console.error("\nCould not find the expected code block in dist/.\n" +
      "The source moved or was renamed; update the pattern in the test.\n" +
      "Pattern: " + re + "\n");
    process.exit(1);
  }
  const prelude = needs && needs.length ? constants(needs) + "\n" : "";
  const body = m[0].replace(/^const /gm, "var ").replace(/^let /gm, "var ");
  return new Function(prelude + body + "; return {" +
    exportNames.map(n => n + ":" + n).join(",") + "};")();
}

module.exports = { DIST, launchOptions, distPath, distSource, distUrl, extract, constants };

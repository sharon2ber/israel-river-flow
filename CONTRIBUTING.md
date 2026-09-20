# Contributing

Corrections to the hydrology are the most valuable thing you can send. Code is welcome too.

- [Reporting a river that looks wrong](#reporting-a-river-that-looks-wrong)
- [From clone to pull request](#from-clone-to-pull-request)
- [The two rules](#the-two-rules)
- [Finding something to work on](#finding-something-to-work-on)
- [Pull request expectations](#pull-request-expectations)

---

## Reporting a river that looks wrong

You do not need to write code to make this project better. Open an issue and say **which
river, where, and what you know**. A photograph with a date, or "I was at this wadi
yesterday and it was bone dry", is real evidence and this map is designed to accept it —
the whole point is not claiming to know more than it does.

Please include:

- the river's name, in Hebrew or English
- roughly where along it (a place name is fine; coordinates are better)
- what the map showed, and what was actually there
- the date

Known-wrong is better than silently wrong. If a report cannot be reconciled with the
sources, it belongs in the caveats in [docs/METHODOLOGY.md](docs/METHODOLOGY.md).

---

## From clone to pull request

### 1. Requirements

| | Version | Why |
|---|---|---|
| **Node** | 20 or later | the test runner and npm scripts |
| **Python** | 3.8 or later | `build.py`; standard library only, nothing to install |
| **git** | any | |

No database, no server, no framework, no bundler.

### 2. Clone and install

```bash
git clone https://github.com/sharon2ber/israel-river-flow.git
cd israel-river-flow
npm install
```

`npm install` brings two things: **Leaflet**, which `build.py` inlines into the output, and
**Playwright**, which the browser tests drive.

### 3. Install the browser the tests use

```bash
npx playwright install chromium
```

Once per machine. If you already have a Chromium or Chrome you would rather use, point at
it instead:

```bash
export PLAYWRIGHT_EXECUTABLE_PATH=/path/to/chrome
```

### 4. Run the tests before you change anything

```bash
npm test
```

This builds first, then runs five suites. You should see each end in `all pass`. If
something fails on a clean checkout, that is a bug — please open an issue rather than
working around it.

```bash
npm run test:unit         # the four fast suites, no browser
npm run test:ui           # the full browser pass on its own
npm run test:resilience   # source failure modes
npm run test:all          # everything
```

### 5. Build and look at the map

```bash
npm run build
open dist/river_flow_israel.html          # macOS
xdg-open dist/river_flow_israel.html      # Linux
start dist\river_flow_israel.html         # Windows
```

First load takes 40–70 seconds while it fetches the stream network; after that it is cached
in your browser for 30 days. "Rebuild network cache" in the About panel clears it — useful
when you are changing anything that touches fetched data.

### 6. Find where your change belongs

[docs/WHERE_TO_MAKE_CHANGES.md](docs/WHERE_TO_MAKE_CHANGES.md) maps tasks to files.
[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) explains how the pieces fit together.

There are no modules: `build.py` concatenates fourteen parts into one file sharing a single
global scope, so **order matters** — a part can only use what an earlier part declared.

### 7. Make the change

**Edit `src/`. Never edit `dist/river_flow_israel.html`.** It is generated; your change is
lost on the next build, and CI fails if the committed file does not match a fresh build of
`src/`.

### 8. Test again, and build

```bash
npm test        # builds, then tests
```

### 9. Review what you are about to send

```bash
git diff -- src/ data/ test/ build.py     # your actual change
git diff --stat -- dist/                  # should be the rebuilt artifact, nothing else
```

Commit the rebuilt `dist/river_flow_israel.html` along with your source change. The two are
checked against each other in CI.

### 10. Open the pull request

```bash
git checkout -b my-change
git add -A
git commit -m "Short description of what changed and why"
git push origin my-change
```

Then open the PR on GitHub. CI runs the build, all tests, the resilience scenarios, and the
`dist/`-matches-`src/` check.

---

## The two rules

Every pull request is held to these. They are not style preferences; they are what the
project is.

### 1. No new keys, no new servers, no build toolchain

The output is one HTML file that works from `file://` with no network at all. A dependency
that needs a secret, a proxy, or a bundler breaks that, and that is a different project.

An *optional* token the reader supplies and stores in their own browser is fine. A token
committed to this repository is not.

### 2. The map must be able to say it does not know

There are five evidence states for a reason, and `EV_UNVER` and `EV_NODATA` are features,
not gaps to be filled in. A change that turns an unverified reading into a confident one has
to bring its evidence with it.

If your change alters what the map *claims*, add or update a test that pins the new
behaviour, so the diff shows what the map now says. `test/flow.js` asserts the evidence
ladder rung by rung and exists exactly for this.

---

## Finding something to work on

[docs/CONTRIBUTION_IDEAS.md](docs/CONTRIBUTION_IDEAS.md) lists concrete tasks grouped by
documentation, hydrology, data, UI and engineering, each with enough context to start
without asking anyone. Several are marked as good first issues.

---

## Pull request expectations

- **One change per PR.** A hydrology fix and a UI tweak are two pull requests.
- **Say why, not just what.** The codebase documents reasoning rather than syntax; commit
  messages and comments should do the same. Why this threshold, why this source, why this
  fallback.
- **Tests pass.** `npm run test:all` locally before you push.
- **`dist/` rebuilt and committed** alongside the source change.
- **Scientific claims stay honest.** Do not describe modelled data as measured, and do not
  remove a caveat to make a sentence shorter.
- **Attribution stays.** The data belongs to the bodies that publish it and the map's
  built-in attributions are part of meeting their terms — see [NOTICE.md](NOTICE.md).

Contributions are licensed under the [GNU AGPL v3 or later](LICENSE), the same as the
project. Add yourself to [AUTHORS](AUTHORS) in the same commit.

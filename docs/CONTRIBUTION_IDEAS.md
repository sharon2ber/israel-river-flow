# Contribution ideas

Concrete tasks, each with enough context to start without asking anyone. Suggested labels
are given so they can be opened as issues as-is.

**🟢 good first issue** — self-contained, no deep hydrology needed
**🔵 needs domain knowledge** — you should know something about Israeli streams
**🟠 larger** — a weekend, not an evening

New here? Read [ARCHITECTURE.md](ARCHITECTURE.md) and
[WHERE_TO_MAKE_CHANGES.md](WHERE_TO_MAKE_CHANGES.md) first, and the two rules in
[CONTRIBUTING.md](../CONTRIBUTING.md#the-two-rules).

---

## Documentation

### 🟢 Add a real screenshot to the README
`documentation`, `good first issue`

The README currently leads with a link to the live map and no image.
[`docs/test-render.png`](test-render.png) is a render of the *test fixtures*, not real data,
so it is deliberately not used as the hero image. Open the live map, let it finish loading,
and contribute a screenshot of the real network — ideally one in winter with water in the
Negev, and one in late summer when most of the country is dry. The contrast is the whole
point of the project.

### 🟢 Proof-read the English
`documentation`, `good first issue`

The prose was written by one person in one voice and never copy-edited. British and
American spellings are mixed in places. Consistency, not rewriting.

### 🔵 Write the Hebrew developer documentation
`documentation`, `hydrology`

The map is fully bilingual; the developer docs are English-only. Israeli hydrologists and
students are the people most likely to spot a wrong river, and a Hebrew
`docs/he/ARCHITECTURE.md` would lower that barrier considerably.

### 🟢 Document the panel and tooltip fields
`documentation`, `good first issue`

Clicking a reach opens a panel with a dozen fields — catchment, drop, gradient, reliability,
regime, the gauge it matched. There is no reference explaining what each means or where it
comes from. A short `docs/PANEL_REFERENCE.md` with a labelled screenshot would help both
readers and contributors.

---

## Hydrology

### 🔵 Verify the flow regime classification against local knowledge
`hydrology`, `data`

[`data/regime.md`](../data/regime.md) lists all 154 gauges with their classification —
perennial, near-perennial, seasonal, rare — derived from 24 years of measured daily
discharge. The rule is mechanical and the record is real, but a mechanical rule over a
gauge record can still land somewhere a hydrologist would not.

Read the table. If a classification contradicts what you know of a stream, open an issue
saying which gauge, what class it got, what you would expect, and why. This is the single
most valuable non-code contribution available.

### 🔵 Re-examine the rain threshold
`hydrology`, `enhancement`

A reach needs **≥5 mm over 14 days** on its catchment before modelled flow is believed
(`RAIN_MM`, `RAIN_WINDOW` in `src/part4_flow.js`). Both numbers were chosen by judgement,
not derived. The Hydrological Service publishes an instantaneous-discharge dataset
(`hidrograph` on data.gov.il, ~600k rows for 2019/20 onward) carrying real flood
hydrographs: rise, peak and recession per station per storm. Deriving the threshold and the
window from measured recessions would replace a guess with a number.

Note the dataset ends 1 September 2024 — fine for calibration, not for today.

### 🔵 Give the near-perennial class somewhere to go
`hydrology`

A near-perennial reach with no rain is `EV_UNVER` — the map says it does not know. That is
honest, and it is also the largest bucket of "don't know" on the map. Is there an
additional signal that would resolve some of them? Seasonality of the gauge record by
month, perhaps, rather than the current all-year fraction.

### 🟠 Flow vs. normal from the measured record
`hydrology`, `enhancement`

The map shows discharge in m³/s. It cannot say whether that is a lot or a little *for
September*. The full measured record on data.gov.il — roughly 1.9 million station-days back
to before 1960 — would give day-of-year percentiles per gauge, and with them a "flow vs
normal" layer. The UI already has a `l_an` / "Flow vs normal" toggle wired for exactly this.

---

## Data

### 🔵 Investigate rivers that are still drawn in pieces
`data`, `hydrology`

The About panel runs a network audit on every load and lists the worst-fragmented rivers.
Pick one, work out whether the break is a hole in the source or a failure of the stitching
in `src/part4h_spines.js`, and say which. Nahal Paran took three attempts to get right and
the history is in [METHODOLOGY.md](METHODOLOGY.md) — worth reading before you start.

### 🔵 Replace the fake-lake name heuristic with the official reservoir list
`data`, `enhancement`

`NOT_LAKE_RE` in `src/part3_app.js` is a Hebrew/English regular expression that stops
reservoirs and settling ponds being drawn as lakes. It works, and it is a heuristic over
OpenStreetMap names. The Water Authority publishes `reservoirs` on data.gov.il — 725
reservoirs with type, volume, water-surface area and the source of the water. Using the
real list would be authoritative rather than approximate.

### 🔵 Add the Nature and Parks Authority closure feed
`data`, `enhancement`

`parks.org.il` exposes an open, keyless WordPress API at `/wp-json/wp/v2/newsflash`
carrying live trail closures that name individual streams, including closures for flooding
and for water pollution. When the Parks Authority closes a wadi for flooding, somebody
official has *observed* water — evidence of exactly the kind the ladder is built to accept.
Needs a failure path and a `test/resilience.js` scenario.

### 🟠 Catchment area per stream from the official source
`data`, `hydrology`

The `streams` dataset on data.gov.il carries 1,288 streams with catchment area in km² and
which stream each one flows into. With a catchment area and a specific discharge calibrated
from nearby gauges, ungauged channels could carry a physically-grounded estimate instead of
a 5 km model cell. This is how River Flow USA handles its ungauged reaches.

---

## User interface

### 🟢 Make the map usable on a phone
`UI`, `good first issue`

The layout assumes a desktop. Panels overlap on narrow screens and the layer controls are
hard to hit with a thumb. All CSS is in `src/part1_head.html`.

### 🟢 Check the Hebrew and English terminology
`UI`, `documentation`, `good first issue`

Strings live in the `I18N` object in `src/part3_app.js`. Hydrological terms in particular
deserve a native speaker's eye — נחל, ואדי, ספיקה, אגן היקוות, משטר זרימה.

### 🟢 Keyboard and screen-reader access
`UI`, `accessibility`, `good first issue`

The map is a canvas with manual hit-testing, so there is effectively no keyboard path
through it. Tab order, focus rings and labels on the controls would be a real improvement
and need no hydrology at all.

### 🔵 A time-series chart when you click a gauge
`UI`, `enhancement`

The panel shows a sparkline. The project already holds 24 years of daily discharge and
112,597 spring measurements; a real chart would use them. Must stay dependency-free — see
[rule 1](../CONTRIBUTING.md#1-no-new-keys-no-new-servers-no-build-toolchain).

---

## Engineering

### 🟢 Split `src/part7_boot.js`
`enhancement`, `good first issue`

At ~1,200 lines it is the largest part, and it holds two unrelated things: the About panel
text and the boot sequence. Splitting the About text into its own part would make both
easier to read. Purely mechanical — add the new file to the list in `build.py` in the right
position and confirm `npm test` still passes.

### 🟢 Extract the magic numbers into one place
`enhancement`, `good first issue`

Thresholds are declared next to the code that uses them — `RAIN_MM`, `DRY_Q`,
`SPRING_MIN_LS`, `REG_NEAR_KM`, `RADAR_DBZ_MIN`, `SPINE_NEAR_KM`, `GAP_KM`. That keeps each
one next to its reasoning, which is good, but there is no single page listing them. A
`docs/TUNING.md` collecting every threshold, its current value, its unit and why it was
chosen would be genuinely useful — and is documentation, not refactoring.

### 🔵 Cache versioning is manual and easy to get wrong
`enhancement`

Cached structures carry a `v:` field that must be bumped by hand when the shape changes;
miss it and a returning reader gets the old shape and a confusing failure. A single place
that declares each cache key with its version and TTL would make this hard to forget.

### 🔵 More resilience scenarios
`testing`

`test/resilience.js` covers Overpass outages and the official layer being down. Not yet
covered: GloFAS returning an error, Open-Meteo rate-limiting (HTTP 429), govmap timing out,
RainViewer serving a malformed index, and IndexedDB being unavailable in private browsing.
Each is a few lines given the existing harness.

### 🔵 Geographic edge cases
`testing`, `data`

No test covers: a reach crossing the antimeridian of the fetch box, a zero-length reach, a
reach with a single coordinate, or a stream whose name exists in two different basins
(which is real — and welding those together was a bug once). `test/fixtures.js` is the
place.

### 🟠 Widen the scope beyond Israel
`enhancement`, `larger`

`SCOPE` in `src/part3_app.js` was written to be widened — fetch box, home view, foreign-
stream policy. The honest first candidate is the United States, because USGS publishes
live, keyless, *measured* discharge, which would let the same engine show measured rather
than modelled water. Read the scope section of [METHODOLOGY.md](METHODOLOGY.md) first.

---

## Not wanted

So nobody wastes a weekend:

- **A build toolchain.** No webpack, no Vite, no TypeScript compile step. One file, no build
  to run it.
- **A backend.** Nothing that needs a server or a secret.
- **A UI framework.** The canvas renderer holds 2,600 reaches at frame rate; React would not.
- **Minifying `dist/`.** The shipped file is meant to be readable.
- **Removing evidence states.** Collapsing "unverified" into "flowing" makes a prettier map
  and a dishonest one.

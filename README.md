# River Flow Israel

**An animated map of how much water is moving in Israel's rivers and wadis today —
and, just as deliberately, where the map does not know.**

[![Tests](https://github.com/sharon2ber/israel-river-flow/actions/workflows/ci.yml/badge.svg)](https://github.com/sharon2ber/israel-river-flow/actions/workflows/ci.yml)
[![Pages](https://github.com/sharon2ber/israel-river-flow/actions/workflows/pages.yml/badge.svg)](https://github.com/sharon2ber/israel-river-flow/actions/workflows/pages.yml)
[![Licence: AGPL v3](https://img.shields.io/badge/licence-AGPL--3.0-blue.svg)](LICENSE)

**▶ Live map: [sharon2ber.github.io/israel-river-flow](https://sharon2ber.github.io/israel-river-flow/)**
· [download the single file](https://github.com/sharon2ber/israel-river-flow/raw/main/dist/river_flow_israel.html)

Built by **Sharon Berkovich** — [LinkedIn](https://www.linkedin.com/in/sharon-berkovich/) · [GitHub](https://github.com/sharon2ber)

---

## What is this?

An animated live streamflow map of Israel, built as a companion to
[River Flow USA](https://norway-charts.netlify.app/river_flow_map_usa/). Water beyond the
border appears only where a stream crosses into or out of Israel.

**What it produces:** one self-contained HTML file, about 560 KB. Leaflet, the styles, 126
gauging stations, 154 measured flow regimes, 383 springs, the coastline and the validation
figures are all inlined. No build step to run it, no API key, no server. It opens from a
download folder with the network switched off, and fills itself in when it has one.

**What makes it unusual:** Israel publishes no open real-time streamflow feed. Most of the
moving water here is **modelled**, not measured — and the whole design is built around
saying so. Five evidence states rather than one number, an ordered ladder of corroboration,
and a measured record that is allowed to *overrule* the model. See
[Scientific assumptions and limitations](#scientific-assumptions-and-limitations).

## What it does

- Colours and animates every watercourse by modelled discharge, with the motion running
  downstream.
- Five discharge classes scaled to Israeli hydrology (0.05 / 0.5 / 2 / 20 m³/s) plus a
  separate class for dry channels, which is most of the country in late summer. Anything
  under 0.01 m³/s counts as dry: arid GloFAS cells idle at a token non-zero baseflow, and
  drawing that as a running stream is the easiest way for this map to mislead. The blue
  ramp is stepped twice — once for the dark basemaps, once for the light ones — because a
  single set of steps cannot stay legible on both.
- Four basemaps behind a picker: dark, Esri hillshade, OpenTopoMap contours, Esri satellite,
  with place names as a toggle rather than a separate entry. The hillshade is the one to
  reach for: seeing the Jordan Rift and the Negev as relief makes flow direction self-evident.
  All tiles are Esri's or OpenTopoMap's — CARTO was dropped once its keyless basemap started
  serving tiles stamped API KEY REQUIRED.
- Five evidence states rather than a number painted straight from the model: flowing,
  dry, dry-overruling-the-model, unverified, and no data. Only corroborated flow animates.
- Layers for the 126 active Hydrological Service gauges, the 33 stream pollution sampling
  points, reservoirs and dams, borders, border crossings of water, river names, and
  flow-vs-normal.
- Israel's four borders — Lebanon, Syria, Jordan, Egypt — with a mark at every point where a
  stream actually crosses one. No other country's borders, and no other country's streams.
- A day slider covering seven days back and the GloFAS forecast ahead.
- A verification panel that puts the model's own long-run mean beside each gauge's measured
  mean annual volume, per gauge and across a sample of the network. Figures ship with the
  map and can be re-run live in the browser.
- Opens with every layer group collapsed and nothing ticked: the river network and a basemap, and
  everything else is something you choose to add.
- Free panning and zooming — the map is about Israel, but it is not fenced into it. A home
  button returns to the opening view.
- Full Hebrew (RTL) and English, switchable, with official names from the Water Authority
  layer and OSM's `name:he` / `name:en` as backup.

---

## Quick start

Python 3 and Node 20 or later. Nothing else, and no toolchain.

```bash
git clone https://github.com/sharon2ber/israel-river-flow.git
cd israel-river-flow

npm install                        # Leaflet (inlined at build) + Playwright (tests)
npx playwright install chromium    # once; the browser the tests drive

npm run build                      # → dist/river_flow_israel.html
npm test                           # builds first, then runs the suite
```

**What you should see.** `npm run build` prints
`wrote .../dist/river_flow_israel.html  559 KB`. `npm test` rebuilds, then runs five suites
that each end in `all pass` and exit non-zero if anything fails.

Then open the result:

```bash
open dist/river_flow_israel.html          # macOS
xdg-open dist/river_flow_israel.html      # Linux
start dist\river_flow_israel.html         # Windows
```

First load takes roughly 40–70 seconds, almost all of it OpenStreetMap; after that the
network is cached in your browser for 30 days and start-up is instant. "Rebuild network
cache" in the About panel clears it.

---

## Architecture

```
                    EXTERNAL SOURCES
   Water Authority · OpenStreetMap · govmap · GloFAS
   Open-Meteo · RainViewer          data.gov.il (baked in)
                          │
              ┌───────────▼───────────┐
              │   FETCH + CACHE       │  part3_app.js · part3b_sources.js
              │   (IndexedDB, mirrors)│
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   GEOMETRY            │  part3b_sources · part4g_basins
              │   rivers, basins,     │  part4h_spines · part4i_gapfill
              │   crossings, spines   │
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   EVIDENCE            │  part4_flow  ← the ladder
              │   discharge, rain,    │  part4c_regime · part4e_springs
              │   radar, regime       │  part4f_radar · part4b_validate
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   STATE  `S`          │  part5_map.js
              └───────────┬───────────┘
                          │
              ┌───────────▼───────────┐
              │   CANVAS + LEAFLET UI │  part5_map · part6_ui · part7_boot
              └───────────┬───────────┘
                          │
                build.py → dist/river_flow_israel.html
```

Full detail, including the boot sequence and the rendering model, in
**[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

---

## Project structure

```
src/                     the application, concatenated in this order by build.py
├── part1_head.html      <head>, all CSS, the licence header
├── part2_body.html      DOM skeleton; placeholders where baked JSON lands
├── part3_app.js         i18n, colour ramp, discharge classes, SCOPE, IndexedDB cache
├── part3b_sources.js    Water Authority layers, OSM merge, flow direction, crossings
├── part4_flow.js        GloFAS discharge, rainfall, THE EVIDENCE LADDER
├── part4b_validate.js   model vs. measured gauge means
├── part4c_regime.js     matching a reach to a gauge's measured flow regime
├── part4d_outlets.js    coast distance, river tracing, network audit
├── part4e_springs.js    which springs feed which reach
├── part4f_radar.js      RainViewer tiles, read for rain falling now
├── part4g_basins.js     191 catchments and the drainage graph
├── part4h_spines.js     assembling one river out of many segments
├── part4i_gapfill.js    filling holes the official layer leaves
├── part5_map.js         Leaflet, application state `S`, canvas renderer
├── part6_ui.js          panels, tooltip, search, layer controls
└── part7_boot.js        About text, and the boot sequence

data/                    baked into the file at build time
├── stations.json        126 gauging stations (measured)
├── regime.json          154 gauges classified by flow regime (derived)
├── regime.md            how that classification was made, and the full results
├── springs.json         383 springs with measured discharge
├── validation.json      GloFAS checked against measured gauge means
├── borders.json         Israel's four boundary lines
├── coast.json           the Mediterranean coastline
└── extent.json          the area the Water Authority layer covers

test/
├── env.js               shared browser + dist plumbing
├── fixtures.js          synthetic versions of every external source
├── build.js             single-file build integrity
├── flow.js              the evidence ladder, rung by rung
├── water.js             water-body classification (real OSM tag combinations)
├── regime.js            flow regime and gauge matching
├── run.js               full browser pass: boot, hover, click, search, language
└── resilience.js        what happens when sources fail

docs/
├── ARCHITECTURE.md      how it is put together
├── WHERE_TO_MAKE_CHANGES.md   task → file index
├── DATA_SOURCES.md      every source, refresh, cache and failure behaviour
├── METHODOLOGY.md       the hydrology, in full
└── CONTRIBUTION_IDEAS.md      concrete tasks to pick up

dist/                    ⚠ GENERATED — never edit by hand
build.py                 the build: concatenates src/ + data/ + Leaflet
package.json             npm scripts
```

> ### ⚠ `dist/` is generated output
>
> `dist/river_flow_israel.html` is assembled by `build.py` from `src/` and `data/`.
> **Any edit you make there is lost on the next build**, and CI fails if the committed
> file does not match a fresh build of `src/`.
>
> Edit `src/`, then run `npm run build`.

---

## Where to make changes

The quick version; the full task-to-file index is
**[docs/WHERE_TO_MAKE_CHANGES.md](docs/WHERE_TO_MAKE_CHANGES.md)**.

| I want to… | Go to |
|---|---|
| Change what counts as "flowing" | `src/part4_flow.js` — `reachState()` |
| Change colours, classes, dash patterns | `src/part3_app.js` |
| Change how rivers are drawn | `src/part5_map.js` |
| Change panels, search, tooltip | `src/part6_ui.js` |
| Change Hebrew or English wording | `src/part3_app.js` — `I18N` |
| Change how segments become one river | `src/part4h_spines.js` |
| Change a data source | `src/part3b_sources.js`, `src/part4_flow.js`, `src/part4g_basins.js` |
| Change caching | `src/part3_app.js` + the TTLs in `src/part7_boot.js` |
| Change the boot sequence | `src/part7_boot.js` — `start()`, `afterRivers()` |
| Add or change tests | `test/` |
| Change the build | `build.py` |

---

## Data sources

Full table — purpose, kind, refresh, cache and **what happens when each source is
down** — in **[docs/DATA_SOURCES.md](docs/DATA_SOURCES.md)**.

### Every layer at a glance

| Layer | Source | Nature |
|---|---|---|
| Stream network and official names | Water Authority [national stream layer](https://services1.arcgis.com/hWUp5lYOh3Fi9WoQ/arcgis/rest/services/israel_rivers/FeatureServer/1) (7,914 features) | authoritative, fetched and cached |
| Channels the official layer misses, cross-border streams, reservoirs, dams | OpenStreetMap via Overpass API | fetched and cached |
| Discharge, forecast, reanalysis | [Open-Meteo Flood API](https://open-meteo.com/en/docs/flood-api) serving GloFAS (Copernicus EMS), 0.05° grid | modelled, live |
| Flow direction, drop, gradient | [Open-Meteo elevation API](https://open-meteo.com/en/docs/elevation-api) | derived, cached permanently |
| Gauging stations, catchments, records | [Israel Hydrological Service](https://data.gov.il/dataset/hydro_station) via data.gov.il, ITM → WGS 84 | measured, baked in |
| Peak discharge and annual volume per station | [data.gov.il](https://data.gov.il/dataset/maxdischarge_yearlyvolume) | measured, baked in |
| Stream pollution sampling points | [NehalimDigum feature service](https://services5.arcgis.com/dlrDjz89gx9qyfev/arcgis/rest/services/NehalimDigum/FeatureServer/0) (33 points) | official, fetched each visit |
| Israel's boundary lines | [Natural Earth](https://www.naturalearthdata.com/) admin-0, Israel's four only, classification kept | baked in, 5 KB |
| Crossings of water | computed: stream geometry ∩ Israel's boundary geometry | derived at load |
| Antecedent rainfall | [Open-Meteo forecast API](https://open-meteo.com/en/docs), 21 days daily | modelled reanalysis + forecast, live |
| Stream network topology | [govmap.gov.il](https://open.govmap.gov.il/) `opendata:nechalim1` — ACC_LEN, STRM_ORDER | authoritative, fetched per river, cached 90 d |
| Drainage basins | [govmap.gov.il](https://open.govmap.gov.il/) `opendata:Nikuz` — 191 basins with DRAIN_TO | authoritative, fetched once, cached |
| Live weather radar | [RainViewer](https://www.rainviewer.com/) | **observed**, live |
| Flow regime per stream | [Israel Hydrological Service daily discharge](https://data.gov.il/dataset/level_discharge), 2000/01–2023/24 | **measured**, baked in, 18 KB |
| Springs and their discharge | [Hydrological Service springs register](https://data.gov.il/dataset/springs) + [measured discharge](https://data.gov.il/dataset/spring_discharge) | **measured**, baked in, 38 KB |
| Coastline | Natural Earth outline minus land boundaries | derived, baked in, 0.7 KB |
| Whether a basin holds water | nothing — not known, and not asserted | shown as unknown |
| Basemaps | Esri (dark canvas, hillshade, imagery), OpenTopoMap | tiles, no key |

---

## Methodology

The hydrology is documented at length in **[docs/METHODOLOGY.md](docs/METHODOLOGY.md)**:
how rivers are assembled from disconnected segments, why catchments beat grid cells for the
rain check, what the radar adds, how springs keep a stream running in a rainless August, how
the flow regime was classified from 24 years of measurements, and how the model is verified
against Israel's own gauge records.

The one thing to read first is the evidence ladder. For each reach, on each day:

1. Model discharge below 0.01 m³/s → **dry**, and nothing overrides it.
2. Radar shows rain falling here or upstream → **flowing** (observed).
3. No rain data at all → **unverified**.
4. ≥5 mm of rain on this catchment in 14 days → **flowing** (corroborated).
5. A measured spring feeds this reach or one above it → **flowing**.
6. The measured regime says perennial → **flowing**.
7. The regime says seasonal or rare, and no rain fell → **the map overrules the model**.
8. Otherwise → **unverified**, drawn dashed, and the panel says why.

Implemented in `reachState()` in `src/part4_flow.js`; asserted rung by rung in
`test/flow.js`.

---

## Scientific assumptions and limitations

Stated plainly, because they are the most important thing about this project.

- **The moving water is modelled, not measured.** Colour and width come from GloFAS, a
  physical model on a ~5 km grid. A grid cell is not a channel cross-section.
- **Israel publishes no open real-time streamflow feed.** Current measured discharge exists
  behind a signed undertaking to the Hydrological Service; this project does not have it.
- **The measured record ends 30 September 2024.** It is published in annual batches. It is
  used to classify what *kind* of stream each one is, and to check the model — never to
  claim what is happening today.
- **A flow regime belongs to a gauge, not to a name.** The Jordan is perennial at one
  station and not at another; the map matches a reach to its nearest relevant gauge within
  30 km and says which gauge it used.
- **"Flowing" means corroborated**, not measured. See the ladder above.
- **Verification is order of magnitude and rank, not gauge accuracy.** The comparison
  periods differ — a gauge record may start in 1966, the reanalysis covers a decade.
- **Some geometry is inferred.** Flow direction comes from model-cell elevations; rivers
  are stitched from segments that mostly do not join end to end; gaps inside one basin are
  filled from the national network.
- **It is not a flood warning system.** Do not enter a wadi on the strength of it.

---

## Testing

```bash
npm test                  # build, then: build integrity, ladder, water, regime, browser pass
npm run test:unit         # the four fast suites, no browser
npm run test:ui           # the full Playwright pass on its own
npm run test:resilience   # source failure modes: outages, partial failures, timeouts
npm run test:all          # everything
```

Every suite exits non-zero on failure, so CI and `&&` chains behave.

Two things worth knowing before you write a test here:

- **The tests check `dist/`, not `src/`.** They exercise the assembled file, because that
  is what ships. `npm test` runs the build first via the `pretest` hook.
- **No test touches the network.** `test/fixtures.js` provides synthetic versions of every
  external source, and `test/run.js` routes every host to them. The fixtures are built to
  reproduce real failures — Nahal Paran's stray stream-order stubs are in there because
  they broke the map twice.

`test/run.js` writes screenshots to `shots/` as it goes;
[`docs/test-render.png`](docs/test-render.png) is one of them, rendered from the fixtures
rather than live data, so you can see what a passing UI run looks like.

---

## Build and deployment

```
src/part*.{html,js}  +  data/*.json  +  node_modules/leaflet
                            ↓  build.py
                  dist/river_flow_israel.html
```

`build.py` reads Leaflet from `node_modules`, strips `url()` references from its CSS so no
image is ever requested, substitutes the baked JSON into the placeholders in
`src/part2_body.html`, and concatenates the parts in order. No minification, no source map —
the shipped file is meant to be readable.

Two GitHub Actions workflows:

| Workflow | Runs on | Does |
|---|---|---|
| [`ci.yml`](.github/workflows/ci.yml) | pull requests, pushes to `main` | build, all tests, resilience, and checks that the committed `dist/` matches a fresh build |
| [`pages.yml`](.github/workflows/pages.yml) | pushes to `main` | rebuilds and publishes to GitHub Pages |

Reproduce CI locally with `npm ci && npx playwright install chromium && npm run test:all`.

### Every push rebuilds the live map

`.github/workflows/pages.yml` runs `npm install` and `python3 build.py` on every push to
`main` and publishes the result to GitHub Pages. The live map is therefore always built from
the committed source, never from a file uploaded by hand — if the two ever disagree, the
source is right.

### How it loads on a first visit

1. First visit: the Water Authority stream layer arrives in four pages of 2,000 features
   (~12 MB, 554k vertices, simplified to about 57k). Then the region is cut into five
   horizontal bands and each is fetched separately from Overpass for the fill-in and the
   water bodies. Everything is stored in IndexedDB for 30 days.
   Six public Overpass mirrors are tried in rotation; a mirror that hangs is dropped for the
   session after a 45-second deadline, a busy one (429/504) is retried elsewhere, and a band
   that still fails leaves the rest of the map intact with a retry link. If nothing answers
   at all, the loader names the failing host and offers "Continue without rivers", which
   still gives you the basemap and the gauging network.
2. Each reach is snapped to the GloFAS cell at its downstream end — about 750 distinct cells.
3. Open-Meteo counts every location in a multi-point request as one API call and caps the
   free tier near 600 per minute, so the first 450 cells load immediately and the rest fill
   in quietly about a minute later. The day's results are cached, so reloads cost nothing.
4. "Rebuild network cache" in the About panel clears everything.

Cold start is roughly 40–70 seconds, almost all of it Overpass. Warm start is instant. A
partially cached network is re-fetched in full on the next visit while the cached version
stays on screen.

---

## Contributing

**[CONTRIBUTING.md](CONTRIBUTING.md)** takes you from clone to pull request, and
**[docs/CONTRIBUTION_IDEAS.md](docs/CONTRIBUTION_IDEAS.md)** lists concrete tasks
organised by documentation, hydrology, data, UI and engineering.

Corrections to the hydrology are the most valuable contribution of all. If a river looks
wrong on the map, open an issue with the river, roughly where along it, what the map showed,
what was actually there, and the date. "I was at this wadi yesterday and it was bone dry" is
real evidence, and this map is designed to accept it.

## Licence

Copyright © 2026 **Sharon Berkovich** — [LinkedIn](https://www.linkedin.com/in/sharon-berkovich/) · [GitHub](https://github.com/sharon2ber)

Free software under the **GNU Affero General Public License, version 3 or later** — see
[LICENSE](LICENSE).

In plain language, and this is the reason for choosing it: anyone may use this, study it,
improve it, and share it, including for money. What nobody may do is take it closed. If you
distribute it, or run a changed version **as a website**, you must keep the copyright notice
and publish your changes under the same licence. That second clause is what an ordinary GPL
lacks and why the Affero version is the one here — a map is something people run as a
service, and without it a company could host an improved version and share nothing back.

It does not forbid commercial use. A licence that did would also stop a consultancy, a
municipality or a water utility from using it in paid work, which would be a loss. What it
prevents is a private, closed product built on this work.

The data is not mine and is not covered by that licence. It belongs to the bodies that
publish it, under their own terms: the Israel Water Authority and the Hydrological Service,
govmap.gov.il, data.gov.il, Copernicus EMS (GloFAS) via Open-Meteo, RainViewer,
OpenStreetMap contributors (ODbL), Natural Earth, Esri and OpenTopoMap. Leaflet is
BSD-2-Clause. See [NOTICE.md](NOTICE.md).

## No warranty

This map carries no warranty of any kind. **It is not a flood warning system.** Most of what
it shows is modelled rather than measured, the model's grid cell is 5 km across, and Israel
publishes no open real-time streamflow feed for it to check against. Do not enter a wadi on
the strength of it.

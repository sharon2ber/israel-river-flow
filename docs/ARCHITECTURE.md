# Architecture

How the project is put together, for someone who wants to change it.

There is no framework, no bundler, no server and no API key. `build.py`
concatenates fourteen source parts and seven JSON files into one HTML document.
That document is the whole application: open it from a download folder with the
network switched off and it runs, showing the basemap and the gauging network;
give it a network and it fills itself in.

---

## The pipeline

```
                          EXTERNAL SOURCES
                                 │
   ┌──────────┬──────────┬───────┼────────┬──────────┬──────────┐
   │          │          │       │        │          │          │
 Water    OpenStreet-  govmap  GloFAS  Open-Meteo  Rain-    data.gov.il
Authority   Map/        WFS   (Open-    (rain,    Viewer    (baked at
 ArcGIS    Overpass            Meteo)  elevation)  radar    author time)
   │          │          │       │        │          │          │
   └──────────┴──────────┴───────┴────────┴──────────┘          │
                                 │                              │
                    ┌────────────▼────────────┐        ┌────────▼────────┐
                    │  FETCH + CACHE          │        │ BAKED INTO THE  │
                    │  part3_app.js  (IndexedDB,       │ FILE AT BUILD   │
                    │  timeouts, Overpass mirrors)     │ data/*.json     │
                    │  part3b_sources.js (ArcGIS)      │ via build.py    │
                    └────────────┬────────────┘        └────────┬────────┘
                                 │                              │
                    ┌────────────▼──────────────────────────────▼────────┐
                    │  GEOMETRY                                          │
                    │  part3b_sources.js  official layer, OSM merge,     │
                    │                     border crossings, orientation  │
                    │  part4h_spines.js   one river from many segments   │
                    │  part4i_gapfill.js  fill holes the source leaves   │
                    │  part4g_basins.js   191 catchments + drainage graph│
                    └────────────┬───────────────────────────────────────┘
                                 │
                    ┌────────────▼───────────────────────────────────────┐
                    │  EVIDENCE                                          │
                    │  part4_flow.js      discharge, rain, THE LADDER    │
                    │  part4c_regime.js   measured perennial/seasonal/…  │
                    │  part4e_springs.js  measured spring discharge      │
                    │  part4f_radar.js    observed rain, right now       │
                    │  part4b_validate.js model vs. measured gauge means │
                    │  part4d_outlets.js  does the river reach the sea?  │
                    └────────────┬───────────────────────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  APPLICATION STATE `S`  │   part5_map.js
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  CANVAS + LEAFLET       │   part5_map.js
                    │  PANELS, SEARCH, i18n   │   part6_ui.js
                    │  BOOT ORCHESTRATION     │   part7_boot.js
                    └────────────┬────────────┘
                                 │
                         dist/river_flow_israel.html
```

---

## The parts, in build order

`build.py` concatenates these in exactly this sequence. Order matters: there are
no modules and no imports, so everything shares one global scope and a part can
only use what an earlier part declared.

| Part | Lines | What it owns |
|---|---:|---|
| `src/part1_head.html` | 272 | `<head>`, all CSS, the licence header. Leaflet's CSS is injected here. |
| `src/part2_body.html` | 123 | The DOM skeleton and the placeholders where baked JSON lands. |
| `src/part3_app.js` | 699 | Hebrew/English strings, the colour ramp and discharge classes, `SCOPE`, the IndexedDB cache, geometry helpers, the Overpass mirror pool. |
| `src/part3b_sources.js` | 405 | The Water Authority ArcGIS layers, merging OSM against them, elevation-based flow direction, border-crossing detection. |
| `src/part4_flow.js` | 540 | GloFAS discharge, rainfall, the reliability pass and **`reachState()` — the evidence ladder**. |
| `src/part4b_validate.js` | 228 | Model-versus-gauge verification, live in the browser. |
| `src/part4c_regime.js` | 109 | Matching a reach to a gauge's measured flow regime. |
| `src/part4d_outlets.js` | 218 | Distance to the coast, river tracing, the network audit. |
| `src/part4e_springs.js` | 90 | Which springs feed which reach. |
| `src/part4f_radar.js` | 142 | RainViewer tiles, read pixel by pixel to see if rain is falling now. |
| `src/part4g_basins.js` | 177 | Drainage basins and routing rain down the `DRAIN_TO` graph. |
| `src/part4h_spines.js` | 378 | Assembling one continuous river out of many segments. |
| `src/part4i_gapfill.js` | 161 | Filling gaps the official layer leaves inside a single basin. |
| `src/part5_map.js` | 664 | Leaflet setup, the application state `S`, the canvas renderer, hit-testing. |
| `src/part6_ui.js` | 681 | Panels, tooltip, search, layer controls, language switching. |
| `src/part7_boot.js` | 1197 | The About text and **`start()` / `afterRivers()` — the boot sequence**. |

---

## Where data enters

Two doors, and the difference matters when you are debugging.

**Baked in at build time.** `build.py` reads seven files from `data/` and
substitutes them into placeholders in `src/part2_body.html`. These become the
constants `STATIONS`, `BORDERS`, `EXTENT`, `VALIDATION`, `REGIME`, `COAST` and
`SPRINGS`. They are present before any network call and the map works without a
connection because of them.

**Fetched at run time**, from the reader's own browser, and cached in IndexedDB.
Nothing is proxied; there is no server. See [DATA_SOURCES.md](DATA_SOURCES.md)
for every endpoint, its refresh interval and what happens when it fails.

---

## How the boot sequence runs

`start()` in `src/part7_boot.js` is the entry point, and `afterRivers()` does
most of the work. The order is not arbitrary — each step needs the one before it.

1. **Basemap and borders.** Tiles are probed before use, so a dead tile server
   falls back instead of showing grey.
2. **Rivers.** The Water Authority layer first (four pages of 2,000 features),
   then OpenStreetMap in bands through the Overpass mirror pool, kept only where
   it adds something the official layer lacks.
3. **Water bodies, dams, sampling points.**
4. **Snap to model cells.** Every reach's downstream end maps to a GloFAS grid
   cell — about 750 distinct cells for 2,600 reaches.
5. **Discharge** for those cells, batched and throttled.
6. **Basins**, then **radar**, then **rainfall**, then the **drainage graph**.
7. **Cell elevations**, which put each river's reaches in headwater-to-mouth
   order — the prerequisite for reasoning along a river rather than per segment.
8. **Crossings, regimes, springs, spines.**
9. **`reliabilityPass()`** — walk each river from headwater to mouth and carry
   evidence downstream, so a river does not flicker between states along its
   length.
10. **Draw.**

After the map is usable, two background passes run: filling gaps in the mapped
network, and fetching river spines from the national stream network.

---

## Where the classification happens

This is the heart of the project, and it lives in two functions.

**`reachState()`** in `src/part4_flow.js` judges one reach on one day and
returns one of five states. The rungs are ordered deliberately — an observation
outranks a model, a model outranks a long-run average — and the order is the
thing to protect. `test/flow.js` exists to catch a change that quietly promotes
"unverified" to "flowing". The ladder is documented in
[METHODOLOGY.md](METHODOLOGY.md).

**`reliabilityPass()`** and **`evidencePass()`**, also in `src/part4_flow.js`,
take those per-reach judgements and make them consistent along a river. Without
this, the Kishon appeared as alternating flowing and dry stretches, because rain
is per 5 km cell, regime is per nearest gauge, and the intermittent flag is per
OSM segment — three different granularities disagreeing.

---

## Application state

One mutable object, `S`, declared in `src/part5_map.js`. There is no store and
no reactivity: code mutates `S` and then calls `invalidate()` or `reset()` to
redraw.

| Field | Holds |
|---|---|
| `S.reaches` | every drawn segment: geometry, names, flags, and the evidence attached to it |
| `S.flow` | `cellKey → {t:[iso], q:[m³/s]}` — modelled discharge |
| `S.rain` | `cellKey → {t:[iso], p:[mm]}` — the independent check |
| `S.radar` | `cellKey → {wet, frac}` — what the radar sees now |
| `S.basins`, `S.basinUp` | catchments and the graph of which drains into which |
| `S.times`, `S.dayIdx` | the day window and which day is shown |
| `S.layers` | which overlays are on. All start off, deliberately |
| `S.groups` | reaches grouped into named rivers |

---

## Rendering

Leaflet supplies the map, the panning and the tiles. Everything else is drawn on
one `<canvas>`: at 2,600 reaches, DOM elements or Leaflet polylines would not
hold a frame rate.

The renderer splits static from moving. Water bodies, the static stroke of each
reach, dams and labels are drawn once into an offscreen canvas and blitted each
frame; only the travelling dashes that show flow direction are re-stroked. When
geometry or classification changes, `baseDirty` is set and the offscreen canvas
is rebuilt.

Hit-testing is manual — `pick(x, y)` in `src/part5_map.js` walks the reaches and
finds the nearest one.

---

## The build

```
src/part*.{html,js}  +  data/*.json  +  node_modules/leaflet  →  build.py
                                    ↓
                     dist/river_flow_israel.html
```

`build.py` does four things: reads Leaflet's JS and CSS from `node_modules`
(falling back to a vendored `package/` copy), strips `url()` references from
Leaflet's CSS so no image is ever requested, substitutes the baked JSON into
placeholders, and concatenates the parts in order.

There is no minification and no source map. The built file is readable, and it
is meant to be — you can open it and find the code.

> **`dist/` is generated. Never edit it.** Every change you make there is lost
> the moment anyone runs the build. Edit `src/` and run `npm run build`.

The committed `dist/` file is checked in CI against a fresh build of `src/`, so
the two cannot drift apart.

---

## Deployment

`.github/workflows/pages.yml` runs on every push to `main`: it installs Leaflet,
runs `build.py`, and publishes the result to GitHub Pages as both `index.html`
and `river_flow_israel.html`. The live map is therefore always built from
committed source, never from a hand-uploaded file.

`.github/workflows/ci.yml` runs the tests on every pull request.

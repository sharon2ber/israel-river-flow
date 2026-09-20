# Where to make changes

There are no modules here — `build.py` concatenates fourteen parts into one
file and they share a single global scope. That makes the project easy to read
and hard to navigate, so this page is the index.

**Always edit `src/`. Never edit `dist/river_flow_israel.html`** — it is
generated, and your change disappears on the next build. After editing, run
`npm run build`.

---

## I want to…

### Change what the map looks like

| Task | File |
|---|---|
| Colours, the discharge ramp, dash patterns | `src/part3_app.js` — `RAMP`, `classCol`, `classDash` |
| The discharge class boundaries | `src/part3_app.js` — `BINS`, `DRY_Q` |
| How rivers, dams, labels are drawn | `src/part5_map.js` — `drawBase`, `draw`, `drawNames` |
| The animated flow dashes | `src/part5_map.js` — `draw` |
| Layout, fonts, panel styling | `src/part1_head.html` (all CSS lives here) |
| The DOM skeleton | `src/part2_body.html` |

### Change the interface

| Task | File |
|---|---|
| Side panels, the reach and station detail views | `src/part6_ui.js` |
| Hover tooltip | `src/part6_ui.js` |
| Search | `src/part6_ui.js` |
| Layer checkboxes and their grouping | `src/part2_body.html` + `src/part6_ui.js` |
| Which layers start switched on | `src/part5_map.js` — `S.layers` |
| Basemaps and the basemap picker | `src/part5_map.js` — `setBasemap`, `pickTiles` |
| Hebrew and English wording | `src/part3_app.js` — the `I18N` object |
| The About panel text | `src/part7_boot.js` — `buildAbout()` |

### Change the hydrology

| Task | File |
|---|---|
| **The evidence ladder — what counts as "flowing"** | `src/part4_flow.js` — `reachState()` |
| Making states consistent along a river | `src/part4_flow.js` — `reliabilityPass()`, `evidencePass()` |
| The rain threshold and window | `src/part4_flow.js` — `RAIN_MM`, `RAIN_WINDOW` |
| Matching a reach to a gauge's flow regime | `src/part4c_regime.js` |
| The regime classification itself | `data/regime.json` — derived data; see `data/regime.md` |
| Springs feeding a reach | `src/part4e_springs.js` |
| Radar interpretation | `src/part4f_radar.js` — `RADAR_DBZ_MIN` |
| Catchment rainfall and the drainage graph | `src/part4g_basins.js` |
| Model-versus-gauge verification | `src/part4b_validate.js` |
| Whether a river reaches the sea | `src/part4d_outlets.js` |

> Changing the ladder changes what the map claims. `test/flow.js` asserts the
> current behaviour rung by rung; if you change it deliberately, update that
> test in the same commit so the diff shows what the map now says.

### Change how rivers are assembled

| Task | File |
|---|---|
| Grouping segments into one river | `src/part4h_spines.js` — `netStem()`, `chainKey()` |
| Filling gaps the official layer leaves | `src/part4i_gapfill.js` |
| Grouping by name for labels and search | `src/part5_map.js` — `buildGroups`, `nameKey` |
| Flow direction along a reach | `src/part3b_sources.js` — `orientByElevation` |
| Border-crossing detection | `src/part3b_sources.js` — `findCrossings` |

### Change data sources

| Task | File |
|---|---|
| The Water Authority stream and sampling layers | `src/part3b_sources.js` — `AGS_RIVERS`, `AGS_SAMPLING` |
| Which OSM features are fetched | `src/part7_boot.js` — the Overpass queries |
| Overpass mirrors and failover | `src/part3_app.js` — `OVERPASS`, `nextEp`, `overpass` |
| The discharge model endpoint | `src/part4_flow.js` — `FLOOD_API` |
| Rain and elevation endpoints | `src/part4_flow.js` — `WX_API`; `src/part3b_sources.js` — `ELEV_API` |
| Radar | `src/part4f_radar.js` — `RADAR_INDEX` |
| The national GIS (basins, stream network) | `src/part4g_basins.js` — `GOVMAP_WFS` |
| Baked datasets | `data/*.json`, wired in `build.py` |

Adding a source? It must be keyless and CORS-open, or it breaks the
no-key, works-offline promise. See the two rules in
[CONTRIBUTING.md](../CONTRIBUTING.md).

### Change caching

| Task | File |
|---|---|
| The IndexedDB helpers | `src/part3_app.js` — `idb`, `cacheGet`, `cacheSet`, `cacheClear` |
| How long the network is kept | `src/part7_boot.js` — `CACHE_TTL` |
| Per-day discharge and rain caching | `src/part7_boot.js` — `afterRivers()`, the `flow_`/`rain_` keys |
| River spine caching | `src/part4h_spines.js` — `SPINE_TTL` |
| Gap-fill caching | `src/part4i_gapfill.js` — `GAP_TTL` |

Bumping a cached structure? Bump its version field too (`v:` in the stored
object), or returning readers get the old shape and a confusing failure.

### Change the map's geographic scope

`src/part3_app.js` — the `SCOPE` object holds the fetch bounding box, the home
view and the foreign-stream policy. It was written to be widened; see the
scope section in [METHODOLOGY.md](METHODOLOGY.md).

### Work on tests

| Task | File |
|---|---|
| The evidence ladder | `test/flow.js` |
| Water-body classification | `test/water.js` |
| Flow regime and gauge matching | `test/regime.js` |
| Single-file build integrity | `test/build.js` |
| Full browser pass | `test/run.js` |
| Behaviour when sources fail | `test/resilience.js` |
| Fake sources for all of the above | `test/fixtures.js` |
| Shared browser/dist plumbing | `test/env.js` |

### Change the build or deployment

| Task | File |
|---|---|
| What gets inlined, and in what order | `build.py` |
| npm scripts | `package.json` |
| Tests on pull requests | `.github/workflows/ci.yml` |
| Publishing to GitHub Pages | `.github/workflows/pages.yml` |

---

## A worked example: change the rain threshold

Today a reach needs 5 mm of rain in the previous 14 days before modelled flow
is believed. Suppose you have evidence that 8 mm is the better number.

```bash
# 1. Find it
grep -n "RAIN_MM" src/part4_flow.js

# 2. Change it in src/part4_flow.js, with a comment saying why

# 3. Rebuild and test — `npm test` builds first, so this is one command
npm test

# 4. Look at it
open dist/river_flow_israel.html      # macOS; xdg-open on Linux
```

`test/flow.js` asserts against the project's real `RAIN_MM`, so it follows your
change rather than fighting it — but the cases either side of the threshold
still prove the boundary behaves. If your change alters which side of the line
a case falls on, update the test in the same commit.

# Data sources

Every place this project gets a number, what kind of number it is, and what
happens when it stops answering.

The distinction that matters most is at the top of the page and repeated in the
tables: **almost everything moving on this map is modelled, not measured.**
Israel publishes no open real-time streamflow feed. The map is built around
admitting that rather than papering over it.

---

## The five kinds of data here

| Kind | What it means | Examples |
|---|---|---|
| **Measured** | An instrument recorded this | Gauge discharge records, spring discharge, weather radar returns |
| **Modelled** | A physical model computed it | GloFAS discharge, Open-Meteo rainfall |
| **Derived** | This project computed it from measurements | The flow regime classification, the model-vs-gauge comparison |
| **Inferred** | This project's rules concluded it | A reach's evidence state; flow direction from cell elevations |
| **Reference** | Fixed geography that does not change day to day | Stream geometry, basins, borders, coastline |

Nothing in this repository presents modelled data as measured. If you find
somewhere it does, that is a bug worth an issue.

---

## Fetched live, in the reader's browser

No server, no proxy, no key. Everything is cached in IndexedDB so a second
visit costs almost nothing.

| Source | Purpose | Kind | Input | Output | Refresh | Cache | If it fails |
|---|---|---|---|---|---|---|---|
| **Water Authority stream layer** <br>`services1.arcgis.com/…/israel_rivers` | The national stream network — 7,914 features, official Hebrew and English names | Reference | 4 paged queries of 2,000 | GeoJSON lines | On cache expiry | 30 days | The map falls back to OpenStreetMap alone and says so. `test/resilience.js` covers this |
| **Stream pollution sampling points** <br>`services5.arcgis.com/…/NehalimDigum` | 33 monitoring points | Reference | One query | GeoJSON points | Every visit | 7 days, used if the fetch fails | Layer silently absent; nothing else affected |
| **OpenStreetMap via Overpass** | Channels the official layer misses, cross-border streams, reservoirs, dams | Reference | 8 banded queries | OSM JSON | On cache expiry | 30 days | 6 mirrors tried in rotation; a mirror that hangs is dropped for the session after 45 s; a band that still fails leaves the rest intact with a retry link. If every mirror is dead, the loader names the host and offers "continue without rivers" |
| **GloFAS discharge** <br>`flood-api.open-meteo.com` | **The moving water on the map** | **Modelled** | ~750 grid cells | m³/s, 7 days past + 7 forecast | Daily | Same calendar day | Reaches show "no model data" — a distinct state, not a guess |
| **Rainfall** <br>`api.open-meteo.com/v1/forecast` | The independent check on the model | **Modelled** | Same cells, 100 per request | Daily mm, 21 days back | Daily | Same calendar day | Reaches become *unverified* rather than flowing. This is the intended failure: no check means no claim |
| **Elevation** <br>`api.open-meteo.com/v1/elevation` | Flow direction, headwater-to-mouth ordering | Reference | Cell centres | Metres | Once | Permanent | Ordering falls back to what the source geometry implies |
| **Weather radar** <br>`api.rainviewer.com` | Rain observed right now — the top rung of the ladder | **Measured** | Tile pixels at zoom 7 | wet / not wet per cell | ~10 min | Per session | `RADAR` is set to null and the rung is skipped; the ladder continues at rainfall |
| **Drainage basins** <br>`open.govmap.gov.il` WFS `opendata:Nikuz` | 191 catchments and which drains into which | Reference | One WFS query | Polygons + `DRAIN_TO` | On cache expiry | 30 days | Rain reverts to per-grid-cell, which is coarser but works |
| **National stream network** <br>`open.govmap.gov.il` WFS `opendata:nechalim1` | `ACC_LEN` and `STRM_ORDER` — assembling one river from many segments | Reference | Per river, by name | Ordered geometry | Background, after the map is up | 90 days | Rivers keep the older name-and-basin grouping and the panel says so |
| **Basemap tiles** <br>Esri, OpenTopoMap | Background | Reference | Tiles | Images | Per view | Browser | Tiles are probed before use; a dead server falls back to another basemap |

---

## Baked into the file at build time

These come from `data/` and are substituted into the HTML by `build.py`. They
are why the map does something useful before any network call, and why it still
works from `file://` with no connection at all.

| File | Contents | Kind | Origin |
|---|---|---|---|
| `data/stations.json` | 126 active gauging stations: location, catchment area, record length, mean annual volume, peak discharge | **Measured** | Israel Hydrological Service via data.gov.il |
| `data/regime.json` | 154 gauges classified perennial / near-perennial / seasonal / rare | **Derived** by this project | Computed from 24 hydrological years (2000/01–2023/24) of measured daily discharge. Method and full results in [`data/regime.md`](../data/regime.md) |
| `data/springs.json` | 383 springs with mean, summer mean and latest measured discharge | **Measured** | Hydrological Service, 112,597 individual measurements via data.gov.il |
| `data/validation.json` | GloFAS reanalysis beside each gauge's measured mean, for a stratified sample | **Derived** by this project | Recomputable live in the browser — see the About panel |
| `data/borders.json` | Israel's four boundary lines | Reference | Natural Earth admin-0 |
| `data/coast.json` | The Mediterranean coastline | Reference | Natural Earth |
| `data/extent.json` | The area the Water Authority layer itself covers | Reference | Derived from that layer |
| `data/stations_raw.json` | The unprocessed station pull, kept for traceability | **Measured** | data.gov.il |

---

## What the Hydrological Service record can and cannot do

The measured record ends on **30 September 2024**. It is published in annual
batches, roughly two years behind. That is not a bug in this project and it is
not a stale cache — it is the publishing cadence.

So the record is used for two things, and neither is "is there water today":

1. **Classifying what kind of stream this is.** Perennial, near-perennial,
   seasonal or rare, from 24 years of daily measurements. That is a property of
   the stream, not of the day: the Dan was perennial in 2024 and is perennial
   now. This classification then *outranks the model* — a rare wadi with no rain
   behind it is drawn as not flowing however confident GloFAS is.
2. **Checking the model.** Comparing each gauge's measured mean annual volume
   against GloFAS's own long-run mean at the same coordinates, so the map can
   show where the model runs hot or cold instead of asking to be trusted.

Today's state comes entirely from live sources: GloFAS, rainfall and radar.

Current measured discharge exists — the Hydrological Service runs an API — but
access requires a signed undertaking sent to `Forecasterihs@water.gov.il`. If
that ever lands, it belongs at the very top of the evidence ladder, above radar.

---

## Adding a source

Two hard constraints, and a change that breaks either one is a different
project:

1. **Keyless and CORS-open.** The page is served as a static file with no
   backend, so anything needing a secret cannot work. An optional token the
   reader supplies and stores in their own browser is acceptable; a token
   committed to this repository is not.
2. **Optional.** The map must still boot and still be honest when the source is
   unreachable. Add the failure path and a row to the table above in the same
   pull request, and a scenario to `test/resilience.js` if the failure mode is
   interesting.

---

## Licences and attribution

Data belongs to the bodies that publish it, under their own terms — see
[NOTICE.md](../NOTICE.md). OpenStreetMap is ODbL and its attribution is built
into the map. Do not remove the attributions; they are part of meeting those
terms.

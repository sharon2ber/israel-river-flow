# Reference project registry

Open-source river and streamflow projects surveyed on **2026-09-28**, kept so they can be
found again — and, later, so a worldwide version of this map can draw on what each country's
maintainers already know.

**The code is not vendored here.** Together these repositories are several hundred megabytes,
mostly history and build assets, and one of them carries no licence at all — committing that
would mean republishing someone's all-rights-reserved work. This registry and
[`reference-projects.json`](reference-projects.json) are the durable record; the working copies
are rebuilt on demand:

```bash
./scripts/fetch-reference-projects.sh            # all of them, into ./reference/
./scripts/fetch-reference-projects.sh Magyar     # just the ones matching a name
DEPTH=full ./scripts/fetch-reference-projects.sh # full history instead of --depth 1
```

`reference/` is git-ignored. Each clone gets a `_REGISTRY_NOTE.txt` naming its licence, so
nobody a year from now copies from a repository they should not.

---

## The register

| Project | Country | Licence | May we reuse the code? |
|---|---|---|---|
| [ZoliQua/Magyar-Vizugy](https://github.com/ZoliQua/Magyar-Vizugy) | Hungary | `NONE FOUND` | ⛔ **Ideas only** |
| [flukelaster/SIAHRA](https://github.com/flukelaster/SIAHRA) | Thailand | `MIT` | ✅ **Reusable** |
| [TNRIS/flood](https://github.com/TNRIS/flood) | United States (Texas) | `MIT` | ✅ **Reusable** |
| [sdl60660/river-runner](https://github.com/sdl60660/river-runner) | global | `GPL-3.0` | ⛔ **Ideas only** (by choice, see below) |
| [interTwin-eu/dask-flood-mapper](https://github.com/interTwin-eu/dask-flood-mapper) | global | `MIT` | ✅ **Reusable** |
| [DOI-USGS/flow-tiles](https://github.com/DOI-USGS/flow-tiles) | United States | `Creative Commons` | 📐 **Method only** |
| [mohsennasab/GageMap](https://github.com/mohsennasab/GageMap) | United States | `custom open source` | ⚠️ **Check first** |
| [timlg07/River-Water-Levels-in-Bavaria](https://github.com/timlg07/River-Water-Levels-in-Bavaria) | Germany (Bavaria) | `unknown` | ❓ **Unverified** |
| [kleok/FLOODPY](https://github.com/kleok/FLOODPY) | global | `unverified` | ❓ **Unverified** |

### What the verdicts mean

| Verdict | Meaning |
|---|---|
| ✅ **Reusable** | Permissive licence — reuse the code with attribution. |
| ⛔ **Ideas only** | Do not copy code. Reimplement behaviour from a description. Either the licence forbids copying (no licence file), or the project has chosen not to (see that entry). |
| 📐 **Method only** | The approach is the value; the code is not portable. |
| ⚠️ **Check first** | Non-standard licence — read it before reusing anything. |
| ❓ **Unverified** | Not examined. Verify before relying on anything here. |

> **The rule that matters.** A repository with no licence file is **all rights reserved**, not
> public domain. Magyar Vízügy is the closest analogue to this project and the one we may copy
> least from. Ideas are not copyrightable and behaviour can be reimplemented freely — but not a
> line of its source may be lifted.

---

## National data feeds found

The single most transferable thing in this survey. Anyone building a worldwide version needs to
know where each country publishes its water data, and that knowledge is usually buried in one
national project's source.

| Country | Feed | Found in |
|---|---|---|
| Hungary | https://www.vizugy.hu (OVF, General Directorate of Water Management) | [Magyar-Vizugy](https://github.com/ZoliQua/Magyar-Vizugy) |
| Hungary | hydroinfo.hu (on their roadmap, not yet used) | [Magyar-Vizugy](https://github.com/ZoliQua/Magyar-Vizugy) |
| Thailand | https://api-v3.thaiwater.net/api/v1/thaiwater30 (water levels, dams, 24h rain) | [SIAHRA](https://github.com/flukelaster/SIAHRA) |
| Thailand | https://api-gateway.gistda.or.th/api/2.0/resources/features/flood (flood extent, incl. 3-day) | [SIAHRA](https://github.com/flukelaster/SIAHRA) |
| United States (Texas) | http://water.weather.gov/ahps/ (NOAA AHPS river forecast) | [flood](https://github.com/TNRIS/flood) |
| United States (Texas) | http://waterdatafortexas.org/ | [flood](https://github.com/TNRIS/flood) |
| United States (Texas) | aerisapi.com (commercial, key required) | [flood](https://github.com/TNRIS/flood) |
| global | https://labs.waterdata.usgs.gov/api/nldi/linked-data/comid/position (USGS NLDI, keyless downstream navigation) | [river-runner](https://github.com/sdl60660/river-runner) |
| global | https://geoconnex.us/ | [river-runner](https://github.com/sdl60660/river-runner) |
| global | https://ksonda.github.io/global-river-runner/ (MERIT-based global API) | [river-runner](https://github.com/sdl60660/river-runner) |
| global | https://stac.eodc.eu/api/v1 (European Open Data Centre STAC - no NASA Earthdata login) | [dask-flood-mapper](https://github.com/interTwin-eu/dask-flood-mapper) |
| United States | USGS internal pipeline (USGS-VIZLAB/gage-conditions-gif); not directly callable | [flow-tiles](https://github.com/DOI-USGS/flow-tiles) |
| United States | https://waterservices.usgs.gov/nwis/site/ (USGS NWIS, keyless) | [GageMap](https://github.com/mohsennasab/GageMap) |
| Germany (Bavaria) | unknown - likely gkd.bayern.de, unverified | [River-Water-Levels-in-Bavaria](https://github.com/timlg07/River-Water-Levels-in-Bavaria) |
| global | unverified | [FLOODPY](https://github.com/kleok/FLOODPY) |

---

## Project by project

### ZoliQua/Magyar-Vizugy

River water-level monitor: 124 gauges on 23 rivers, map plus per-station history charts, hourly ingestion.

- **Country:** Hungary
- **Stack:** Next.js, Postgres/Drizzle, MapLibre GL, ECharts, GitHub Actions cron
- **Licence:** `NONE FOUND` → ⛔ **Ideas only** — Do not copy code. Reimplement behaviour from a description.
- **Note:** No licence file in the repository, which means all rights reserved. Study freely, copy nothing.
- **Examined:** full
- **National feeds:**
  - `https://www.vizugy.hu (OVF, General Directorate of Water Management)`
  - `hydroinfo.hu (on their roadmap, not yet used)`
- **Worth taking:**
  - 24h trend with a dead band and a null state
  - explicit staleness flag
  - implausible-jump 'suspect' quality flag
  - official flood-alert thresholds as colour bands
  - bilingual README

### flukelaster/SIAHRA

3D geospatial hazard platform: real-time flood, rainfall, dam and earthquake monitoring by province.

- **Country:** Thailand
- **Stack:** React 19, TypeScript
- **Licence:** `MIT` → ✅ **Reusable** — Permissive licence — reuse the code with attribution.
- **Note:** MIT: reuse with attribution.
- **Examined:** sources and README
- **National feeds:**
  - `https://api-v3.thaiwater.net/api/v1/thaiwater30 (water levels, dams, 24h rain)`
  - `https://api-gateway.gistda.or.th/api/2.0/resources/features/flood (flood extent, incl. 3-day)`
- **Worth taking:**
  - a national feed catalogue for Thailand
  - dam state as a first-class layer
  - multi-hazard framing

### TNRIS/flood

Flood viewer over USGS and NWS gauges with SMS subscription. Archived read-only, September 2024.

- **Country:** United States (Texas)
- **Stack:** React, webpack
- **Licence:** `MIT` → ✅ **Reusable** — Permissive licence — reuse the code with attribution.
- **Note:** MIT, but archived and depends on a commercial weather key.
- **Examined:** sources and README
- **National feeds:**
  - `http://water.weather.gov/ahps/ (NOAA AHPS river forecast)`
  - `http://waterdatafortexas.org/`
  - `aerisapi.com (commercial, key required)`
- **Worth taking:**
  - NOAA AHPS as a forecast source
  - alert subscription as a product idea

### sdl60660/river-runner

Animates the path of a raindrop downstream to the sea.

- **Country:** global
- **Stack:** Svelte, Mapbox GL
- **Licence:** `GPL-3.0` → ⛔ **Ideas only** — by choice rather than by licence.
- **Note:** GPL-3.0 can legally be combined with this project's AGPL-3.0, so this is a decision, not a prohibition. It is unusable as shipped without two Mapbox tokens, which breaks the project's no-keys rule. The valuable part is the NLDI endpoint, not the code.
- **Examined:** sources and README
- **National feeds:**
  - `https://labs.waterdata.usgs.gov/api/nldi/linked-data/comid/position (USGS NLDI, keyless downstream navigation)`
  - `https://geoconnex.us/`
  - `https://ksonda.github.io/global-river-runner/ (MERIT-based global API)`
- **Worth taking:**
  - USGS NLDI for downstream navigation
  - MERIT Hydro as a global network with connectivity

### interTwin-eu/dask-flood-mapper

Sentinel-1 flood extent by the Bayesian decision method of Bauer-Marschallinger et al. (2022).

- **Country:** global
- **Stack:** Python, Dask, xarray, STAC
- **Licence:** `MIT` → ✅ **Reusable** — Permissive licence — reuse the code with attribution.
- **Note:** MIT, pip-installable, and the only keyless route to observed water extent found in this survey.
- **Examined:** sources, config and README
- **National feeds:**
  - `https://stac.eodc.eu/api/v1 (European Open Data Centre STAC - no NASA Earthdata login)`
- **Worth taking:**
  - observed surface water for reservoirs, lakes and large floods, baked offline into data/

### DOI-USGS/flow-tiles

Official USGS cartogram of streamflow percentile against the historic record.

- **Country:** United States
- **Stack:** R, targets
- **Licence:** `Creative Commons` → 📐 **Method only** — The approach is the value; the code is not portable.
- **Note:** Depends on a USGS-internal pipelining package. The framing is the value, not the code.
- **Examined:** README and plotting source
- **National feeds:**
  - `USGS internal pipeline (USGS-VIZLAB/gage-conditions-gif); not directly callable`
- **Worth taking:**
  - 'flow percentile relative to the historic record' as the standard way to express flow vs normal

### mohsennasab/GageMap

Upload a project boundary, get every USGS gauge within and around it.

- **Country:** United States
- **Stack:** FastAPI, Folium
- **Licence:** `custom open source` → ⚠️ **Check first** — Non-standard licence — read it before reusing anything.
- **Note:** Custom licence text in the README; read it before reusing.
- **Examined:** sources and README
- **National feeds:**
  - `https://waterservices.usgs.gov/nwis/site/ (USGS NWIS, keyless)`
- **Worth taking:**
  - USGS NWIS site service for gauge discovery

### timlg07/River-Water-Levels-in-Bavaria

Interactive dashboard of Bavarian river water levels.

- **Country:** Germany (Bavaria)
- **Stack:** unknown
- **Licence:** `unknown` → ❓ **Unverified** — Not examined. Verify before relying on anything here.
- **Note:** Repository exists but the clone timed out twice; nothing here has been verified.
- **Examined:** none
- **National feeds:**
  - `unknown - likely gkd.bayern.de, unverified`

### kleok/FLOODPY

Flood Python Toolbox, SAR-based flood mapping.

- **Country:** global
- **Stack:** Python
- **Licence:** `unverified` → ❓ **Unverified** — Not examined. Verify before relying on anything here.
- **Note:** Found in search, not cloned or examined.
- **Examined:** search result only
- **National feeds:**
  - `unverified`

---

## Keeping this current

Add a project by editing [`reference-projects.json`](reference-projects.json) — the fetch script
reads it directly, so a new entry is clonable immediately. This page is written by hand, so edit
it in the same commit; the two must not drift apart.

Always record the licence, and record it as `NONE FOUND` when there is none. That field is the
reason this file exists.

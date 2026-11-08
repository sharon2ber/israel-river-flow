# Notice — third-party code and data

River Flow Israel — Copyright © 2026 **Sharon Berkovich**
([LinkedIn](https://www.linkedin.com/in/sharon-berkovich/) · [GitHub](https://github.com/sharon2ber)).

It is licensed under the GNU AGPL v3 or later (see `LICENSE`). That covers the
code in this repository. It does **not** cover the data the map draws, which belongs to the
bodies that publish it and reaches you under their terms, not mine.

## Bundled code

| Component | Licence | Where |
|---|---|---|
| [Leaflet](https://leafletjs.com/) 1.9.4 | BSD-2-Clause | inlined into `dist/river_flow_israel.html` at build time |
| [Playwright](https://playwright.dev/) | Apache-2.0 | development only, not shipped |

Leaflet's own copyright notice is preserved inside the built file, as its licence requires.

## Data baked into the file

| Data | Publisher | Terms |
|---|---|---|
| Gauging stations, catchments, mean annual volumes, peak discharge | Israel Hydrological Service via [data.gov.il](https://data.gov.il/) | Israeli government open data |
| Flow regime classification (154 gauges, 24 years of daily discharge) | derived by this project from the above | AGPL-3.0-or-later, as a derived work of the code |
| Springs (383) | Israel Hydrological Service via data.gov.il | Israeli government open data |
| Israel's four boundary lines; coastline | [Natural Earth](https://www.naturalearthdata.com/) | public domain |
| GloFAS-vs-gauge validation figures | derived by this project | AGPL-3.0-or-later |
| Measured discharge and water level, 10-minute resolution (`data/measured.json`) | Israel Hydrological Service data retrieval API | **permission granted to this project — conditions below** |

## The Hydrological Service API — the one source with negotiated terms

Everything else here is either open data or this project's own work. The measured
10-minute discharge and water level are different, and the difference matters to anyone
forking this.

The Israel Hydrological Service granted this project access to their data retrieval API in
October 2026, on an access token that is **secret, IP-bound and not redistributable**. It is
not in this repository and it never will be. The API is never called by the map; it is called
by the maintainer, and the map reads a baked file produced from the result.

The permission to display the data publicly was given on two conditions, confirmed by the
Service:

1. **The information is shown free of charge.**
2. **Its origin is stated** — the data comes from the Israel Hydrological Service, Israel
   Water Authority.

Both are met in the map's own credit panel, in Hebrew and English, and must stay met.

**This is the one place where the AGPL is not the whole story.** The AGPL covers the code and
explicitly permits commercial use. It cannot and does not grant you rights over the
Hydrological Service's data. If you fork this map and charge for it, or charge for access to
the measured readings, you are outside the permission that put those readings here, and you
need your own agreement with the Service. Forking the code is free; inheriting this data
arrangement is not something the licence can hand you.

Storing the readings cumulatively is explicitly permitted: the API serves only the most
recent ~42 hours, so without a local store the record would be lost as it passed.

## Data fetched live, at the reader's request

Nothing below is redistributed by this repository. The map asks for it from the reader's own
browser, on their own connection, and caches it locally in their browser only.

| Data | Publisher | Terms |
|---|---|---|
| National stream layer (7,914 features), official river names | Israel Water Authority ArcGIS | Israeli government open data |
| Stream network topology — `ACC_LEN`, `STRM_ORDER`; 191 drainage basins | [govmap.gov.il](https://open.govmap.gov.il/) open data | Israeli government open data |
| Channels, reservoirs, dams, cross-border streams | [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors | ODbL 1.0 — attribution is shown in the map |
| Discharge, forecast, reanalysis (GloFAS) | Copernicus Emergency Management Service via [Open-Meteo](https://open-meteo.com/) | Copernicus licence; Open-Meteo CC-BY 4.0 |
| Antecedent rainfall, elevation | [Open-Meteo](https://open-meteo.com/) | CC-BY 4.0 |
| Weather radar | [RainViewer](https://www.rainviewer.com/) | RainViewer terms |
| Stream pollution sampling points | Israeli monitoring `NehalimDigum` feature service | Israeli government open data |
| Basemap tiles — dark, hillshade, satellite | [Esri](https://www.esri.com/) | Esri terms; attribution shown in the map |
| Basemap tiles — contours | [OpenTopoMap](https://opentopomap.org/) | CC-BY-SA 3.0; attribution shown in the map |

If you fork this and publish it, the attributions built into the map are part of meeting
those terms. Do not remove them.

## A note on what this project is not

The map is modelled, not measured, almost everywhere — Israel publishes no open real-time
streamflow feed. It carries no warranty and it is not a flood warning system. The design goes
to some length to say "I do not know" out loud rather than guess; please keep that property if
you build on it.

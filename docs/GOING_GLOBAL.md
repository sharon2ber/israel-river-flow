# Going global

Notes towards a worldwide version of this map, written while surveying what other countries'
projects already do. See [PROJECT_REGISTRY.md](PROJECT_REGISTRY.md) for the projects themselves.

---

## The good news: the engine is already global

Almost everything this map runs on works anywhere on Earth:

| Component | Global? |
|---|---|
| GloFAS discharge via Open-Meteo | ✅ worldwide |
| Rainfall and elevation via Open-Meteo | ✅ worldwide |
| RainViewer radar | ✅ worldwide |
| OpenStreetMap via Overpass | ✅ worldwide |
| Esri and OpenTopoMap basemaps | ✅ worldwide |
| The evidence ladder, the renderer, the UI | ✅ nothing in them is Israeli |

`SCOPE` in `src/part3_app.js` was written to be widened, and holds the fetch box, the home view
and the foreign-stream policy.

What is **not** global is everything baked into `data/` — 126 gauging stations, 154 measured
flow regimes, 383 springs, the model-vs-gauge validation — plus two live sources, the Water
Authority's stream layer and govmap's national GIS.

So the world version is not a rewrite. It is a **data-adapter problem**.

---

## The unit to merge is not code

The instinct is to absorb other countries' projects. Having read them, that is the wrong unit,
for three reasons.

**They are dashboards over a feed we do not have.** Hungary's project exists because Hungary
publishes hourly measured water levels; Thailand's because `thaiwater.net` does. Each is
essentially a parser plus a renderer for one national schema. The renderer is the part we
already have, better; the parser is the part that does not transfer.

**Licences forbid it anyway.** The closest analogue to this project has no licence file at all,
so its code may not be copied. See the registry.

**What does transfer is knowledge.** A project that knows `api-v3.thaiwater.net` exists, what
it returns and what its quirks are, is worth more than its React components. That is why the
registry records national feeds as a first-class field.

---

## A country pack

The shape that follows from the above. One folder per country, providing as much of this as
exists — and the map degrades honestly when a piece is missing, exactly as it does now.

| Piece | Required? | Israel's version | Fallback when absent |
|---|---|---|---|
| Fetch box, home view, language | yes | `SCOPE` | — |
| Stream geometry | yes | Water Authority ArcGIS layer | OpenStreetMap, or HydroRIVERS |
| Network topology and ordering | no | govmap `nechalim1` (`ACC_LEN`, `STRM_ORDER`) | HydroRIVERS `NEXT_DOWN`; MERIT Hydro |
| Catchments | no | govmap `Nikuz`, 191 basins | HydroBASINS |
| Gauge list | no | `data/stations.json` | none — hide the layer |
| Measured record → flow regime | no | `data/regime.json`, 24 years | none — the ladder falls back to rain and radar |
| Live measured discharge | no | Israel Hydrological Service 10-minute API, collected locally and baked into `data/measured.json`. **By permission, not open data** (see `NOTICE.md`) | GloFAS only, clearly labelled |
| Springs | no | `data/springs.json` | none |
| Attribution and licence | **yes** | `NOTICE.md` | — |

The important property: **a country with nothing but OpenStreetMap still gets a working, honest
map** — GloFAS for discharge, Open-Meteo for rain, RainViewer for radar, and a great deal of
"unverified", stated as such. That is already how the map behaves in the corners of Israel with
no gauge nearby.

Countries with a real feed get more rungs on the ladder. Israel now has one: a measured gauge
reading on a reach outranks every model (see `part4j_measured.js`), under strict rules about age,
stream and distance. The United States is the obvious next one, because USGS publishes live,
keyless, **measured** discharge, and would prove the measured rung is not Israel-shaped.

---

## A path that does not require permission from anyone

1. **Formalise the country pack interface.** Nothing new is fetched; the Israeli data simply
   moves behind a named boundary. Pure refactor, testable against the current output.
2. **Add one country with no national feed at all** — Jordan, Greece, Cyprus. This proves the
   fallback path and is the honest common case worldwide.
3. **Add a second country with a measured feed** — the United States via USGS NWIS and NLDI, both
   keyless. Israel already proves the ladder can take a measured rung above radar; this proves
   it is not specific to one country's feed.
4. **Then invite maintainers.** A country pack is a small, self-contained contribution with a
   clear interface. Someone who already built their national dashboard is exactly the person to
   write one, and inviting them is both friendlier and more legally straightforward than
   absorbing their repository.

Step 4 is the one that scales, and it only works if steps 1–3 have made the interface obvious.

---

## Things to decide before starting

- **Naming.** "River Flow Israel" does not survive going global. The Israeli map could become
  one country pack in something more general, with the current URL kept as an alias.
- **Licence friction.** This project is AGPL-3.0-or-later. MIT and Apache-2.0 code can be brought
  in with attribution; GPL-3.0 code can be combined with it, but GPL-2.0-only cannot; no-licence
  code cannot be used at all. A contributor porting their own MIT project can relicense their own
  work freely — someone porting *somebody else's* cannot.
- **Relicensing needs everyone's permission.** Folding this project into something larger on
  different terms requires the consent of every contributor, unless they agreed up front. That is
  what [`CLA.md`](../CLA.md) is for, and it is far easier to have in place before the first outside
  patch than after.
- **Data is not covered by the code licence.** The Hydrological Service's readings reach this map
  by negotiated permission, on conditions (free of charge, origin stated). Every country pack
  with a similar arrangement needs its own, and `NOTICE.md` is where each is recorded.
- **Load.** Every fetch happens in the reader's browser today, which is what keeps the project
  serverless. A worldwide map multiplies requests to Overpass and Open-Meteo. Their rate limits,
  not our code, will decide how far this goes without a build step.
- **Scope of honesty.** The map's whole argument is that it says what it does not know. Applied
  worldwide, the honest answer in most countries is "modelled, unverified" for most channels
  most of the time. That must stay visible rather than being smoothed away by a prettier map.

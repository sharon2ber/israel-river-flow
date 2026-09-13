# River Flow Israel

A live streamflow map of Israel's rivers and wadis, built as a companion to
[River Flow USA](https://norway-charts.netlify.app/river_flow_map_usa/). Water beyond the
border appears only where a stream crosses into or out of Israel.

**Live map: [sharon2ber.github.io/israel-river-flow](https://sharon2ber.github.io/israel-river-flow/)**
· [download the single file](https://github.com/sharon2ber/israel-river-flow/raw/main/dist/river_flow_israel.html)

Built by **Sharon Berkovich** — [LinkedIn](https://www.linkedin.com/in/sharon-berkovich/) · [GitHub](https://github.com/sharon2ber)

`river_flow_israel.html` is a single self-contained file — Leaflet, the styles, the gauge
data and all the logic are inlined. Open it directly, or drop it on any static host
(Netlify, GitHub Pages, S3). No build step, no API key, no server. It works from `file://`
with no network at all, and then fills itself in when it has one.

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

## Where the numbers come from

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

## What this map does not know

Kept as a list, and shown on screen rather than hidden behind a plausible colour:

- **Whether any Israeli stream is flowing right now.** No public real-time gauge feed exists.
  Every moving line is a model's opinion.
- **Whether a reservoir holds water.** OSM draws the outline of a basin, not its contents.
  Israel's agricultural reservoirs, winter-fill basins, evaporation pans and fish ponds stand
  empty for months. Only a lake OSM explicitly calls a lake is filled blue; everything else is
  an outline, and clicking it shows the exact tags the classification rests on.

  Checked against Overpass over the Galilee, the Jordan Valley and the Dead Sea: of 2,611 water
  polygons there, **34 carry an explicit `water=lake`** and **1,148 are bare `natural=water` with
  no subtype at all** — many of them named *ma'agar*, reservoir, in Hebrew: Ma'agar Bazelet,
  Ma'agar Yaqutza, Ma'agar Ammud. The earlier version of this map painted all 1,148 lake-blue.
  That is the "lake in the desert" bug. The name is treated as evidence too, so a polygon called
  *ma'agar*, *brekhat* or *malhat* is not a lake however it is tagged — which correctly demotes
  the Sodom salt flat while leaving the Sea of Galilee and the Dead Sea filled.
  `node test/water.js` holds fourteen real tag combinations as a regression test.
- **Whether an *ungauged* channel is perennial.** For the 154 gauged streams this is now measured,
  not guessed — see the flow regime section below. For everything else the Water Authority layer
  carries no such attribute and OSM's `intermittent` tag is applied unevenly, so the map does not
  guess.
- **The exact discharge anywhere.** The gauge comparison below measures how wrong the model is.

## When a river is drawn in pieces

Nahal Paran was reported as drawn in disconnected pieces. It was, and no grouping rule could have
fixed it — the geometry is not there to group. The Water Authority layer carries Nahal Paran as
**6 features totalling 24.5 km**, for a wadi that runs about 150, with a 30 km hole in the middle and
an 11 km hole after it.

Not a Paran quirk. Walking all 7,914 features of that layer: of **398 named rivers, 81 (one in five)
have a break of more than 3 km**.

| River | features | mapped km | largest gap |
|---|---|---|---|
| נחל באר | 2 | 12.4 | 250 km |
| נחל חור | 2 | 8.4 | 217 km |
| נחל קמה | 2 | 16.0 | 151 km |
| נחל פארן | 6 | 24.5 | 48 km |
| ירדן | 44 | 240.5 | 32 km (6 breaks over 3 km) |
| נחל צין | 19 | 123.8 | 24 km (5 breaks) |

Some of those giant "gaps" are two genuinely different wadis sharing a name — which is why clustering
existed. Three changes, in order of how much they matter:

1. **Grouping is now name + drainage basin.** A 30 km hole inside one catchment no longer cuts a river
   into chains that are judged and coloured separately. A break *between* basins is left alone, because
   two wadis sharing a name in different catchments are two wadis.
2. **Holes are filled from the national network.** Where the official layer has a gap inside one basin,
   the river is fetched by name from `opendata:nechalim1`, its main stem merged in ACC_LEN order into
   one continuous line, and only the parts falling in the hole are added — anything already drawn is
   left alone. Filled stretches are marked and say where they came from. Runs in the background after
   the map is up, cached 90 days.
3. **The coverage gate no longer erases readings.** A cluster with under a third of its cells known had
   *every* reach set to no-data, including ones with their own reading. That is how a river vanished
   mid-length. Now only the filling between known cells is withheld.

### The audit

Rather than fixing reported rivers one at a time, `networkAudit()` walks every named watercourse on
every load and scores it on the three ways a continuous river can look broken — how many pieces it was
cut into, the largest gap between consecutive segments, and how many times the drawn state changes
along it. The worst offenders are listed in the About panel, so a regression shows up as a number.

## Where the order along a river comes from

Two things this map used to infer, and one source that states them —
[govmap.gov.il's open WFS](https://open.govmap.gov.il/), Israel's national GIS, no key, CORS open.

**Order.** Headwater-to-mouth came from sorting each reach by the elevation of its 5 km model cell.
`opendata:nechalim1` carries **`ACC_LEN`** — accumulated upstream channel length, the total length of
everything draining into a point. (Not distance to the mouth: Paran reads 6,799 for a 150 km wadi.
It rises strictly downstream, which is all the ordering needs.) Measured, and rising strictly toward the mouth. Verified on the
Kishon: lowest value in the upper Jezreel Valley, highest in Haifa Bay.

**Grouping.** Decided by matching names and clustering within 3 km, which is why the Yarkon arrived
as 45 disconnected pieces with a 356 km "largest gap". Now a river is identified by its **spine** —
the network is asked about one name, the largest connected run is kept, and a reach either projects
onto that line or does not.

> **`HYDRO_NET` is not a river id.** Nearly every watercourse in the country carries net 51 — it
> identifies a hydrological *system*. Grouping by it would merge Israel into one chain. This looked
> like the obvious answer and is wrong.

The layer is 1.5 M segments — too large to carry or fetch whole, and a `STRM_ORDER` filter is
unindexed and times out, while a name query returns in a few seconds. So spines are fetched **per
river**: the fourteen biggest quietly after the map is up, any river the moment you open its trace,
cached for 90 days. A river without one keeps elevation ordering and its trace says so.

Measured effect in the test suite: a spine-matched river goes from **45 pieces, ordered by elevation**
to **1 piece, ordered by measured distance along the channel**, and the trace gains a real answer for
how far the drawn line stops short of the network's mouth.

## Catchments, not grid cells

The rain check asked "did it rain on this stream's 5 km model cell". Water reaches a channel from its
catchment, which may be a hundred times the size of one cell. `opendata:Nikuz` gives **191 drainage
basins**, each carrying **`DRAIN_TO`** — the basin it empties into, so the set forms a graph. The map
now asks how much rain fell anywhere in a stream's catchment, upstream basins included, taking the
wettest cell rather than the mean because the question is whether water could be moving at all.

2.4 MB raw, so it is fetched once and cached like the other big layers, simplified to ~500 m on
arrival.

## Radar — rain seen rather than modelled

[RainViewer](https://www.rainviewer.com/): keyless, CORS open, thirteen frames covering the past two
hours. Modelled daily rain is right for "has this catchment been wet lately" and wrong for what an
Israeli wadi does — run during a storm and stop within the day.

Radar is an observation, so it enters the evidence ladder **above** modelled rain. The map samples the
rendered radar tile at each model cell and asks whether that pixel carries echo; a reach with rain
over its catchment right now is flowing, and the panel says the map watched it rather than inferred
it. Applies to today only. Also a layer you can switch on.

The ladder is now, in order: **radar → catchment rain → live spring → perennial gauge → measured
regime → unverified.**

## Why a river flows in some places and not others

Often it genuinely does. The Kishon is the case in point: its upper reach in the Jezreel Valley is
dry in September while its lower reach runs on springs and effluent. One river, two states, both
correct.

What was wrong was the flicker. All three inputs to the evidence decision vary along a river for
reasons that have nothing to do with the river — rain is measured on a 5 km grid and a long river
crosses eight or ten cells; the regime came from whichever gauge was nearest; OSM's `intermittent`
tag is applied segment by segment by different contributors. So the map alternated blue and violet
down a single watercourse.

The evidence pass now walks each connected river headwater to mouth and carries what it knows with
the current:

- rain accumulates **downstream**, never up — a reach is credited with the wettest cell at or above it
- a perennial gauge or a live spring makes everything **below** it perennial too
- once flowing, a river cannot be dry further down

A river therefore changes state **at most once** along its length. `test/run.js` asserts it: across
336 connected chains, worst case one transition, zero chains with more. The transition point is drawn
as a small ring.

## Springs — why a stream runs in a rainless August

The Hydrological Service registers 679 springs and publishes **112,597 individual measured discharges**
in litres per second through [data.gov.il](https://data.gov.il/dataset/spring_discharge). The 383 with
a real, repeatedly measured flow are on the map, sized by discharge:

| Spring | Mean l/s | Jul–Sep l/s |
|---|---|---|
| Dan springs (sum) | 7,437 | 7,318 |
| Banias | 1,989 | 1,161 |
| Zuqim (Dead Sea shore) | 1,895 | 1,905 |
| Wazani | 1,436 | 1,199 |
| Taninim springs | 739 | 659 |
| Na'aman | 654 | 508 |

A spring with real summer discharge is evidence, the same as a perennial gauge, and it carries
downstream: below a live source, water is expected. 217 of the 383 qualify as live sources, 228
reaches sit within 2 km of one, and 34 reaches that would otherwise read "unverified" now read
flowing with the spring named.

## When a river stops before the sea

Three different causes wear that face, and the map measures all three rather than guessing:

1. **the source stops** — the Water Authority ships each river as separate features that mostly do not
   join (611 of 15,106 endpoints touch), so a river can have no feature for its last kilometre
2. **the river was split** — pieces more than 3 km apart are treated as different watercourses
3. **no model data below** — a chain whose cells are empty draws as a faint dotted line

Open any river's **trace** from its detail panel: pieces it arrived in, largest gap between them,
distance from its downstream end to the coastline, then every segment in flow order with its cell,
elevation, discharge, rain, regime and verdict. Breaks in the source data are marked. Coastline from
Natural Earth, taken as the part of Israel's outline that is not a land boundary — 36 points from
Rosh Hanikra to Gaza plus two at Eilat. Verified: Tel Aviv beach 1.6 km, Haifa port 0.9 km,
Jerusalem 51.7 km.

## The flow regime: what each stream actually does

Israel has a handful of streams that run all year, many that carry water only in the wet season,
and some that flow once in several years. That distinction does not have to be guessed. The
Hydrological Service publishes **daily mean discharge for every gauging station, zeros included**,
through [data.gov.il](https://data.gov.il/dataset/level_discharge). Twenty-four hydrological years
of it — 2000/01 to 2023/24, about 8,800 days per station — classify each gauged stream by what was
measured there:

| Class | Rule | Gauges |
|---|---|---|
| perennial | water on ≥80% of July–September days | 19 |
| near-perennial | water on ≥30% of all days, summer breaks | 27 |
| seasonal | flows in ≥60% of years, wet season only | 76 |
| rare | flows in fewer than 60% of years | 17 |
| unclassified | record under 1,000 days or 3 years | 15 |

The perennial list is the Jordan (four gauges), Dan, Senir, Hermon, Meshushim, Yehudiya, Orevim,
Kalil, Qishon, Zippori, Alexander, Yarqon, Soreq at Hartuv, Harod and the Yarmouk. The rare list is
Timna, Amram, Shelomo above Eilat, Uba, Zihor, Masor, Ammi'az, Admon, Al Burida, the Arava at
Hazeva, the Besor at Re'im, Shillo, Shion, Haro'a, Ashalim Canal, and the Zin waterfall.

**The class belongs to the gauge, not to the name.** A stream is not one thing along its length:
the Jordan is perennial at Sede Nehemya, the Besor at Re'im has flowed in fewer than three years in
five, and Nahal Zin is seasonal at Masos while its waterfall gauge has recorded nothing in thirteen
years. A reach takes the regime of the nearest gauge on its own stream, within 30 km, and names that
gauge and the distance in the panel. No gauge on that stream means the regime stays unknown.

The full listing is in [`data/regime.md`](data/regime.md); the machine-readable form the app inlines
is `data/regime.json`.

### This now outranks the model

A perennial stream with no recent rain is drawn as **flowing** — a perennial stream runs without
rain. A seasonal or rare channel with no recent rain is drawn as **dry** even when the model insists
otherwise. Measurement beats a global model on its own ground.

### The comparison, run every time

Every load counts where the model contradicts the measured record and lists the cases rather than
summarising them away — the model claiming water on a channel the gauges say is dry this time of
year, and the model claiming dry on a stream that has run through twenty-four summers. It is in the
About panel, recomputed on each load, and each row names the gauge it is judged against.

## The rain check

The model is one opinion and not a measured one, but a second independent observation is free:
whether it has rained on the catchment. Israeli hydrology makes that nearly decisive — outside the
winter rains almost every watercourse here is an ephemeral wadi that runs after rain and at no
other time.

So every model cell also carries 21 days of daily rainfall from the Open-Meteo forecast API
(one request per hundred cells, cached for the day), and each reach lands in one of five states:

| State | Meaning | Drawn as |
|---|---|---|
| flowing | model reports water, rain has fallen on the cell | blue, moving |
| dry | model reports nothing, nothing contradicts it | thin sand-coloured line |
| dry, overruling the model | model reports water, no rain, channel mapped `intermittent=yes` | thin sand-coloured line |
| unverified | model reports water, no rain, perenniality unknown | still dashed violet |
| no data | model gave nothing | dotted grey |

Threshold: 5 mm over 14 days — far less than a wadi needs to run, so the model has to fail badly
before it is overruled. The window ends on whichever day the slider shows and is matched by date,
not by array index. Colour is never the only signal: each state has its own stroke, so the three
non-flowing states stay apart without hue.

Measured while building this, on 2026-09-04: across a hundred cells spanning Israel, **not one had
received 5 mm of rain in a fortnight, and GloFAS still reported flow in 32 of them** — including
0.76 m³/s in a Negev cell near Be'er Sheva that had seen 0.2 mm in two weeks. That is the failure
mode this check exists to catch, and it is why the map shows far less blue in September than it
used to.

## The honest caveat

The moving water is modelled, not measured. The Hydrological Service's discharge records on
data.gov.il stop at the 2023/24 hydrological year, and that API sends no CORS headers, so a
browser cannot read it.

There is a better feed, and it is nearly in reach: [hydro.water.gov.il](https://hydro.water.gov.il/)
carries live readings from the Service's transmitting hydrometric stations and publishes an
API for them. Access is granted individually — sign their undertaking and email it to
Forecasterihs@water.gov.il. With that key this map could show measured Israeli discharge
instead of a global model. It would slot in where `fetchFlow()` is called.

## The reliability step

GloFAS runs on a grid about five kilometres across. One river crosses several cells, and a
cell with no modelled channel returns zero — so raw values make a river appear to flow, stop,
and flow again along its length. That is the grid, not the hydrology.

Before anything is drawn, each named river is split into spatially connected clusters (a
shared name is not proof two wadis are the same river), ordered headwater to mouth by the
elevation of its cells, and its discharge carried downstream as a running maximum. Water
accumulates downstream; it does not vanish and reappear. A genuinely dry headwater above a
spring-fed reach is untouched, because the fill only ever comes from upstream. A river whose
cells are mostly empty (under a third covered) is not smoothed into a confident line — it is
shown as having no model data. The detail panel reports, per reach, whether the number is the
cell's own reading or was filled from the river profile.

## Scope: Israel first, and how to widen it

This is a map of Israel's streams. The only boundaries drawn are Israel's own four — Lebanon,
Syria, Jordan, Egypt — and the only crossings marked are of those. Borders between other
countries, and their streams, are not fetched at all.

A stream beyond the border is drawn only if it crosses into or out of Israel, and then it is
drawn in full, as far as it runs. Everything else is dropped before it is painted: a Syrian
stream that never comes near, a wadi that stays in Sinai. The rule is geometric — a foreign
reach survives if it crosses one of Israel's borders, or joins end to end with one that does.

"Inside" is decided two ways at once, and a reach has to fail both: Israel's mapped extent
per Natural Earth (three rings, simplified to 400 m, baked in at 6 KB) and the footprint of
the Water Authority's own stream layer with about two kilometres of slack. Nine points along
each reach are tested rather than its midpoint alone, which was the old rule and let any
foreign stream whose middle happened to fall near the border pass as Israeli.

All of that hangs off one object, `SCOPE` at the top of `src/part3_app.js`:

```js
const SCOPE = {
  id: "israel",
  fetchBox: [28.90, 33.60, 34.05, 36.70],   // S, W, N, E
  home: { rings: EXTENT, official: true, nearKm: 2 },
  foreignPolicy: "crossing-only",           // or "all"
  borderPairs: null,                        // or ["Israel|Jordan", ...]
  view: { center: [31.45, 34.95], zoom: 8, min: 3, max: 18 }
};
```

Adding a neighbour means widening `fetchBox` and adding its rings to `home`. A whole
Middle East build means `foreignPolicy: "all"`, empty `rings`, and a wider `view` — the
pruning step then returns everything untouched and nothing else changes.

## Verification: is the model any good?

The map should not ask to be trusted, so it carries the check. The Hydrological Service
publishes, for every active gauge, the mean annual volume measured there over decades. A
volume per year is a discharge — divide by the 31,556,952 seconds in one — and GloFAS can be
asked the same question at the same coordinates out of its own reanalysis. The two numbers go
side by side.

Click any gauge and its pair appears with the ratio: green inside a factor of two, amber
inside three, red beyond. The About panel carries the network figures — how many gauges agree
within a factor of two and three, the median bias, the rank correlation, whether the model
reproduces the collapse to nothing in late summer — and a button that recomputes all of it
live in your browser.

Open-Meteo's free tier prices a request by places times days, so four years at all 126 gauges
is far past an hour's allowance. Rather than shorten the window until one wet winter decides
the answer, the check takes a stratified sample: gauges sorted by measured mean, evenly spaced
picks, so the smallest desert wadi and the Dan are both in. Forty-eight gauges, four years,
twelve requests a minute apart — about thirteen minutes if you run it live.

Two limits stated plainly. The periods do not match: a gauge record may start in 1966, the
reanalysis covers four years. And a 5 km model cell is not a gauge cross-section. This
establishes order of magnitude and rank, which is what the map claims when it colours a
stream, not gauge accuracy, which it never claims.

### What it says, as of 2026-08-31

48 gauges, four years:

| | |
|---|---|
| within a factor of 2 | 15% |
| within a factor of 3 | 36% |
| within a factor of 10 | 70% |
| median bias | ×1.86, model high |
| rank correlation (Spearman) | 0.64 |
| late-summer flow as a share of winter, modelled | 47% |
| gauge cells the model empties in Aug–Sep | 38% |

Read plainly: GloFAS ranks Israel's streams reasonably — bigger reads as bigger, which is what
the colour scale asks of it — but its number for any one stream is off by more than a factor of
three about two thirds of the time, and it runs roughly twice high. Its weakest point is exactly
the season this map is most likely to be read in: it holds late-summer flow at about half of
winter and empties only 38% of gauge cells in August and September, where most Israeli wadis
simply stop. A blue line in late summer deserves suspicion unless the stream is spring-fed or
carries effluent. The flow-vs-normal layer is the honest way to read that season, because a
percentile cancels the model's standing baseflow.

Best agreement in the sample: Hermon at Kefar Szold Road (1.996 measured → 2.054 modelled),
Soreq at Yavne (0.286 → 0.255), Shiqma–Erez (0.192 → 0.233). Worst: the Jordan at Sede Nehemya
(11.64 → 0.42, the model has no idea the upper Jordan is there) and several Negev wadis where a
5 km cell holds no channel at all.

Boundary lines are Natural Earth's, kept with their own classification — international with
Jordan and Egypt, indefinite with Lebanon, line of control with Syria — and drawn dashed
wherever the source calls them anything other than settled. Nothing here asserts sovereignty.
The Israel–Palestine line is present in the source data but is not drawn and not used for
crossings; it can be switched on in `data/borders.json` if that changes.

## Flow direction

OSM draws waterways downstream by convention. The official layer is digitised downstream
about nine times in ten — checked against the Jordan, Lakhish, Soreq, Alexander, Hadera and
Shiqma — which is not good enough to animate from. So every reach over 2 km has both ends'
elevation looked up and is reversed if it was running uphill. That also yields the drop and
gradient shown in the detail panel. Terrain does not move, so the result is cached for good.

## How it loads

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

## Rebuilding from source

Python 3 and Node 20 or later. Nothing else, and no toolchain.

```
npm install             # Leaflet (inlined at build time) + Playwright (tests only)
npm run build           # inlines Leaflet + data into dist/river_flow_israel.html
npm test                # headless Playwright pass: boot, hover, click, toggles,
                        # language switch, search, cache reload, screenshots
node test/resilience.js # source failure modes: healthy, partial Overpass outage, total
                        # Overpass outage, Overpass timeout replies, official layer down
node test/water.js      # water-body classification against real OSM tag combinations
node test/regime.js     # flow-regime source integrity and gauge matching
```

A weekly scheduled task re-checks every source above — endpoints, schemas, feature counts,
and whether the Hydrological Service API has opened up — and reports anything that changed.

`data/stations.json` is a snapshot of the active gauge network. To refresh it, re-pull
`hydro_station` and `maxdischarge_yearlyvolume` from data.gov.il and re-run the ITM→WGS 84
conversion (`pyproj`, EPSG:2039 → EPSG:4326).

## Every push rebuilds the live map

`.github/workflows/pages.yml` runs `npm install` and `python3 build.py` on every push to
`main` and publishes the result to GitHub Pages. The live map is therefore always built from
the committed source, never from a file uploaded by hand — if the two ever disagree, the
source is right.

## Contributing

Corrections to the hydrology are the most valuable contribution. If a river looks wrong on
the map, open an issue with the river, roughly where along it, what the map showed, what was
actually there, and the date. "I was at this wadi yesterday and it was bone dry" is real
evidence and this map is built to accept it. See [CONTRIBUTING.md](CONTRIBUTING.md) for the
two rules any code change is held to.

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

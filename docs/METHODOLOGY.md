# Methodology and scientific limitations

This is the reasoning behind the map: what it measures, what it models, what it
infers, and — at length, because it matters most — what it cannot know.

Every section here was written as the corresponding problem was found and
fixed. Nothing has been simplified for brevity; if a caveat reads as
uncomfortably blunt, that is deliberate.

For the code that implements any of this, see
[ARCHITECTURE.md](ARCHITECTURE.md) and
[WHERE_TO_MAKE_CHANGES.md](WHERE_TO_MAKE_CHANGES.md). For where each number
comes from, see [DATA_SOURCES.md](DATA_SOURCES.md).

---

## The short version

- The colour and width of every channel come from **GloFAS**, a physical
  hydrological model on a ~5 km grid. That is **modelled**, not measured.
- Whether the map *animates* that flow depends on corroboration: observed
  radar, modelled catchment rainfall, measured spring discharge, or a measured
  long-run flow regime.
- Where nothing corroborates, the map says **unverified** and draws a dashed
  violet line. Where the measured record contradicts the model, the map
  **overrules the model**. Where there is no model value, it says so.
- Israel publishes no open real-time streamflow feed, so there is no measured
  "is there water right now" anywhere in this project.

---

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

---

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

---

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

---

## Catchments, not grid cells

The rain check asked "did it rain on this stream's 5 km model cell". Water reaches a channel from its
catchment, which may be a hundred times the size of one cell. `opendata:Nikuz` gives **191 drainage
basins**, each carrying **`DRAIN_TO`** — the basin it empties into, so the set forms a graph. The map
now asks how much rain fell anywhere in a stream's catchment, upstream basins included, taking the
wettest cell rather than the mean because the question is whether water could be moving at all.

2.4 MB raw, so it is fetched once and cached like the other big layers, simplified to ~500 m on
arrival.

---

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

---

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

---

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

---

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

---

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

The full listing is in [`data/regime.md`](../data/regime.md); the machine-readable form the app inlines
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

---

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

---

## The honest caveat

The moving water is modelled, not measured. The Hydrological Service's discharge records on
data.gov.il stop at the 2023/24 hydrological year, and that API sends no CORS headers, so a
browser cannot read it.

There is a better feed, and it is nearly in reach: [hydro.water.gov.il](https://hydro.water.gov.il/)
carries live readings from the Service's transmitting hydrometric stations and publishes an
API for them. Access is granted individually — sign their undertaking and email it to
Forecasterihs@water.gov.il. With that key this map could show measured Israeli discharge
instead of a global model. It would slot in where `fetchFlow()` is called.

---

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

---

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

---

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

---

## Flow direction

OSM draws waterways downstream by convention. The official layer is digitised downstream
about nine times in ten — checked against the Jordan, Lakhish, Soreq, Alexander, Hadera and
Shiqma — which is not good enough to animate from. So every reach over 2 km has both ends'
elevation looked up and is reversed if it was running uphill. That also yields the drop and
gradient shown in the detail panel. Terrain does not move, so the result is cached for good.

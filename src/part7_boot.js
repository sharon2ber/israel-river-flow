
/* ============================================================
   About text + boot
   ============================================================ */
function buildAbout(){
  const en = `
<h2>About the data</h2>
<p>This map shows Israel's streams, coloured and animated by how much water the
GloFAS flood model says is moving through them. It is a companion to
<a href="https://norway-charts.netlify.app/river_flow_map_usa/" target="_blank" rel="noopener">River Flow USA</a>,
rebuilt on the sources that exist for this region.</p>

<div class="warn"><p><b>The flow you see is modelled, not measured.</b> Israel has no public real-time
streamflow feed comparable to the USGS one. The Israel Hydrological Service publishes gauge records through
data.gov.il, but the most recent discharge data there ends with the 2023/24 hydrological year, and the API
does not allow browser access. So the live layer comes from a global model, and the Israeli gauge network is
shown as measured historical context.</p></div>

<h4>Discharge — live layer</h4>
<p><a href="https://open-meteo.com/en/docs/flood-api" target="_blank" rel="noopener">Open-Meteo Flood API</a>,
serving <a href="https://www.globalfloods.eu/" target="_blank" rel="noopener">GloFAS</a> (Copernicus Emergency
Management Service). Daily mean river discharge on a 0.05° grid — roughly 5 km — with seven days of history and
seven of forecast. Because the grid is coarse relative to Israeli catchments, neighbouring watercourses inside
one grid cell share a value, and small wadis are represented crudely. Treat the numbers as an indication of
regime, not as a gauge reading.</p>

<h4>Flow vs normal</h4>
<p>Computed on demand from the same model's 20-year reanalysis: the percentile of today's discharge within all
values recorded for that grid cell within ±10 days of this calendar date. Click a river to see it, or switch on
the layer to rank the largest flows in the network.</p>

<h4>Gauging stations — measured</h4>
<p>126 currently active hydrometric stations of the
<a href="https://www.gov.il/en/departments/units/hydrological_service" target="_blank" rel="noopener">Israel
Hydrological Service</a> (Israel Water Authority), from
<a href="https://data.gov.il/dataset/hydro_station" target="_blank" rel="noopener">data.gov.il</a>. Each carries
its catchment area, period of record, mean annual volume and the highest discharge ever measured there, from the
<a href="https://data.gov.il/dataset/maxdischarge_yearlyvolume" target="_blank" rel="noopener">peak discharge and
annual volume</a> dataset. Coordinates converted from Israel Transverse Mercator (EPSG:2039) to WGS 84. The full
archive holds 457 stations including closed ones; only active gauges are mapped.</p>

<h4>The stream network</h4>
<p>The watercourses themselves come from the Water Authority's national stream layer &mdash; 7,914 line features
with official Hebrew and English names, served openly from
<a href="https://services1.arcgis.com/hWUp5lYOh3Fi9WoQ/arcgis/rest/services/israel_rivers/FeatureServer/1" target="_blank" rel="noopener">ArcGIS</a>
and fetched fresh on your first visit. It is the same layer behind the Hydrological Service's own stream map, and
it carries thousands of wadis that OpenStreetMap does not.</p>
<p><a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors
(ODbL) do two jobs only: filling channels the official layer misses inside Israel, and carrying the streams that
cross Israel's border. Any OSM watercourse running within 400 m of an official one is dropped, so nothing is drawn
twice. Reservoirs, lakes and dams are OSM throughout.</p>
<p>The official layer ships each river as many separate line features that do not join end to end &mdash; only 611
of its 15,106 endpoints touch &mdash; so this map groups them by river name instead. Hover any fragment and the
whole river lights up; the panel reports its combined length.</p>

<h4>Which way the water runs</h4>
<p>OSM draws waterways downstream by convention. The official layer is digitised downstream about nine times in
ten, which is not good enough, so every reach over 2 km has the elevation of both its ends looked up through the
<a href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noopener">Open-Meteo elevation API</a>
and is reversed if it was running uphill. That also gives the drop and gradient in the detail panel. Terrain does
not move, so this is worked out once and kept.</p>

<h4>Pollution sampling points</h4>
<p>The 33 stream sampling points of the
<a href="https://www.arcgis.com/apps/dashboards/da4d9cbb77e14183bd7a80b13e34a5f5" target="_blank" rel="noopener">stream
pollution monitoring dashboard</a>, each with its stream and site name. Note that this is the pollution sampling
network; it is not a microbiological result feed, and no measurements are published through it.</p>

<h4>Basemaps</h4>
<p>All tiles come from Esri's open services, except the contours, which are OpenTopoMap's. CARTO was dropped: its
keyless basemap now serves tiles stamped API KEY REQUIRED. There is one dark map, with place names as a toggle
rather than a separate entry. The
hillshade is worth switching to: once you can see the Jordan Rift and the Negev as relief, the direction of every
wadi stops being a claim the map is making and becomes something you can read off the ground. Attribution is a
licence condition of all four, so it stays on the map &mdash; folded into the small badge in the corner.</p>

<h4>Why the colour scale is different</h4>
<p>Israel's rivers are one to three orders of magnitude smaller than the American ones. The Jordan at Deganya
averages around ten cubic metres per second; the Yarkon runs at a few. Using the US scale would paint the whole
country a single colour, so the class breaks here are set to local hydrology: 0.05, 0.5, 2, 10 and 50 m³/s.
Flash floods in the Negev briefly exceed everything on this scale — Nahal Paran once peaked at 1,155 m³/s.</p>

<h4>The reliability step</h4>
<p>GloFAS runs on a grid about five kilometres across. A single river crosses several cells, and a cell with no
modelled channel in it returns zero &mdash; so the raw numbers make a river appear to flow, stop, and flow again
along its length. That is the grid, not the hydrology, and it should not reach you unexamined.</p>
<p>So before anything is drawn: each named river is split into spatially connected clusters (a name is not proof
that two wadis are the same river), ordered headwater to mouth by the elevation of its cells, and the discharge is
carried downstream as a running maximum. Water accumulates downstream; it does not vanish and reappear. A genuinely
dry headwater above a spring-fed reach survives this untouched, because the fill only ever comes from upstream.</p>
<p>A river whose cells are mostly empty is not smoothed into a confident blue line &mdash; it is shown as having no
model data at all. The detail panel tells you, for every reach, whether the number is that cell's own reading or was
filled in from the river's profile.</p>

<h4>What this map does not know</h4>
<p>A map that only ever shows what it has is a map that quietly invents things. So this one keeps
a list of what it cannot tell you, and shows those states on screen instead of hiding them behind
a plausible colour.</p>
<ul>
<li><b>Whether any Israeli stream is flowing right now.</b> There is no public real-time gauge feed.
Every moving line is a model's opinion.</li>
<li><b>Whether a reservoir has water in it.</b> OpenStreetMap draws the outline of a basin; it does
not say what is in it today. Israel's agricultural reservoirs, winter-fill basins, evaporation pans
and fish ponds stand empty for months. Only a natural, permanent, non-seasonal lake is painted
blue here &mdash; everything else is drawn as an outline, and clicking it shows the exact tags the
classification rests on.</li>
<li><b>Whether a channel is perennial.</b> The Water Authority's layer carries no such attribute and
OpenStreetMap's <code>intermittent</code> tag is applied unevenly. Where it is missing, this map does
not guess.</li>
<li><b>The exact discharge anywhere.</b> The gauge comparison below measures how wrong the model is.
It is off by more than a factor of three about two thirds of the time.</li>
</ul>

<h4>Catchments, not grid cells</h4>
<p>The rain check used to ask "did it rain on this stream's 5 km model cell". That is not the
hydrological question. Water reaches a channel from its catchment, which may be a hundred times the
size of one cell and shaped nothing like it. Asking per cell is what made the rain evidence flicker
along a river in the first place.</p>
<p>The national GIS publishes the real answer: 191 drainage basins, each carrying
<code>DRAIN_TO</code> &mdash; the basin it empties into. That is a graph, and it lets the map ask what
it should have asked from the start: how much rain has fallen anywhere in this stream's catchment,
every basin that drains into it included. The figure taken is the wettest cell in that catchment, not
the mean, because the question is whether water could be moving at all.</p>
<p>Each reach names its catchment and its area in the detail panel. Reaches outside any mapped basin
fall back to the old accumulation along the chain.</p>

<h4>Radar &mdash; rain seen rather than modelled</h4>
<p>Every rain figure here had been modelled. That is right for "has this catchment been wet lately"
and wrong for what an Israeli wadi actually does: run during a storm and stop within the day. A
fourteen-day total cannot see that, and by the time it can, the water has gone.</p>
<p><a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a> composites
weather radar worldwide and publishes the frame index openly &mdash; thirteen frames covering the past
two hours. That is an observation, so it enters the ladder above modelled rain: a reach with echo over
its catchment right now is flowing, and the panel says the map watched it rather than inferred it.
Radar evidence applies to today only, and it is a layer you can simply switch on and look at.</p>

<h4>The rain check</h4>
<p>The model is one opinion, and not a measured one. But a second, independent observation is free:
whether it has rained on the catchment. Israeli hydrology makes that nearly decisive, because outside
the winter rains almost every watercourse here is an ephemeral wadi &mdash; it runs after rain and at
no other time.</p>
<p>So every model cell also carries three weeks of daily rainfall from
<a href="https://open-meteo.com/en/docs" target="_blank" rel="noopener">Open-Meteo</a>, and each reach
lands in one of five states rather than being coloured straight from the model:</p>
<ul>
<li><b>Flowing</b> &mdash; the model reports water and rain has fallen on the cell. Drawn blue and moving.</li>
<li><b>Dry</b> &mdash; the model reports nothing, and nothing contradicts it.</li>
<li><b>Dry, overruling the model</b> &mdash; the model reports water, no rain has fallen, and this
channel is mapped as intermittent. In Israel that means dry, so the map says dry.</li>
<li><b>Unverified</b> &mdash; the model reports water, no rain has fallen, and we do not know whether
this channel runs year-round. Drawn as a still, dashed violet line: not water, not a claim of dryness.</li>
<li><b>No data</b> &mdash; dotted, because the model gave nothing at all.</li>
</ul>
<p>The threshold is deliberately generous &mdash; five millimetres over fourteen days, far less than a
wadi needs to run &mdash; so the model has to fail badly before it is overruled. Colour is never the
only signal either: each state has its own stroke, so the three non-flowing states stay apart for a
reader who cannot separate the hues.</p>
<p>This is why the map may show far less blue than you expect in September. That is the point. In a
sample of a hundred cells across Israel taken while this was built, not one had received five
millimetres of rain in a fortnight, and GloFAS still reported flow in a third of them.</p>

<h4>When a river is drawn in pieces</h4>
<p>Nahal Paran was reported as drawn in disconnected pieces. It was, and no grouping rule could have
fixed it, because the geometry is not there to group. The Water Authority's national layer carries
Nahal Paran as <b>six features totalling 24.5 km</b>, for a wadi that runs about 150, with a 30 km
hole in the middle and an 11 km hole after it.</p>
<p>That is not a Paran quirk. Walking all 7,914 features of that layer: of 398 named rivers,
<b>81 &mdash; one in five &mdash; have a break of more than 3 km</b>. Nahal Be'er, Hor, Kama and Yahel
are two fragments each. The Jordan has six breaks over 3 km; Nahal Zin has five.</p>
<p>Israel's national stream network has the same rivers whole. Paran there is 409 segments and 144 km,
spanning the entire wadi. So where the official layer has a hole inside one drainage basin, the map
now goes and gets the missing channel: the river is fetched by name, its main stem taken, merged in
order into one continuous line, and only the parts that fall in the hole are added. Anything already
drawn is left alone, and a filled stretch says where it came from when you click it.</p>
<p><b>Taking the main stem got this wrong twice, and Nahal Paran showed it both times.</b>
The first attempt kept only the highest Strahler stream order. But order <i>rises</i> downstream, so
the highest is the river's lowest reach and nothing above it: for Paran that is the bottom 61 km of a
143 km wadi, and an official Paran segment at 34.71&deg;E sits outside it entirely. Paran is carried
at orders 3 through 7 &mdash; 49&nbsp;km, 10, 9, 15, 61 &mdash; and every one of them is the same
channel. No order is dropped now.</p>
<p>The second attempt kept every order and trusted <code>ACC_LEN</code> to put them in sequence. It
does, almost everywhere. But Paran also carries three tiny order&#8209;0 stubs and one order&#8209;2
fragment whose <code>ACC_LEN</code> lands them in the middle of the walk, so the line jumped out to a
stub and back and tore in two, leaving holes of 88.6 km and 37.7 km. Dropping short stream orders
fixed Paran and nothing else &mdash; the same noise at a different length went straight through.</p>
<p>So the ordering is repaired rather than filtered. The segments are walked in <code>ACC_LEN</code>
order, each one flipped if it was digitised against the flow; the walk is broken wherever it jumps
more than 3 km; the longest piece becomes the trunk; and every other piece is offered back to it
whole, at the cheapest place it fits. Cheap means it lies <i>along</i> the channel there &mdash;
however wide the hole it fills &mdash; which is what lets a sparsely mapped wadi keep its real gaps
while a stub sitting off to the side is left out. Whole pieces rather than single segments, because
Paran's three strays sit side by side in the ordering: each one's neighbour is the next stray, so not
one of them looks out of place on its own. Paran comes out of that as <b>405 segments, 143.5 km,
29.577&deg;N to 30.397&deg;N, with no gap over a kilometre</b>.</p>
<p>A break <i>between</i> two basins is left exactly as it is. Two wadis sharing a name in different
catchments are two wadis, and welding them was the bug that made the old 3 km clustering necessary.
Grouping now uses name and drainage basin together, which is why a 30 km hole inside one catchment no
longer cuts a river into pieces that are judged and coloured separately.</p>
<p>Two other things used to make a whole river vanish mid-length. A cluster whose cells were mostly
empty had every reach set to no data, including the ones that had their own reading &mdash; now only
the filling between them is withheld. And the audit below counts what is still broken, on every load,
so a regression shows up as a number rather than as a complaint.</p>
<div id="auditbox"></div>

<h4>Where the order along a river comes from</h4>
<p>Two things this map used to infer, and one source that states them.</p>
<p><b>Order.</b> Headwater to mouth came from sorting each reach by the elevation of its 5 km model
cell. Terrain is not the channel, and a coarse cell is not terrain. Israel's national stream layer,
published openly through <a href="https://open.govmap.gov.il/" target="_blank" rel="noopener">govmap.gov.il</a>,
carries <code>ACC_LEN</code>: the distance water has already travelled along the network when it
reaches a segment. Measured, and rising strictly toward the mouth &mdash; checked on the Kishon,
whose lowest value sits in the upper Jezreel Valley and whose highest sits in Haifa Bay.</p>
<p><b>Grouping.</b> Which segments are one river was decided by matching names and clustering
anything within 3 km. That is why the Yarkon arrived as forty-five disconnected pieces with a 356 km
"largest gap". Now a river is identified by its spine: the national network is asked about one name,
the largest connected run of it is kept, and a reach either projects onto that line or does not.</p>
<p>One caution, learned the hard way and worth stating because it looks like the obvious answer:
<code>HYDRO_NET</code> is not a river id. Nearly every watercourse in the country carries net 51 &mdash;
it identifies a hydrological system, not a stream &mdash; so grouping by it would merge Israel into a
single chain.</p>
<p>The layer is a million and a half segments, too large to carry or fetch whole, so spines are
fetched per river: the biggest ones quietly after the map is up, any river the moment you open its
trace. A river without one keeps the old elevation ordering, and its trace says so.</p>

<h4>Why a river flows in some places and not others</h4>
<p>Because that is often true, and the map used to say it badly. The Kishon is the case in point:
its upper reach in the Jezreel Valley really is dry in September while its lower reach really does
run, fed by springs and effluent. One river, two states, and both correct.</p>
<p>What was wrong was the flicker. All three inputs to the old decision vary along a river for
reasons that have nothing to do with the river: rain is measured on a 5 km grid and a long river
crosses eight or ten cells, so one clears the threshold and the next does not; the regime came from
whichever gauge happened to be nearest; and OpenStreetMap's intermittent tag is applied segment by
segment by different contributors. So the map alternated blue and violet down a single watercourse.</p>
<p>Water does not work that way. It enters a channel at a point and runs downstream. The evidence
pass now walks each connected river from headwater to mouth and carries what it knows with the
current: rain accumulates downstream, never up; a perennial gauge or a live spring makes everything
below it perennial too; and once a river is flowing it cannot be dry further down. A river therefore
changes state <b>at most once</b> along its length, and the point where it changes is drawn as a small
ring you can click.</p>

<h4>Springs &mdash; why a stream runs in a rainless August</h4>
<p>The map was asking the wrong question of the summer. It knew the sky was dry and it knew what the
gauges measured, but it had no account of the thing that actually keeps an Israeli stream running in
September: a source putting water into it.</p>
<p>The Hydrological Service registers 679 springs and publishes 112,597 individual measured discharges
for them, in litres per second, through
<a href="https://data.gov.il/dataset/spring_discharge" target="_blank" rel="noopener">data.gov.il</a>.
The 383 with a real, repeatedly measured flow are on the map, sized by discharge. The largest are not
marginal: the Dan springs average <b>7,437 l/s</b> &mdash; seven and a half cubic metres a second, in
summer as much as in winter. Banias 1,989. Zuqim on the Dead Sea shore 1,895. Wazani 1,436. Taninim
739. Na'aman 654. These are why the Jordan, the Taninim and the Na'aman run through a rainless
August.</p>
<p>A spring with real summer discharge now counts as evidence, the same way a perennial gauge does,
and it carries downstream: below a live source, water is expected. Click any spring for its mean, its
July&ndash;September mean, its latest reading and how often measurement found any water at all.</p>

<h4>When a river stops before the sea</h4>
<p>Three different things wear that face, and the map now measures all three rather than guessing.
The source stops &mdash; the Water Authority ships each river as separate features that mostly do not
join, only 611 of 15,106 endpoints touch, so a river can simply have no feature for its last
kilometre. Or the river was split &mdash; pieces more than 3 km apart are treated as different
watercourses, because a shared name is not proof of continuity. Or the lower half has no model data
and is drawn as a faint dotted line that reads as nothing at all.</p>
<p>Open any river's <b>trace</b> from its detail panel: how many pieces it arrived in, the largest gap
between them, how far its downstream end sits from the coastline, and then every segment in the order
the water runs with its cell, elevation, discharge, rain, regime and verdict. Breaks in the source
data are marked. The coastline is Natural Earth's, taken as the part of Israel's outline that is not a
land boundary.</p>

<h4>What the gauges say each stream actually does</h4>
<p>Israel has a handful of streams that run all year, many that carry water only in the wet season,
and some that flow once in several years. Until now this map could not tell them apart, so a model
number with no rain behind it could only be called unverified. That distinction does not have to be
guessed: the Hydrological Service publishes daily mean discharge for every gauging station, zeros
included, through <a href="https://data.gov.il/dataset/level_discharge" target="_blank" rel="noopener">data.gov.il</a>.</p>
<p>Twenty-four hydrological years of it &mdash; 2000/01 to 2023/24, about 8,800 days per station &mdash;
classify each gauged stream by what was measured there rather than by reputation:</p>
<ul>
<li><b>Perennial</b> &mdash; water on 80% or more of July&ndash;September days. Nineteen stations:
the Jordan, Dan, Senir, Hermon, Meshushim, Yehudiya, Orevim, Qishon, Zippori, Alexander, Yarqon,
Soreq at Hartuv, Harod, Yarmouk.</li>
<li><b>Near-perennial</b> &mdash; water on 30% or more of all days, but the summer breaks. Twenty-seven.</li>
<li><b>Seasonal</b> &mdash; flows in most years, the wet season only. Seventy-six.</li>
<li><b>Rare</b> &mdash; flows in fewer than 60% of years. Seventeen, and they are where you would expect:
Timna, Amram, Shelomo above Eilat, Uba, Zihor, the Arava at Hazeva, the Besor at Re'im.</li>
</ul>
<p>The class attaches to a gauge, not to a name, because a stream is not one thing along its length.
The Jordan is perennial at Sede Nehemya; the Besor at Re'im has flowed in fewer than three years in
five. A reach takes the regime of the nearest gauge on its own stream and names it in the panel, with
the distance. Where there is no gauge on that stream, the regime stays unknown.</p>
<p>This is now the strongest evidence the map has, and it outranks the model. A perennial stream with
no recent rain is drawn as flowing, because a perennial stream runs without rain. A seasonal or rare
channel with no recent rain is drawn as dry even when the model insists otherwise &mdash; measurement
beats a global model on its own ground.</p>

<h4>The comparison, run every time</h4>
<p>Every load counts where the model contradicts the measured record, and lists the cases rather than
summarising them away. Two kinds: the model claiming water on a channel the gauges say is dry this
time of year, and the model claiming dry on a stream that has run through twenty-four summers.</p>
<div id="cmpbox"></div>

<h4>How do we know any of this is right?</h4>
<p>The map should not ask to be trusted. The Hydrological Service publishes, for every active
gauge, the mean annual volume actually measured there &mdash; decades of record, in millions of
cubic metres. A volume per year is a discharge: divide by the 31,556,952 seconds in one. GloFAS
can be asked the same question at the same coordinates, out of its own reanalysis. The two
numbers can then simply be put side by side.</p>
<p>The figures below ship with the map, computed exactly this way on the date they carry, and the
button recomputes all of it live in your browser if you would rather watch it happen than take it
on trust. The result is whatever it is &mdash; including, if that is the answer, that the model is
poor. Every gauge you click also shows its own pair, with the ratio beside it: green inside a
factor of two, amber inside three, red beyond.</p>
<p>Open-Meteo's free tier prices a request by places multiplied by days, and four years at all 126
gauges is far past an hour's allowance. Rather than shorten the window until one wet winter decides
the answer, the check takes a stratified sample: every gauge sorted by its measured mean, then
evenly spaced picks, so the smallest desert wadi and the Dan are both in it.</p>
<div id="verbox"></div>
<p>Two limits worth stating. The periods do not match &mdash; a gauge record may start in 1966,
the reanalysis covers the last decade &mdash; and a 5 km model cell is not a gauge cross-section.
So this establishes order of magnitude and rank, which is what the map claims when it colours a
stream, and not gauge accuracy, which it never claims.</p>
<p>Two other things guard against a stream being drawn as flowing when it is not. Anything under
ten litres a second is drawn as a dry bed, not a blue line, because arid GloFAS cells idle at a
token non-zero baseflow that would otherwise paint half the Negev as running. And a river whose
cells are mostly empty is shown as having no data rather than being smoothed into confidence.</p>

<h4>Dry channels</h4>
<p>Most Israeli watercourses are wadis that carry water only after rain. When the model puts a reach at zero it
is drawn as a still, dust-coloured line rather than a flowing blue one — in late summer that is most of the
country, and it is the honest picture.</p>

<h4>The live feed that is not open yet</h4>
<p>The Hydrological Service runs <a href="https://hydro.water.gov.il/" target="_blank" rel="noopener">hydro.water.gov.il</a>,
which shows readings from its transmitting hydrometric stations, and it does publish an API for them. Access is
granted individually: you sign an undertaking and email it to Forecasterihs@water.gov.il. With that key this map
could show measured Israeli discharge instead of a global model, which would be a different and much better map.
Until then, everything moving on screen is modelled.</p>

<h4>Licence, source and credit</h4>
<p>River Flow Israel &mdash; Copyright &copy; 2026 <b>Sharon Berkovich</b>
(<a href="https://www.linkedin.com/in/sharon-berkovich/" target="_blank" rel="noopener">LinkedIn</a> &middot;
<a href="https://github.com/sharon2ber" target="_blank" rel="noopener">GitHub</a>).
Free software under the <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener">GNU
Affero General Public License, version 3</a> or later. You may use it, study it, change it and
share it, including commercially. If you distribute it, or run a changed version as a website, you
must keep the copyright notice and publish your changes under the same licence.</p>
<p><b>Source code:</b>
<a href="https://github.com/sharon2ber/israel-river-flow" target="_blank" rel="noopener">github.com/sharon2ber/israel-river-flow</a></p>
<p>The data belongs to the bodies that publish it, under their own terms: the Israel Water
Authority and the Hydrological Service, govmap.gov.il, data.gov.il, Copernicus EMS (GloFAS) via
Open-Meteo, RainViewer, OpenStreetMap contributors (ODbL), Natural Earth, Esri and
OpenTopoMap. Mapping library: Leaflet, BSD-2-Clause.</p>
<p>This map carries no warranty of any kind. It is not a flood warning system. Do not enter a
wadi on the strength of it.</p>
<p style="margin-top:16px"><button class="lnk" id="rebuild">Rebuild network cache</button></p>`;

  const he = `
<h2>על הנתונים</h2>
<p>המפה מציגה את נחלי ישראל, כשהצבע והתנועה מבטאים את כמות המים שמודל השיטפונות GloFAS מעריך
שזורמת בהם. זו גרסה מקבילה ל־<a href="https://norway-charts.netlify.app/river_flow_map_usa/" target="_blank" rel="noopener">River Flow USA</a>,
בנויה על המקורות שקיימים לאזור הזה.</p>

<div class="warn"><p><b>הזרימה שרואים כאן מודלית ולא מדודה.</b> בישראל אין הזנה ציבורית של ספיקות בזמן אמת
בדומה ל־USGS. השירות ההידרולוגי מפרסם נתוני תחנות ב־data.gov.il, אבל נתוני הספיקה העדכניים ביותר שם מסתיימים
בשנה ההידרולוגית 2023/24, וה־API אינו מאפשר גישה מהדפדפן. לכן השכבה החיה מגיעה ממודל גלובלי, ורשת התחנות
הישראלית מוצגת כהקשר היסטורי מדוד.</p></div>

<h4>ספיקה — השכבה החיה</h4>
<p><a href="https://open-meteo.com/en/docs/flood-api" target="_blank" rel="noopener">Open-Meteo Flood API</a>
המגיש את <a href="https://www.globalfloods.eu/" target="_blank" rel="noopener">GloFAS</a> (שירות ניהול החירום
של קופרניקוס). ספיקה יומית ממוצעת ברשת של 0.05 מעלות — כ־5 ק״מ — עם שבעה ימים אחורה ושבעה ימי תחזית. מכיוון
שהרשת גסה ביחס לאגני ההיקוות בישראל, נחלים שכנים באותו תא מקבלים אותו ערך, וּוואדיות קטנים מיוצגים בגסות. יש
לקרוא את המספרים כאינדיקציה למשטר הזרימה, לא כקריאת מד.</p>

<h4>ספיקה מול הרגיל</h4>
<p>מחושב לפי דרישה מתוך אנליזה־מחדש של 20 שנה מאותו מודל: האחוזון של הספיקה היום בתוך כל הערכים שנרשמו לאותו תא
רשת בטווח של ±10 ימים סביב תאריך זה. לחצו על נחל כדי לראות, או הדליקו את השכבה כדי לדרג את הזרימות הגדולות ברשת.</p>

<h4>תחנות הידרומטריות — מדוד</h4>
<p>126 תחנות פעילות של <a href="https://www.gov.il/he/departments/units/hydrological_service" target="_blank" rel="noopener">השירות
ההידרולוגי</a> (רשות המים), מתוך <a href="https://data.gov.il/dataset/hydro_station" target="_blank" rel="noopener">data.gov.il</a>.
לכל תחנה מוצגים שטח ההיקוות, תקופת המדידה, הנפח השנתי הממוצע וספיקת השיא הגבוהה ביותר שנמדדה בה, מתוך מאגר
<a href="https://data.gov.il/dataset/maxdischarge_yearlyvolume" target="_blank" rel="noopener">ספיקות שיא ונפחים
שנתיים</a>. הקואורדינטות הומרו מרשת ישראל החדשה (EPSG:2039) ל־WGS 84. הארכיון המלא כולל 457 תחנות ובהן סגורות;
במפה מוצגות רק הפעילות.</p>

<h4>רשת הנחלים</h4>
<p>הנחלים עצמם מגיעים משכבת הנחלים הארצית של רשות המים — 7,914 מקטעי קו עם שמות רשמיים בעברית ובאנגלית,
המוגשים בפתיחות מ־<a href="https://services1.arcgis.com/hWUp5lYOh3Fi9WoQ/arcgis/rest/services/israel_rivers/FeatureServer/1" target="_blank" rel="noopener">ArcGIS</a>
ונמשכים מחדש בביקור הראשון. זו אותה שכבה שעומדת מאחורי מפת הנחלים של השירות ההידרולוגי, והיא כוללת אלפי
ואדיות ש־OpenStreetMap אינו מכיר.</p>
<p>תורמי <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> (ODbL)
(ODbL) עושים שתי עבודות בלבד: השלמת אפיקים שהשכבה הרשמית מפספסת בתוך ישראל, ונשיאת הנחלים שחוצים את גבול ישראל.
כל נחל OSM שעובר במרחק של עד 400 מ׳ מנחל רשמי מושמט, כך ששום נחל אינו מצויר פעמיים. מאגרים, אגמים וסכרים מגיעים
כולם מ־OSM.</p>
<p>בשכבה הרשמית כל נחל מפוצל למקטעים נפרדים שאינם מתחברים קצה אל קצה — רק 611 מתוך 15,106 הקצוות נוגעים —
ולכן המפה מקבצת אותם לפי שם הנחל. ריחוף מעל מקטע אחד מדליק את הנחל כולו, והחלונית מציגה את אורכו המצטבר.</p>

<h4>לאן זורמים המים</h4>
<p>ב־OSM נחלים משורטטים במורד הזרם על פי מוסכמה. השכבה הרשמית משורטטת במורד הזרם בכ־90% מהמקרים, וזה לא מספיק,
ולכן לכל קטע מעל 2 ק״מ נשלפים גבהי שני הקצוות דרך
<a href="https://open-meteo.com/en/docs/elevation-api" target="_blank" rel="noopener">Open-Meteo elevation API</a>
והוא מתהפך אם התברר שהוא עולה במעלה. מכאן מגיעים גם המפל והשיפוע בחלונית. התבליט אינו משתנה, ולכן זה מחושב פעם
אחת ונשמר.</p>

<h4>נקודות דיגום זיהום</h4>
<p>33 נקודות הדיגום בנחלים מתוך
<a href="https://www.arcgis.com/apps/dashboards/da4d9cbb77e14183bd7a80b13e34a5f5" target="_blank" rel="noopener">לוח
המחוונים לניטור זיהום בנחלים</a>, כל אחת עם שם הנחל ושם התחנה. שימו לב: זו רשת דיגום הזיהום, אין זו הזנה של
תוצאות מיקרוביולוגיות, ולא מתפרסמות דרכה מדידות.</p>

<h4>מפות רקע</h4>
<p>כל האריחים מגיעים משירותי Esri הפתוחים, למעט קווי הגובה שהם של OpenTopoMap. CARTO הוסר: מפת הרקע שלו ללא מפתח
מגישה כעת אריחים עם הכיתוב API KEY REQUIRED. יש מפה כהה אחת, ושמות המקומות הם מתג ולא אפשרות נפרדת. שווה לעבור להצללת
התבליט: כשרואים את בקע הירדן ואת הנגב כתבליט, כיוון הזרימה של כל ואדי מפסיק להיות טענה של המפה והופך למשהו
שקוראים מהשטח. מתן קרדיט הוא תנאי רישיון של כל הארבעה, ולכן הוא נשאר על המפה — מקופל לתג הקטן בפינה.</p>

<h4>למה סולם הצבעים שונה</h4>
<p>נחלי ישראל קטנים בסדר גודל עד שלושה מאשר האמריקאיים. הירדן בדגניה זורם בממוצע סביב עשרה מ״ק לשנייה; הירקון
בכמה בודדים. שימוש בסולם האמריקאי היה צובע את כל הארץ בצבע אחד, ולכן הסיווג כאן מותאם להידרולוגיה המקומית:
0.05, 0.5, 2, 10 ו־50 מ״ק/שנייה. שיטפונות בנגב חורגים לרגע מכל הסולם — נחל פארן הגיע פעם ל־1,155 מ״ק/שנייה.</p>

<h4>שלב המהימנות</h4>
<p>GloFAS פועל ברשת של כחמישה קילומטרים. נחל בודד חוצה כמה תאים, ותא שאין בו אפיק מודלי מחזיר אפס — ולכן המספרים
הגולמיים גורמים לנחל להיראות כזורם, נעצר, וזורם שוב לאורכו. זו הרשת, לא ההידרולוגיה, וזה לא צריך להגיע אליכם ללא בדיקה.</p>
<p>לכן לפני שמצויר משהו: כל נחל נקרא מפוצל לאשכולות רציפים במרחב (שם אינו הוכחה ששני ואדיות הם אותו נחל), מסודר
ממעלה למורד לפי גובה התאים שלו, והספיקה מועברת במורד הזרם כמקסימום מתגלגל. מים מצטברים במורד; הם לא נעלמים וחוזרים.
מעלה נחל יבש באמת מעל קטע שניזון ממעיינות שורד זאת ללא שינוי, כי ההשלמה מגיעה תמיד רק מלמעלה.</p>
<p>נחל שרוב תאיו ריקים אינו מוחלק לקו כחול בטוח — הוא מוצג כחסר נתוני מודל לגמרי. חלונית הפרטים אומרת לכם, לכל
קטע, אם המספר הוא קריאה של התא עצמו או הושלם מפרופיל הנחל.</p>

<h4>מה המפה הזו אינה יודעת</h4>
<p>מפה שמציגה רק את מה שיש לה היא מפה שממציאה בשקט. לכן המפה הזו מחזיקה רשימה של מה שאינה יכולה
לומר לכם, ומציגה את המצבים האלה על המסך במקום להסתיר אותם מאחורי צבע סביר.</p>
<ul>
<li><b>אם נחל כלשהו בישראל זורם ברגע זה.</b> אין הזנה ציבורית של מדידות בזמן אמת. כל קו שנע הוא
דעה של מודל.</li>
<li><b>אם יש מים במאגר.</b> OpenStreetMap משרטט את מתאר המאגר; הוא אינו אומר מה יש בו היום. מאגרים
חקלאיים, בריכות חורף, בריכות אידוי ובריכות דגים בישראל עומדים ריקים חודשים. רק אגם טבעי, קבוע ולא
עונתי נצבע כאן בכחול — כל השאר מצויר כמתאר, ולחיצה עליו מציגה בדיוק את התגיות שעליהן הסיווג נשען.</li>
<li><b>אם אפיק הוא איתן.</b> בשכבת רשות המים אין תכונה כזו, ותגית <code>intermittent</code> ב־OSM
מיושמת באופן לא אחיד. במקום שבו היא חסרה, המפה אינה מנחשת.</li>
<li><b>את הספיקה המדויקת בשום מקום.</b> ההשוואה לתחנות שלמטה מודדת עד כמה המודל שגוי. הוא חורג מפי
שלושה בכשני שלישים מהמקרים.</li>
</ul>

<h4>אגני היקוות, לא תאי רשת</h4>
<p>בדיקת הגשם נהגה לשאול ״האם ירד גשם על תא המודל של הנחל הזה״. זו אינה השאלה ההידרולוגית. המים מגיעים
לאפיק מאגן ההיקוות שלו, שעשוי להיות גדול פי מאה מתא בודד ובעל צורה שונה לחלוטין. השאלה לפי תא היא
שגרמה מלכתחילה לריצוד ראיות הגשם לאורך נחל.</p>
<p>ה־GIS הלאומי מפרסם את התשובה האמיתית: 191 אגני ניקוז, שכל אחד נושא את <code>DRAIN_TO</code> — האגן
שאליו הוא נשפך. זהו גרף, והוא מאפשר למפה לשאול את מה שהיה עליה לשאול מלכתחילה: כמה גשם ירד בכל מקום
באגן ההיקוות של הנחל הזה, כולל כל אגן שנשפך אליו. הערך הנלקח הוא התא הרטוב ביותר באותו אגן, ולא הממוצע,
כי השאלה היא אם בכלל ייתכנו מים.</p>
<p>כל קטע מציין את אגן ההיקוות שלו ואת שטחו בחלונית הפרטים. קטעים מחוץ לכל אגן ממופה חוזרים לצבירה
הישנה לאורך השרשרת.</p>

<h4>מכ״ם — גשם שנראה ולא גשם שחושב</h4>
<p>כל נתוני הגשם כאן היו מודליים. זה נכון עבור ״האם אגן ההיקוות היה רטוב לאחרונה״ ושגוי עבור מה שוואדי
ישראלי באמת עושה: זורם בזמן הסערה ונעצר בתוך היום. סכום של ארבעה־עשר יום אינו יכול לראות זאת, וכשהוא
כן יכול, המים כבר הלכו.</p>
<p><a href="https://www.rainviewer.com/" target="_blank" rel="noopener">RainViewer</a> מרכיב תצלי מכ״ם
מזג אוויר בעולם ומפרסם את אינדקס הפריימים בפתיחות — שלושה־עשר פריימים המכסים את השעתיים האחרונות. זו
תצפית, ולכן היא נכנסת לסולם מעל גשם מודלי: קטע עם הד מעל אגן ההיקוות שלו ברגע זה זורם, והחלונית אומרת
שהמפה ראתה זאת ולא הסיקה זאת. ראיית מכ״ם תקפה להיום בלבד, וזו שכבה שאפשר פשוט להדליק ולהסתכל.</p>

<h4>בדיקת הגשם</h4>
<p>המודל הוא דעה אחת, ולא דעה מדודה. אבל תצפית שנייה ובלתי־תלויה זמינה בחינם: האם ירד גשם על אגן
ההיקוות. ההידרולוגיה הישראלית הופכת את זה לכמעט מכריע, כי מחוץ לגשמי החורף כמעט כל אפיק כאן הוא ואדי
אכזב — הוא זורם אחרי גשם ולא בשום זמן אחר.</p>
<p>לכן כל תא מודל נושא גם שלושה שבועות של גשם יומי מ־<a href="https://open-meteo.com/en/docs" target="_blank" rel="noopener">Open-Meteo</a>,
וכל קטע נחל נוחת באחד מחמישה מצבים במקום להיצבע ישירות מהמודל:</p>
<ul>
<li><b>זורם</b> — המודל מדווח על מים וירד גשם על התא. מצויר בכחול ובתנועה.</li>
<li><b>יבש</b> — המודל אינו מדווח על דבר, ושום דבר אינו סותר אותו.</li>
<li><b>יבש, בניגוד למודל</b> — המודל מדווח על מים, לא ירד גשם, והאפיק ממופה כאכזב. בישראל זה אומר
יבש, ולכן המפה אומרת יבש.</li>
<li><b>לא מאומת</b> — המודל מדווח על מים, לא ירד גשם, ואיננו יודעים אם האפיק זורם כל השנה. מצויר כקו
סגול מקווקו ודומם: לא מים, וגם לא טענה שיבש.</li>
<li><b>אין נתונים</b> — מנוקד, כי המודל לא נתן דבר.</li>
</ul>
<p>הסף נדיב במכוון — חמישה מילימטרים בארבעה־עשר ימים, הרבה פחות ממה שוואדי צריך כדי לזרום — כך
שהמודל צריך להיכשל קשות לפני שגוברים עליו. גם הצבע לעולם אינו הסימן היחיד: לכל מצב יש קו משלו, כך
ששלושת המצבים הלא־זורמים נשארים נבדלים גם למי שאינו מפריד בין הגוונים.</p>
<p>לכן ייתכן שהמפה תציג הרבה פחות כחול ממה שציפיתם בספטמבר. זו בדיוק הכוונה. במדגם של מאה תאים ברחבי
ישראל שנלקח בזמן הבנייה, אף אחד לא קיבל חמישה מילימטרים של גשם בשבועיים, ו־GloFAS עדיין דיווח על
זרימה בשליש מהם.</p>

<h4>כשנחל מצויר בחתיכות</h4>
<p>דווח שנחל פארן מצויר בחתיכות מנותקות. הוא אכן היה, ושום כלל קיבוץ לא היה יכול לתקן זאת, כי
הגיאומטריה פשוט אינה שם. השכבה הלאומית של רשות המים מחזיקה את נחל פארן כ־<b>שש ישויות שסך הכול 24.5
ק״מ</b>, לוואדי שאורכו כ־150, עם חור של 30 ק״מ באמצע וחור של 11 ק״מ אחריו.</p>
<p>וזו אינה תופעה ייחודית לפארן. סריקה של כל 7,914 הישויות באותה שכבה: מתוך 398 נחלים בעלי שם,
<b>ל־81 — אחד מכל חמישה — יש שבר של יותר מ־3 ק״מ</b>. נחל באר, חור, קמה ויהל הם שני שברים כל אחד.
לירדן שישה שברים מעל 3 ק״מ; לנחל צין חמישה.</p>
<p>לרשת הנחלים הלאומית של ישראל יש את אותם נחלים בשלמותם. פארן שם הוא 409 מקטעים ו־144 ק״מ, לאורך כל
הוואדי. לכן במקום שבו לשכבה הרשמית יש חור בתוך אגן ניקוז אחד, המפה הולכת ומביאה את האפיק החסר: הנחל
נמשך לפי שם, נלקח האפיק הראשי שלו, ממוזג לפי סדר לקו רציף אחד, ורק החלקים שנופלים בתוך החור מתווספים.
כל מה שכבר מצויר נשאר כמות שהוא, ומקטע שהושלם מציין מהיכן הגיע כשלוחצים עליו.</p>
<p><b>לקיחת האפיק הראשי נכשלה פעמיים, ונחל פארן חשף את זה בשתיהן.</b> בניסיון הראשון נשמרה רק
דרגת שטראלר הגבוהה ביותר. אבל הדרגה <i>עולה</i> במורד הזרם, כך שהגבוהה ביותר היא הקטע הנמוך של הנחל
ולא כלום מעליו: אצל פארן אלה 61 הק״מ התחתונים של ואדי באורך 143, וקטע פארן רשמי ב־34.71&deg;E נמצא
לגמרי מחוץ להם. פארן מוחזק בדרגות 3 עד 7 — 49 ק״מ, 10, 9, 15, 61 — וכולן אותו אפיק. היום לא נזרקת
אף דרגה.</p>
<p>בניסיון השני נשמרו כל הדרגות והסתמכנו על <code>ACC_LEN</code> לסדר אותן. הוא אכן עושה זאת כמעט
תמיד. אבל פארן מחזיק גם שלושה גדמים זעירים בדרגה 0 ושבר אחד בדרגה 2, שה־<code>ACC_LEN</code> שלהם
ממקם אותם באמצע ההליכה — הקו קפץ אל גדם וחזר, ונקרע לשניים, עם חורים של 88.6 ק״מ ו־37.7 ק״מ. זריקת
דרגות קצרות תיקנה את פארן ורק אותו; אותו רעש באורך אחר עבר ישר.</p>
<p>לכן הסדר <i>מתוקן</i> ולא מסונן. הקטעים נסרקים לפי <code>ACC_LEN</code>, כל אחד מתהפך אם שורטט נגד
כיוון הזרימה; ההליכה נשברת בכל מקום שבו היא קופצת יותר מ־3 ק״מ; החתיכה הארוכה ביותר הופכת לגזע; וכל
חתיכה אחרת מוצעת אליו בשלמותה, במקום הזול ביותר שהיא מתאימה לו. זול פירושו שהיא שוכבת <i>לאורך</i>
האפיק שם — רחב ככל שיהיה החור שהיא ממלאת — וזה מה שמאפשר לוואדי ממופה בדלילות לשמור על החורים
האמיתיים שלו, בעוד גדם שיושב הצידה נשאר בחוץ. חתיכות שלמות ולא קטעים בודדים, כי שלושת הגדמים של פארן
יושבים זה לצד זה בסדר: השכן של כל אחד הוא הגדם הבא, ולכן אף אחד מהם אינו נראה חריג בפני עצמו. פארן
יוצא מזה כ־<b>405 קטעים, 143.5 ק״מ, 29.577&deg;N עד 30.397&deg;N, בלי שום חור מעל קילומטר</b>.</p>
<p>שבר <i>בין</i> שני אגנים נשאר בדיוק כפי שהוא. שני ואדיות בעלי אותו שם באגנים שונים הם שני ואדיות,
וריתוכם היה הבאג שבגללו נדרש קיבוץ 3 הק״מ הישן. הקיבוץ משתמש כעת בשם ובאגן הניקוז יחד, ולכן חור של
30 ק״מ בתוך אגן אחד אינו חותך עוד נחל לחתיכות שנשפטות ונצבעות בנפרד.</p>
<p>שני דברים נוספים נהגו לגרום לנחל שלם להיעלם באמצע. אשכול שרוב תאיו היו ריקים קיבל אפס נתונים לכל
קטע, כולל אלה שהייתה להם קריאה משלהם — כעת נמנעת רק ההשלמה שביניהם. והביקורת שלמטה סופרת מה עדיין
שבור, בכל טעינה, כך שנסיגה מופיעה כמספר ולא כתלונה.</p>
<div id="auditbox"></div>

<h4>מהיכן מגיע הסדר לאורך הנחל</h4>
<p>שני דברים שהמפה נהגה להסיק, ומקור אחד שפשוט אומר אותם.</p>
<p><b>סדר.</b> מהמעלה למוצא נגזר ממיון כל קטע לפי גובה תא המודל שלו, 5 ק״מ. תבליט אינו האפיק, ותא גס
אינו תבליט. שכבת הנחלים הלאומית, המתפרסמת בפתיחות דרך <a href="https://open.govmap.gov.il/" target="_blank" rel="noopener">govmap.gov.il</a>,
נושאת את <code>ACC_LEN</code>: המרחק שהמים כבר עברו לאורך הרשת כשהם מגיעים לקטע. מדוד, ועולה בעקביות
לכיוון המוצא — נבדק על הקישון, שהערך הנמוך ביותר שלו נמצא בעמק יזרעאל העליון והגבוה ביותר במפרץ חיפה.</p>
<p><b>קיבוץ.</b> אילו קטעים הם נחל אחד נקבע לפי התאמת שמות וקיבוץ כל מה שבטווח 3 ק״מ. לכן הירקון הגיע
כארבעים וחמישה חלקים מנותקים עם ״פער מרבי״ של 356 ק״מ. כעת נחל מזוהה לפי השדרה שלו: שואלים את הרשת
הלאומית על שם אחד, שומרים את הרצף המחובר הגדול ביותר, וקטע או מוטל על הקו הזה או לא.</p>
<p>אזהרה אחת, שנלמדה בדרך הקשה וראוי לומר אותה כי היא נראית כמו התשובה המתבקשת: <code>HYDRO_NET</code>
אינו מזהה של נחל. כמעט כל אפיק בארץ נושא net 51 — הוא מזהה מערכת הידרולוגית, לא נחל — וקיבוץ לפיו היה
ממזג את ישראל כולה לשרשרת אחת.</p>
<p>השכבה מונה מיליון וחצי קטעים, גדולה מכדי לשאת או למשוך במלואה, ולכן שדרות נמשכות לפי נחל: הגדולים
בשקט אחרי שהמפה עולה, וכל נחל ברגע שפותחים את המעקב שלו. נחל בלי שדרה שומר על סדר הגבהים הישן, והמעקב
שלו אומר זאת.</p>

<h4>למה נחל זורם במקומות מסוימים ולא באחרים</h4>
<p>כי לעיתים קרובות זה נכון, והמפה פשוט אמרה את זה רע. הקישון הוא הדוגמה: המקטע העליון שלו בעמק
יזרעאל באמת יבש בספטמבר, בעוד המקטע התחתון באמת זורם, מוזן ממעיינות ומקולחין. נחל אחד, שני מצבים,
ושניהם נכונים.</p>
<p>מה שהיה שגוי הוא הריצוד. שלושת הקלטים של ההחלטה הישנה משתנים לאורך נחל מסיבות שאינן קשורות לנחל:
הגשם נמדד ברשת של 5 ק״מ ונחל ארוך חוצה שמונה או עשרה תאים, ולכן אחד עובר את הסף והבא אחריו לא;
המשטר הגיע מהתחנה שבמקרה הייתה הקרובה ביותר; ותגית intermittent ב־OSM מיושמת מקטע־מקטע בידי תורמים
שונים. וכך המפה החליפה כחול וסגול לאורך אותו אפיק עצמו.</p>
<p>מים אינם עובדים כך. הם נכנסים לאפיק בנקודה וזורמים במורד. מעבר הראיות עובר עכשיו על כל נחל מחובר
מהמעלה למוצא ונושא איתו את מה שהוא יודע עם הזרם: גשם מצטבר במורד ולעולם לא במעלה; תחנה איתנה או
מעיין חי הופכים את כל מה שמתחתיהם לאיתן; וברגע שנחל זורם הוא אינו יכול להיות יבש מתחת לכך. לכן נחל
משנה מצב <b>לכל היותר פעם אחת</b> לאורכו, והנקודה שבה הוא משתנה מצוירת כטבעת קטנה שאפשר ללחוץ עליה.</p>

<h4>מעיינות — למה נחל זורם באוגוסט בלי גשם</h4>
<p>המפה שאלה את השאלה הלא נכונה על הקיץ. היא ידעה שהשמיים יבשים וידעה מה התחנות מדדו, אבל לא היה לה
הסבר לדבר שבאמת מחזיק נחל ישראלי זורם בספטמבר: מקור שמזרים אליו מים.</p>
<p>השירות ההידרולוגי רושם 679 מעיינות ומפרסם 112,597 מדידות ספיקה עבורם, בליטר לשנייה, ב־<a href="https://data.gov.il/dataset/spring_discharge" target="_blank" rel="noopener">data.gov.il</a>.
383 מהם, אלה עם זרימה נמדדת אמיתית וחוזרת, נמצאים על המפה, בגודל לפי הספיקה. הגדולים אינם שוליים:
מעיינות הדן נותנים בממוצע <b>7,437 ליטר בשנייה</b> — שבעה וחצי מ״ק בשנייה, בקיץ כמו בחורף. בניאס
1,989. צוקים על חוף ים המלח 1,895. הווזני 1,436. התנינים 739. הנעמן 654. אלה הסיבה שהירדן, התנינים
והנעמן זורמים לאורך אוגוסט חסר גשם.</p>
<p>מעיין עם ספיקת קיץ אמיתית נחשב כעת לראיה, בדיוק כמו תחנה איתנה, והוא נישא במורד: מתחת למקור חי,
מים הם הציפייה. לחצו על כל מעיין לראות את הממוצע שלו, ממוצע יולי–ספטמבר, המדידה האחרונה, וכמה
מהמדידות בכלל מצאו מים.</p>

<h4>כשנחל נעצר לפני הים</h4>
<p>שלושה דברים שונים לובשים את הפרצוף הזה, והמפה מודדת עכשיו את שלושתם במקום לנחש. המקור נגמר —
רשות המים מספקת כל נחל כישויות נפרדות שברובן אינן מתחברות, רק 611 מתוך 15,106 קצוות נוגעים, ולכן
לנחל פשוט יכולה לא להיות ישות לקילומטר האחרון שלו. או שהנחל פוצל — חלקים המרוחקים יותר מ־3 ק״מ
נחשבים לאפיקים שונים, כי שם משותף אינו הוכחה לרציפות. או שלחצי התחתון אין נתוני מודל והוא מצויר
כקו מנוקד חיוור שנקרא ככלום.</p>
<p>פתחו את <b>המעקב</b> של כל נחל מחלונית הפרטים שלו: בכמה חלקים הוא הגיע, מה הפער הגדול ביותר
ביניהם, כמה רחוק הקצה התחתון שלו מקו החוף, ואז כל מקטע לפי סדר זרימת המים עם התא, הגובה, הספיקה,
הגשם, המשטר והמסקנה. שברים בנתוני המקור מסומנים. קו החוף הוא של Natural Earth, הנלקח כחלק מקו
המתאר של ישראל שאינו גבול יבשתי.</p>

<h4>מה התחנות אומרות שכל נחל באמת עושה</h4>
<p>בישראל יש קומץ נחלים שזורמים כל השנה, רבים שנושאים מים רק בעונת הגשמים, וכאלה שזורמים אחת לכמה
שנים. עד עכשיו המפה לא ידעה להבחין ביניהם, ולכן מספר של מודל בלי גשם מאחוריו יכול היה להיקרא רק
״לא מאומת״. את ההבחנה הזו לא צריך לנחש: השירות ההידרולוגי מפרסם ספיקה יומית ממוצעת לכל תחנת מדידה,
כולל אפסים, ב־<a href="https://data.gov.il/dataset/level_discharge" target="_blank" rel="noopener">data.gov.il</a>.</p>
<p>עשרים וארבע שנים הידרולוגיות ממנה — 2000/01 עד 2023/24, כ־8,800 ימים לתחנה — מסווגות כל נחל מדוד
לפי מה שנמדד בו ולא לפי המוניטין שלו:</p>
<ul>
<li><b>איתן</b> — מים ב־80% ומעלה מימי יולי–ספטמבר. תשע־עשרה תחנות: הירדן, הדן, השניר, החרמון,
המשושים, היהודיה, העורבים, הקישון, ציפורי, אלכסנדר, הירקון, שורק בחרטוב, חרוד, הירמוך.</li>
<li><b>כמעט איתן</b> — מים ב־30% ומעלה מכלל הימים, אבל הקיץ נקטע. עשרים ושבע.</li>
<li><b>עונתי</b> — זורם ברוב השנים, בעונת הגשמים בלבד. שבעים ושש.</li>
<li><b>נדיר</b> — זורם בפחות מ־60% מהשנים. שבע־עשרה, והן בדיוק היכן שהייתם מצפים: תמנע, עמרם, שלמה
מעל אילת, עובה, זיהור, הערבה בחצבה, הבשור ברעים.</li>
</ul>
<p>הסיווג נצמד לתחנה ולא לשם, כי נחל אינו דבר אחד לאורכו. הירדן איתן בשדה נחמיה; הבשור ברעים זרם
בפחות משלוש שנים מתוך חמש. כל קטע מקבל את המשטר של התחנה הקרובה ביותר על הנחל שלו עצמו, והחלונית
מציינת אותה ואת המרחק. במקום שאין תחנה על אותו נחל, המשטר נשאר לא ידוע.</p>
<p>זו כעת הראיה החזקה ביותר שיש למפה, והיא גוברת על המודל. נחל איתן בלי גשם אחרון מצויר כזורם, כי נחל
איתן זורם גם בלי גשם. אפיק עונתי או נדיר בלי גשם אחרון מצויר כיבש גם כשהמודל מתעקש אחרת — מדידה
מנצחת מודל גלובלי בשטח שלו.</p>

<h4>ההשוואה, בכל פעם מחדש</h4>
<p>כל טעינה סופרת היכן המודל סותר את הרישום המדוד, ומציגה את המקרים במקום לסכם אותם. שני סוגים: המודל
טוען שיש מים באפיק שהתחנות אומרות שיבש בעונה הזו, והמודל טוען יבש בנחל שזרם עשרים וארבעה קיצים.</p>
<div id="cmpbox"></div>

<h4>איך אפשר לדעת שזה נכון?</h4>
<p>המפה לא צריכה לבקש אמון. השירות ההידרולוגי מפרסם לכל תחנה פעילה את הנפח השנתי הממוצע שנמדד בה
בפועל — עשרות שנות רישום, במיליוני מ״ק. נפח לשנה הוא ספיקה: מחלקים ב־31,556,952 השניות שבשנה.
אפשר לשאול את GloFAS בדיוק את אותה שאלה באותן קואורדינטות, מתוך האנליזה־מחדש שלו. ואז פשוט
מניחים את שני המספרים זה לצד זה.</p>
<p>המספרים שלמטה מגיעים עם המפה, מחושבים בדיוק כך בתאריך שרשום עליהם, והכפתור מחשב הכול מחדש
בדפדפן שלכם — אם אתם מעדיפים לראות את זה קורה ולא לקחת על אמון. התוצאה היא מה שהיא, כולל, אם זו
התשובה, שהמודל חלש. בכל תחנה שתלחצו יופיע גם הזוג שלה עם היחס לצידו: ירוק בתוך פי שניים, כתום
בתוך פי שלושה, אדום מעבר לכך.</p>
<p>השכבה החינמית של Open-Meteo מתמחרת בקשה לפי מספר נקודות כפול מספר ימים, וארבע שנים על כל 126
התחנות חורגות בהרבה ממכסת השעה. במקום לקצר את החלון עד שחורף גשום יחיד יקבע את התשובה, הבדיקה
לוקחת מדגם מרובד: כל התחנות ממוינות לפי הממוצע שנמדד בהן, ואז בחירה במרווחים שווים — כך שגם הוואדי
המדברי הקטן וגם הדן נמצאים בפנים.</p>
<div id="verbox"></div>
<p>שתי מגבלות שראוי לומר. התקופות אינן חופפות — רישום של תחנה עשוי להתחיל ב־1966, והאנליזה־מחדש
מכסה ארבע שנים — ותא מודל של 5 ק״מ אינו חתך מדידה. לכן הבדיקה מבססת סדר גודל ודירוג, וזו
בדיוק הטענה של המפה כשהיא צובעת נחל, ולא דיוק ברמת מד, שאותו היא אינה טוענת.</p>
<p>שני דברים נוספים מגינים מפני נחל שמצויר כזורם בעוד שאינו. כל ערך מתחת לעשרה ליטר בשנייה מצויר
כאפיק יבש ולא כקו כחול, כי תאי GloFAS צחיחים משדרים זרימת בסיס סמלית שהייתה צובעת חצי מהנגב כזורם.
ונחל שרוב תאיו ריקים מוצג כחסר נתונים ולא מוחלק לכדי ביטחון מדומה.</p>

<h4>אפיקים יבשים</h4>
<p>רוב הנחלים בישראל הם ואדיות שנושאים מים רק אחרי גשם. כשהמודל נותן לקטע ערך אפס הוא מצויר כקו דומם בגוון
אבק ולא כקו כחול זורם — בסוף הקיץ זה מצבה של רוב הארץ, וזו התמונה הכנה.</p>

<h4>ההזנה החיה שעדיין אינה פתוחה</h4>
<p>השירות ההידרולוגי מפעיל את <a href="https://hydro.water.gov.il/" target="_blank" rel="noopener">hydro.water.gov.il</a>,
המציג קריאות מהתחנות ההידרומטריות המשדרות שלו, והוא אכן מפרסם עבורן API. הגישה ניתנת פרטנית: חותמים על כתב
התחייבות ושולחים אותו למייל Forecasterihs@water.gov.il. עם מפתח כזה המפה הזו הייתה יכולה להציג ספיקה ישראלית
מדודה במקום מודל גלובלי — מפה אחרת לגמרי, וטובה בהרבה. עד אז, כל מה שזז על המסך הוא מודל.</p>

<h4>גבולות ישראל, והמקומות שבהם מים חוצים אותם</h4>
<p>זו מפה של נחלי ישראל. הגבולות היחידים המשורטטים הם ארבעת גבולותיה של ישראל — עם לבנון, סוריה, ירדן ומצרים —
והחציות היחידות המסומנות הן שלהם. גבולות בין מדינות אחרות, והנחלים שלהן, אינם נושא המפה הזו ואינם נמשכים כלל.</p>
<p>קווי הגבול הם של <a href="https://www.naturalearthdata.com/" target="_blank" rel="noopener">Natural Earth</a>,
עם הסיווג שלהם עצמם ולא מכווצים למילה אחת: בין־לאומי מול ירדן ומצרים, לא מסומן מול לבנון, קו הפרדה מול סוריה,
ומשורטט מקווקו בכל מקום שהמקור אינו מגדיר כמוסדר. אין כאן שום אמירה על ריבונות.</p>
<p>כל מעוין ענבר הוא מקום שבו נחל ואחד מארבעת הקווים האלה נחתכים בפועל — מחושב משתי הגיאומטריות, לא מרשימה.
לחצו על אחד כדי לראות איזה נחל ואיזה גבול. היכן שגבול עוקב אחרי נחל לאורך מרחק במקום לחצות אותו, יופיעו כמה
סימונים לאורך אותו קטע; זו הגיאומטריה שאומרת את האמת ולא המפה שמנחשת.</p>

<h4>מים מעבר לגבול, וכמה מעט מהם כאן</h4>
<p>נחל בלבנון, בסוריה, בירדן או בסיני מצויר רק אם הוא חוצה אל ישראל או ממנה. כשהוא כן חוצה, הוא מצויר במלואו,
לכל אורכו, כי חצי נחל אינו תשובה. כל השאר שמעבר לגבול נמחק עוד לפני שצויר: נחל סורי שאינו מתקרב, ואדי שנשאר בסיני.</p>
<p>״בתוך ישראל״ אינה הכרעה שהמפה הזו עושה. זהו פשוט השטח ששכבת הנחלים של רשות המים עצמה מתארת, עם כמה קילומטרים
של מרווח בשוליים. מעבר לכך נחל מזכה את עצמו בגיאומטריה בלבד — הוא חוצה אחד מגבולות ישראל, או מתחבר קצה אל קצה
לנחל שחוצה.</p>
<h4>רישיון, קוד מקור וקרדיט</h4>
<p>River Flow Israel &mdash; זכויות יוצרים &copy; 2026 <b>שרון ברקוביץ׳</b>
(<a href="https://www.linkedin.com/in/sharon-berkovich/" target="_blank" rel="noopener">LinkedIn</a> &middot;
<a href="https://github.com/sharon2ber" target="_blank" rel="noopener">GitHub</a>).
תוכנה חופשית תחת <a href="https://www.gnu.org/licenses/agpl-3.0.html" target="_blank" rel="noopener">רישיון
GNU Affero General Public License גרסה 3</a> או מתקדמת ממנה. מותר להשתמש, ללמוד, לשנות ולהפיץ,
גם למטרות מסחריות. מי שמפיץ אותה, או מריץ גרסה משונה שלה כאתר אינטרנט, חייב לשמור על הודעת זכויות
היוצרים ולפרסם את השינויים שלו תחת אותו רישיון.</p>
<p><b>קוד המקור:</b>
<a href="https://github.com/sharon2ber/israel-river-flow" target="_blank" rel="noopener">github.com/sharon2ber/israel-river-flow</a></p>
<p>הנתונים שייכים לגופים שמפרסמים אותם, תחת התנאים שלהם: רשות המים והשירות ההידרולוגי,
govmap.gov.il, data.gov.il, ‏Copernicus EMS (GloFAS) דרך Open-Meteo, ‏RainViewer, תורמי
OpenStreetMap (ODbL), ‏Natural Earth, ‏Esri ו־OpenTopoMap. ספריית המפות: Leaflet, ברישיון
BSD-2-Clause.</p>
<p>המפה הזו ניתנת בלי כל אחריות. היא אינה מערכת התרעת שיטפונות. אל תיכנסו לוואדי על סמך מה
שכתוב בה.</p>
<p style="margin-top:16px"><button class="lnk" id="rebuild">בנייה מחדש של המטמון</button></p>`;

  $("#abouttext").innerHTML = LANG === "he" ? he : en;
  const rb = $("#rebuild");
  if (rb) rb.onclick = async () => { await cacheClear(); location.reload(); };
  renderValidation();
  renderCompare();
  renderAudit();
}

/* ---------- how broken the drawn network is, every load ----------
   The reader should not have to be the one who notices. */
function renderAudit(){
  const box = $("#auditbox");
  if (!box) return;
  if (typeof S === "undefined" || !S.reaches || !S.reaches.length){ box.innerHTML = ""; return; }
  const a = networkAudit(8);
  let h = '<table id="vertable"><tbody>' +
    "<tr><td>" + esc(T("au_rivers")) + "</td><td><bdi>" + fmtN(a.rivers) + "</bdi></td></tr>" +
    "<tr><td>" + esc(T("au_frag")) + "</td><td><bdi>" + fmtN(a.fragmented) + "</bdi></td></tr>" +
    "<tr><td>" + esc(T("au_broken")) + "</td><td><bdi>" + fmtN(a.broken) + "</bdi></td></tr>" +
    "<tr><td>" + esc(T("au_filled")) + "</td><td><bdi>" +
      fmtN(S.reaches.filter(r => r.src === 2).length) + "</bdi></td></tr>" +
    "</tbody></table>";
  if (a.worst.length){
    h += '<p style="margin:8px 0 4px;font-size:12.5px"><b>' + esc(T("au_worst")) + "</b></p>" +
      '<ul style="margin:0;padding-inline-start:18px;font-size:12px;color:var(--ink-3);line-height:1.6">' +
      a.worst.map(r => "<li>" + esc(r.name) + " \u2014 <bdi>" +
        T("au_row").replace("%p", r.pieces).replace("%b", r.breaks).replace("%g", r.gap.toFixed(1)) +
        "</bdi></li>").join("") + "</ul>";
  }
  h += '<p style="font-size:12px;color:var(--ink-3)">' + esc(T("au_note")) + "</p>";
  box.innerHTML = h;
}

/* ---------- the model against the measured regime, every load ---------- */
function renderCompare(){
  const box = $("#cmpbox");
  if (!box) return;
  const rep = (typeof S !== "undefined" && S.reaches && S.reaches.length) ? regimeReport() : null;
  if (!rep){ box.innerHTML = ""; return; }
  const pct = v => v == null || v < 0 ? "\u2014" : Math.round(v*100) + "%";
  let h = '<table id="vertable"><tbody>' +
    "<tr><td>" + esc(T("cmp_matched")) + "</td><td><bdi>" + fmtN(rep.matched) + "</bdi></td></tr>" +
    "<tr><td>" + esc(T("reg_P")) + "</td><td><bdi>" + fmtN(rep.byClass.P || 0) + "</bdi></td></tr>" +
    "<tr><td>" + esc(T("reg_N")) + "</td><td><bdi>" + fmtN(rep.byClass.N || 0) + "</bdi></td></tr>" +
    "<tr><td>" + esc(T("reg_S")) + "</td><td><bdi>" + fmtN(rep.byClass.S || 0) + "</bdi></td></tr>" +
    "<tr><td>" + esc(T("reg_R")) + "</td><td><bdi>" + fmtN(rep.byClass.R || 0) + "</bdi></td></tr>" +
    "</tbody></table>";
  const list = (rows, label, colour) => {
    if (!rows.length) return "";
    return '<p style="margin:10px 0 4px;font-size:12.5px;color:' + colour + '"><b>' +
      esc(label) + "</b> \u00b7 <bdi>" + rows.length + "</bdi></p>" +
      '<ul style="margin:0;padding-inline-start:18px;font-size:12px;color:var(--ink-3);line-height:1.6">' +
      rows.slice(0, 8).map(x =>
        "<li>" + esc(x.name || "\u2014") + " \u2014 <bdi>" +
        (x.q == null ? "\u2014" : fmtQ(x.q) + " m\u00b3/s") + "</bdi>" +
        (x.mm != null ? ", <bdi>" + x.mm.toFixed(1) + " mm</bdi>" : "") +
        ' <span style="opacity:.75">' + esc(x.site || "") + "</span></li>").join("") +
      (rows.length > 8 ? "<li>\u2026</li>" : "") + "</ul>";
  };
  h += list(rep.over, T("cmp_over"), pal().unver);
  h += list(rep.under, T("cmp_under"), pal().dry);
  if (!rep.over.length && !rep.under.length)
    h += "<p>" + esc(T("cmp_none")) + "</p>";
  h += '<p style="font-size:12px;color:var(--ink-3)">' + esc(T("cmp_note")) + "</p>";
  box.innerHTML = h;
}

/* ---------- the verification box inside About ---------- */
/* Say what the numbers mean, in the numbers' own terms, without softening. */
function verdict(v){
  const pc = x => Math.round(x*100) + "%";
  const rank = v.rho == null ? "" :
    v.rho >= 0.75 ? T("v_rank_good") : v.rho >= 0.5 ? T("v_rank_ok") : T("v_rank_poor");
  const mag = v.within3 >= 0.7 ? T("v_mag_good") : v.within3 >= 0.4 ? T("v_mag_ok") : T("v_mag_poor");
  const bias = v.medianRatio == null ? "" :
    v.medianRatio > 1.3 ? T("v_bias_high").replace("%x", v.medianRatio.toFixed(1)) :
    v.medianRatio < 0.77 ? T("v_bias_low").replace("%x", (1/v.medianRatio).toFixed(1)) :
    T("v_bias_ok");
  const dry = T("v_dry").replace("%p", pc(v.summerDry))
                       .replace("%s", v.seasonal == null ? "\u2014" : pc(v.seasonal));
  return esc(mag) + " " + esc(rank) + " " + esc(bias) + " " + esc(dry);
}

let valRunning = false;
function renderValidation(){
  const box = $("#verbox");
  if (!box) return;
  const v = VALID;
  const pc = x => x == null ? "\u2014" : Math.round(x*100) + "%";
  let h = "";
  if (v && v.n){
    const r = v.medianRatio;
    const dir = r == null ? "" : r > 1.15 ? T("ver_over") : r < 0.87 ? T("ver_under") : "";
    h += '<div class="num"><bdi>' + pc(v.within3) + "</bdi></div>" +
         '<div class="lede">' + esc(T("ver_w3")) + " \u00b7 " + v.n +
         (v.sampleOf ? " / " + v.sampleOf : "") + " " + esc(T("ver_n")) + "</div>";
    h += '<table id="vertable"><tbody>' +
      "<tr><td>" + esc(T("ver_w2")) + "</td><td><bdi>" + pc(v.within2) + "</bdi></td></tr>" +
      "<tr><td>" + esc(T("ver_bias")) + (dir ? " \u00b7 " + esc(dir) : "") +
        "</td><td><bdi>\u00d7" + (r == null ? "\u2014" : r.toFixed(2)) + "</bdi></td></tr>" +
      "<tr><td>" + esc(T("ver_rho")) + "</td><td><bdi>" +
        (v.rho == null ? "\u2014" : v.rho.toFixed(2)) + "</bdi></td></tr>" +
      "<tr><td>" + esc(T("ver_seas")) + "</td><td><bdi>" +
        (v.seasonal == null ? "\u2014" : pc(v.seasonal)) + "</bdi></td></tr>" +
      "<tr><td>" + esc(T("ver_dry")) + "</td><td><bdi>" + pc(v.summerDry) + "</bdi></td></tr>" +
      "</tbody></table>";
    h += '<p style="font-size:13px">' + verdict(v) + "</p>";
    if (v.worst && v.worst.length){
      const nm = x => LANG === "he" ? (x.he || x.name) : (x.name || x.he);
      const line = a => a.map(x => esc(nm(x)) + " <bdi>(" + fmtQ(x.meas) + " \u2192 " +
                                  fmtQ(x.model) + ")</bdi>").join(", ");
      h += '<p style="font-size:12px;color:var(--ink-3)"><b>' + esc(T("ver_best")) + ":</b> " +
           line(v.best) + "<br><b>" + esc(T("ver_worst")) + ":</b> " + line(v.worst) + "</p>";
    }
    h += '<p style="font-size:12px;color:var(--ink-3)">' + esc(T("ver_note")) + " " +
         esc(T("ver_slow")) + "</p>";
    h += '<p><button class="lnk" id="verrun">' + esc(T("ver_again")) + '</button>' +
         ' <small style="color:var(--ink-3)">' +
         esc(v.live ? T("ver_live") : T("ver_baked")) + " " + esc(v.when) +
         " \u00b7 " + v.years + " " + esc(T("ver_years")) + "</small></p>";
  } else {
    h += '<p><button class="lnk" id="verrun">' + esc(T("ver_run")) + "</button></p>" +
         '<p style="font-size:12px;color:var(--ink-3)">' + esc(T("ver_note")) + " " +
         esc(T("ver_slow")) + "</p>";
  }
  box.innerHTML = h;
  const btn = $("#verrun");
  if (btn) btn.onclick = runValidation;
}

async function runValidation(){
  if (valRunning) return;
  valRunning = true;
  const box = $("#verbox");
  const n = validationSample().length;
  box.innerHTML = "<p>" + esc(T("ver_running").replace("%n", n)) +
                  '</p><div id="verbar"><i></i></div>';
  try{
    const v = await validateAgainstGauges(f => {
      const b = $("#verbar i"); if (b) b.style.width = Math.round(f*100) + "%";
    });
    if (!v.n) throw new Error("no rows");
    v.live = true;
    VALID = v;
    await saveValidation(v);
  }catch(e){
    box.innerHTML = '<p class="warn">' + esc(T("ver_fail")) + "</p>" +
                    '<p><button class="lnk" id="verrun">' + esc(T("ver_run")) + "</button></p>";
    const btn = $("#verrun"); if (btn) btn.onclick = runValidation;
    valRunning = false;
    return;
  }
  valRunning = false;
  renderValidation();
}

/* ============================================================
   Boot
   ============================================================ */
const boot = $("#boot"), bar = $("#bar i"), bmsg = $("#bmsg");
const say = (p, m) => { bar.style.width = Math.round(p*100) + "%"; bmsg.textContent = m; };
const CACHE_TTL = 30 * 864e5;
const FIRST_PASS = 450;   /* stay inside Open-Meteo's per-minute allowance */
const he = () => LANG === "he";

function banner(html){
  let b = $("#banner");
  if (!html){ if (b) b.remove(); return; }
  if (!b){ b = el("div", "panel"); b.id = "banner"; document.body.appendChild(b); }
  b.innerHTML = html;
}

/* Fetch one Overpass band, tolerating failure. */
async function band(q){
  try{ return (await overpass(q)).elements || []; }
  catch(e){ return null; }
}

/* OpenStreetMap fills the gaps the national layer leaves: the Golan, the
   Jordan and Yarmouk headwaters, and unnamed wadis. Anything OSM draws on top
   of an official stream is dropped, so no river is painted twice. */
async function loadRivers(state){
  const failed = [];
  const base = S.osmBase || [];
  const idx = officialIndex(base);
  for (let i = 0; i < RIVER_BANDS.length; i++){
    if (state.done.has(i)) continue;
    say(0.40 + 0.16 * (i / RIVER_BANDS.length),
      (he() ? "משלימים ועוקבים אחרי נחלים חוצי גבול · חלק " : "filling gaps and following cross-border streams · part ")
      + (i+1) + "/" + RIVER_BANDS.length);
    const els = await band(qRivers(RIVER_BANDS[i]));
    if (!els){
      failed.push(i);
      /* two bands down and none up: Overpass is not answering, so stop
         grinding and carry on with whatever the official layer gave us */
      if (!state.done.size && failed.length >= 2){
        for (let j = i + 1; j < RIVER_BANDS.length; j++) failed.push(j);
        break;
      }
      continue;
    }
    state.done.add(i);
    for (const e of els) if (!state.byId.has(e.id)) state.byId.set(e.id, e);
    let built = buildReaches({ elements: Array.from(state.byId.values()) })
      .filter(r => !coveredByOfficial(r.g, idx));
    for (const r of built) r.src = 0;
    /* Israel's map: foreign water stays only where it crosses Israel's border */
    built = keepIsraeliAndCrossing(built, base, S.borders);
    S.osmFresh = built;
    S.reaches = base.concat(built);
    buildGroups(); reset(); invalidate();
  }
  return failed;
}

async function saveRivers(state){
  await cacheSet("osm", { v:4, at:Date.now(),
    data:S.osmFresh || [], done:Array.from(state.done), total:RIVER_BANDS.length });
}

function assignCells(){
  const rank = new Map();
  for (const r of S.reaches){
    const p = r.g[r.g.length-1];
    r.cell = cellKey(p[1], p[0]);
    if (!(rank.get(r.cell) >= r.km)) rank.set(r.cell, r.km);
  }
  return Array.from(rank.keys()).sort((a,b) => rank.get(b) - rank.get(a));
}

function setDays(){
  for (const f of S.flow.values()){ if (f.t && f.t.length){ S.times = f.t; break; } }
  if (!S.times.length){
    const t = [];
    for (let d = -7; d <= 7; d++) t.push(new Date(Date.now() + d*864e5).toISOString().slice(0,10));
    S.times = t;
  }
  const todayISO = new Date().toISOString().slice(0,10);
  let ti = S.times.indexOf(todayISO);
  if (ti < 0) ti = Math.min(7, S.times.length-1);
  S.todayIdx = ti; S.dayIdx = ti;
  const dayEl = $("#day");
  dayEl.min = String(-ti);
  dayEl.max = String(S.times.length - 1 - ti);
  dayEl.value = "0";
  $("#dayv").textContent = T("today");
}

function showMap(){
  reset();
  buildStations();
  if (S.layers.stations) stationLayer.addTo(map);
  invalidate(); updateStat();
  requestAnimationFrame(draw);
  boot.classList.add("done");
  setTimeout(() => { if (boot.parentNode) boot.remove(); }, 700);
}

/* Nothing came back at all — say what actually happened and offer a way on. */
function overpassDeadEnd(state){
  const detail = lastOverpassError ? esc(lastOverpassError) : "";
  bmsg.innerHTML =
    '<div style="color:#f4d69a;line-height:1.5">' + T("err") + "</div>" +
    (detail ? '<div style="margin-top:6px;font-size:11px;color:var(--ink-3)">' + detail + "</div>" : "") +
    '<div style="margin-top:8px;font-size:11px;color:var(--ink-3);max-width:380px;line-height:1.5">'
      + T("errhint") + "</div>";
  const wrap = el("div"); wrap.style.cssText = "margin-top:14px;display:flex;gap:8px;justify-content:center";
  const rb = el("button", "btn"); rb.textContent = T("retry");
  rb.onclick = async () => {
    rb.disabled = true;
    const failed = await loadRivers(state);
    if (state.done.size){ await saveRivers(state); await afterRivers(state, failed); }
    else { rb.disabled = false; overpassDeadEnd(state); }
  };
  const cb = el("button", "btn"); cb.textContent = T("without");
  cb.onclick = () => { setDays(); reliabilityPass(); showMap(); };
  wrap.appendChild(rb); wrap.appendChild(cb);
  bmsg.appendChild(wrap);
}

async function afterRivers(state, failed){
  if (failed && failed.length)
    banner('<div style="padding:9px 13px;font-size:11.5px;color:var(--ink-2)">' +
      T("partial").replace("%n", Math.min(failed.length, RIVER_BANDS.length)).replace("%t", RIVER_BANDS.length) +
      ' <button class="lnk" id="bretry">' + T("retry") + "</button></div>");

  say(0.58, he() ? "מוסיפים מאגרים וסכרים…" : "adding reservoirs and dams…");
  const cW = await cacheGet("water");
  if (cW && Date.now() - cW.at < CACHE_TTL && cW.v === 3) S.water = cW.data;
  else {
    const all = [];
    for (const bb of WATER_BANDS){
      const els = await band(qWater(bb));
      if (els) all.push.apply(all, els);
    }
    if (all.length){
      const seen = new Set(), uniq = [];
      for (const e of all){ const k = e.type + e.id; if (!seen.has(k)){ seen.add(k); uniq.push(e); } }
      S.water = buildWater({ elements: uniq });
      await cacheSet("water", { v:3, at:Date.now(), data:S.water });
    }
  }

  /* pollution sampling points — small, so just refresh them each visit */
  const cS = await cacheGet("sampling");
  if (cS && Date.now() - cS.at < 7*864e5 && cS.data && cS.data.length) S.sampling = cS.data;
  const fresh = await fetchSampling();
  if (fresh.length){ S.sampling = fresh; await cacheSet("sampling", { at:Date.now(), data:fresh }); }

  const cellList = assignCells();
  const dayKey = "flow_" + new Date().toISOString().slice(0,10);
  const cached = await cacheGet(dayKey);
  if (cached && cached.pairs) S.flow = new Map(cached.pairs);

  const missing = cellList.filter(c => !S.flow.has(c));
  let leftover = [];
  if (missing.length){
    say(0.66, he() ? "שואלים את מודל GloFAS…" : "asking the GloFAS model…");
    const res = await fetchFlow(missing, S.flow, p => say(0.66 + p*0.29,
      (he() ? "ספיקה: " : "discharge: ") + Math.round(p*100) + "%"), FIRST_PASS);
    leftover = res.remaining;
    if (S.flow.size) await cacheSet(dayKey, { pairs: Array.from(S.flow.entries()) });
  }
  setDays();

  /* drainage basins from the national GIS — the catchment each stream
     belongs to, and which basin drains into which */
  say(0.58, he() ? "מושכים אגני ניקוז…" : "fetching drainage basins…");
  const cB = await cacheGet("basins");
  if (cB && cB.v === 1 && cB.data && Date.now() - cB.at < CACHE_TTL) S.basins = cB.data;
  if (!S.basins.length){
    try{
      S.basins = await fetchBasins();
      if (S.basins.length) await cacheSet("basins", { v:1, at:Date.now(), data:S.basins });
    }catch(e){ S.basins = []; }
  }
  assignBasins();

  say(0.60, he() ? "מסתכלים במכ״ם…" : "looking at the radar…");
  await fetchRadarIndex();
  if (RADAR) await assignRadar(cellList);

  /* Rain over the same cells. One request per hundred, three weeks of daily
     totals, and it is what stops the map claiming water it cannot support:
     an ephemeral wadi with no rain behind it is not flowing, whatever the
     model says. Cached for the day like the discharge. */
  say(0.62, he() ? "בודקים כמה ירד גשם…" : "checking how much rain has fallen…");
  const rainKey = "rain_" + new Date().toISOString().slice(0,10);
  const cachedRain = await cacheGet(rainKey);
  if (cachedRain && cachedRain.pairs) S.rain = new Map(cachedRain.pairs);
  const needRain = cellList.filter(c => !S.rain.has(c));
  if (needRain.length){
    await fetchRain(needRain, S.rain, p => say(0.62 + p*0.04,
      (he() ? "גשם: " : "rain: ") + Math.round(p*100) + "%"));
    if (S.rain.size) await cacheSet(rainKey, { pairs: Array.from(S.rain.entries()) });
  }

  if (S.basins.length) buildBasinGraph();

  /* Cell elevations order each river headwater-to-mouth, which is what makes
     the reliability pass possible. About a thousand points, cached for good. */
  const ec = (await cacheGet("cellel")) || { v:1, map:{} };
  S.cellEl = ec.map;
  const needEl = cellList.filter(c => ec.map[c] == null).slice(0, 1600);
  if (needEl.length){
    say(0.95, he() ? "בודקים גבהים…" : "checking elevations…");
    await cellElevations(needEl, ec.map);
    await cacheSet("cellel", { v:1, map:ec.map });
  }

  S.crossings = findCrossings(S.reaches, S.borders);
  assignRegimes();
  assignSprings();
  assignSpines();
  reliabilityPass();

  say(1, he() ? "מציירים…" : "drawing…");
  buildSprings();
  buildRadar();
  showMap();

  const br = $("#bretry");
  if (br) br.onclick = async () => {
    br.textContent = "…";
    const again = await loadRivers(state);
    await saveRivers(state);
    banner(again.length ? '<div style="padding:9px 13px;font-size:11.5px;color:var(--ink-2)">' +
      T("partial").replace("%n", Math.min(again.length, RIVER_BANDS.length)).replace("%t", RIVER_BANDS.length) + ' <button class="lnk" id="bretry">' + T("retry") + "</button></div>" : "");
    const need = assignCells().filter(c => !S.flow.has(c));
    if (need.length) await fetchFlow(need, S.flow, null, FIRST_PASS);
    const needR = assignCells().filter(c => !S.rain.has(c));
    if (needR.length) await fetchRain(needR, S.rain, null);
    S.crossings = findCrossings(S.reaches, S.borders);
    assignRegimes();
    assignSprings();
    assignSpines();
    reliabilityPass();
    invalidate(); updateStat();
  };

  /* Elevation settles the flow direction of the reaches big enough to matter,
     and gives the detail panel its drop and gradient. Terrain does not move,
     so this is cached for good and only ever runs once. */
  setTimeout(async () => {
    try{
      const c = (await cacheGet("elev")) || { at:Date.now(), v:1, map:{} };
      const flipped = await orientByElevation(S.reaches, 2, 900, c.map);
      await cacheSet("elev", { at:Date.now(), v:1, map:c.map });
      if (flipped) invalidate();
    }catch(e){}
  }, 2500);

  /* The national stream network, twice over and both after the map is usable.
     First the holes: one named river in five is missing more than 3 km of its
     own channel in the official layer, and no grouping rule can join geometry
     that is not there. Then the spines, which re-order what they touch. */
  setTimeout(async () => {
    try{
      const res = await fillGaps(120, (f, nm) => {
        banner('<div style="padding:9px 13px;font-size:11.5px;color:var(--ink-2)">' +
          esc(T("gap_working").replace("%p", Math.round(f*100)).replace("%r", nm)) + "</div>");
      });
      banner("");
      if (res.added){
        assignCells();
        assignBasins(); assignRegimes(); assignSprings();
        buildGroups(); reset();
        const need = assignCells().filter(c => !S.flow.has(c));
        if (need.length) await fetchFlow(need, S.flow, null, 250);
        const needR = assignCells().filter(c => !S.rain.has(c));
        if (needR.length) await fetchRain(needR, S.rain, null);
        if (S.basins.length) buildBasinGraph();
        S.crossings = findCrossings(S.reaches, S.borders);
        assignSpines(); reliabilityPass();
        invalidate(); updateStat(); renderAudit();
        banner('<div style="padding:9px 13px;font-size:11.5px;color:var(--ink-2)">' +
          esc(T("gap_done").replace("%n", res.rivers).replace("%s", res.added)) +
          ' <button class="lnk" id="gapx">' + T("close") + "</button></div>");
        const gx = $("#gapx"); if (gx) gx.onclick = () => banner("");
      }
      const got = await loadTopSpines(60);
      if (got){ assignSpines(); reliabilityPass(); invalidate(); updateStat(); renderAudit(); }
    }catch(e){ banner(""); }
  }, 3000);

  /* Fill in the rest of the network quietly once the per-minute window resets. */
  if (leftover.length){
    setTimeout(async () => {
      await fetchFlow(leftover, S.flow, null);
      if (S.flow.size) await cacheSet("flow_" + new Date().toISOString().slice(0,10),
                       { pairs: Array.from(S.flow.entries()) });
      const lr = leftover.filter(c => !S.rain.has(c));
      if (lr.length){
        await fetchRain(lr, S.rain, null);
        await cacheSet("rain_" + new Date().toISOString().slice(0,10),
                       { pairs: Array.from(S.rain.entries()) });
      }
      const ec2 = (await cacheGet("cellel")) || { v:1, map:S.cellEl };
      const more = leftover.filter(c => ec2.map[c] == null).slice(0, 1600);
      if (more.length){ await cellElevations(more, ec2.map); await cacheSet("cellel", { v:1, map:ec2.map }); }
      S.cellEl = ec2.map;
      assignRegimes();
      assignSprings();
      assignSpines();
      reliabilityPass();
      invalidate(); updateStat();
    }, 62000);
  }
}

/* ---------- the national stream layer ---------- */
async function loadOfficial(){
  const c = await cacheGet("official");
  if (c && c.v === 1 && c.data && c.data.length && Date.now() - c.at < CACHE_TTL) return c.data;
  say(0.10, he() ? "מושכים את שכבת הנחלים של רשות המים…"
                 : "fetching the Water Authority stream layer…");
  const feats = await fetchOfficialRivers(p => say(0.10 + p*0.28,
    (he() ? "נחלים רשמיים: " : "official streams: ") + Math.round(p*100) + "%"));
  const built = buildOfficial(feats);
  await cacheSet("official", { v:1, at:Date.now(), data:built });
  return built;
}

async function start(){
  try{ await loadValidation(); }catch(e){}
  applyLang();
  let want = "dark";
  try{ want = localStorage.getItem("rfil_base") || "dark"; }catch(e){}
  if (!BASEMAPS[want]) want = "dark";
  await setBasemap(want);
  buildBaseMenu();
  say(0.04, he() ? "בודקים מטמון מקומי…" : "checking local cache…");

  /* 1 — the authoritative Israeli network */
  let official = [];
  try{ official = await loadOfficial(); }
  catch(e){ lastOverpassError = String(e.message || e); }
  if (official.length){
    S.reaches = official; buildGroups(); reset(); invalidate();
  }

  S.borders = borderSegments();

  /* 2 — OpenStreetMap, for two jobs only: gaps inside Israel that the
         official layer misses, and streams that cross Israel's border */
  const state = { byId: new Map(), done: new Set() };
  const cR = await cacheGet("osm");
  const complete = cR && cR.v === 4 && cR.data &&
                   (cR.done || []).length === RIVER_BANDS.length &&
                   Date.now() - cR.at < CACHE_TTL;
  let osm = (cR && cR.v === 4 && cR.data && Date.now() - cR.at < CACHE_TTL) ? cR.data : [];
  let failed = [];
  if (!complete){
    S.osmBase = official;
    failed = await loadRivers(state);
    if (state.done.size){
      osm = S.osmFresh || osm;
      await cacheSet("osm", { v:4, at:Date.now(), data:osm, done:Array.from(state.done) });
    }
  } else {
    for (let i = 0; i < RIVER_BANDS.length; i++) state.done.add(i);
  }

  S.reaches = official.concat(osm);
  buildGroups(); reset(); invalidate();

  if (!S.reaches.length){ overpassDeadEnd(state); return; }
  await afterRivers(state, failed);
}
start();

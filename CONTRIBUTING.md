# Contributing

Corrections to the hydrology are the most valuable thing you can send.

## If a river looks wrong on the map

Open an issue and say **which river, where, and what you know**. A photograph with a date,
or "I was at this wadi yesterday and it was bone dry", is real evidence and this map treats
it as such — the whole design is built around not claiming to know more than it does. Please
include:

- the river's name, in Hebrew or English
- roughly where along it (a place name is fine; coordinates are better)
- what the map showed, and what was actually there
- the date

Known-wrong is better than silently wrong. If a report cannot be reconciled with the
sources, that belongs in the README's caveats.

## If you want to change the code

```
npm install             # Leaflet + Playwright
npm run build           # writes dist/river_flow_israel.html
npm test                # headless pass: boot, hover, click, toggles, language, search
node test/resilience.js # behaviour when the sources fail
node test/water.js      # water-body classification against real OSM tag combinations
node test/regime.js     # flow-regime source integrity and gauge matching
```

Edit the parts under `src/`, never `dist/river_flow_israel.html` — that file is generated
and every change to it is lost on the next build. `build.py` lists the parts in order.

Two rules the codebase holds to, and pull requests are held to as well:

1. **No new keys, no new servers, no build toolchain.** The output is one HTML file that
   works from `file://` with no network at all. Anything that breaks that is a different
   project.
2. **The map must be able to say it does not know.** A change that turns an unverified
   reading into a confident one needs to bring its evidence with it. There are five
   evidence states for a reason; `EV_UNVER` and `EV_NODATA` are features.

If a change alters what the map claims, add a test that would have caught the old behaviour.
`test/fixtures.js` holds synthetic sources built to reproduce real failures — Nahal Paran's
stray stream-order stubs are in there because they broke the map twice.

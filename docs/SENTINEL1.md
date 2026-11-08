# Sentinel-1 water extent as a possible rung

A feasibility note, written 2026-11-08 after a read-only probe of the EODC STAC catalogue. **Nothing
here is built.** It records what was checked and what was not, so the next person does not start from
zero or assume more than was established.

## What was checked

`https://stac.eodc.eu/api/v1` answers without any key or login. A search over a box around Israel
(`34.2, 29.4, 35.9, 33.4`) returned items from two collections, the newest stamped 2026-11-08
03:50 UTC, i.e. available within hours of the satellite pass:

| Collection | What it is | Items matching the box |
|---|---|---|
| `GFM` | Global Flood Monitoring: a published, ready-made flood and observed-water product from Sentinel-1 (ensemble of three algorithms), 2015 to now | 38,109 |
| `SENTINEL1_SIG0_20M` | Calibrated Sentinel-1 backscatter at 20 m, the input that `dask-flood-mapper` turns into flood extent | 52,314 |

Each `GFM` item carries Cloud-Optimised GeoTIFF assets: `ensemble_flood_extent`,
`ensemble_water_extent` (observed water, not only flood), `ensemble_likelihood`, `exclusion_mask`,
`advisory_flags`, `reference_water_mask`, and per-item properties including `flooded_pixels` and
`floodable_pixels`.

So the ready-made product exists and is keyless; computing it ourselves with `dask-flood-mapper`
(MIT, see [PROJECT_REGISTRY.md](PROJECT_REGISTRY.md)) is not the only route.

## What was not checked, and decides whether this is worth building

1. **Whether the data cover Israel's land.** The tiles that matched the box are large (300 km) and
   intersect it; that does not show that the pixels over any particular wadi are valid. No raster
   was downloaded or read.
2. **The exclusion mask.** As documented for GFM (not verified here), the product masks out terrain
   where radar cannot tell water from dry ground: bare sand and arid land, steep slopes and radar
   shadow, dense urban areas. Much of the Negev and the Arava, where ephemeral floods matter most,
   may be exactly what is excluded. This is the single most likely reason the idea fails, and it
   can be tested cheaply: read `exclusion_mask` over the Negev.
3. **Channel width.** Pixels are 20 m. Most Israeli wadis are narrower than that for most of their
   length; a flood would register where it spreads out, not along the channel.
4. **Licence.** Not read. GFM is a Copernicus product; confirm its terms and the attribution
   wording before anything is shown.

## If it is built, the constraints are already known

- It can only ever corroborate. A pass every few days is a snapshot, and *no water detected* is
  not *dry*. It belongs on the ladder next to radar, as evidence of water, never as evidence of its
  absence.
- It must be baked offline, like the Hydrological Service readings: a script on the maintainer's
  machine reads the catalogue and writes a small file; the map never calls the catalogue.
- Age is judged when the map is viewed, as for `part4j_measured.js`, and a detection older than a
  few days is not evidence about now.
- It must say what it is. "Satellite-observed water on <date>" is a different claim from a gauge
  reading, and the panel should not blur the two.

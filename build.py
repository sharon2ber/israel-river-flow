#!/usr/bin/env python3
"""Assemble the single-file River Flow Israel app.

    src/part*.{html,js}  +  data/*.json  +  node_modules/leaflet
                            |
                         build.py
                            v
                 dist/river_flow_israel.html

Output is one self-contained HTML document: Leaflet, the CSS, the baked
datasets and every source part, in one file that opens from a download folder
with no network at all.

Two things to know before editing this script.

*Order is the contract.* There are no modules and no imports in src/ — the
parts are concatenated into a single global scope, so a part can only use what
an earlier part declared. The PARTS list below is that order. Moving an entry,
or adding one in the wrong place, produces a file that fails at load with a
ReferenceError rather than anything more helpful.

*Placeholders are how data gets in.* src/part2_body.html contains comment
markers such as /*STATIONS*/ which are replaced here with the contents of the
matching file in data/. A placeholder that survives into the output means a
dataset silently failed to inline; test/build.js checks for exactly that.

Run it with `npm run build`. Nothing here is minified, because the shipped
file is meant to be readable by whoever downloads it.
"""
import json, pathlib, re, sys

root = pathlib.Path(__file__).parent
src = root / "src"
dist = root / "dist"
dist.mkdir(exist_ok=True)

LEAFLET = next((d for d in [root / "node_modules/leaflet/dist", root / "package/dist"] if d.exists()), None)
if LEAFLET is None:
    sys.exit("Leaflet not found. Run: npm install")
leaflet_js = (LEAFLET / "leaflet.js").read_text(encoding="utf-8")
leaflet_css = (LEAFLET / "leaflet.css").read_text(encoding="utf-8")
# leaflet.css references marker images we never use; strip the url() refs
leaflet_css = re.sub(r"url\([^)]*\)", "none", leaflet_css)

stations = json.loads((root / "data/stations.json").read_text(encoding="utf-8"))
borders = json.loads((root / "data/borders.json").read_text(encoding="utf-8"))
extent = json.loads((root / "data/extent.json").read_text(encoding="utf-8"))
validation = json.loads((root / "data/validation.json").read_text(encoding="utf-8"))
regime = json.loads((root / "data/regime.json").read_text(encoding="utf-8"))
coast = json.loads((root / "data/coast.json").read_text(encoding="utf-8"))
springs = json.loads((root / "data/springs.json").read_text(encoding="utf-8"))

head = (src / "part1_head.html").read_text(encoding="utf-8")
body = (src / "part2_body.html").read_text(encoding="utf-8")
# Concatenation order. See the note on order in the module docstring before
# changing this list: each entry may only use what the entries above it define.
PARTS = [
    "part3_app.js",        # i18n, colour ramp, discharge classes, SCOPE, IndexedDB cache
    "part3b_sources.js",   # Water Authority layers, OSM merge, flow direction, crossings
    "part4_flow.js",       # GloFAS discharge, rainfall, the evidence ladder
    "part4b_validate.js",  # model checked against measured gauge means
    "part4c_regime.js",    # matching a reach to a gauge's measured flow regime
    "part4d_outlets.js",   # coast distance, river tracing, network audit
    "part4e_springs.js",   # which springs feed which reach
    "part4f_radar.js",     # RainViewer tiles, read for rain falling now
    "part4g_basins.js",    # drainage basins and the DRAIN_TO graph
    "part4h_spines.js",    # assembling one river out of many segments
    "part4i_gapfill.js",   # filling holes the official layer leaves
    "part5_map.js",        # Leaflet, application state S, canvas renderer
    "part6_ui.js",         # panels, tooltip, search, layer controls
    "part7_boot.js",       # About text and the boot sequence
]
js = "\n".join((src / f).read_text(encoding="utf-8") for f in PARTS)

head = head.replace("/*LEAFLET_CSS*/", leaflet_css)
body = body.replace("/*LEAFLET_JS*/", leaflet_js)
body = body.replace("/*STATIONS*/", json.dumps(stations, ensure_ascii=False, separators=(",", ":")))
body = body.replace("/*BORDERS*/", json.dumps(borders, ensure_ascii=False, separators=(",", ":")))
body = body.replace("/*EXTENT*/", json.dumps(extent, separators=(",", ":")))
body = body.replace("/*VALIDATION*/", json.dumps(validation, ensure_ascii=False, separators=(",", ":")))
body = body.replace("/*REGIME*/", json.dumps(regime, ensure_ascii=False, separators=(",", ":")))
body = body.replace("/*COAST*/", json.dumps(coast, separators=(",", ":")))
body = body.replace("/*SPRINGS*/", json.dumps(springs, ensure_ascii=False, separators=(",", ":")))

out = head + body + js + "\n</script>\n</body>\n</html>\n"
p = dist / "river_flow_israel.html"
p.write_text(out, encoding="utf-8")
print(f"wrote {p}  {len(out.encode('utf-8'))/1024:.0f} KB")

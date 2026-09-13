#!/usr/bin/env python3
"""Assemble the single-file River Flow Israel app."""
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
js = "\n".join((src / f).read_text(encoding="utf-8") for f in
               ["part3_app.js", "part3b_sources.js", "part4_flow.js", "part4b_validate.js", "part4c_regime.js", "part4d_outlets.js", "part4e_springs.js", "part4f_radar.js", "part4g_basins.js", "part4h_spines.js", "part4i_gapfill.js",
                "part5_map.js", "part6_ui.js", "part7_boot.js"])

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

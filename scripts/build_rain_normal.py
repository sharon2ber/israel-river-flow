#!/usr/bin/env python3
"""Turn the Israel Meteorological Service's 1991-2020 mean-rainfall layer into
data/rain_normal.json: one number per 0.05 degree grid cell.

    1991-2020mean.tif.aux.zip  (or the .tif inside it)  ->  data/rain_normal.json

    python scripts/build_rain_normal.py PATH [--out PATH] [--check]

PATH is the file downloaded from the Ministry of Environmental Protection's
Climate Risk Portal. Its terms and the permission this project was given are
in NOTICE.md; the short version is that the *layer file is never committed*.
What is committed is what this script writes: block means on the grid the map
already uses, marked as processed, and credited to the Israel Meteorological
Service wherever the number is shown.

Why a block mean and not a point sample: the layer has 400 m pixels and the
map's rainfall check works on 0.05 degree (about 5 km) model cells. A point
sample would quote one hillside as if it were the whole cell.

What this script refuses to do, because the map's honesty depends on it:

  * guess. A cell with too few real pixels under it is null, not interpolated.
  * trust a file it does not understand. Compressed rasters, a CRS other than
    Israel TM, or a grid that does not look like the one it was written for
    stop the run; nothing is written.
  * write a plausible-looking wrong file. After sampling, it prints what the
    layer says at eight well-known places. A wrong projection shows up there
    first (Eilat at 500 mm, Haifa at 30 mm).

Standard library only. The layer's own readings are millimetres per year,
averaged over 1991-2020 (confirmed by the Ministry in writing, 2026-11-10);
the coordinate system, Israeli Transverse Mercator (EPSG:2039), is also
confirmed by them and is not stored in the file itself.
"""
import argparse, json, math, pathlib, struct, sys, zipfile
from array import array

STEP = 0.05                 # the GloFAS grid the map snaps every reach to
MIN_PIXELS = 30             # real 400 m pixels needed under a cell (of ~160) before it counts
PLAUSIBLE = (5.0, 2500.0)   # mm/yr; anything outside is nodata or garbage, never rainfall here
LAT_RANGE = (29.0, 33.7)    # Israel with a margin; cells outside are never emitted
LON_RANGE = (34.0, 36.0)

# ---- Israeli Transverse Mercator (EPSG:2039), GRS80 --------------------------
A_GRS80 = 6378137.0
F_GRS80 = 1 / 298.257222101
K0 = 1.0000067
LON0 = math.radians(35.2045169444)
LAT0 = math.radians(31.7343936111)
FE, FN = 219529.584, 626907.390

_n = F_GRS80 / (2 - F_GRS80)
_A = A_GRS80 / (1 + _n) * (1 + _n**2 / 4 + _n**4 / 64)
_e = math.sqrt(F_GRS80 * (2 - F_GRS80))
_alpha = [
    _n / 2 - 2 * _n**2 / 3 + 5 * _n**3 / 16 + 41 * _n**4 / 180,
    13 * _n**2 / 48 - 3 * _n**3 / 5 + 557 * _n**4 / 1440,
    61 * _n**3 / 240 - 103 * _n**4 / 140,
    49561 * _n**4 / 161280,
]
_beta = [
    _n / 2 - 2 * _n**2 / 3 + 37 * _n**3 / 96 - _n**4 / 360,
    _n**2 / 48 + _n**3 / 15 - 437 * _n**4 / 1440,
    17 * _n**3 / 480 - 37 * _n**4 / 840,
    4397 * _n**4 / 161280,
]
_delta = [
    2 * _n - 2 * _n**2 / 3 - 2 * _n**3 + 116 * _n**4 / 45,
    7 * _n**2 / 3 - 8 * _n**3 / 5 - 227 * _n**4 / 45,
    56 * _n**3 / 15 - 136 * _n**4 / 35,
    4279 * _n**4 / 630,
]


def _xi_eta(lat, dlon):
    s = math.sin(lat)
    chi = math.atan(math.sinh(math.asinh(math.tan(lat)) - _e * math.atanh(_e * s)))
    xi1 = math.atan2(math.tan(chi), math.cos(dlon))
    eta1 = math.atanh(math.cos(chi) * math.sin(dlon))
    xi = xi1 + sum(a * math.sin(2 * j * xi1) * math.cosh(2 * j * eta1) for j, a in enumerate(_alpha, 1))
    eta = eta1 + sum(a * math.cos(2 * j * xi1) * math.sinh(2 * j * eta1) for j, a in enumerate(_alpha, 1))
    return xi, eta


_XI0 = _xi_eta(LAT0, 0.0)[0]


def itm_forward(lat_deg, lon_deg):
    """(lat, lon) in degrees -> (east, north) in Israel TM metres."""
    xi, eta = _xi_eta(math.radians(lat_deg), math.radians(lon_deg) - LON0)
    return FE + K0 * _A * eta, FN + K0 * _A * (xi - _XI0)


def itm_inverse(east, north):
    """(east, north) in Israel TM metres -> (lat, lon) in degrees."""
    eta = (east - FE) / (K0 * _A)
    xi = (north - FN) / (K0 * _A) + _XI0
    xi1 = xi - sum(b * math.sin(2 * j * xi) * math.cosh(2 * j * eta) for j, b in enumerate(_beta, 1))
    eta1 = eta - sum(b * math.cos(2 * j * xi) * math.sinh(2 * j * eta) for j, b in enumerate(_beta, 1))
    chi = math.asin(math.sin(xi1) / math.cosh(eta1))
    lat = chi + sum(d * math.sin(2 * j * chi) for j, d in enumerate(_delta, 1))
    lon = LON0 + math.atan2(math.sinh(eta1), math.cos(xi1))
    return math.degrees(lat), math.degrees(lon)


# ---- a small, strict GeoTIFF reader ------------------------------------------
_TYPES = {1: ("B", 1), 2: ("c", 1), 3: ("H", 2), 4: ("I", 4), 5: ("II", 8), 11: ("f", 4), 12: ("d", 8), 16: ("Q", 8)}


class TiffError(Exception):
    pass


def read_geotiff(data):
    """Return (width, height, values, east0, north0, pixel_m, nodata, epsg).

    Only what the layer needs: one band, 32-bit float, uncompressed, strips or
    tiles, north-up with a ModelTiepoint and ModelPixelScale. Anything else is
    refused, loudly, rather than decoded wrongly."""
    if data[:2] == b"II":
        e = "<"
    elif data[:2] == b"MM":
        e = ">"
    else:
        raise TiffError("not a TIFF file")
    magic = struct.unpack(e + "H", data[2:4])[0]
    if magic != 42:
        raise TiffError("BigTIFF and other variants are not supported (magic %d)" % magic)
    ifd = struct.unpack(e + "I", data[4:8])[0]
    n = struct.unpack(e + "H", data[ifd:ifd + 2])[0]
    tags = {}
    for i in range(n):
        off = ifd + 2 + i * 12
        tag, typ, cnt = struct.unpack(e + "HHI", data[off:off + 8])
        if typ not in _TYPES:
            continue
        fmt, size = _TYPES[typ]
        total = size * cnt
        raw = data[off + 8:off + 8 + total] if total <= 4 else data[struct.unpack(e + "I", data[off + 8:off + 12])[0]:][:total]
        if typ == 2:
            tags[tag] = raw.rstrip(b"\x00").decode("latin-1")
        elif typ == 5:
            tags[tag] = [struct.unpack(e + "II", raw[k:k + 8]) for k in range(0, total, 8)]
        else:
            tags[tag] = list(struct.unpack(e + str(cnt) + fmt, raw))

    def one(tag, default=None):
        v = tags.get(tag)
        return v[0] if isinstance(v, list) and v else (default if v is None else v)

    w, h = one(256), one(257)
    if one(259, 1) != 1:
        raise TiffError("compressed TIFF (compression=%s); only uncompressed is supported" % one(259))
    if one(258) != 32 or one(339, 1) != 3 or one(277, 1) != 1:
        raise TiffError("expected one band of 32-bit float; got bits=%s format=%s bands=%s" % (one(258), one(339), one(277)))
    if one(284, 1) != 1:
        raise TiffError("planar-separate TIFF not supported")
    if 33550 not in tags or 33922 not in tags:
        raise TiffError("no ModelPixelScale/ModelTiepoint: the file is not georeferenced")
    sx, sy = tags[33550][0], tags[33550][1]
    if abs(sx - sy) > 1e-6:
        raise TiffError("non-square pixels (%s x %s)" % (sx, sy))
    tp = tags[33922]
    # tiepoint (i, j, k, x, y, z): raster (i, j) sits at model (x, y)
    east0 = tp[3] - tp[0] * sx
    north0 = tp[4] + tp[1] * sy
    epsg = None
    gk = tags.get(34735)
    if gk:
        for k in range(4, len(gk) - 3, 4):
            if gk[k] == 3072 and gk[k + 1] == 0:      # ProjectedCSTypeGeoKey stored inline
                epsg = gk[k + 3]
    nodata = None
    if 42113 in tags:
        try:
            nodata = float(tags[42113])
        except ValueError:
            nodata = None

    values = array("f", [float("nan")]) * (w * h)
    if 322 in tags:      # tiled
        tw, th = one(322), one(323)
        offs, cnts = tags[324], tags[325]
        across = (w + tw - 1) // tw
        for t, (o, c) in enumerate(zip(offs, cnts)):
            if c < tw * th * 4:
                raise TiffError("short tile %d" % t)
            tile = array("f"); tile.frombytes(data[o:o + tw * th * 4])
            if (e == "<") != (sys.byteorder == "little"):
                tile.byteswap()
            ty, tx = divmod(t, across)
            for r in range(th):
                y = ty * th + r
                if y >= h:
                    break
                x0 = tx * tw
                n_ = min(tw, w - x0)
                values[y * w + x0:y * w + x0 + n_] = tile[r * tw:r * tw + n_]
    else:                # strips
        rps = one(278, h)
        offs, cnts = tags[273], tags[279]
        y = 0
        for o, c in zip(offs, cnts):
            rows = min(rps, h - y)
            strip = array("f"); strip.frombytes(data[o:o + rows * w * 4])
            if (e == "<") != (sys.byteorder == "little"):
                strip.byteswap()
            values[y * w:(y + rows) * w] = strip
            y += rows
    return w, h, values, east0, north0, sx, nodata, epsg


# ---- sampling onto the map's grid ---------------------------------------------
def block_means(w, h, values, east0, north0, px, nodata):
    """-> {(iy, ix): (mean, n_pixels)} where cell (iy, ix) is centred at (iy*STEP, ix*STEP)."""
    acc = {}
    for r in range(h):
        north = north0 - (r + 0.5) * px
        base = r * w
        for c in range(w):
            v = values[base + c]
            if v != v or (nodata is not None and v == nodata):
                continue
            if not (PLAUSIBLE[0] <= v <= PLAUSIBLE[1]):
                continue
            lat, lon = itm_inverse(east0 + (c + 0.5) * px, north)
            if not (LAT_RANGE[0] <= lat <= LAT_RANGE[1] and LON_RANGE[0] <= lon <= LON_RANGE[1]):
                continue
            key = (round(lat / STEP), round(lon / STEP))     # same rounding as cellKey() in the map
            s = acc.get(key)
            if s is None:
                acc[key] = [v, 1]
            else:
                s[0] += v; s[1] += 1
    return {k: (s[0] / s[1], s[1]) for k, s in acc.items()}


def build(path):
    p = pathlib.Path(path)
    if p.suffix.lower() == ".zip":
        with zipfile.ZipFile(p) as z:
            names = [n for n in z.namelist() if n.lower().endswith(".tif")]
            if len(names) != 1:
                raise TiffError("expected exactly one .tif in the zip, found %s" % names)
            data = z.read(names[0])
    else:
        data = p.read_bytes()
    w, h, values, east0, north0, px, nodata, epsg = read_geotiff(data)
    if epsg not in (None, 2039, 32767):
        raise TiffError("the file declares EPSG:%s, not Israel TM (2039); refusing to reinterpret it" % epsg)
    warn = []
    if epsg != 2039:
        warn.append("the file does not declare its CRS; Israel TM (EPSG:2039) is assumed, as the Ministry confirmed in writing")
    means = block_means(w, h, values, east0, north0, px, nodata)
    kept = {k: v for k, v in means.items() if v[1] >= MIN_PIXELS}
    if not kept:
        raise TiffError("no cell has %d real pixels under it; the CRS or the file is wrong" % MIN_PIXELS)
    iys = [k[0] for k in kept]; ixs = [k[1] for k in kept]
    iy0, iy1, ix0, ix1 = min(iys), max(iys), min(ixs), max(ixs)
    rows, cols = iy1 - iy0 + 1, ix1 - ix0 + 1
    mm = [None] * (rows * cols)
    for (iy, ix), (m, _) in kept.items():
        mm[(iy - iy0) * cols + (ix - ix0)] = int(round(m))
    out = {
        "v": 1,
        "what": "Mean annual rainfall, 1991-2020, averaged over each 0.05 degree grid cell. Processed by River Flow Israel: block means of the original 400 m layer, NOT the original values.",
        "unit": "mm/yr",
        "period": "1991-2020",
        "step": STEP,
        "iy0": iy0, "ix0": ix0, "rows": rows, "cols": cols,
        "mm": mm,
        "credit": "Israel Meteorological Service, via the Ministry of Environmental Protection's Climate Risk Portal",
        "minPixels": MIN_PIXELS,
    }
    return out, means, warn


PLACES = [   # (name, lat, lon, a wide plausible range of the 1991-2020 mean in mm/yr)
    ("Eilat", 29.56, 34.95, (0, 70)),
    ("Beer Sheva", 31.25, 34.79, (120, 280)),
    ("Tel Aviv", 32.08, 34.78, (400, 650)),
    ("Jerusalem", 31.77, 35.21, (400, 750)),
    ("Haifa", 32.80, 34.99, (450, 800)),
    ("Tiberias", 32.79, 35.53, (300, 550)),
    ("Metula", 33.28, 35.58, (600, 1100)),
    ("Dead Sea shore", 31.50, 35.40, (0, 120)),
]


def spot_check(out):
    """Print what the baked file says at known places. Returns the names that fall outside a generous range."""
    off = []
    cols, rows = out["cols"], out["rows"]
    print("\nSpot check (a wrong projection fails here first):")
    for name, lat, lon, (lo, hi) in PLACES:
        iy, ix = round(lat / STEP) - out["iy0"], round(lon / STEP) - out["ix0"]
        v = None
        if 0 <= iy < rows and 0 <= ix < cols:
            v = out["mm"][iy * cols + ix]
        flag = "" if v is not None and lo <= v <= hi else "   <-- outside the expected range %d-%d" % (lo, hi)
        if flag:
            off.append(name)
        print("  %-15s %s%s" % (name, "no data" if v is None else "%d mm/yr" % v, flag))
    return off


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("path", help="1991-2020mean.tif.aux.zip, or the .tif inside it")
    ap.add_argument("--out", default=str(pathlib.Path(__file__).resolve().parent.parent / "data" / "rain_normal.json"))
    ap.add_argument("--force", action="store_true", help="write even if the spot check fails (do not)")
    a = ap.parse_args()
    try:
        out, means, warn = build(a.path)
    except TiffError as e:
        sys.exit("refusing: %s" % e)
    for w_ in warn:
        print("note:", w_)
    vals = [v for v in out["mm"] if v is not None]
    print("cells with a value: %d of %d in the %dx%d box; range %d-%d mm/yr" %
          (len(vals), len(out["mm"]), out["rows"], out["cols"], min(vals), max(vals)))
    off = spot_check(out)
    if off and not a.force:
        sys.exit("\nrefusing to write: %s fall outside a plausible range. Check the file and its projection." % ", ".join(off))
    pathlib.Path(a.out).write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("\nwrote", a.out)


if __name__ == "__main__":
    main()

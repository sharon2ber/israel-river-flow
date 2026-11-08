#!/usr/bin/env python3
"""Turn the collector's append-only store into data/measured.json.

    ihs-collector/ihs-data/measurements.ndjson  ->  data/measured.json

The map never calls the Hydrological Service API. The collector (on the
maintainer's machine) appends every 10-minute reading to an NDJSON store; this
script reads that store and bakes the little the map needs: the latest valid
reading per station, a thin recent series for the sparkline, and a flag for
sensors that look frozen. The map decides what a reading is worth when it is
*viewed* -- age is judged there, against the clock -- so nothing here may
claim a reading is fresh.

    python scripts/build_measured.py [--store PATH] [--out PATH] [--now ISO]

Rules this script keeps, because the map's honesty depends on them:

  * null is missing, never zero. A station that reported "no data" has no
    reading at that time; it is not dry. The latest reading kept per station
    is the latest row with a real flow value, carrying its own timestamp.
  * Everything is keyed on timeUtc. The service's "local" field is fixed
    UTC+2 all year and is ignored.
  * A flow that has not changed across many consecutive 10-minute readings
    while above zero is probably a stuck sensor. It is flagged (fz), and the
    map then treats it as no measurement at all.
  * Only the recent window is baked. The file is inlined into a single HTML
    page and has to stay small.

The two frozen-sensor numbers below are provisional. They were chosen before
any real collected data existed; check them against the store once it has a
few days in it.
"""
import argparse, json, pathlib, sys
from datetime import datetime, timedelta, timezone

ROOT = pathlib.Path(__file__).resolve().parent.parent
DEFAULT_STORE = ROOT.parent / "ihs-collector" / "ihs-data" / "measurements.ndjson"
DEFAULT_OUT = ROOT / "data" / "measured.json"

SERIES_HOURS = 36          # sparkline window, one value per hour
EMIT_MAX_AGE_H = 48        # a station silent for longer than this is left out
FROZEN_MIN_READINGS = 36   # identical consecutive positive flows ...
FROZEN_MIN_SPAN_MIN = 300  # ... spread over at least this long, is suspect


def parse_utc(s):
    """'2026-10-04 22:10' (naive, UTC) -> aware datetime; None if unusable."""
    if not isinstance(s, str):
        return None
    s = s.strip().replace(" ", "T").rstrip("Z")
    try:
        return datetime.fromisoformat(s).replace(tzinfo=timezone.utc)
    except ValueError:
        return None


def number(v):
    """A real finite number, else None. 'no data', 'NA', None and bools are missing."""
    if isinstance(v, bool) or v is None:
        return None
    try:
        x = float(v)
    except (TypeError, ValueError):
        return None
    return x if x == x and abs(x) != float("inf") else None


def iso(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%SZ")


def read_store(path):
    seen, rows, skipped = set(), [], 0
    with open(path, encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if not line:
                continue
            try:
                r = json.loads(line)
            except json.JSONDecodeError:
                skipped += 1
                continue
            t = parse_utc(r.get("timeUtc"))
            if t is None or r.get("catId") is None:
                skipped += 1
                continue
            key = (r["catId"], t)
            if key in seen:
                continue
            seen.add(key)
            r["_t"] = t
            rows.append(r)
    return rows, skipped


def is_frozen(readings):
    """readings: [(time, flow)] of valid flows, oldest first."""
    tail = readings[-FROZEN_MIN_READINGS:]
    if len(tail) < FROZEN_MIN_READINGS:
        return False, 0
    v = tail[-1][1]
    if v <= 0 or any(f != v for _, f in tail):
        return False, 0
    span = (tail[-1][0] - tail[0][0]).total_seconds() / 60
    return span >= FROZEN_MIN_SPAN_MIN, len(tail)


def build(rows, now=None):
    if not rows:
        return {"v": 1, "asOf": None, "grid": None, "st": []}
    asof = max(r["_t"] for r in rows)
    now = now or asof
    end = now.replace(minute=0, second=0, microsecond=0)
    start = end - timedelta(hours=SERIES_HOURS - 1)

    by = {}
    for r in rows:
        by.setdefault(r["catId"], []).append(r)

    out = []
    for cat, rs in by.items():
        rs.sort(key=lambda r: r["_t"])
        meta = rs[-1]
        flows = [(r["_t"], number(r.get("flow"))) for r in rs]
        flows = [(t, f) for t, f in flows if f is not None]
        if not flows:
            continue                         # never reported a flow: nothing to say
        tq, q = flows[-1]
        if now - tq > timedelta(hours=EMIT_MAX_AGE_H):
            continue
        levels = [(r["_t"], number(r.get("level"))) for r in rs]
        levels = [(t, h) for t, h in levels if h is not None]
        fz, run = is_frozen(flows)

        series = [None] * SERIES_HOURS       # null = nothing collected that hour
        for t, f in flows:
            if start <= t < end + timedelta(hours=1):
                i = int((t.replace(minute=0, second=0, microsecond=0) - start)
                        .total_seconds() // 3600)
                if 0 <= i < SERIES_HOURS:
                    series[i] = round(f, 3)

        st = {"id": cat, "mp": meta.get("measurePointId"),
              "en": meta.get("nameEn"), "he": meta.get("nameHe"),
              "lat": meta.get("lat"), "lon": meta.get("lon"),
              "basin": meta.get("basinNameEn"),
              "tq": iso(tq), "q": round(q, 3),
              "fz": 1 if fz else 0, "s": series}
        if levels:
            st["tl"], st["h"] = iso(levels[-1][0]), round(levels[-1][1], 3)
        if fz:
            st["fzn"] = run
        out.append(st)

    out.sort(key=lambda s: s["id"])
    return {"v": 1, "asOf": iso(asof),
            "grid": {"end": iso(end), "stepMin": 60, "n": SERIES_HOURS},
            "st": out}


def main(argv=None):
    ap = argparse.ArgumentParser(description="Bake data/measured.json from the collector store")
    ap.add_argument("--store", default=str(DEFAULT_STORE))
    ap.add_argument("--out", default=str(DEFAULT_OUT))
    ap.add_argument("--now", help="ISO UTC time to treat as 'now' (tests); default: newest reading")
    a = ap.parse_args(argv)

    store = pathlib.Path(a.store)
    if not store.exists():
        sys.exit("No store at %s -- collection has not run. Nothing written." % store)
    rows, skipped = read_store(store)
    doc = build(rows, parse_utc(a.now) if a.now else None)
    pathlib.Path(a.out).write_text(
        json.dumps(doc, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    frozen = sum(s["fz"] for s in doc["st"])
    print("wrote %s: %d stations (%d frozen), asOf %s, %d unusable rows skipped"
          % (a.out, len(doc["st"]), frozen, doc["asOf"], skipped))


if __name__ == "__main__":
    main()

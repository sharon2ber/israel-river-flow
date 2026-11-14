
/* ============================================================
   Typical annual rainfall, for context only
   ------------------------------------------------------------
   data/rain_normal.json holds the Israel Meteorological Service's
   1991-2020 mean annual rainfall, averaged onto the same 0.05
   degree cells the rest of this map already uses (see
   scripts/build_rain_normal.py and NOTICE.md for where it came
   from and on what terms).

   This is deliberately NOT evidence. Nothing in reachState(),
   evidencePass() or reliabilityPass() reads it, and test/rainnormal.js
   fails if that ever changes. A wet region is not a flowing
   stream, and "how much rain usually falls here in a year" says
   nothing about whether water is in this channel today. It is
   shown in the panel so a reader can judge the rain figure above
   it against the place it fell on.

   Every rule fails toward "no number": a missing file, the wrong
   version, a cell outside the grid, an empty cell, or a value that
   is not a finite positive number all return null, and the panel
   then shows nothing rather than a guess.
   ============================================================ */
function rainNormalFor(cell, data){
  data = data || RAINNORM;
  if (!data || data.v !== 1 || data.unit !== "mm/yr") return null;
  if (!(data.rows > 0) || !(data.cols > 0) || !Array.isArray(data.mm)) return null;
  if (data.mm.length !== data.rows * data.cols) return null;
  if (data.step !== GRID) return null;
  if (typeof cell !== "string") return null;
  const p = cell.split("_");
  if (p.length !== 2) return null;
  const iy = +p[0] - data.iy0, ix = +p[1] - data.ix0;
  if (!Number.isInteger(iy) || !Number.isInteger(ix)) return null;
  if (iy < 0 || iy >= data.rows || ix < 0 || ix >= data.cols) return null;
  const v = data.mm[iy * data.cols + ix];
  if (v == null || typeof v !== "number" || !isFinite(v) || v <= 0) return null;
  return { mm: v, period: data.period };
}

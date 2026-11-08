/* ============================================================
   Measured discharge — a gauge reading on this very reach
   ------------------------------------------------------------
   The Israel Hydrological Service granted this project its
   10-minute measured discharge. A collector on the maintainer's
   machine stores it; scripts/build_measured.py bakes the latest
   of it into data/measured.json; the map never calls the API.

   This is the one place on the map where an observation of the
   water itself outranks a model. It is also the easiest place to
   make the map more confident than it has any right to be, so the
   rules for when a reading counts are strict and all of them fail
   toward "no measurement", which drops the reach back down the
   ladder to radar, rain, springs and regime:

     · a reading covers a point, not a wadi. It speaks only for
       reaches whose line passes within MEAS_SNAP_KM of the gauge,
       not for a basin and not for the stream's whole length
     · being on the same stream matters more than distance: the
       gauge's stream name must equal the reach's name. A nearer
       gauge on a different channel does not count, and a reach with
       no name is never credited with a measurement
     · age is judged here, against the clock at the moment of
       viewing, never at build time. A baked file gets old on a
       static page; a reading older than MEAS_MAX_AGE_MIN is not
       evidence about now, and neither is one stamped in the future
     · it applies to today only. Scrubbing to another day must not
       carry a reading from this morning onto it
     · a missing flow is missing, not zero, and a sensor flagged as
       frozen by the builder is no measurement at all
   ============================================================ */

/* the part of a station's name that names the stream: "Meshushim-Pkak"
   and "משושים-פ-דרדרה" are both the stream before the first hyphen */
function measStream(name){
  if (!name) return "";
  return regNorm(String(name).split(/[-–—]/)[0]);
}

/* shortest distance from a point to a polyline of [lon, lat] vertices, in km,
   on a local flat projection (exact enough at 1-2 km) */
function distToLineKm(lat, lon, g){
  const kx = 111.32 * Math.cos(lat * Math.PI / 180), ky = 110.57;
  let best = Infinity;
  for (let i = 0; i < g.length; i++){
    const ax = (g[i][0] - lon) * kx, ay = (g[i][1] - lat) * ky;
    let bx = ax, by = ay;
    if (i + 1 < g.length){ bx = (g[i+1][0] - lon) * kx; by = (g[i+1][1] - lat) * ky; }
    const dx = bx - ax, dy = by - ay, L = dx*dx + dy*dy;
    const t = L ? Math.max(0, Math.min(1, -(ax*dx + ay*dy) / L)) : 0;
    const px = ax + t*dx, py = ay + t*dy;
    const d = Math.sqrt(px*px + py*py);
    if (d < best) best = d;
  }
  return best;
}

/* length of a polyline of [lon, lat] vertices, km */
function lineLengthKm(g){
  let km = 0;
  for (let i = 1; i < g.length; i++){
    const lat = (g[i][1] + g[i-1][1]) / 2;
    const dx = (g[i][0] - g[i-1][0]) * 111.32 * Math.cos(lat * Math.PI / 180);
    const dy = (g[i][1] - g[i-1][1]) * 110.57;
    km += Math.sqrt(dx*dx + dy*dy);
  }
  return km;
}

/* The fresh, trusted reading that speaks for reach `r` on `dateISO`, or null.
   `data` and `nowMs` are parameters so the rules can be tested without a
   clock or the baked file. */
function measuredFor(r, nowMs, dateISO, data){
  data = data || MEASURED;
  if (!data || !data.st || !data.st.length || !r || !r.g || !r.g.length) return null;
  if (dateISO !== new Date(nowMs).toISOString().slice(0, 10)) return null;
  const names = [regNorm(r.he), regNorm(r.en)].filter(Boolean);
  if (!names.length) return null;
  /* a point cannot vouch for a long stretch: past this length the reach falls
     back to the model and its corroboration, however close the gauge is */
  if (lineLengthKm(r.g) > MEAS_MAX_REACH_KM) return null;
  let best = null;
  for (const s of data.st){
    if (s.fz) continue;
    if (s.q == null || !isFinite(s.q)) continue;
    const ageMin = (nowMs - Date.parse(s.tq)) / 60000;
    if (!isFinite(ageMin) || ageMin > MEAS_MAX_AGE_MIN || ageMin < -MEAS_FUTURE_SLACK_MIN) continue;
    const sh = measStream(s.he), se = measStream(s.en);
    if (!((sh && names.indexOf(sh) >= 0) || (se && names.indexOf(se) >= 0))) continue;
    if (s.lat == null || s.lon == null) continue;
    const km = distToLineKm(s.lat, s.lon, r.g);
    if (km > MEAS_SNAP_KM) continue;
    if (!best || km < best.km)
      best = { id:s.id, q:s.q, h:s.h == null ? null : s.h, tq:s.tq,
               ageMin:Math.max(0, Math.round(ageMin)), km:+km.toFixed(2),
               he:s.he, en:s.en, s:s.s || null };
  }
  return best;
}

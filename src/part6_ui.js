
/* ============================================================
   Panels, tooltip, search, boot
   ============================================================ */
const esc = s => String(s == null ? "" : s)
  .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");

const tip = $("#tip");
function showTip(ev, html){
  tip.innerHTML = html; tip.style.display = "block";
  const r = map.getContainer().getBoundingClientRect();
  let x = ev.clientX - r.left + 14, y = ev.clientY - r.top + 14;
  if (x + tip.offsetWidth > r.width - 8) x = ev.clientX - r.left - tip.offsetWidth - 14;
  if (y + tip.offsetHeight > r.height - 8) y = ev.clientY - r.top - tip.offsetHeight - 14;
  tip.style.left = x + "px"; tip.style.top = y + "px";
}
function hideTip(){ tip.style.display = "none"; }

/* ---------- detail panel ---------- */
const info = $("#info");
function hideInfo(){ info.classList.remove("show"); S.sel = -1; S.selKind = null; }
$("#infox").onclick = hideInfo;

function typeLabel(r){
  const base = r.wt === 0 ? T("river") : r.wt === 1 ? T("stream") : T("canal");
  return base + " · " + (r.it ? T("intermittent") : T("perennial"));
}

function showReach(i){
  const r = S.reaches[i];
  S.sel = i; S.selKind = "reach";
  const g = groupStats(i);
  const src = g.outlet;
  const q = qOf(src);
  const nm = nameOf(r) || (LANG === "he" ? "נחל ללא שם" : "Unnamed watercourse");
  $("#iname").textContent = nm;
  const alt = LANG === "he" ? r.en : r.he;
  $("#isub").innerHTML = (alt ? esc(alt) + " · " : "") +
    '<span class="pill model">' + T("modelPill") + "</span>" +
    ' <span class="pill src">' +
    (r.src === 1 ? T("src_official") : r.src === 2 ? T("src_net") : T("src_osm")) + "</span>";
  $("#iq").innerHTML = evHeadline(r, q);
  const dl = $("#idl");
  let h = row(T("type"), typeLabel(r)) +
          row(T("length"), "<bdi>" + g.km.toFixed(1) + " km</bdi>" +
              (g.n > 1 ? ' <span style="color:var(--ink-3)">\u00b7 ' + g.n + " " + T("segs") + "</span>" : ""));
  if (g.hi != null && g.lo != null){
    h += row(T("elev_from"), "<bdi>" + Math.round(g.hi) + " \u2192 " + Math.round(g.lo) + " m</bdi>");
    const drop = g.hi - g.lo;
    if (drop > 0 && g.km > 0){
      h += row(T("elev_drop"), "<bdi>" + Math.round(drop) + " m</bdi>");
      h += row(T("elev_grad"), "<bdi>" + (drop / (g.km * 1000) * 100).toFixed(2) + " %</bdi>");
    }
  }
  const conf = r.conf === 1 ? T("rel_fill") : r.conf === 2 ? T("rel_own") : T("rel_low");
  h += row(T("rel"), '<span style="color:' + (r.conf === 2 ? "var(--ink-2)" : "var(--ink-3)") + '">' + conf + "</span>");
  if (r.src === 2)
    h += '<dt></dt><dd style="color:var(--ink-3);font-size:12px;line-height:1.45">' +
         esc(T("src_gapfill")) + "</dd>";
  h += row(T("reg"), regLabel(r));
  if (r.spring){
    const sn = LANG === "he" ? (r.spring.s[3] || r.spring.s[4]) : (r.spring.s[4] || r.spring.s[3]);
    h += row(T("sp_feeds"), esc(sn) + ' <span style="color:var(--ink-3)">\u00b7 <bdi>' +
             r.spring.ls.toFixed(0) + " l/s, " + r.spring.km + " km</bdi></span>");
  }
  if (r.reg && r.reg.rec){
    const rc = r.reg.rec;
    const pct = v => v == null || v < 0 ? "\u2014" : Math.round(v*100) + "%";
    const ev = (rc.c === "R" || rc.c === "U")
      ? T("reg_yrs").replace("%f", pct(rc.yfrac)).replace("%y", rc.years)
      : T("reg_sum").replace("%p", pct(rc.summer)).replace("%y", rc.years);
    h += '<dt></dt><dd style="color:var(--ink-3);font-size:11.5px;line-height:1.45">' +
         esc(T("reg_gauge") + " " + (LANG === "he" ? rc.siteHe || rc.siteEn : rc.siteEn || rc.siteHe)) +
         (r.reg.km != null && r.reg.near ? " <bdi>(" + r.reg.km + " km)</bdi>" : "") +
         "<br>" + esc(ev) +
         (r.reg.near ? "" : "<br>" + esc(T("reg_far").replace("%d", r.reg.km == null ? "?" : r.reg.km))) +
         "</dd>";
  }
  h += row(T("ev"), evLabel(r));
  if (r.basin != null){
    h += row(T("bs_basin"), esc(basinName(r.basin) || "\u2014") +
      (S.basins[r.basin] && S.basins[r.basin].km2
        ? ' <span style="color:var(--ink-3)"><bdi>' + fmtN(Math.round(S.basins[r.basin].km2)) + " km²</bdi></span>" : ""));
    if (r.catch)
      h += row(T("bs_catchrain"), "<bdi>" + r.catch.mm.toFixed(1) + " mm</bdi>" +
        ' <span style="color:var(--ink-3)">' +
        T("bs_over").replace("%n", r.catch.basins).replace("%c", r.catch.cells) + "</span>");
  }
  if (r.radar) h += row(T("ev_radar"), r.radar.wet
      ? '<span style="color:' + pal().cols[3] + '">' + T("ev_radar_wet") + "</span>"
      : '<span style="color:var(--ink-3)">' + T("ev_radar_dry") + "</span>");
  h += row(T("ev_rain"), r.rainUp != null
      ? "<bdi>" + r.rainUp.toFixed(1) + " mm</bdi> <span style=\"color:var(--ink-3)\">" +
        T("ev_rain_days").replace("%n", RAIN_WINDOW) +
        (r.rain && Math.abs(r.rain.mm - r.rainUp) > 0.05
          ? ", " + T("ev_rain_up").replace("%c", r.rain.mm.toFixed(1)) : "") + "</span>"
      : '<span style="color:var(--ink-3)">' + T("nodata") + "</span>");
  if (r.ev === EV_FLOW){
    const w = r.evWhy === "radar"   ? T("ev_why_radar")
            : r.evWhy === "radarup" ? T("ev_why_radarup")
            : r.evWhy === "spring" ? T("ev_why_spring").replace("%s",
                (r.spring ? (LANG === "he" ? (r.spring.s[3] || r.spring.s[4]) : (r.spring.s[4] || r.spring.s[3])) : ""))
                .replace("%v", r.spring ? r.spring.ls.toFixed(0) : "")
            : r.evWhy === "perennial" ? T("ev_why_perennial")
            : r.evWhy === "carried"   ? T("ev_why_carried")
            : r.evWhy === "rain"      ? T("ev_why_rain").replace("%n", RAIN_WINDOW)
            : null;
    if (w) h += '<dt></dt><dd style="color:var(--ink-3);font-size:12px;line-height:1.45">' +
                esc(w) + "</dd>";
  }
  if (r.trans)
    h += '<dt></dt><dd style="color:var(--ink-2);font-size:12px">\u25cb ' +
         esc(T("ev_trans")) + "</dd>";
  if (r.ev === EV_UNVER || r.ev === EV_STOPPED){
    const why = r.evWhy === "carried" ? T("ev_why_carried")
              : r.evWhy === "nocheck" ? T("ev_nocheck_why")
              : r.evWhy === "rare"     ? T("ev_why_rare")
              : r.evWhy === "seasonal" ? T("ev_why_seasonal")
              : r.evWhy === "nearperennial" ? T("ev_why_nearperennial")
              : r.ev === EV_STOPPED    ? T("ev_stopped_why")
              : T("ev_unver_why");
    h += '<dt></dt><dd style="color:var(--ink-3);font-size:12px;line-height:1.45">' +
         esc(why) + "</dd>";
  }
  h += row(T("vsnorm"), '<span id="anomv">' + T("computing") + "</span>");
  dl.innerHTML = h;
  const tb = el("button", "lnk");
  tb.textContent = T("tr_open");
  tb.style.marginTop = "10px";
  tb.onclick = () => showTrace(S.sel);
  dl.parentNode.insertBefore(tb, dl.nextSibling);
  info.classList.add("show");
  drawSpark(src);
  i = src;
  const rr = S.reaches[i];
  if (rr.cell) fetchClimatology(rr.cell).then(c => {
    if (S.sel !== i) return;
    const p = percentileFor(c, S.times[S.dayIdx], q);
    const e = $("#anomv");
    if (e) e.innerHTML = p == null ? T("nodata")
      : '<span style="color:' + anomColour(p) + '">' + anomLabel(p) + ' \u00B7 <bdi>' + p + '%</bdi></span>';
  });
}
function row(k, v){ return "<dt>" + esc(k) + "</dt><dd><bdi>" + v + "</bdi></dd>"; }

/* ---------- saying what is actually known ----------
   The headline is the state first and the number second, because on most of
   this map, on most days, the state is the more honest answer. */
function evHeadline(r, q){
  if (r.ev === EV_STOPPED)
    return '<span style="color:' + pal().dry + ';font-size:20px">' + T("dry") + "</span>";
  if (r.ev === EV_UNVER)
    return '<span style="color:' + pal().unver + ';font-size:19px">' + T("ev_unver") + "</span>" +
           ' <small style="font-size:12px;color:var(--ink-3)">' + T("ev_model_says") +
           " <bdi>" + fmtQ(r.qShow) + " m\u00b3/s</bdi></small>";
  if (r.ev === EV_NODATA || q == null)
    return '<span style="color:' + pal().unknown + ';font-size:19px">' + T("unknown") + "</span>";
  if (q < DRY_Q)
    return '<span style="color:' + pal().dry + ';font-size:20px">' + T("dry") + "</span>";
  return "<bdi>" + fmtQ(q) + " <small>m³/s</small></bdi>";
}
function regLabel(r){
  if (!r.reg || !r.reg.rec)
    return '<span class="pill none">' + esc(T("reg_none")) + "</span>";
  const c = r.reg.rec.c;
  const style = c === "P" ? "ok" : c === "N" ? "cross" : c === "R" ? "dry" : c === "U" ? "none" : "dry";
  return '<span class="pill ' + style + '">' + esc(T("reg_" + c)) + "</span>";
}

function evLabel(r){
  const map = {};
  map[EV_FLOW]    = ['<span class="pill ok">',    T("ev_flow")];
  map[EV_DRY]     = ['<span class="pill dry">',   T("ev_dry")];
  map[EV_STOPPED] = ['<span class="pill dry">',   T("ev_stopped")];
  map[EV_UNVER]   = ['<span class="pill unver">', T("ev_unver")];
  map[EV_NODATA]  = ['<span class="pill none">',  T("ev_none")];
  const e = map[r.ev] || map[EV_NODATA];
  return e[0] + esc(e[1]) + "</span>";
}

function showStation(idx){
  const s = STATIONS.s[idx];
  S.sel = idx; S.selKind = "station";
  const nm = LANG === "he" ? s[1] : (s[2] || s[1]);
  $("#iname").textContent = nm;
  const alt = LANG === "he" ? s[2] : s[1];
  $("#isub").innerHTML = (alt ? esc(alt) + " · " : "") + '<span class="pill meas">' + T("measPill") + "</span>";
  $("#iq").innerHTML = "<bdi>" + (s[11] != null ? fmtQ(s[11]) : "—") + " <small>m³/s</small></bdi>"
    + ' <small style="font-size:12px;font-weight:500;color:var(--ink-3)">' + T("st_max") + "</small>";
  let h = "";
  h += row(T("st_id"), s[0]);
  h += row(T("basin"), esc(STATIONS.b[s[6]] || "—"));
  if (s[5]) h += row(T("st_area"), fmtN(s[5]) + " km²");
  if (s[7] && s[8]) h += row(T("st_rec"), "<bdi>" + s[7] + "–" + s[8] + "</bdi> · <bdi>" + s[9] + "</bdi> " + T("st_years"));
  if (s[10] != null) h += row(T("st_vol"), s[10].toFixed(2) + " MCM");
  if (s[12]) h += row(T("st_on"), s[12]);
  const meas = measuredMeanQ(s);
  if (meas != null) h += row(T("ver_meas"), fmtQ(meas) + " m\u00b3/s");
  h += '<dt>' + esc(T("ver_model")) + '</dt><dd id="vmodel"><bdi>' + T("computing") + '</bdi></dd>';
  $("#idl").innerHTML = h;
  const sp = $("#spark"); sp.getContext("2d").clearRect(0,0,sp.width,sp.height);
  info.classList.add("show");

  /* the one number that answers "is this believable": what the model says the
     long-run mean is here, beside what the gauge actually recorded */
  if (meas != null) validateStation(idx).then(r => {
    if (S.sel !== idx || S.selKind !== "station") return;
    const c = $("#vmodel");
    if (!c) return;
    if (!r){ c.innerHTML = "<bdi>" + T("nodata") + "</bdi>"; return; }
    const ratio = r.model / r.meas;
    const band = ratio >= 0.5 && ratio <= 2 ? "ok" : ratio >= 1/3 && ratio <= 3 ? "mid" : "off";
    c.innerHTML = "<bdi>" + fmtQ(r.model) + " m\u00b3/s</bdi>" +
      ' <span class="vr ' + band + '"><bdi>' +
      (ratio >= 1 ? "\u00d7" + ratio.toFixed(1) : "\u00f7" + (1/ratio).toFixed(1)) +
      "</bdi></span>";
  });
}

function showCrossing(idx){
  const c = S.crossings[idx];
  S.sel = idx; S.selKind = "crossing";
  const nm = LANG === "he" ? (c.he || c.en) : (c.en || c.he);
  $("#iname").textContent = nm || T("crossing");
  $("#isub").innerHTML = '<span class="pill cross">' + T("crossing") + "</span>";
  $("#iq").innerHTML = '<span style="font-size:18px">' + esc(crossingLabel(c)) + "</span>";
  $("#idl").innerHTML =
    row(T("cross_of"), esc(T("b_" + c.cls))) +
    row("lat, lon", "<bdi>" + c.lat.toFixed(4) + ", " + c.lon.toFixed(4) + "</bdi>");
  const sp = $("#spark"); sp.getContext("2d").clearRect(0,0,sp.width,sp.height);
  info.classList.add("show");
}

/* A water body says what OSM calls it, and whether this map is willing to
   claim there is water in it. The tags are shown so the claim can be checked
   rather than believed. */
function showWater(idx){
  const w = S.water.polys[idx];
  S.sel = idx; S.selKind = "water";
  const nm = (LANG === "he" ? (w.he || w.en) : (w.en || w.he)) || T("w_body");
  $("#iname").textContent = nm;
  $("#isub").innerHTML = '<span class="pill ' + (w.wet ? "ok" : "none") + '">' +
    esc(T("w_" + (w.k || "unknown"))) + "</span>" +
    ' <span class="pill src">' + T("src_osm") + "</span>";
  $("#iq").innerHTML = w.wet
    ? '<span style="color:' + pal().waterEdge + ';font-size:19px">' + T("w_wet") + "</span>"
    : '<span style="color:' + pal().dry + ';font-size:19px">' + T("l_basin") + "</span>";
  let h = row(T("w_kind"), esc(T("w_" + (w.k || "unknown"))));
  if (w.a) h += row(T("w_area"), "<bdi>" + w.a.toFixed(2) + " km²</bdi>");
  if (w.tg) h += row(T("w_tags"), '<code style="font-size:11px">' + esc(w.tg) + "</code>");
  h += '<dt></dt><dd style="color:var(--ink-3);font-size:12px;line-height:1.45">' +
       esc(w.wet ? T("w_src") : T("w_dry") + " " + T("w_src")) + "</dd>";
  $("#idl").innerHTML = h;
  const sp = $("#spark"); sp.getContext("2d").clearRect(0,0,sp.width,sp.height);
  info.classList.add("show");
}

function showSpring(idx){
  const s = springsList()[idx];
  S.sel = idx; S.selKind = "spring";
  const nm = (LANG === "he" ? (s[3] || s[4]) : (s[4] || s[3])) || T("sp_layer");
  $("#iname").textContent = nm;
  const alt = LANG === "he" ? s[4] : s[3];
  const kind = { reg:"sp_reg", survey:"sp_survey", old:"sp_old", unk:"sp_unk" }[s[5]] || "sp_unk";
  $("#isub").innerHTML = (alt ? esc(alt) + " \u00b7 " : "") +
    '<span class="pill meas">' + T("measPill") + "</span>" +
    ' <span class="pill src">' + esc(T(kind)) + "</span>";
  const v = s[10] != null ? s[10] : s[7];
  $("#iq").innerHTML = "<bdi>" + (v == null ? "\u2014" : v.toFixed(1)) + " <small>l/s</small></bdi>" +
    ' <small style="font-size:12px;font-weight:500;color:var(--ink-3)">' +
    (s[10] != null ? T("sp_summer") : T("sp_mean")) + "</small>";
  let h = "";
  if (s[7]  != null) h += row(T("sp_mean"),   "<bdi>" + s[7].toFixed(1) + " l/s</bdi>");
  if (s[10] != null) h += row(T("sp_summer"), "<bdi>" + s[10].toFixed(1) + " l/s</bdi>");
  if (s[8]  != null) h += row(T("sp_last"),   "<bdi>" + s[8].toFixed(2) + " l/s</bdi>" +
                                (s[9] ? ' <span style="color:var(--ink-3)">' + esc(s[9]) + "</span>" : ""));
  if (s[11] != null) h += row(T("sp_wet"), Math.round(s[11]*100) + "%");
  h += row(T("sp_n"), fmtN(s[6]));
  h += '<dt></dt><dd style="color:var(--ink-3);font-size:12px;line-height:1.45">' +
       esc(T("sp_note")) + "</dd>";
  $("#idl").innerHTML = h;
  const sp = $("#spark"); sp.getContext("2d").clearRect(0,0,sp.width,sp.height);
  info.classList.add("show");
}

function showSampling(idx){
  const p = S.sampling[idx];
  S.sel = idx; S.selKind = "sampling";
  $("#iname").textContent = p.point || T("sampling");
  $("#isub").innerHTML = '<span class="pill samp">' + T("sampling") + "</span>";
  $("#iq").innerHTML = '<span style="font-size:19px">' + esc(p.stream) + "</span>";
  $("#idl").innerHTML = row(T("basin"), esc(p.stream)) +
    row("lat, lon", "<bdi>" + p.lat.toFixed(4) + ", " + p.lon.toFixed(4) + "</bdi>");
  const sp = $("#spark"); sp.getContext("2d").clearRect(0,0,sp.width,sp.height);
  info.classList.add("show");
}

/* ---------- sparkline: 7 past + today + 7 forecast ---------- */
function drawSpark(i){
  const c = $("#spark"), g = c.getContext("2d");
  const w = c.clientWidth || 250, h = 44;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  c.width = w*dpr; c.height = h*dpr; g.setTransform(dpr,0,0,dpr,0,0);
  g.clearRect(0,0,w,h);
  const r = S.reaches[i], f = r.cell && S.flow.get(r.cell);
  if (!f) return;
  const q = f.q.map(v => (v == null || !isFinite(v)) ? 0 : v);
  const max = Math.max.apply(null, q) || 1, min = Math.min.apply(null, q);
  const pad = 4, yy = v => h - pad - (v - min) / ((max - min) || 1) * (h - pad*2);
  const xx = k => pad + k / (q.length - 1) * (w - pad*2);
  g.beginPath(); g.moveTo(xx(0), h);
  for (let k = 0; k < q.length; k++) g.lineTo(xx(k), yy(q[k]));
  g.lineTo(xx(q.length-1), h); g.closePath();
  g.fillStyle = "rgba(57,135,229,.18)"; g.fill();
  g.beginPath();
  for (let k = 0; k < q.length; k++) k ? g.lineTo(xx(k), yy(q[k])) : g.moveTo(xx(k), yy(q[k]));
  g.strokeStyle = "#6da7ec"; g.lineWidth = 1.6; g.stroke();
  const k0 = S.dayIdx;
  g.beginPath(); g.arc(xx(k0), yy(q[k0]), 3, 0, 7); g.fillStyle = "#ffd24a"; g.fill();
  g.font = "9px " + getComputedStyle(document.body).fontFamily;
  g.fillStyle = "#6e7c86"; g.textAlign = "start";
  g.fillText(T("past"), pad, 9);
  g.textAlign = "end"; g.fillText(T("fc"), w - pad, 9);
}

/* ---------- map interaction ---------- */
let lastSpringFloor = -1;
map.on("moveend zoomend resize", () => {
  reset();
  /* rebuild the spring layer only when the threshold actually changes */
  const f = springMinLs(map.getZoom());
  if (f !== lastSpringFloor){ lastSpringFloor = f; buildSprings(); }
});
map.on("zoomstart movestart", hideTip);
map.getContainer().addEventListener("mousemove", ev => {
  const r = map.getContainer().getBoundingClientRect();
  const x = ev.clientX - r.left, y = ev.clientY - r.top;
  const i = pick(x, y);
  if (i !== S.hover){ S.hover = i; map.getContainer().style.cursor = i >= 0 ? "pointer" : ""; }
  if (overStation) return;
  const xc = pickCrossing(x, y);
  if (xc >= 0){
    const c = S.crossings[xc];
    const nm = LANG === "he" ? (c.he || c.en) : (c.en || c.he);
    map.getContainer().style.cursor = "pointer";
    showTip(ev, "<b>" + esc(nm || T("crossing")) + "</b>" +
      '<div class="q">' + esc(crossingLabel(c)) + "</div>" +
      '<div class="m">' + esc(T("b_" + c.cls)) + "</div>");
    return;
  }
  if (i >= 0){
    const rr = S.reaches[i], q = qOf(i);
    const nm = nameOf(rr) || (LANG === "he" ? "נחל ללא שם" : "Unnamed watercourse");
    const qline =
      rr.ev === EV_UNVER ? '<div class="q" style="color:' + pal().unver + '">' + T("ev_unver") + "</div>"
      : rr.ev === EV_NODATA || q == null ? '<div class="q" style="color:' + pal().unknown + '">' + T("unknown") + "</div>"
      : q < DRY_Q ? '<div class="q" style="color:' + pal().dry + '">' + T("dry") + "</div>"
      : '<div class="q"><bdi>' + fmtQ(q) + " m³/s</bdi></div>";
    showTip(ev, "<b>" + esc(nm) + "</b>" + qline + '<div class="m">' + esc(typeLabel(rr)) + "</div>");
    return;
  }
  const wi = pickWater(x, y);
  if (wi >= 0){
    const w = S.water.polys[wi];
    const wn = (LANG === "he" ? (w.he || w.en) : (w.en || w.he)) || T("w_body");
    map.getContainer().style.cursor = "pointer";
    showTip(ev, "<b>" + esc(wn) + "</b>" +
      '<div class="q" style="color:' + (w.wet ? pal().waterEdge : pal().dry) + '">' +
      esc(w.wet ? T("w_wet") : T("l_basin")) + "</div>" +
      '<div class="m">' + esc(T("w_" + (w.k || "unknown"))) + "</div>");
  } else hideTip();
});
map.getContainer().addEventListener("mouseleave", () => { S.hover = -1; hideTip(); });
function pickCrossing(x, y){
  if (!S.layers.crossings) return -1;
  let best = -1, bd = 11*11;
  for (let i = 0; i < XP.length; i++){
    const p = XP[i];
    const d = (p[0]-x)*(p[0]-x) + (p[1]-y)*(p[1]-y);
    if (d < bd){ bd = d; best = i; }
  }
  return best;
}
map.on("click", e => {
  const p = map.latLngToContainerPoint(e.latlng);
  const c = pickCrossing(p.x, p.y);
  if (c >= 0){ showCrossing(c); return; }
  const i = pick(p.x, p.y);
  if (i >= 0){ showReach(i); return; }
  const w = pickWater(p.x, p.y);
  if (w >= 0) showWater(w); else hideInfo();
});

/* ---------- controls ---------- */
function applyLang(){
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === "he" ? "rtl" : "ltr";
  document.querySelectorAll("[data-t]").forEach(n => { n.textContent = T(n.dataset.t); });
  const ln = $("#relnote"); if (ln) ln.textContent = T("rel_note");
  $("#q").placeholder = T("ph");
  const hb = $("#homebtn"); if (hb){ hb.title = T("home"); hb.setAttribute("aria-label", T("home")); }
  document.querySelectorAll("#langseg button").forEach(b => b.classList.toggle("on", b.dataset.lang === LANG));
  buildLegend(); buildAbout(); buildBaseMenu(); updateStat();
  buildStations(); buildSampling(); buildSprings(); invalidate();
  if (S.layers.stations) stationLayer.addTo(map);
  if (S.layers.sampling) samplingLayer.addTo(map);
  if (S.layers.springs) springLayer.addTo(map);
  if (S.selKind === "reach" && S.sel >= 0) showReach(S.sel);
  else if (S.selKind === "station" && S.sel >= 0) showStation(S.sel);
  else if (S.selKind === "sampling" && S.sel >= 0) showSampling(S.sel);
  else if (S.selKind === "crossing" && S.sel >= 0) showCrossing(S.sel);
  else if (S.selKind === "water" && S.sel >= 0) showWater(S.sel);
  else if (S.selKind === "spring" && S.sel >= 0) showSpring(S.sel);
  try{ localStorage.setItem("rfil_lang", LANG); }catch(e){}
}
document.querySelectorAll("#langseg button").forEach(b => b.onclick = () => { LANG = b.dataset.lang; applyLang(); });

function buildLegend(){
  const b = v => "<bdi>" + v + " m\u00B3/s</bdi>";
  const labels = [
    b("0.01 \u2013 0.05"), b("0.05 \u2013 0.5"), b("0.5 \u2013 2"),
    b("2 \u2013 20"), T("over") + " " + b("20"),
    T("dry") + " <bdi>(" + T("under") + " 0.01)</bdi>",
    T("ev_unver"), T("unknown")
  ];
  const cols = pal().cols.concat([pal().dry, pal().unver, pal().unknown]);
  /* the last three states carry their stroke pattern into the legend, so the
     reader learns that dashed means unverified and dotted means no data —
     colour is never asked to do the job on its own */
  const dashed = (c, on, off) =>
    "background:repeating-linear-gradient(90deg," + c + " 0 " + on + "px,transparent " + on + "px " + (on+off) + "px)";
  const swatch = i =>
    i === 5 ? "background:" + cols[5] :
    i === 6 ? dashed(cols[6], 5, 5) :
    i === 7 ? dashed(cols[7], 2, 4) : "background:" + cols[i];
  $("#lgrid").innerHTML = labels.map((l,i) =>
    '<div class="lswatch" style="' + swatch(i) + '"></div><span>' + l + "</span>").join("") +
    '<div class="lswatch" style="background:' + pal().dryWater + ';border:1px dashed ' + pal().dryWaterEdge + '"></div>' +
    "<span>" + T("l_basin") + "</span>" +
    '<div class="lswatch" style="background:transparent;position:relative">' +
      '<span style="position:absolute;inset-inline-start:11px;top:-4px;width:11px;height:11px;' +
      'background:' + pal().cross + ';transform:rotate(45deg);border-radius:2px"></span></div>' +
    "<span>" + T("l_cross") + "</span>";
}

$("#speed").oninput = e => {
  S.speed = +e.target.value / 10;
  $("#speedv").textContent = S.speed.toFixed(1) + "\u00D7";
};
$("#minq").onchange = e => { S.minQ = +e.target.value; invalidate(); };
$("#day").oninput = e => {
  const d = +e.target.value;
  S.dayIdx = 7 + d;
  $("#dayv").textContent = d === 0 ? T("today")
    : (d > 0 ? "+" : "\u2212") + Math.abs(d) + " " + T("dunit");
  reliabilityPass();
  if (S.selKind === "reach" && S.sel >= 0) showReach(S.sel);
  invalidate(); updateStat();
};
document.querySelectorAll("#ctl .ghead").forEach(h => {
  h.onclick = () => {
    const g = h.parentNode;
    g.classList.toggle("open");
    h.querySelector(".gcar").textContent = g.classList.contains("open") ? "\u25be" : "\u25b8";
  };
});
document.querySelectorAll("#ctl label[data-k]").forEach(l => {
  l.onclick = () => {
    const k = l.dataset.k;
    S.layers[k] = !S.layers[k];
    l.querySelector(".sw").classList.toggle("on", S.layers[k]);
    if (k === "stations") S.layers.stations ? stationLayer.addTo(map) : map.removeLayer(stationLayer);
    if (k === "sampling") S.layers.sampling ? samplingLayer.addTo(map) : map.removeLayer(samplingLayer);
    if (k === "springs") S.layers.springs ? springLayer.addTo(map) : map.removeLayer(springLayer);
    if (k === "radar" && radarLayer) S.layers.radar ? radarLayer.addTo(map) : map.removeLayer(radarLayer);
    if (k === "anom" && S.layers.anom) computeAnomalies();
    invalidate();
  };
});

/* ---------- flow vs normal for the biggest reaches in view ---------- */
let anomBusy = false;
async function computeAnomalies(){
  if (anomBusy) return;
  anomBusy = true;
  const seen = new Set(), todo = [];
  const ranked = S.reaches.map((r,i)=>[i, qOf(i)]).filter(a => a[1] != null)
    .sort((a,b)=>b[1]-a[1]);
  for (const [i] of ranked){
    const c = S.reaches[i].cell;
    if (!c || seen.has(c)) continue;
    seen.add(c); todo.push(i);
    if (todo.length >= 25) break;
  }
  for (const i of todo){
    const c = await fetchClimatology(S.reaches[i].cell);
    const p = percentileFor(c, S.times[S.dayIdx], qOf(i));
    if (p != null){
      for (let j = 0; j < S.reaches.length; j++)
        if (S.reaches[j].cell === S.reaches[i].cell) S.anom.set(j, p);
    }
  }
  anomBusy = false;
}

/* ---------- search ---------- */
const qbox = $("#q"), qres = $("#qres");
qbox.oninput = () => {
  const v = qbox.value.trim().toLowerCase();
  qres.innerHTML = "";
  if (v.length < 2) return;
  const hits = [];
  const seen = new Set();
  for (let i = 0; i < S.reaches.length; i++){
    const r = S.reaches[i];
    const n1 = (r.he||"").toLowerCase(), n2 = (r.en||"").toLowerCase();
    if ((n1 && n1.includes(v)) || (n2 && n2.includes(v))){
      const key = r.he + "|" + r.en;
      if (seen.has(key)) continue;
      seen.add(key); hits.push({ kind:"reach", i:i, label:nameOf(r) });
      if (hits.length > 7) break;
    }
  }
  STATIONS.s.forEach((s, idx) => {
    if (hits.length > 11) return;
    if ((s[1]||"").toLowerCase().includes(v) || (s[2]||"").toLowerCase().includes(v))
      hits.push({ kind:"station", i:idx, label:(LANG==="he"?s[1]:(s[2]||s[1])) });
  });
  if (!hits.length){ qres.innerHTML = '<div style="font-size:11px;color:var(--ink-3);padding:4px 2px">' + T("noresult") + "</div>"; return; }
  for (const h of hits){
    const b = el("button", "btn");
    b.style.cssText = "width:100%;text-align:start;margin-top:4px";
    b.innerHTML = (h.kind === "station" ? '<span style="color:var(--accent)">◉</span> ' : '<span style="color:var(--q3)">≈</span> ') + esc(h.label);
    b.onclick = () => {
      if (h.kind === "reach"){
        const g = S.reaches[h.i].g;
        map.fitBounds(L.latLngBounds(g.map(p => [p[1], p[0]])), { padding:[80,80], maxZoom:13 });
        setTimeout(() => showReach(h.i), 350);
      } else {
        const s = STATIONS.s[h.i];
        map.setView([s[3], s[4]], 12);
        showStation(h.i);
      }
      qres.innerHTML = ""; qbox.value = "";
    };
    qres.appendChild(b);
  }
};

/* ---------- stat line ---------- */
function updateStat(){
  const n = S.reaches.length;
  let flowing = 0, unver = 0;
  for (let i = 0; i < n; i++){
    const r = S.reaches[i];
    if (r.ev === EV_UNVER) unver++;
    else if (r.ev === EV_FLOW) flowing++;
    else if (r.ev === undefined){ const q = qOf(i); if (q != null && q >= DRY_Q) flowing++; }
  }
  const d = S.times[S.dayIdx] || "";
  $("#stat").innerHTML =
    "<b>" + fmtN(n) + "</b> " + T("reaches") +
    " · <b>" + fmtN(flowing) + "</b> " + T("flowing") +
    (unver ? ' · <b style="color:' + pal().unver + '">' + fmtN(unver) + "</b> " + T("ev_unver") : "") +
    " · <b>" + fmtN(STATIONS.s.length) + "</b> " + T("gauges") +
    (d ? " · " + T("asof") + " <b><bdi>" + d + "</bdi></b>" : "");
}

/* ---------- basemap picker ---------- */
const BASE_SWATCH = {
  dark:"linear-gradient(135deg,#2a3138,#0d0f11)",
  hill:"linear-gradient(135deg,#e8e3da,#9b9186)",
  topo:"linear-gradient(135deg,#dfeacb,#b9a37e)",
  sat:"linear-gradient(135deg,#4b6b3a,#243a52)"
};
function buildBaseMenu(){
  const m = $("#basemenu");
  m.innerHTML = '<p id="basehint">' + T("bm_hint") + "</p>" +
    BASE_ORDER.map(id =>
      '<button class="bopt' + (S.basemap === id ? " on" : "") + '" data-b="' + id + '">' +
      '<span class="bswatch" style="background:' + BASE_SWATCH[id] + '"></span>' +
      "<span>" + T("bm_" + id) + "</span></button>").join("") +
    '<label class="bopt" id="lblopt" style="margin-top:8px">' +
      '<i class="sw' + (S.layers.labels ? " on" : "") + '">' +
      '<svg viewBox="0 0 10 10"><path d="M1 5l2.6 2.6L9 2" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg></i>' +
      "<span>" + T("bm_labels") + "</span></label>";
  m.querySelectorAll(".bopt[data-b]").forEach(b => b.onclick = () => {
    setBasemap(b.dataset.b).then(() => {
      buildBaseMenu();
      if (S.selKind === "reach" && S.sel >= 0) showReach(S.sel);
    });
  });
  const lo = $("#lblopt");
  if (lo) lo.onclick = () => {
    S.layers.labels = !S.layers.labels;
    setBasemap(S.basemap).then(buildBaseMenu);
  };
}
$("#basebtn").onclick = () => $("#basemenu").classList.toggle("open");

/* ---------- trace: one river, segment by segment ----------
   Every number the map used to decide, in the order the water runs, so a
   claim about a river can be checked rather than argued with. */
async function showTrace(i){
  /* if the national network has not been asked about this river yet, ask now:
     it is the difference between a measured order and an inferred one */
  const r0 = S.reaches[i];
  if (!r0.spine && riverNameHe(r0)){
    $("#tracebody").innerHTML = "<h2>" + esc(nameOf(r0) || T("tr_unnamed")) + "</h2>" +
      '<p style="color:var(--ink-2)">' + esc(T("tr_fetch")) + "</p>";
    $("#trace").classList.add("show");
    try{
      const sp = await ensureSpine(r0);
      if (sp){ assignSpines(); reliabilityPass(); invalidate(); updateStat(); }
    }catch(e){}
  }
  const t = riverTrace(i);
  const st = ev => ev === EV_FLOW ? ["ok", T("ev_flow")]
                 : ev === EV_DRY ? ["dry", T("ev_dry")]
                 : ev === EV_STOPPED ? ["dry", T("ev_stopped")]
                 : ev === EV_UNVER ? ["unver", T("ev_unver")]
                 : ["none", T("ev_none")];
  const num = (v, u, d) => v == null ? "\u2014" : "<bdi>" + (+v).toFixed(d == null ? 1 : d) + (u || "") + "</bdi>";
  let h = "<h2>" + esc(t.name || T("tr_unnamed")) + "</h2>" +
    '<p style="color:var(--ink-2);font-size:13px;margin:2px 0 0">' + esc(T("tr_lede")) + "</p>";

  h += '<div id="trhead">' +
    "<div><b>" + t.n + "</b><span>" + esc(T("segs")) + "</span></div>" +
    "<div><b>" + t.pieces + "</b><span>" + esc(T("tr_pieces")) + "</span></div>" +
    "<div><b>" + num(t.maxGap, " km", 2) + "</b><span>" + esc(T("tr_maxgap")) + "</span></div>" +
    "<div><b>" + num(t.coastKm, " km", 1) + "</b><span>" + esc(T("tr_coast")) + "</span></div>" +
    "<div><b>" + t.nodata + "</b><span>" + esc(T("tr_nodata")) + "</span></div>" +
    "</div>";

  if (t.net != null)
    h += '<p style="font-size:12.5px;color:var(--ink-2)">' +
      esc(T("tr_net").replace("%o", t.ord).replace("%k", t.netKm == null ? "?" : t.netKm.toFixed(1))) +
      (t.mouthGap != null
        ? " " + esc(t.mouthGap <= 1 ? T("tr_mouth_ok")
                    : T("tr_mouth_gap").replace("%d", t.mouthGap.toFixed(1))) : "") + "</p>";
  else
    h += '<p style="font-size:12.5px;color:var(--ink-3)">' + esc(T("tr_nonet")) + "</p>";
  if (t.endsShort)
    h += '<p class="warn" style="font-size:12.5px">' + esc(T("tr_short").replace("%d", t.coastKm)) + "</p>";
  if (t.pieces > 1)
    h += '<p style="font-size:12.5px;color:var(--ink-3)">' +
         esc(T("tr_split").replace("%n", t.pieces).replace("%g", t.maxGap)) + "</p>";

  h += '<table id="trtable"><thead><tr>' +
    ["#", T("length"), t.ordBy === "acc" ? T("tr_acc") : T("elev_from"),
     T("q_now"), T("ev_rain"), T("reg"), T("ev")]
      .map(x => "<th>" + esc(x) + "</th>").join("") + "</tr></thead><tbody>";
  t.steps.forEach((s2, k) => {
    const e = st(s2.ev);
    h += '<tr class="' + (s2.gap != null && s2.gap > 3 ? "gap" : "") + '">' +
      "<td>" + (k+1) + (s2.trans ? " \u25cb" : "") + "</td>" +
      "<td>" + num(s2.km, " km") + "</td>" +
      "<td>" + (t.ordBy === "acc"
        ? (s2.acc == null ? "\u2014" : "<bdi>" + s2.acc.toFixed(1) + " km</bdi>")
        : (s2.el == null ? "\u2014" : "<bdi>" + Math.round(s2.el) + " m</bdi>")) + "</td>" +
      "<td>" + (s2.q == null ? "\u2014" : "<bdi>" + fmtQ(s2.q) + "</bdi>") + "</td>" +
      "<td>" + num(s2.rainUp, " mm") + "</td>" +
      "<td>" + (s2.reg ? esc(T("reg_" + s2.reg).split(" \u2014 ")[0]) : "\u2014") + "</td>" +
      '<td class="st" style="color:' + (s2.ev === EV_FLOW ? pal().cols[2]
        : s2.ev === EV_UNVER ? pal().unver : s2.ev === EV_NODATA ? pal().unknown : pal().dry) +
        '">' + esc(e[1]) + "</td></tr>";
    if (s2.gap != null && s2.gap > 3)
      h += '<tr><td colspan="7" style="color:var(--warning);font-size:11px">' +
           esc(T("tr_gap").replace("%g", s2.gap)) + "</td></tr>";
  });
  h += "</tbody></table>";
  $("#tracebody").innerHTML = h;
  $("#trace").classList.add("show");
}
$("#tracex").onclick = () => $("#trace").classList.remove("show");
$("#trace").onclick = e => { if (e.target.id === "trace") $("#trace").classList.remove("show"); };

/* ---------- about ---------- */
$("#aboutbtn").onclick = () => $("#about").classList.add("show");
$("#aboutx").onclick = () => $("#about").classList.remove("show");
$("#about").onclick = e => { if (e.target.id === "about") $("#about").classList.remove("show"); };

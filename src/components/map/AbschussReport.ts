import { ABSCHUSS_TYPES, MARKER_TYPE_BY_KEY, type JagdMapData } from "@/lib/jagdmap";
import { getSpeciesByKeyAnyState } from "@/lib/species";

/**
 * Builds the self-contained "Abschuss-Statistik" HTML report.
 *
 * The returned document contains everything (inline CSS + inline JS + inlined
 * data + base64-encoded species icons). It opens offline on any device and
 * loads nothing from outside. Year, Wildart and Schütze stay selectable and
 * the hotspot map reacts to the filters.
 */

const ICON_FILES: Record<string, string> = {
  deer: "deer.png",
  boar: "boar.png",
  fox: "fox.png",
  badger: "badger.png",
  raccoon: "raccoon.png",
  fasan: "fasan.png",
  duck: "duck.png",
  hare: "hare.png",
  kaninchen: "kaninchen.png",
  schnepfe: "schnepfe.png",
};

async function fetchIconDataUrl(iconName: string): Promise<string> {
  const file = ICON_FILES[iconName];
  if (!file) return "";
  try {
    const res = await fetch(`/icons/wildarten/${file}`);
    if (!res.ok) return "";
    const blob = await res.blob();
    return await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
      reader.onerror = () => resolve("");
      reader.readAsDataURL(blob);
    });
  } catch {
    return "";
  }
}

export async function buildAbschussReportHtml(data: JagdMapData): Promise<string> {
  const presentSpecies: Record<string, { n: string; ic: string }> = {};
  const presentTypes: Record<string, { label: string; color: string; icon: string }> = {};

  for (const m of data.markers) {
    if (!ABSCHUSS_TYPES.includes(m.type)) continue;
    for (const a of m.abschuesse ?? []) {
      const wk = a.wildart.trim().toLowerCase();
      if (wk && !presentSpecies[wk]) {
        const s = getSpeciesByKeyAnyState(wk);
        presentSpecies[wk] = { n: s?.n ?? wk, ic: s?.ic ?? "deer" };
      }
    }
  }
  for (const m of data.markers) {
    if (!presentTypes[m.type]) {
      const t = MARKER_TYPE_BY_KEY[m.type];
      presentTypes[m.type] = { label: t.label, color: t.color, icon: t.icon };
    }
  }

  const iconNames = Array.from(new Set(Object.values(presentSpecies).map((s) => s.ic)));
  const icons: Record<string, string> = {};
  await Promise.all(iconNames.map(async (ic) => { icons[ic] = await fetchIconDataUrl(ic); }));

  const payload = {
    exportedAt: new Date().toISOString(),
    boundary: data.boundary,
    markers: data.markers.map((m) => ({
      id: m.id,
      type: m.type,
      name: m.name,
      lat: m.lat,
      lng: m.lng,
      abschuesse: m.abschuesse ?? [],
    })),
    species: presentSpecies,
    types: presentTypes,
    icons,
    abschussTypes: ABSCHUSS_TYPES,
  };

  // Escape "<" so user-supplied text can never break out of the <script> block.
  const dataJson = JSON.stringify(payload).replace(/</g, "\\u003c");
  const script = REPORT_JS.replace("__REPORT_DATA__", dataJson);

  return (
    "<!doctype html>\n" +
    '<html lang="de">\n' +
    "<head>\n" +
    '<meta charset="utf-8">\n' +
    '<meta name="viewport" content="width=device-width, initial-scale=1">\n' +
    "<title>Abschuss-Statistik – Hanseller Pirschpilot</title>\n" +
    "<style>\n" +
    REPORT_CSS +
    "</style>\n" +
    "</head>\n" +
    "<body>\n" +
    '<div class="wrap">\n' +
    "  <header>\n" +
    "    <h1>Abschuss-Statistik</h1>\n" +
    '    <div class="meta">Stand: <span id="stamp"></span> · schreibgeschützter Bericht</div>\n' +
    "  </header>\n" +
    '\n  <section class="kpis" aria-label="Kennzahlen">\n' +
    '    <div class="kpi main">\n' +
    '      <div class="k">Strecke · <span id="kpi-period">Gesamt</span></div>\n' +
    '      <div class="v"><span id="kpi-total">0</span> Stück</div>\n' +
    "    </div>\n" +
    "  </section>\n" +
    '\n  <section class="card">\n' +
    '    <h2 class="section-label">Abschüsse pro Jahr</h2>\n' +
    '    <div class="chips" id="year-strip"></div>\n' +
    "  </section>\n" +
    '\n  <section class="grid">\n' +
    '    <div class="card">\n' +
    '      <h2 class="section-label">Nach Wildart</h2>\n' +
    '      <div class="rows" id="wildart-list"></div>\n' +
    "    </div>\n" +
    '    <div class="card">\n' +
    '      <h2 class="section-label">Nach Schütze</h2>\n' +
    '      <div class="rows" id="schuetze-list"></div>\n' +
    "    </div>\n" +
    "  </section>\n" +
    '\n  <div class="toolbar">\n' +
    '    <button type="button" id="reset-filters" class="btn" style="display:none">Alle Filter zurücksetzen</button>\n' +
    '    <span class="hint">Klicken zum Filtern · erneut klicken zum Abwählen</span>\n' +
    "  </div>\n" +
    '\n  <section class="card mapcard">\n' +
    '    <div id="map-wrap">\n' +
    '      <canvas id="heat-canvas" aria-hidden="true"></canvas>\n' +
    '      <svg id="map-svg" role="img" aria-label="Abschuss-Karte mit Hotspots"></svg>\n' +
    "    </div>\n" +
    '    <div class="legend">\n' +
    '      <span class="item heat"><span class="key">wenig</span><span class="sw heat" id="heat-bar"></span><span class="key">viel</span></span>\n' +
    '      <span class="item"><span class="sw hot"></span> mit Abschuss</span>\n' +
    '      <span class="item"><span class="sw cold"></span> ohne Abschuss</span>\n' +
    "    </div>\n" +
    "  </section>\n" +
    "\n  <footer>\n" +
    "    <p>Einträge ohne Datum zählen in den Summen mit, erscheinen aber nicht in der Jahresansicht.</p>\n" +
    "    <p>Alle Zahlen werden beim Öffnen live aus den gespeicherten Abschuss-Einträgen berechnet.</p>\n" +
    "  </footer>\n" +
    "</div>\n" +
    "<script>\n" +
    script +
    "</script>\n" +
    "</body>\n" +
    "</html>\n"
  );
}

const REPORT_CSS = `
:root{
  --bg:#F6F3EC; --bg-soft:#FBF9F4; --card:#FFFFFF; --line:#E5DFD3;
  --ink:#16211B; --ink-2:#4B584F; --ink-3:#7C877F;
  --green:#2E7D4F; --green-soft:#E4F1E7;
}
*{box-sizing:border-box; -webkit-tap-highlight-color:transparent;}
html,body{margin:0;padding:0;}
body{
  font-family:-apple-system,BlinkMacSystemFont,"SF Pro Text","Segoe UI",Inter,Roboto,Helvetica,Arial,sans-serif;
  color:var(--ink); background:var(--bg); -webkit-font-smoothing:antialiased;
}
.wrap{max-width:1000px;margin:0 auto;padding:20px 16px 60px;}
h1{font-size:26px;font-weight:800;letter-spacing:-.5px;margin:0;}
.meta{color:var(--ink-3);font-size:13px;font-weight:600;margin-top:4px;}
.card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:18px;box-shadow:0 1px 2px rgba(20,40,28,.06),0 4px 14px rgba(20,40,28,.05);}
.section-label{font-size:12px;font-weight:800;letter-spacing:1.1px;text-transform:uppercase;color:var(--ink-3);margin:0 0 10px;}
.kpis{display:grid;grid-template-columns:1fr;gap:12px;margin:16px 0;}
.kpi{border-radius:16px;padding:14px 16px;}
.kpi.main{background:var(--green);color:#fff;}
.kpi.main .v{font-size:34px;font-weight:800;letter-spacing:-1px;line-height:1;}
.kpi .k{font-size:12px;font-weight:700;opacity:.85;text-transform:uppercase;letter-spacing:.4px;}
.kpi .v{font-size:24px;font-weight:800;margin-top:2px;line-height:1;}
.chips{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.chip{border:1px solid var(--line);background:var(--card);border-radius:999px;padding:7px 13px;font-size:13.5px;font-weight:700;color:var(--ink-2);cursor:pointer;}
.chip b{font-weight:800;margin-left:4px;}
.chip.sel{background:var(--green);border-color:var(--green);color:#fff;}
.chip.muted{background:transparent;color:var(--ink-3);cursor:default;font-weight:600;}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:16px 0;}
.rows{display:flex;flex-direction:column;gap:6px;}
.row{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1px solid var(--line);background:var(--bg-soft);border-radius:14px;padding:8px 10px;cursor:pointer;font:inherit;}
.row .ico{width:30px;height:30px;flex:none;border-radius:9px;overflow:hidden;background:#fff;border:1px solid var(--line);display:grid;place-items:center;}
.row .ico img{width:100%;height:100%;object-fit:cover;}
.row .ico.who::before{content:"";width:12px;height:12px;border-radius:50%;background:var(--green);}
.row .lbl{flex:1;min-width:0;font-size:14px;font-weight:650;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
.row .cnt{font-size:13px;font-weight:800;color:var(--green);background:var(--green-soft);border-radius:999px;padding:3px 9px;min-width:26px;text-align:center;}
.row .pct{font-size:12px;font-weight:600;color:var(--ink-3);width:44px;text-align:right;}
.row.zero{opacity:.5;}
.row.sel{border-color:var(--green);background:#F1F9F3;}
.row.sel .cnt{background:var(--green);color:#fff;}
.none{color:var(--ink-3);font-size:13.5px;font-weight:600;padding:8px 0;}
.toolbar{display:flex;align-items:center;gap:12px;margin:16px 0 10px;flex-wrap:wrap;}
.toolbar .hint{color:var(--ink-3);font-size:12.5px;font-weight:600;}
.btn{border:1px solid var(--line);background:var(--card);color:var(--ink-2);border-radius:14px;padding:9px 14px;font-size:13.5px;font-weight:720;cursor:pointer;}
.mapcard{padding:0;position:relative;overflow:hidden;}
#map-wrap{position:relative;aspect-ratio:var(--map-ar, 3/2);background:#E9E4D8;overscroll-behavior:none;max-height:80vh;}
#heat-canvas{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;}
#map-svg{position:absolute;inset:0;width:100%;height:100%;z-index:1;-webkit-user-select:none;user-select:none;}
.dim{opacity:.38;}
.legend{display:flex;gap:16px;flex-wrap:wrap;padding:12px 14px;border-top:1px solid var(--line);background:var(--bg-soft);font-size:12.5px;font-weight:650;color:var(--ink-2);}
.legend .item{display:flex;align-items:center;gap:6px;}
.legend .sw{width:14px;height:14px;border-radius:5px;}
.legend .sw.hot{background:rgba(22,33,27,.75);border:2px solid #fff;border-radius:50%;}
.legend .sw.cold{background:#fff;border:1px solid var(--line);opacity:.45;}
.legend .sw.heat{width:96px;height:10px;border-radius:999px;background:linear-gradient(90deg,#B2D6FF,#6EC86E,#FFD652,#FA8A3A,#C31E2D);}
.legend .key{font-size:11px;font-weight:750;color:var(--ink-3);}
footer{color:var(--ink-3);font-size:12.5px;font-weight:550;margin-top:20px;line-height:1.55;}
footer p{margin:4px 0;}
@media(max-width:640px){
  .grid{grid-template-columns:1fr;}
  .kpis{grid-template-columns:1fr;}
}
`;

// NOTE: REPORT_JS is injected verbatim into the report's <script>. It must NOT
// contain backticks or ${...}, and must not contain the literal "</script>".
const REPORT_JS = `
(function () {
  "use strict";
  var DATA = __REPORT_DATA__;
  var ABSCHUSS_TYPES = DATA.abschussTypes;
  var SPECIES = DATA.species;
  var TYPES = DATA.types;

  /* ---------- helpers ---------- */
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function num(n) { return (n || 0).toLocaleString("de-DE"); }
  function yearOf(datum) {
    if (!datum) return null;
    var m = /^(\\d{4})/.exec(String(datum));
    return m ? parseInt(m[1], 10) : null;
  }
  function wildartLabel(key) {
    if (!key) return "";
    var s = SPECIES[key];
    if (s && s.n) return s.n;
    return key.split("-").map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join("-");
  }
  function wildartIcon(key) { return (SPECIES[key] && SPECIES[key].ic) ? SPECIES[key].ic : "deer"; }

  /* ---------- flatten records ---------- */
  var markers = [];
  var rows = [];
  for (var mi = 0; mi < DATA.markers.length; mi++) {
    var m = DATA.markers[mi];
    markers.push(m);
    if (ABSCHUSS_TYPES.indexOf(m.type) === -1) continue;
    var abs = m.abschuesse || [];
    for (var ai = 0; ai < abs.length; ai++) {
      var a = abs[ai];
      var wk = String(a.wildart || "").replace(/\\s+/g, " ").trim().toLowerCase();
      var sn = String(a.schuetze || "").replace(/\\s+/g, " ").trim();
      var sk = sn ? sn.toLocaleLowerCase("de") : "";
      rows.push({
        mid: m.id, lat: m.lat, lng: m.lng,
        wildartKey: wk, schuetzeKey: sk, schuetzeName: sn,
        year: yearOf(a.datum)
      });
    }
  }

  /* ---------- schütze labels (most frequent spelling per key) ---------- */
  var schLabels = {};
  var schOrder = [];
  var schSpell = {};
  for (var i = 0; i < rows.length; i++) {
    var r = rows[i];
    if (!r.schuetzeKey) continue;
    if (!(r.schuetzeKey in schSpell)) { schSpell[r.schuetzeKey] = {}; schOrder.push(r.schuetzeKey); }
    schSpell[r.schuetzeKey][r.schuetzeName] = (schSpell[r.schuetzeKey][r.schuetzeName] || 0) + 1;
  }
  for (var si = 0; si < schOrder.length; si++) {
    var skk = schOrder[si];
    var best = null, bc = -1;
    for (var nm in schSpell[skk]) { if (schSpell[skk][nm] > bc) { bc = schSpell[skk][nm]; best = nm; } }
    schLabels[skk] = best;
  }

  /* ---------- full dimension sets (lists keep all entries) ---------- */
  var allWildarten = [];
  var allSchuetzen = [];
  var seenW = {}, seenS = {};
  for (var di = 0; di < rows.length; di++) {
    var dr = rows[di];
    if (dr.wildartKey && !(dr.wildartKey in seenW)) { seenW[dr.wildartKey] = 1; allWildarten.push(dr.wildartKey); }
    if (dr.schuetzeKey && !(dr.schuetzeKey in seenS)) { seenS[dr.schuetzeKey] = 1; allSchuetzen.push(dr.schuetzeKey); }
  }

  /* ---------- filter state ---------- */
  var filter = { year: null, wildart: "", schuetze: "" };

  function matches(r) {
    if (filter.year !== null) {
      if (r.year === null) return false;
      if (r.year !== filter.year) return false;
    }
    if (filter.wildart && r.wildartKey !== filter.wildart) return false;
    if (filter.schuetze && r.schuetzeKey !== filter.schuetze) return false;
    return true;
  }

  function totalRows() {
    var c = 0;
    for (var i = 0; i < rows.length; i++) if (matches(rows[i])) c++;
    return c;
  }
  function yearCounts() {
    var counts = {}, undated = 0, has = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (filter.wildart && r.wildartKey !== filter.wildart) continue;
      if (filter.schuetze && r.schuetzeKey !== filter.schuetze) continue;
      if (r.year === null) undated++;
      else { counts[r.year] = (counts[r.year] || 0) + 1; has[r.year] = 1; }
    }
    var years = Object.keys(has).map(Number).sort(function (a, b) { return b - a; });
    return { years: years, counts: counts, undated: undated };
  }
  function dimensionRows(dim) {
    var keys = dim === "wildart" ? allWildarten : allSchuetzen;
    var out = [];
    for (var i = 0; i < keys.length; i++) {
      var kk = keys[i], c = 0;
      for (var j = 0; j < rows.length; j++) {
        var r = rows[j];
        var dv = dim === "wildart" ? r.wildartKey : r.schuetzeKey;
        if (dv !== kk) continue;
        if (filter.year !== null) { if (r.year === null || r.year !== filter.year) continue; }
        if (dim === "wildart") { if (filter.schuetze && r.schuetzeKey !== filter.schuetze) continue; }
        else { if (filter.wildart && r.wildartKey !== filter.wildart) continue; }
        c++;
      }
      out.push({ key: kk, count: c });
    }
    out.sort(function (a, b) {
      if (b.count !== a.count) return b.count - a.count;
      var la = dim === "wildart" ? wildartLabel(a.key) : (schLabels[a.key] || a.key);
      var lb = dim === "wildart" ? wildartLabel(b.key) : (schLabels[b.key] || b.key);
      return la.localeCompare(lb);
    });
    return out;
  }

  /* ---------- render ---------- */
  function renderKpi() {
    var tot = totalRows();
    document.getElementById("kpi-total").textContent = num(tot);
    document.getElementById("kpi-period").textContent = filter.year === null ? "Gesamt" : String(filter.year);
  }

  function renderYears() {
    var yc = yearCounts();
    var sum = 0;
    for (var i = 0; i < yc.years.length; i++) sum += yc.counts[yc.years[i]];
    var html = '<button type="button" class="chip' + (filter.year === null ? " sel" : "") + '" data-year="__all__">Gesamt <b>' + num(sum + yc.undated) + "</b></button>";
    for (var j = 0; j < yc.years.length; j++) {
      var y = yc.years[j];
      html += '<button type="button" class="chip' + (filter.year === y ? " sel" : "") + '" data-year="' + y + '">' + y + " <b>" + num(yc.counts[y]) + "</b></button>";
    }
    if (yc.undated > 0) {
      html += '<span class="chip muted" title="Einträge ohne Datum – in Summen enthalten, nicht in der Jahresansicht">Ohne Datum (' + yc.undated + ")</span>";
    }
    document.getElementById("year-strip").innerHTML = html;
  }

  function renderList(dim) {
    var list = dimensionRows(dim);
    var base = 0;
    for (var i = 0; i < list.length; i++) base += list[i].count;
    var sel = dim === "wildart" ? filter.wildart : filter.schuetze;
    var el = document.getElementById(dim === "wildart" ? "wildart-list" : "schuetze-list");
    if (!list.length) { el.innerHTML = '<div class="none">Keine Einträge.</div>'; return; }
    var html = "";
    for (var j = 0; j < list.length; j++) {
      var rr = list[j];
      var isSel = rr.key === sel;
      var zero = rr.count === 0;
      var pct = base > 0 ? Math.round((rr.count / base) * 100) : 0;
      var lbl = dim === "wildart" ? wildartLabel(rr.key) : (schLabels[rr.key] || rr.key);
      html += '<button type="button" class="row' + (isSel ? " sel" : "") + (zero ? " zero" : "") + '" data-key="' + esc(rr.key) + '">';
      if (dim === "wildart") {
        var ic = wildartIcon(rr.key);
        var dataUrl = DATA.icons[ic];
        html += dataUrl ? '<span class="ico"><img src="' + dataUrl + '" alt=""/></span>' : '<span class="ico"></span>';
      } else {
        html += '<span class="ico who"></span>';
      }
      html += '<span class="lbl">' + esc(lbl) + '</span>';
      html += '<span class="cnt">' + num(rr.count) + '</span>';
      html += '<span class="pct">' + pct + ' %</span>';
      html += "</button>";
    }
    el.innerHTML = html;
  }

  /* ---------- map: projection & svg ---------- */
  var SVG = document.getElementById("map-svg");
  var MAP_G = null;
  var proj = null;

  /* ---------- heat layer ---------- */
  var HEAT = null, HEAT_CTX = null;
  var RES = Math.min(window.devicePixelRatio || 1, 2);
  var GRID_STEP = 3;
  var HEAT_GAMMA = 0.55;
  var RAMP = [
    [178, 214, 255, 0.00, 0.00],
    [110, 200, 110, 0.30, 0.30],
    [255, 214, 82, 0.60, 0.58],
    [250, 138, 58, 0.82, 0.80],
    [195, 30, 45, 1.00, 1.00]
  ];
  var PALETTE = null;

  function buildPalette() {
    var pal = new Array(256);
    for (var i = 0; i < 256; i++) {
      var t = i / 255;
      var j = 0;
      while (j < RAMP.length - 2 && t > RAMP[j + 1][4]) j++;
      var a0 = RAMP[j], a1 = RAMP[j + 1];
      var span = a1[4] - a0[4];
      var f = span > 0 ? (t - a0[4]) / span : 0;
      if (f < 0) f = 0; else if (f > 1) f = 1;
      pal[i] = [
        Math.round(a0[0] + (a1[0] - a0[0]) * f),
        Math.round(a0[1] + (a1[1] - a0[1]) * f),
        Math.round(a0[2] + (a1[2] - a0[2]) * f),
        a0[3] + (a1[3] - a0[3]) * f
      ];
    }
    return pal;
  }

  function renderLegendBar() {
    var el = document.getElementById("heat-bar");
    if (!el) return;
    var css = "linear-gradient(90deg, rgb(" + RAMP[0][0] + "," + RAMP[0][1] + "," + RAMP[0][2] + ")";
    for (var i = 1; i < RAMP.length; i++) {
      css += ", rgb(" + RAMP[i][0] + "," + RAMP[i][1] + "," + RAMP[i][2] + ") " + Math.round(RAMP[i][4] * 100) + "%";
    }
    css += ")";
    el.style.background = css;
  }

  function inPoly(x, y, poly) {
    var inside = false;
    for (var i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      var xi = poly[i].x, yi = poly[i].y;
      var xj = poly[j].x, yj = poly[j].y;
      if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) {
        inside = !inside;
      }
    }
    return inside;
  }

  function renderHeat(countByMid) {
    if (!HEAT) return;
    HEAT_CTX.clearRect(0, 0, HEAT.width, HEAT.height);
    var pts = [];
    var i, j;
    for (i = 0; i < markers.length; i++) {
      var w = countByMid[markers[i].id] || 0;
      if (w <= 0) continue;
      var p = proj.px(markers[i].lat, markers[i].lng);
      pts.push({ x: p.x, y: p.y, w: w });
    }
    if (!pts.length) return;
    var gw = Math.ceil(W / GRID_STEP);
    var gh = Math.ceil(H / GRID_STEP);
    /* adaptive sigma: median nearest-neighbour distance among heat sources */
    var sigma;
    if (pts.length >= 2) {
      var nnDists = [];
      for (var ni = 0; ni < pts.length; ni++) {
        var nearest = Infinity;
        for (var nj = 0; nj < pts.length; nj++) {
          if (ni === nj) continue;
          var ddx = pts[ni].x - pts[nj].x, ddy = pts[ni].y - pts[nj].y;
          var dd = ddx * ddx + ddy * ddy;
          if (dd < nearest) nearest = dd;
        }
        nnDists.push(Math.sqrt(nearest));
      }
      nnDists.sort(function (a, b) { return a - b; });
      var median = nnDists[Math.floor(nnDists.length / 2)];
      sigma = median * 1.2;
    } else {
      sigma = 0.05 * (W < H ? W : H);
    }
    if (sigma < 18) sigma = 18;
    if (sigma > 120) sigma = 120;
    var R = 3.5 * sigma;
    var R2 = R * R;
    var s2 = 2 * sigma * sigma;
    var sup = Math.ceil(R / GRID_STEP);
    var grid = [];
    for (i = 0; i < gw * gh; i++) grid.push(0);
    for (i = 0; i < pts.length; i++) {
      var ci = Math.floor(pts[i].x / GRID_STEP);
      var cj = Math.floor(pts[i].y / GRID_STEP);
      var i0 = ci - sup, i1 = ci + sup;
      if (i0 < 0) i0 = 0;
      if (i1 >= gw) i1 = gw - 1;
      var j0 = cj - sup, j1 = cj + sup;
      if (j0 < 0) j0 = 0;
      if (j1 >= gh) j1 = gh - 1;
      for (var gy = j0; gy <= j1; gy++) {
        var dy = (gy + 0.5) * GRID_STEP - pts[i].y;
        for (var gx = i0; gx <= i1; gx++) {
          var dx = (gx + 0.5) * GRID_STEP - pts[i].x;
          var d2 = dx * dx + dy * dy;
          if (d2 > R2) continue;
          grid[gy * gw + gx] += pts[i].w * Math.exp(-d2 / s2);
        }
      }
    }
    var b = DATA.boundary;
    if (b && b.length >= 3) {
      var poly = [];
      for (i = 0; i < b.length; i++) {
        var bp = proj.px(b[i][0], b[i][1]);
        poly.push({ x: bp.x, y: bp.y });
      }
      for (j = 0; j < gh; j++) {
        for (i = 0; i < gw; i++) {
          if (!inPoly((i + 0.5) * GRID_STEP, (j + 0.5) * GRID_STEP, poly)) {
            grid[j * gw + i] = 0;
          }
        }
      }
    }
    var maxV = 0;
    for (i = 0; i < grid.length; i++) if (grid[i] > maxV) maxV = grid[i];
    if (!(maxV > 0)) return;
    var img = HEAT_CTX.getImageData(0, 0, HEAT.width, HEAT.height);
    var px = img.data;
    var inv = 1 / maxV;
    var invRES = 1 / RES;
    for (j = 0; j < HEAT.height; j++) {
      var gyf = ((j + 0.5) * invRES) / GRID_STEP - 0.5;
      var g0y = Math.floor(gyf);
      var fy = gyf - g0y;
      if (g0y < 0) g0y = 0;
      if (g0y > gh - 2) g0y = gh - 2;
      var row0 = g0y * gw;
      var row1 = (g0y + 1) * gw;
      for (i = 0; i < HEAT.width; i++) {
        var gxf = ((i + 0.5) * invRES) / GRID_STEP - 0.5;
        var g0x = Math.floor(gxf);
        var fx = gxf - g0x;
        if (g0x < 0) g0x = 0;
        if (g0x > gw - 2) g0x = gw - 2;
        var v00 = grid[row0 + g0x];
        var v10 = grid[row0 + g0x + 1];
        var v01 = grid[row1 + g0x];
        var v11 = grid[row1 + g0x + 1];
        var v = v00 + (v10 - v00) * fx + (v01 - v00) * fy + (v00 - v10 - v01 + v11) * fx * fy;
        if (!(v > 0)) continue;
        var n = v * inv;
        if (n > 1) n = 1;
        var vg = Math.pow(n, HEAT_GAMMA);
        var idx = Math.round(vg * 255);
        if (idx > 255) idx = 255;
        var c = PALETTE[idx];
        var o = (j * HEAT.width + i) * 4;
        px[o] = c[0];
        px[o + 1] = c[1];
        px[o + 2] = c[2];
        px[o + 3] = Math.round(c[3] * 255);
      }
    }
    HEAT_CTX.putImageData(img, 0, 0);
  }
  var W = 0, H = 0;

  function dataPts() {
    var pts = [];
    var b = DATA.boundary;
    if (b && b.length >= 3) {
      for (var i = 0; i < b.length; i++) pts.push({ lat: b[i][0], lng: b[i][1] });
    }
    for (var j = 0; j < markers.length; j++) pts.push({ lat: markers[j].lat, lng: markers[j].lng });
    return pts;
  }

  function initMap() {
    var pts = dataPts();
    if (!pts.length) return;
    var minLat = Infinity, maxLat = -Infinity, minLng = Infinity, maxLng = -Infinity;
    for (var i = 0; i < pts.length; i++) {
      if (pts[i].lat < minLat) minLat = pts[i].lat;
      if (pts[i].lat > maxLat) maxLat = pts[i].lat;
      if (pts[i].lng < minLng) minLng = pts[i].lng;
      if (pts[i].lng > maxLng) maxLng = pts[i].lng;
    }
    if (minLng === maxLng) { minLng -= 0.001; maxLng += 0.001; }
    if (minLat === maxLat) { minLat -= 0.001; maxLat += 0.001; }
    var kx = Math.cos(((minLat + maxLat) / 2) * Math.PI / 180);
    var pad = 26;
    var lngSpan = (maxLng - minLng) * kx;
    var latSpan = maxLat - minLat;
    /* derive W and H from the data aspect ratio, fitting into max 1000×800 */
    var aspect = lngSpan / latSpan;
    if (aspect >= 1) { W = 1000; H = Math.round(1000 / aspect); if (H > 800) H = 800; }
    else { H = 800; W = Math.round(800 * aspect); if (W > 1000) W = 1000; }
    if (W < 300) W = 300;
    if (H < 300) H = 300;
    var s = Math.min((W - pad * 2) / lngSpan, (H - pad * 2) / latSpan);
    if (!isFinite(s) || s <= 0) s = 1;
    var ox = (W - lngSpan * s) / 2;
    var oy = (H - latSpan * s) / 2;
    proj = {
      px: function (lat, lng) {
        return { x: (lng - minLng) * kx * s + ox, y: (maxLat - lat) * s + oy };
      }
    };
    SVG.setAttribute("viewBox", "0 0 " + W + " " + H);
    document.getElementById("map-wrap").style.setProperty("--map-ar", W + "/" + H);
    MAP_G = document.createElementNS("http://www.w3.org/2000/svg", "g");
    MAP_G.setAttribute("id", "map-g");
    SVG.appendChild(MAP_G);
    HEAT = document.getElementById("heat-canvas");
    HEAT.width = Math.round(W * RES);
    HEAT.height = Math.round(H * RES);
    HEAT_CTX = HEAT.getContext("2d");
    PALETTE = buildPalette();
    renderLegendBar();
  }

  function renderMap() {
    if (!MAP_G) return;
    while (MAP_G.firstChild) MAP_G.removeChild(MAP_G.firstChild);
    var countByMid = {};
    for (var i = 0; i < rows.length; i++) {
      var r = rows[i];
      if (matches(r)) countByMid[r.mid] = (countByMid[r.mid] || 0) + 1;
    }
    renderHeat(countByMid);
    var b = DATA.boundary;
    if (b && b.length >= 3) {
      var polyPts = [];
      for (var bi = 0; bi < b.length; bi++) {
        var bp = proj.px(b[bi][0], b[bi][1]);
        polyPts.push(bp.x.toFixed(1) + "," + bp.y.toFixed(1));
      }
      var poly = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      poly.setAttribute("points", polyPts.join(" "));
      poly.setAttribute("fill", "transparent");
      poly.setAttribute("stroke", "#D8D0BF");
      poly.setAttribute("stroke-width", "2");
      poly.setAttribute("vector-effect", "non-scaling-stroke");
      MAP_G.appendChild(poly);
    }
    for (var mj = 0; mj < markers.length; mj++) {
      var mk = markers[mj];
      var c = countByMid[mk.id] || 0;
      var mp = proj.px(mk.lat, mk.lng);
      var circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      circle.setAttribute("cx", mp.x.toFixed(1));
      circle.setAttribute("cy", mp.y.toFixed(1));
      if (c > 0) {
        var rad = 5 + Math.sqrt(c) * 3.2;
        if (rad > 24) rad = 24;
        circle.setAttribute("r", rad.toFixed(1));
        circle.setAttribute("fill", "rgba(22,33,27,.75)");
        circle.setAttribute("stroke", "#FFFFFF");
        circle.setAttribute("stroke-width", "2");
        circle.setAttribute("vector-effect", "non-scaling-stroke");
        circle.setAttribute("data-count", String(c));
      } else {
        circle.setAttribute("r", "6");
        circle.setAttribute("fill", "#FFFFFF");
        circle.setAttribute("stroke", "#9AA59D");
        circle.setAttribute("stroke-width", "2");
        circle.setAttribute("vector-effect", "non-scaling-stroke");
        circle.setAttribute("class", "dim");
      }
      var title = document.createElementNS("http://www.w3.org/2000/svg", "title");
      title.textContent = (mk.name ? mk.name : "Marker") + (c > 0 ? " · " + c + " Abschuss" + (c === 1 ? "" : "e") : "");
      circle.appendChild(title);
      MAP_G.appendChild(circle);
    }
  }

  /* ---------- filters & wiring ---------- */
  function toggleFilter(dim, value) {
    if (dim === "year") {
      if (filter.year === value) filter.year = null;
      else filter.year = value;
    } else if (dim === "wildart") {
      filter.wildart = filter.wildart === value ? "" : value;
    } else {
      filter.schuetze = filter.schuetze === value ? "" : value;
    }
    renderAll();
  }

  function renderStamp() {
    var d = new Date(DATA.exportedAt);
    var p = function (n) { return String(n).padStart(2, "0"); };
    document.getElementById("stamp").textContent =
      p(d.getDate()) + "." + p(d.getMonth() + 1) + "." + d.getFullYear() + ", " + p(d.getHours()) + ":" + p(d.getMinutes()) + " Uhr";
  }

  function renderAll() {
    renderKpi();
    renderYears();
    renderList("wildart");
    renderList("schuetze");
    renderMap();
    var any = filter.year !== null || !!filter.wildart || !!filter.schuetze;
    document.getElementById("reset-filters").style.display = any ? "" : "none";
  }

  document.addEventListener("click", function (e) {
    var t = e.target;
    while (t && t.getAttribute) {
      if (t.getAttribute("data-year") !== null) {
        var v = t.getAttribute("data-year");
        toggleFilter("year", v === "__all__" ? null : Number(v));
        return;
      }
      if (t.getAttribute("data-key") !== null) {
        var dim = t.closest && t.closest("#wildart-list") ? "wildart" : "schuetze";
        toggleFilter(dim, t.getAttribute("data-key"));
        return;
      }
      t = t.parentNode;
    }
  });

  document.getElementById("reset-filters").addEventListener("click", function () {
    filter.year = null;
    filter.wildart = "";
    filter.schuetze = "";
    renderAll();
  });

  renderStamp();
  initMap();
  renderAll();
})();
`;

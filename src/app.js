// Brickwell page glue: read the form, run the engine in core.js, draw the
// shopping list and a to-scale elevation of the wall, keep a share link in the
// URL, and tell Red what's happening. The sums all live in core.js.
(function () {
  "use strict";
  var B = window.Brickwell;
  var $ = function (id) { return document.getElementById(id); };
  var ids = ["length", "height", "unit", "type", "openingsM2", "waste", "mix"];
  var el = {};
  ids.forEach(function (id) { el[id] = $(id); });
  var out = $("out");

  function readState() {
    var s = {};
    ids.forEach(function (id) { s[id] = el[id].value; });
    return s;
  }

  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[c]; }); }

  // A plain elevation of the wall: the outline, the courses stacked up, and a
  // half-brick stagger (stretcher bond) so it reads as brickwork rather than a
  // grid. Blocks are drawn bigger and fewer. Scaled to fit.
  function drawWall(r, s) {
    var L = B.toMm(s.length, s.unit), H = B.toMm(s.height, s.unit);
    if (!(L > 0) || !(H > 0)) return "";
    // Fit by the wider of the two dimensions.
    var pad = 12, vw = 320, scale = (vw - pad * 2) / Math.max(L, H);
    var ww = L * scale, wh = H * scale, vh = wh + pad * 2;
    var courseH = Math.max(3, (r.courseMm * scale));
    var unitW = Math.max(6, r.perM2 <= 12 ? (450 * scale) : (225 * scale));
    var g = ['<svg class="plan" viewBox="0 0 ' + vw + ' ' + Math.round(vh) + '" role="img" aria-label="Elevation of the wall, about ' + r.courses + ' courses of ' + r.unitName + '">'];
    var y, row = 0;
    for (y = pad + wh - courseH; y > pad - 0.5; y -= courseH) {
      var offset = (row % 2 === 0) ? 0 : unitW / 2;
      for (var x = pad - offset; x < pad + ww; x += unitW) {
        var bx = Math.max(pad, x), bw = Math.min(x + unitW - 2, pad + ww) - bx;
        if (bw <= 0) continue;
        g.push('<rect x="' + bx.toFixed(1) + '" y="' + y.toFixed(1) + '" width="' + bw.toFixed(1) + '" height="' + (courseH - 2).toFixed(1) + '" rx="1.5" fill="var(--brick)" opacity="0.92"/>');
      }
      row++;
    }
    g.push('<rect x="' + pad + '" y="' + pad + '" width="' + ww.toFixed(1) + '" height="' + wh.toFixed(1) + '" fill="none" stroke="var(--accent)" stroke-width="1.5"/>');
    g.push('</svg>');
    return g.join("");
  }

  function render(r, s) {
    if (!r) {
      out.innerHTML = "";
      window.Red && window.Red.context("start");
      return;
    }
    var cards = [
      [r.unitName, r.units.toLocaleString(), "inc. " + r.wastePct + "% spare, at ~" + r.perM2 + "/m²"],
      ["mortar", r.mortarM3 + " m³", "mixed " + r.mix + " sand to cement"],
      ["sand", r.sandT + " t", r.sandBulkBags + " bulk bag" + (r.sandBulkBags === 1 ? "" : "s") + " (~0.8 t)"],
      ["cement", r.cementBags + " bags", "25 kg each"],
      ["courses", r.courses, r.courseMm + " mm a course"],
      ["wall area", r.netM2 + " m²", r.openingsM2 > 0 ? "after " + r.openingsM2 + " m² of openings" : "the solid wall"]
    ];

    var cardHtml = cards.map(function (c) {
      return '<div class="card"><div class="n">' + esc(c[1]) + '</div><div class="k">' + esc(c[0]) + '</div><div class="x">' + esc(c[2]) + '</div></div>';
    }).join("");

    var notes = [];
    var openingClamped = r.grossM2 > 0 && r.netM2 === 0;
    if (openingClamped) notes.push('<div class="note warn"><b>Nothing to build:</b> the openings add up to more than the wall, so there is no solid area left. Check the opening total against the wall size.</div>');
    notes.push('<div class="note good"><b>Order a few spare:</b> the count carries ' + r.wastePct + '% for cuts and breakages, but buy from one batch and keep a handful back. Shades drift between batches, and a later match is never quite right.</div>');
    notes.push('<div class="note"><b>The mortar mix:</b> ' + r.mix + ' is sand to cement by volume. A general wall is fine at 1:5; a garden wall that takes the weather wants a stronger 1:4, a weaker block a softer 1:6. Keep the joints an even 10 mm.</div>');
    notes.push('<div class="note"><b>' + r.typeLabel.charAt(0).toUpperCase() + r.typeLabel.slice(1) + ':</b> ' + r.thickMm + ' mm thick. Bed each ' + (r.isBlock ? "block" : "brick") + ' on a full bed of mortar, stagger the joints course to course, and strike the joints before the mortar goes off so rain sheds off the face.</div>');

    out.innerHTML =
      '<div class="headline"><div class="big"><span>' + r.units.toLocaleString() + '</span> ' + r.unitName + '</div>' +
      '<div class="sub">' + r.netM2 + ' m² · ' + r.typeLabel + '</div></div>' +
      '<div class="cards">' + cardHtml + '</div>' +
      drawWall(r, s) +
      notes.join("");

    if (window.Red) {
      window.Red.context(r.openingsM2 > 0 ? "openings" : "result");
      window.Red.react(openingClamped ? "care" : "happy");
    }
  }

  function run() {
    var s = readState();
    var r = B.plan({
      length: s.length, height: s.height, unit: s.unit,
      type: s.type, openingsM2: s.openingsM2, waste: s.waste, mix: s.mix
    });
    render(r, s);
    syncUrl(s);
  }

  // Share link: pack the form into the hash so a plan can be sent or kept.
  function syncUrl(s) {
    try {
      var q = Object.keys(s).filter(function (k) { return s[k] !== ""; })
        .map(function (k) { return k + "=" + encodeURIComponent(s[k]); }).join("&");
      history.replaceState(null, "", q ? "#" + q : location.pathname);
    } catch (e) {}
  }
  function loadUrl() {
    if (!location.hash) return;
    location.hash.slice(1).split("&").forEach(function (pair) {
      var kv = pair.split("="); var k = kv[0];
      if (el[k]) el[k].value = decodeURIComponent(kv[1] || "");
    });
  }

  ids.forEach(function (id) { el[id].addEventListener("input", run); el[id].addEventListener("change", run); });
  loadUrl();
  run();
})();

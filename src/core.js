// Brickwell core: what a brick or block wall needs to buy, from the wall size
// and the way it's built. No DOM in here, so the same file runs in the page
// and under `node --test`.
//
// A wall is bricks (or blocks) plus the mortar between them, and the mortar
// joint is why you can't just divide the wall area by a brick face. Every
// brick carries half a joint all round, so what actually repeats across the
// wall is the brick plus its 10 mm joint, the "coordinating" size. That one
// fact drives the counts:
//
//   1) How many. A UK brick is 215 x 102.5 x 65 mm; with a 10 mm joint it
//      repeats every 225 x 75 mm, so a half-brick (single skin) wall takes
//      about 60 bricks per square metre, a one-brick (double skin) wall twice
//      that, and a standard 440 x 215 mm block about 10 per square metre. On
//      top goes a wastage margin for cuts, breakages and a few spares.
//   2) The mortar. Published trade figures put a single-skin brick wall at
//      about 0.022 m3 of mortar per square metre, a one-brick wall at double,
//      and blockwork at about 0.010 m3. That wet mortar is mostly sand, mixed
//      with cement to a chosen ratio, so the volume turns into tonnes of sand
//      and 25 kg bags of cement.
//   3) The courses. Height divided by the 75 mm brick course (or 225 mm block
//      course) tells you the number of courses, handy for setting out and for
//      seeing the wall drawn to scale.
//
// Figures follow the common UK merchant and trade guidance (Travis Perkins,
// Brickhunter, Engineering ToolBox) and the standard metric brick and block
// sizes. They're a buying guide; a structural wall wants an engineer's spec.
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.Brickwell = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  var IN = 25.4; // mm per inch
  var TO_MM = { mm: 1, cm: 10, m: 1000, in: IN, ft: 304.8 };

  function toMm(value, unit) {
    var n = typeof value === "number" ? value : parseFloat(String(value == null ? "" : value).replace(",", "."));
    var k = TO_MM[unit];
    if (!isFinite(n) || !k) return NaN;
    return n * k;
  }

  function round1(x) { return Math.round(x * 10) / 10; }
  function round2(x) { return Math.round(x * 100) / 100; }

  var JOINT_MM = 10; // standard mortar joint

  // The repeating "coordinating" face of each unit: the unit plus one joint.
  // Bricks per square metre falls straight out of it.
  var UNIT = {
    half:  { label: "half-brick (single skin)", faceWmm: 225, faceHmm: 75,  thickMm: 102.5, perM2: 1 / (0.225 * 0.075),       mortar: 0.022, courseMm: 75,  bondOffset: 0.5 },
    one:   { label: "one-brick (double skin)",  faceWmm: 225, faceHmm: 75,  thickMm: 215,   perM2: 2 / (0.225 * 0.075),       mortar: 0.044, courseMm: 75,  bondOffset: 0.5 },
    block: { label: "block wall",               faceWmm: 450, faceHmm: 225, thickMm: 100,   perM2: 1 / (0.450 * 0.225),       mortar: 0.010, courseMm: 225, bondOffset: 0.5 }
  };

  // Mortar mixes as sand : cement by volume. 1:4 is a strong mix, 1:6 a soft
  // one for weaker blocks; 1:5 is a sensible general bricklaying default.
  var MIX = { "1:4": 4, "1:5": 5, "1:6": 6 };

  // Damp sand bulks up and has voids, so a batch of wet mortar needs a bit
  // more loose sand than its own volume. Densities are the usual merchant
  // figures (building sand ~1.6 t/m3, cement powder ~1.44 t/m3).
  var SAND_BULKING = 1.25;
  var SAND_T_PER_M3 = 1.6;
  var CEMENT_T_PER_M3 = 1.44;
  var BULK_BAG_T = 0.8;   // a merchant's bulk bag of sand
  var BAG_KG = 25;        // a cement / small sand bag

  // Mortar volume (m3) turned into the sand and cement to order. The sand is
  // the whole mortar volume (plus bulking); the cement is that sand over the
  // mix ratio.
  function materials(mortarM3, mix) {
    var ratio = MIX[mix] || MIX["1:5"];
    var sandM3 = mortarM3 * SAND_BULKING;
    var sandKg = sandM3 * SAND_T_PER_M3 * 1000;
    var cementKg = (sandM3 / ratio) * CEMENT_T_PER_M3 * 1000;
    return {
      mix: MIX[mix] ? mix : "1:5",
      sandKg: Math.round(sandKg),
      sandT: round2(sandKg / 1000),
      sandBulkBags: Math.max(1, Math.ceil(sandKg / 1000 / BULK_BAG_T - 1e-9)),
      cementKg: Math.round(cementKg),
      cementBags: Math.max(1, Math.ceil(cementKg / BAG_KG - 1e-9))
    };
  }

  // Courses up the wall: the height over the unit's course (brick 75 mm,
  // block 225 mm). Rounded to whole courses, which is how a wall is set out.
  function courses(heightMm, type) {
    var u = UNIT[type] || UNIT.half;
    return Math.max(1, Math.round(heightMm / u.courseMm));
  }

  // --------------------------------------------------------------- main

  // Everything arrives as strings from the form. Returns null when the wall
  // size is missing or not positive, so the page shows its own prompt instead
  // of a wall of NaNs.
  function plan(input) {
    input = input || {};
    var unit = TO_MM[input.unit] ? input.unit : "m";
    var type = UNIT[input.type] ? input.type : "half";
    var u = UNIT[type];

    var L = toMm(input.length, unit); // wall length
    var H = toMm(input.height, unit); // wall height
    if (!(L > 0) || !(H > 0)) return null;

    var grossM2 = (L * H) / 1e6;

    // Openings (doors, windows) come off the area. Given straight in square
    // metres, summed, so a window schedule can be totalled into one figure.
    var openings = parseFloat(input.openingsM2);
    if (!isFinite(openings) || openings < 0) openings = 0;
    var netM2 = Math.max(0, grossM2 - openings);

    // Wastage for cuts, breakages and spares. 5% is the usual allowance; a
    // wall full of openings and returns wants more.
    var waste = parseFloat(input.waste);
    if (!(isFinite(waste) && waste >= 0 && waste <= 50)) waste = 5;

    var unitsRaw = netM2 * u.perM2;
    var units = Math.max(0, Math.ceil(unitsRaw * (1 + waste / 100) - 1e-9));

    var mortarM3 = round2(netM2 * u.mortar * (1 + waste / 100));
    var mats = materials(netM2 * u.mortar * (1 + waste / 100), input.mix);

    return {
      unit: unit,
      type: type,
      typeLabel: u.label,
      thickMm: u.thickMm,
      grossM2: round2(grossM2),
      openingsM2: round2(openings),
      netM2: round2(netM2),
      wastePct: waste,
      isBlock: type === "block",
      unitName: type === "block" ? "blocks" : "bricks",
      perM2: Math.round(u.perM2),
      units: units,
      courses: courses(H, type),
      courseMm: u.courseMm,
      jointMm: JOINT_MM,
      mortarM3: mortarM3,
      mix: mats.mix,
      sandT: mats.sandT,
      sandKg: mats.sandKg,
      sandBulkBags: mats.sandBulkBags,
      cementBags: mats.cementBags,
      cementKg: mats.cementKg
    };
  }

  return {
    toMm: toMm,
    materials: materials,
    courses: courses,
    plan: plan,
    UNIT: UNIT,
    MIX: MIX,
    JOINT_MM: JOINT_MM
  };
});

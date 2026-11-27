"use strict";
const test = require("node:test");
const assert = require("node:assert");
const B = require("../src/core.js");

test("perM2 comes from the brick plus its joint, about 60 for a single skin", () => {
  // 225 x 75 mm coordinating face -> 59.26, shown as 60.
  assert.strictEqual(B.UNIT.half.perM2 > 59 && B.UNIT.half.perM2 < 60, true);
  assert.strictEqual(Math.round(B.UNIT.half.perM2), 59);
  assert.strictEqual(Math.round(B.UNIT.one.perM2), Math.round(B.UNIT.half.perM2 * 2));
});

test("plan: a half-brick wall, 5 x 2.4 m, 5% waste", () => {
  const r = B.plan({ length: 5, height: 2.4, unit: "m", type: "half" });
  assert.strictEqual(r.netM2, 12);
  assert.strictEqual(r.wastePct, 5);
  assert.strictEqual(r.unitName, "bricks");
  // 12 * 59.26 = 711 bricks, * 1.05 = 747.
  assert.strictEqual(r.units, 747);
  assert.strictEqual(r.courses, 32); // 2400 / 75
  assert.strictEqual(r.mortarM3, 0.28);
});

test("plan: a one-brick wall takes about twice the bricks", () => {
  const half = B.plan({ length: 5, height: 2.4, unit: "m", type: "half" });
  const one = B.plan({ length: 5, height: 2.4, unit: "m", type: "one" });
  assert.strictEqual(one.units, 1494); // 747 * 2
  assert.ok(one.units >= half.units * 2 - 2);
  assert.strictEqual(one.thickMm, 215);
});

test("plan: a block wall counts blocks, about ten per square metre", () => {
  const r = B.plan({ length: 5, height: 2.4, unit: "m", type: "block" });
  assert.strictEqual(r.isBlock, true);
  assert.strictEqual(r.unitName, "blocks");
  assert.strictEqual(r.perM2, 10);
  assert.strictEqual(r.units, 125);   // 12 * 9.88 * 1.05
  assert.strictEqual(r.courses, 11);  // 2400 / 225
});

test("plan: openings come off the wall area", () => {
  const r = B.plan({ length: 5, height: 2.4, unit: "m", type: "half", openingsM2: 2, waste: 0 });
  assert.strictEqual(r.grossM2, 12);
  assert.strictEqual(r.netM2, 10);
  assert.strictEqual(r.units, 593); // 10 * 59.26, no waste, rounded up
});

test("plan: an opening bigger than the wall clamps the area to zero", () => {
  const r = B.plan({ length: 2, height: 1, unit: "m", type: "half", openingsM2: 5 });
  assert.strictEqual(r.netM2, 0);
  assert.strictEqual(r.units, 0);
});

test("plan: a custom waste margin overrides the default", () => {
  const r = B.plan({ length: 5, height: 2.4, unit: "m", type: "half", waste: 10 });
  assert.strictEqual(r.wastePct, 10);
  const base = B.plan({ length: 5, height: 2.4, unit: "m", type: "half" });
  assert.ok(r.units > base.units, "more waste means more bricks");
});

test("plan: a silly waste value falls back to 5%", () => {
  assert.strictEqual(B.plan({ length: 5, height: 2.4, unit: "m", waste: 200 }).wastePct, 5);
  assert.strictEqual(B.plan({ length: 5, height: 2.4, unit: "m", waste: -3 }).wastePct, 5);
});

test("materials: a stronger mix needs more cement, the same sand", () => {
  const strong = B.materials(0.3, "1:4");
  const soft = B.materials(0.3, "1:6");
  assert.strictEqual(strong.sandT, soft.sandT);           // sand set by mortar volume
  assert.ok(strong.cementBags > soft.cementBags, "1:4 uses more cement than 1:6");
  assert.strictEqual(strong.cementBags, 6);
  assert.strictEqual(soft.cementBags, 4);
});

test("materials: an unknown mix falls back to 1:5", () => {
  assert.strictEqual(B.materials(0.3, "1:9").mix, "1:5");
  assert.strictEqual(B.materials(0.3).mix, "1:5");
});

test("materials: sand and cement are never below one unit", () => {
  const m = B.materials(0.001, "1:5");
  assert.ok(m.sandBulkBags >= 1);
  assert.ok(m.cementBags >= 1);
});

test("courses: block courses are 225 mm, brick courses 75 mm", () => {
  assert.strictEqual(B.courses(2250, "block"), 10);
  assert.strictEqual(B.courses(2250, "half"), 30);
  assert.strictEqual(B.courses(10, "half"), 1); // never below one
});

test("plan: feet convert the same as metres", () => {
  const m = B.plan({ length: 3.048, height: 3.048, unit: "m", type: "half" });
  const ft = B.plan({ length: 10, height: 10, unit: "ft", type: "half" });
  assert.strictEqual(m.units, ft.units);
  assert.strictEqual(m.courses, ft.courses);
});

test("plan returns null on missing or bad inputs", () => {
  assert.strictEqual(B.plan({ length: 5 }), null);           // no height
  assert.strictEqual(B.plan({ height: 2.4 }), null);         // no length
  assert.strictEqual(B.plan({ length: -1, height: 2 }), null);
  assert.strictEqual(B.plan({}), null);
});

test("plan: an unknown type falls back to half-brick", () => {
  const r = B.plan({ length: 5, height: 2.4, unit: "m", type: "nonsense" });
  assert.strictEqual(r.type, "half");
});

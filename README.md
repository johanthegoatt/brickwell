# Brickwell

[![test](https://github.com/johanthegoatt/brickwell/actions/workflows/test.yml/badge.svg)](https://github.com/johanthegoatt/brickwell/actions/workflows/test.yml)

How many bricks or blocks to buy for a wall, and the mortar to go with them. Put in the wall size and how it's built, and Brickwell works out the units, the sand and cement, the courses, and draws the wall to scale.

It runs entirely in your browser. Nothing is uploaded and there is nothing to sign up for.

## What it works out

- **Bricks or blocks to buy** — the wall area with a spare margin on top, turned into a unit count. A half-brick (single skin) wall takes about 60 bricks per square metre, a one-brick (double skin) wall about 120, and a standard 440 × 215 mm block about 10. You can push the margin up for a wall full of openings and cuts.
- **The mortar** — the wet mortar volume from the wall, then the **sand** (in tonnes and bulk bags) and the **cement** (25 kg bags) to mix it, at the ratio you pick.
- **The courses** — the wall height over the 75 mm brick course (or 225 mm block course), so you can set it out and check the drawing.
- **Openings** — add up the doors and windows into one square-metre figure and Brickwell takes them off the solid wall.
- **A to-scale elevation** of the wall, courses stacked in a stretcher-bond stagger.

## Why the joint matters

You can't just divide the wall area by a brick face. Every brick carries half a 10 mm mortar joint all round, so what actually repeats across the wall is the brick *plus* its joint — the "coordinating" size, 225 × 75 mm for a UK brick. That is where the 60-per-square-metre figure comes from, and the mortar between the units is a real quantity to buy, mostly sand with cement mixed in. Brickwell plans both around that.

## The figures

Counts and mortar follow the common UK merchant and trade guidance (Travis Perkins, Brickhunter, Engineering ToolBox) and the standard metric brick (215 × 102.5 × 65 mm) and block (440 × 215 mm) sizes: about 60 bricks/m² single skin, 120 double, 10 blocks/m²; roughly 0.022 m³ of mortar per m² of single-skin brickwork, double for a one-brick wall, 0.010 m³ for blockwork. Mixes are 1:4 (strong) to 1:6 (soft) sand to cement, with 1:5 a sensible general default.

It is a buying guide, not a structural design. A retaining wall, a pier, or anything carrying load wants an engineer's spec and the right foundation.

## Run the tests

```
npm test
```

The maths lives in `src/core.js` with no DOM, so the same file runs in the page and under `node --test`. The tests in `test/core.test.js` cover the per-square-metre counts for each wall type, the openings and the clamp to zero, the waste margin, the sand-and-cement split by mix, the courses, unit conversion and the empty states.

## Meet Red

Red the brick sits in the corner with a tip when you tap, a grin when the wall adds up cleanly, and a careful look when the openings take out more than the wall can give.

## Licence

MIT. See [LICENSE](./LICENSE).

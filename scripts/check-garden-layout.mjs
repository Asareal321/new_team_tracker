// The garden grows sideways, then its beds shrink.
//
// It used to grow downward — three wide, adding rows — so buying beds pushed
// the garden off the bottom of the screen and the reward for expanding was
// having to scroll. Now the row count is fixed and each expansion adds a
// column, and the CSS caps the grid at the width it has, so the beds shrink
// once the garden can't get any wider.

import {
  PLOT_ROWS, PLOTS_PER_ROW, STARTING_PLOTS, MAX_PLOTS,
  EXPANSION_COSTS, nextExpansion,
} from '../src/lib/garden.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

// What GardenPage puts in --cols.
const cols = plots => Math.max(1, Math.ceil(plots / PLOT_ROWS))

// Every size the garden can actually be.
const sizes = []
for (let p = STARTING_PLOTS; p <= MAX_PLOTS; p += PLOTS_PER_ROW) sizes.push(p)

ok('the garden starts at 12 beds', STARTING_PLOTS === 12)
ok('it is three rows deep', PLOT_ROWS === 3)
ok('12 beds is 4 columns of 3', cols(12) === 4)
ok('24 beds is 8 columns of 3', cols(24) === 8)

// The point of the change: expanding must widen, never lengthen.
ok('every expansion adds exactly one column',
  sizes.slice(1).every((p, i) => cols(p) === cols(sizes[i]) + 1),
  sizes.map(cols).join(','))
ok('the row count never changes',
  sizes.every(p => Math.ceil(p / cols(p)) === PLOT_ROWS),
  sizes.map(p => Math.ceil(p / cols(p))).join(','))

// Every plot must land in the grid — a bed you own and can't see is worse
// than one you haven't bought.
ok('every size fills its grid exactly',
  sizes.every(p => cols(p) * PLOT_ROWS === p),
  sizes.filter(p => cols(p) * PLOT_ROWS !== p).join(','))

// Plot indices are untouched by the layout change, so nobody's garden moves.
ok('indices are contiguous from zero',
  sizes.every(p => Array.from({ length: p }, (_, i) => i).every(i => i < cols(p) * PLOT_ROWS)))

// — expansion stays coherent —

ok('every size below the max can expand', sizes.slice(0, -1).every(p => nextExpansion(p) !== null))
ok('the largest garden cannot expand', nextExpansion(MAX_PLOTS) === null)
ok('every expansion has a price',
  sizes.slice(0, -1).every(p => typeof nextExpansion(p).cost === 'number'))
ok('expansions get more expensive',
  sizes.slice(0, -1).every((p, i, a) =>
    i === 0 || nextExpansion(p).cost > nextExpansion(a[i - 1]).cost))
ok('every priced size is a size you can reach',
  Object.keys(EXPANSION_COSTS).every(k => sizes.includes(Number(k))),
  Object.keys(EXPANSION_COSTS).join(','))

// — the shrink —
//
// The CSS is max-width: min(100%, cols * --tile). Below the container width
// the garden grows outward at a fixed bed size; above it, 100% wins and the
// beds divide a fixed width instead. Restated here so the intent is pinned
// even though the arithmetic lives in the stylesheet.
const TILE = 112, AVAIL = 460
const bedWidth = p => Math.min(AVAIL, cols(p) * TILE) / cols(p)

ok('beds never grow as the garden does',
  sizes.slice(1).every((p, i) => bedWidth(p) <= bedWidth(sizes[i])),
  sizes.map(p => Math.round(bedWidth(p))).join(','))
ok('the garden never exceeds the width it has',
  sizes.every(p => bedWidth(p) * cols(p) <= AVAIL + 0.001))
ok('the largest garden still has usable beds', bedWidth(MAX_PLOTS) >= 40,
  `${Math.round(bedWidth(MAX_PLOTS))}px`)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

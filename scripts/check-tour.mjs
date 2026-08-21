// The guided walk.
//
// The old tour was seven screens of paragraphs and people finished it knowing
// nothing about where anything was. The fix was many short steps pointing at
// real elements — so the two things worth protecting are the step count and
// the length of each body. Both drift back silently if nothing checks them.

import { TOUR_STEPS, TOUR_ROUTES, MAX_BODY } from '../src/lib/tourSteps.js'
import { readFileSync } from 'fs'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

// — shape —

ok('the walk is many short steps, not a few long ones', TOUR_STEPS.length >= 15,
  `only ${TOUR_STEPS.length}`)

const keys = TOUR_STEPS.map(s => s.key)
ok('every step key is unique', new Set(keys).size === keys.length)

for (const s of TOUR_STEPS) {
  ok(`"${s.key}" has a title and a body`, !!(s.title && s.body))
  ok(`"${s.key}" says one thing (${s.body?.length ?? 0} ≤ ${MAX_BODY})`,
    (s.body?.length ?? 999) <= MAX_BODY, s.body)
  ok(`"${s.key}" goes somewhere the app serves`, TOUR_ROUTES.includes(s.route), s.route)
  ok(`"${s.key}" gives Trak a mood`, typeof s.mood === 'string' && s.mood.length > 0)
}

// — it must actually visit the three tabs the tour is for —

for (const route of TOUR_ROUTES) {
  ok(`the walk stops at ${route}`, TOUR_STEPS.some(s => s.route === route))
}

// Steps run in route order rather than hopping between tabs, which would make
// the walk feel like it was thrashing.
const order = []
for (const s of TOUR_STEPS) if (order[order.length - 1] !== s.route) order.push(s.route)
ok('each tab is visited once, in one run', order.length === new Set(order).size,
  order.join(' → '))

// — the selectors have to name things that exist —
//
// A step whose anchor matches nothing degrades to a centred card, which is
// survivable but silent. This catches the typo at build time instead.

const SOURCES = [
  'src/components/TaskBoard.jsx', 'src/components/Layout.jsx',
  'src/components/CommunityPeople.jsx', 'src/components/Marketplace.jsx',
  'src/pages/GardenPage.jsx', 'src/pages/TeamsPage.jsx',
]
const src = SOURCES.map(f => { try { return readFileSync(f, 'utf8') } catch { return '' } }).join('\n')
// `band-${status}` is built at runtime from the board's own keys.
const RUNTIME = ['band-todo', 'band-in_progress', 'band-done']

for (const s of TOUR_STEPS) {
  for (const sel of s.anchor || []) {
    const cls = sel.replace(/^\./, '')
    const found = RUNTIME.includes(cls) || new RegExp(`[\`"'\\s]${cls}[\`"'\\s$]`).test(src)
    ok(`"${s.key}" points at a real element (${sel})`, found)
  }
}

// The last step is the only one allowed to have no anchor — it is the goodbye.
const anchorless = TOUR_STEPS.filter(s => !s.anchor)
ok('only the closing step is unanchored',
  anchorless.length === 1 && anchorless[0] === TOUR_STEPS[TOUR_STEPS.length - 1],
  anchorless.map(s => s.key).join(', '))

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

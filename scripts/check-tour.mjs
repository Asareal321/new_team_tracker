// The guided walk.
//
// The old tour was seven screens of paragraphs and people finished it knowing
// nothing about where anything was. The fix was many short steps pointing at
// real elements — so the two things worth protecting are the step count and
// the length of each body. Both drift back silently if nothing checks them.

import { TOUR_STEPS, TOUR_ROUTES, MAX_BODY, stepsFor } from '../src/lib/tourSteps.js'
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
  'src/components/CalendarStrip.jsx', 'src/components/ReferralCard.jsx',
  'src/pages/GardenPage.jsx', 'src/pages/TeamsPage.jsx',
  'src/pages/DeadlinesPage.jsx', 'src/pages/AccountPage.jsx',
]
const src = SOURCES.map(f => { try { return readFileSync(f, 'utf8') } catch { return '' } }).join('\n')
// `band-${status}` is built at runtime from the board's own keys.
const RUNTIME = ['band-todo', 'band-in_progress', 'band-done']

// The nav links and the garden rooms are named by a data-tour attribute built
// from a value in a list, so what the source contains is the value, not the
// whole attribute — `nav-garden` comes from the label, `room-shop` from the key.
function needle(sel) {
  const attr = sel.match(/^\[data-tour="([^"]+)"\]$/)
  if (!attr) return sel.replace(/^\./, '')
  const [, value] = attr
  const [, tail] = value.match(/^(?:nav|room|acct)-(.+)$/) || [null, value]
  return value.startsWith('acct-') ? value : tail
}

for (const s of TOUR_STEPS) {
  for (const sel of s.anchor || []) {
    const cls = needle(sel)
    const found = RUNTIME.includes(cls)
      || new RegExp(`[\`"'\\s>]${cls}[\`"'\\s<$]`, 'i').test(src)
    ok(`"${s.key}" points at a real element (${sel})`, found)
  }
}

// — you do the travelling —
//
// The point of this version of the tour is that it never zaps you between
// tabs. So any step that lands on a route different from the one before it has
// to have been reached by a click you performed on the step before.

for (const phone of [false, true]) {
  const walk = stepsFor({ phone })
  const where = phone ? 'phone' : 'desktop'
  let prevRoute = null
  for (const [n, s] of walk.entries()) {
    if (prevRoute && s.route !== prevRoute) {
      ok(`(${where}) "${s.key}" is reached by clicking, not by a redirect`,
        walk[n - 1]?.act === 'click', `${prevRoute} → ${s.route} with no click step`)
    }
    prevRoute = s.route
  }
  const seen = []
  for (const s of walk) if (seen[seen.length - 1] !== s.route) seen.push(s.route)
  ok(`(${where}) the walk visits each tab once, in the rail's order`,
    seen.join(' → ') === TOUR_ROUTES.join(' → '), seen.join(' → '))
  ok(`(${where}) the walk is still many short steps`, walk.length >= 15, `${walk.length}`)
}

// A click step that pointed at nothing would leave you staring at a card that
// says \"your turn\" with nothing to press.
for (const s of TOUR_STEPS) {
  if (s.act) {
    ok(`"${s.key}" is a click on something`, s.act === 'click' && (s.anchor?.length ?? 0) > 0)
  }
}

ok('the walk makes you click at least ten times',
  TOUR_STEPS.filter(s => s.act === 'click').length >= 10,
  `${TOUR_STEPS.filter(s => s.act === 'click').length} click steps`)

// The last step is the only one allowed to have no anchor — it is the goodbye.
const anchorless = TOUR_STEPS.filter(s => !s.anchor)
ok('only the closing step is unanchored',
  anchorless.length === 1 && anchorless[0] === TOUR_STEPS[TOUR_STEPS.length - 1],
  anchorless.map(s => s.key).join(', '))

// — the walk follows the app's own layout —
//
// The tabs are in one order in the rail and along the bottom bar of a phone,
// and the tour visits them in that same order so that redoing it from memory
// works. Read out of Layout rather than restated here, because a restated copy
// would be the thing that goes stale.

const layout = readFileSync('src/components/Layout.jsx', 'utf8')
const navBlock = layout.slice(layout.indexOf('const NAV = ['), layout.indexOf(']', layout.indexOf('const NAV = [')))
const navOrder = [...navBlock.matchAll(/\{\s*to:\s*'([^']+)'[^}]*\}/g)]
  // The dashboard is admin-only, so most people never see that tab and the
  // walk has nothing to say about it.
  .filter(m => !/admin:\s*true/.test(m[0]))
  .map(m => m[1])

ok('every tab the walk visits is a real destination in the rail',
  TOUR_ROUTES.every(r => navOrder.includes(r)),
  TOUR_ROUTES.filter(r => !navOrder.includes(r)).join(', '))

const walkOrder = navOrder.filter(r => TOUR_ROUTES.includes(r))
ok('and it visits them in the order they appear there',
  walkOrder.join(' → ') === TOUR_ROUTES.join(' → '),
  `rail: ${walkOrder.join(' → ')}  |  tour: ${TOUR_ROUTES.join(' → ')}`)

// The steps themselves have to run in that order too, not just be declared in
// it — `order` was collected further up.
ok('the steps run in the same order as the tabs',
  order.join(' → ') === TOUR_ROUTES.join(' → '), order.join(' → '))

// — replaying gives you nothing —
//
// The walk and the setup screens are both replayable from Account, and neither
// may hand out a second starter or a second public-profile packet. Setup is
// guarded twice over (BoardPage only mounts it when the account is unonboarded,
// and completeOnboarding returns early once onboarded); this checks the third
// guard, which is that replay never reaches the granting screens at all.

const onb = readFileSync('src/components/Onboarding.jsx', 'utf8')
const replay = onb.match(/const REPLAY_STEPS\s*=\s*\[([^\]]*)\]/)?.[1] ?? ''
const replaySteps = [...replay.matchAll(/'([^']+)'/g)].map(m => m[1])

ok('replay has steps at all', replaySteps.length > 0, replay)
for (const granting of ['packet', 'planted', 'profile', 'task']) {
  ok(`replaying does not reach "${granting}", so nothing is granted twice`,
    !replaySteps.includes(granting), replaySteps.join(', '))
}
ok('and replay bails out before onFinish is ever called',
  /if \(mode === 'replay'\) return onClose\?\.\(\)/.test(onb))

// — the two screens are different apps, and both get taught —
//
// A phone has no chevrons, no braindump tray and no number keys; a desktop has
// no swipe. Dropping a step for one platform without giving it a replacement
// would leave that platform with no way of knowing how to move a task at all,
// and it would be invisible from the other one.

for (const s of TOUR_STEPS) {
  if (s.only) ok(`"${s.key}" is marked for a real screen`, s.only === 'phone' || s.only === 'desktop', s.only)
}

const onlySteps = TOUR_STEPS.filter(s => s.only)
ok('the platforms differ enough to be worth splitting', onlySteps.length >= 4)
ok('and neither platform is the one carrying all the exceptions',
  onlySteps.filter(s => s.only === 'phone').length > 0
  && onlySteps.filter(s => s.only === 'desktop').length > 0)

// Every platform-specific step sits between the same two shared steps as its
// opposite number — that is what "it has a partner" means in practice, and it
// catches a step deleted from one walk but not the other.
function neighbours(step) {
  const n = TOUR_STEPS.indexOf(step)
  let before = null, after = null
  for (let i = n - 1; i >= 0; i--) if (!TOUR_STEPS[i].only) { before = TOUR_STEPS[i].key; break }
  for (let i = n + 1; i < TOUR_STEPS.length; i++) if (!TOUR_STEPS[i].only) { after = TOUR_STEPS[i].key; break }
  return `${before} … ${after}`
}
for (const s of onlySteps) {
  const partner = onlySteps.find(o => o !== s && o.only !== s.only && neighbours(o) === neighbours(s))
  ok(`"${s.key}" has an opposite number for the other screen`, !!partner, neighbours(s))
}

// The gestures that only exist on one screen have to be named on that screen.
const phoneBodies = stepsFor({ phone: true }).map(s => `${s.title} ${s.body}`).join(' ').toLowerCase()
const deskBodies = stepsFor({ phone: false }).map(s => `${s.title} ${s.body}`).join(' ').toLowerCase()

ok('the phone walk teaches the swipe', /swipe|flick/.test(phoneBodies))
ok('and does not tell you to use chevrons that are not there', !/chevron/.test(phoneBodies))
ok('the desktop walk teaches the chevrons', /chevron/.test(deskBodies))
ok('and does not tell you to swipe', !/\bswipe\b/.test(deskBodies))
ok('the desktop walk mentions dragging, which a phone row cannot do', /drag/.test(deskBodies))

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

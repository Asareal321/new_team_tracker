// What the phone is allowed to say, and when.
//
// Notifications are the one part of this app that reaches a person who is not
// using it, so the failure modes are unusually expensive: a nudge at 3am, a
// nudge about a task they finished this morning, forty nudges at once, or a
// nudge naming a task from Up next — a queue they deliberately have not
// started, so being chased about it is being chased about a decision they
// already made.

import {
  planNotifications, nudgeSubject, nudgeCopy, nudgeTimes,
  MAX_SCHEDULED, HORIZON_DAYS, NUDGE_INTERVAL_MINUTES, AFTERNOON_FROM, NUDGE_MARGIN,
} from '../src/lib/notificationPlan.js'

let pass = 0, fail = 0
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const NOW = new Date(2026, 0, 15, 6, 30)
const PREFS = { wake: '07:00', bed: '22:30' }
const DOING = { id: 'd1', status: 'in_progress', title: 'Write the deck' }
const UPNEXT = { id: 'u1', status: 'todo', title: 'Do not name me' }

const base = (over = {}) => planNotifications({
  now: NOW,
  garden: { prefs: PREFS, streak: { current: 3, lastDay: null }, daily: { day: '2026-01-15' }, ...over.garden },
  tasks: over.tasks ?? [DOING, UPNEXT],
  settings: over.settings,
  focusBlocks: over.focusBlocks ?? [],
  rand: () => 0,
})

const mins = d => { const x = new Date(d); return x.getHours() * 60 + x.getMinutes() }
const plan = base()

// — nothing at an antisocial hour —

ok('nothing is scheduled before the wake time',
  plan.every(n => mins(n.at) >= 7 * 60),
  plan.filter(n => mins(n.at) < 7 * 60).map(n => `${n.id}@${mins(n.at)}`).join(', '))

// The flower is the exception and is allowed to land whenever it finishes —
// it is the one alarm the person explicitly asked for by planting something.
ok('and nothing after bedtime, except the flower',
  plan.every(n => n.category === 'flower' || mins(n.at) <= 22 * 60 + 30),
  plan.filter(n => n.category !== 'flower' && mins(n.at) > 22 * 60 + 30).map(n => n.id).join(', '))

// — iOS drops everything past 64 pending, silently —

ok(`no more than ${MAX_SCHEDULED} are handed over`, plan.length <= MAX_SCHEDULED, `${plan.length}`)
ok('every id is unique, so none silently replaces another',
  new Set(plan.map(n => n.id)).size === plan.length)
ok('they are handed over in time order',
  plan.every((n, i) => i === 0 || plan[i - 1].at <= n.at))
ok('nothing is scheduled in the past',
  plan.every(n => new Date(n.at) > NOW))
ok(`nothing is scheduled beyond ${HORIZON_DAYS} days`,
  plan.every(n => new Date(n.at) - NOW <= HORIZON_DAYS * 86400e3))
ok('every one has something to say',
  plan.every(n => n.title && n.body && n.category && n.at))

// — the nudges —

const nudges = plan.filter(n => n.category === 'nudge')
ok('the nudges repeat on the stated interval', (() => {
  const today = nudges.filter(n => new Date(n.at).getDate() === 15).map(n => mins(n.at))
  return today.every((t, i) => i === 0 || t - today[i - 1] === NUDGE_INTERVAL_MINUTES)
})(), nudges.map(n => mins(n.at)).join(','))

ok('the last nudge leaves room before bed, so it does not land on the planning hour',
  nudges.every(n => mins(n.at) <= 22 * 60 + 30 - NUDGE_MARGIN))

ok('morning nudges ask you to write things down',
  nudges.filter(n => mins(n.at) < AFTERNOON_FROM).every(n => /today|write/i.test(`${n.title} ${n.body}`)))
ok('afternoon nudges ask after what you started',
  nudges.filter(n => mins(n.at) >= AFTERNOON_FROM).every(n => /progress|done|Doing/i.test(`${n.title} ${n.body}`)))

// The one the user was specific about.
ok('a nudge names a task from Doing, never from Up next',
  nudges.every(n => !n.body.includes(UPNEXT.title)),
  nudges.filter(n => n.body.includes(UPNEXT.title)).map(n => n.id).join(', '))
ok('and it does name the one in Doing',
  nudges.some(n => n.body.includes(DOING.title)))

ok('nudgeSubject ignores every band but Doing',
  nudgeSubject([UPNEXT, { status: 'done', title: 'x' }, { status: 'braindump', title: 'y' }]) === null)
ok('nudgeSubject copes with an empty board', nudgeSubject([]) === null)
ok('nudgeSubject stays in range at the top of the roll',
  nudgeSubject([DOING, { ...DOING, id: 'd2' }], 0.999) != null)
ok('an empty Doing band still has something to say',
  !!nudgeCopy({ afternoon: true, subject: null }).body)

// — "if they have not done so yet" —

const wrote = base({ garden: { daily: { day: '2026-01-15', added: 2 } } })
  .filter(n => n.category === 'nudge' && new Date(n.at).getDate() === 15)
ok('writing a task down silences today’s morning nudges',
  wrote.every(n => mins(n.at) >= AFTERNOON_FROM))
ok('but not the afternoon ones — those are about finishing',
  wrote.length > 0)

const finished = base({ garden: { streak: { current: 3, lastDay: '2026-01-15' } } })
  .filter(n => n.category === 'nudge' && new Date(n.at).getDate() === 15)
ok('finishing something silences today’s afternoon nudges',
  finished.every(n => mins(n.at) < AFTERNOON_FROM))

ok('tomorrow’s nudges are unaffected — nothing is known about tomorrow',
  base({ garden: { daily: { day: '2026-01-15', added: 5 }, streak: { current: 3, lastDay: '2026-01-15' } } })
    .some(n => n.category === 'nudge'))

// — switches —

for (const category of ['flower', 'planning', 'streak', 'focus', 'nudge']) {
  ok(`"${category}" can be turned off on its own`,
    base({ settings: { [category]: false } }).every(n => n.category !== category))
}

ok('quiet mode stops the nudges, being the loudest part of the game layer',
  base({ garden: { quiet_mode: true } }).every(n => n.category !== 'nudge'))
ok('but quiet mode does not stop the flower you asked for', (() => {
  const p = planNotifications({
    now: NOW,
    garden: {
      prefs: PREFS, quiet_mode: true, growing_seed: 'daisy',
      growing_started_at: new Date(2026, 0, 15, 6, 0).toISOString(),
      growing_grow_seconds: 7200, shaved_seconds: 0,
    },
  })
  return p.some(n => n.category === 'flower')
})())

// — the parts that need setting up first —

ok('no planning alarms until the hours are actually set',
  planNotifications({ now: NOW, garden: { prefs: {} } }).every(n => n.category !== 'planning'))
ok('no streak alarm without a streak to lose',
  base({ garden: { streak: { current: 0 } } }).every(n => n.category !== 'streak'))

// — nothing at all is a valid plan —

ok('an empty account schedules nothing rather than throwing',
  Array.isArray(planNotifications({ now: NOW })))
ok('and no argument at all does not throw', Array.isArray(planNotifications()))

// — a focus block warns before it moves the board —

const focus = planNotifications({
  now: NOW, garden: { prefs: PREFS },
  focusBlocks: [{ id: 'b1', projectName: 'BCG', start: new Date(2026, 0, 15, 13, 0).toISOString() }],
  rand: () => 0,
}).filter(n => n.category === 'focus')
ok('a focus block warns you before it starts, not as it starts',
  focus.length === 1 && mins(focus[0].at) === 12 * 60 + 55, JSON.stringify(focus))
ok('and says the board will park things rather than lose them',
  /park/i.test(focus[0]?.body || ''))

ok('nudgeTimes is empty when the waking day is too short to fit one',
  nudgeTimes(8 * 60, 8 * 60 + 60).length === 0)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

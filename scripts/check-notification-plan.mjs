// What the phone is allowed to say, and when.
//
// Notifications are the one part of this app that reaches a person who is not
// using it, so the failure modes are unusually expensive: a nudge at 3am, a
// nudge about something they already did today, forty nudges at once, or a
// nudge that names the sphere they are already pouring time into — the
// opposite of the point, which is balance.

import {
  planNotifications, nudgeSubject, nudgeCopy, nudgeTimes, CATEGORIES,
  MAX_SCHEDULED, HORIZON_DAYS, NUDGE_INTERVAL_MINUTES, AFTERNOON_FROM, NUDGE_MARGIN,
} from '../src/lib/notificationPlan.js'

let pass = 0, fail = 0
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const NOW = new Date(2026, 0, 15, 6, 30)
const PREFS = { wake: '07:00', bed: '22:30' }
const ago = d => new Date(NOW.getTime() - d * 864e5).toISOString()

const BUSY = { id: 'econ', name: 'ECON 2220' }
const QUIET = { id: 'rec', name: 'Recruiting' }
const ARCHIVED = { id: 'old', name: 'Old club', archived_at: ago(40) }
const SPHERES = [BUSY, QUIET, ARCHIVED]
const LOGS = [
  ...Array.from({ length: 5 }, (_, i) => ({ id: `e${i}`, sphere_id: 'econ', logged_at: ago(i * 0.5 + 0.2) })),
  { id: 'r1', sphere_id: 'rec', logged_at: ago(9) },
]

const base = (over = {}) => planNotifications({
  now: NOW,
  garden: { prefs: PREFS, streak: { current: 3, lastDay: null }, daily: { day: '2026-01-15' }, ...over.garden },
  spheres: over.spheres ?? SPHERES,
  logs: over.logs ?? LOGS,
  settings: over.settings,
  focusBlocks: over.focusBlocks ?? [],
})

const mins = d => { const x = new Date(d); return x.getHours() * 60 + x.getMinutes() }
const plan = base()

// — nothing at an antisocial hour —

ok('nothing is scheduled before the wake time',
  plan.every(n => mins(n.at) >= 7 * 60),
  plan.filter(n => mins(n.at) < 7 * 60).map(n => `${n.id}@${mins(n.at)}`).join(', '))
ok('and nothing after bedtime',
  plan.every(n => mins(n.at) <= 22 * 60 + 30),
  plan.filter(n => mins(n.at) > 22 * 60 + 30).map(n => n.id).join(', '))

// — iOS drops everything past 64 pending, silently —

ok(`no more than ${MAX_SCHEDULED} are handed over`, plan.length <= MAX_SCHEDULED, `${plan.length}`)
ok('every id is unique, so none silently replaces another', new Set(plan.map(n => n.id)).size === plan.length)
ok('they are handed over in time order', plan.every((n, i) => i === 0 || plan[i - 1].at <= n.at))
ok('nothing is scheduled in the past', plan.every(n => new Date(n.at) > NOW))
ok(`nothing is scheduled beyond ${HORIZON_DAYS} days`,
  plan.every(n => new Date(n.at) - NOW <= HORIZON_DAYS * 86400e3))
ok('every one has something to say', plan.every(n => n.title && n.body && n.category && n.at))
ok('every one is a category the settings can switch off', plan.every(n => CATEGORIES.includes(n.category)))

// — the nudges —

const nudges = plan.filter(n => n.category === 'nudge')
ok('the nudges repeat on the stated interval', (() => {
  const today = nudges.filter(n => new Date(n.at).getDate() === 15).map(n => mins(n.at))
  return today.length > 1 && today.every((t, i) => i === 0 || t - today[i - 1] === NUDGE_INTERVAL_MINUTES)
})(), nudges.map(n => mins(n.at)).join(','))
ok('the last nudge leaves room before bed, so it does not land on the planning hour',
  nudges.every(n => mins(n.at) <= 22 * 60 + 30 - NUDGE_MARGIN))

ok('morning nudges ask what you will move forward',
  nudges.filter(n => mins(n.at) < AFTERNOON_FROM).every(n => /move forward|today/i.test(`${n.title} ${n.body}`)))
ok('afternoon nudges ask whether you have, and to log it',
  nudges.filter(n => mins(n.at) >= AFTERNOON_FROM).every(n => /log/i.test(`${n.title} ${n.body}`)))

// The point of the redesign: balance, not volume.
ok('a nudge names the neglected sphere', nudges.some(n => n.body.includes(QUIET.name)))
ok('never the one you are already busy in', nudges.every(n => !n.body.includes(BUSY.name)))
ok('never an archived one', nudges.every(n => !n.body.includes(ARCHIVED.name)))
ok('and says how long it has been', nudges.some(n => /9 days/.test(n.body)))

ok('a never-logged sphere is named over a merely skipped one',
  nudgeSubject([BUSY, QUIET, { id: 'gym', name: 'Fitness' }], LOGS, NOW)?.sphere.id === 'gym')
ok('no spheres, no subject', nudgeSubject([], LOGS, NOW) === null)
ok('no spheres still has something to say',
  !!nudgeCopy({ afternoon: true, subject: null }).body && !!nudgeCopy({ afternoon: false, subject: null }).body)
ok('the copy asks rather than accuses', nudges.every(n => /\?/.test(`${n.title}${n.body}`)))

// — "if they have not done so yet" —

const logged = base({ garden: { daily: { day: '2026-01-15', logs: 1 } } })
  .filter(n => n.category === 'nudge' && new Date(n.at).getDate() === 15)
ok('logging something silences the rest of today’s nudges', logged.length === 0)

const planned = base({ garden: { daily: { day: '2026-01-15', goals: 1 } } })
  .filter(n => n.category === 'nudge' && new Date(n.at).getDate() === 15)
ok('setting a goal answers the morning’s question', planned.every(n => mins(n.at) >= AFTERNOON_FROM))
ok('but not the afternoon’s', planned.length > 0)

ok('tomorrow’s nudges are unaffected — nothing is known about tomorrow',
  base({ garden: { daily: { day: '2026-01-15', logs: 4 } } }).some(n => n.category === 'nudge'))
ok('yesterday’s bucket does not silence today',
  base({ garden: { daily: { day: '2026-01-14', logs: 9 } } })
    .some(n => n.category === 'nudge' && new Date(n.at).getDate() === 15))

// — switches —

for (const category of CATEGORIES) {
  ok(`"${category}" can be turned off on its own`,
    base({ settings: { [category]: false } }).every(n => n.category !== category))
}
ok('the greenhouse flower alarm is gone with the greenhouse', !CATEGORIES.includes('flower'))
ok('quiet mode stops the nudges, being the loudest part of the game layer',
  base({ garden: { quiet_mode: true } }).every(n => n.category !== 'nudge'))

// — the parts that need setting up first —

ok('no planning alarms until the hours are actually set',
  planNotifications({ now: NOW, garden: { prefs: {} } }).every(n => n.category !== 'planning'))
ok('planning alarms once they are', plan.some(n => n.category === 'planning'))
ok('no streak alarm without a streak to lose',
  base({ garden: { streak: { current: 0 } } }).every(n => n.category !== 'streak'))

// — nothing at all is a valid plan —

ok('an empty account schedules nothing rather than throwing', Array.isArray(planNotifications({ now: NOW })))
ok('and no argument at all does not throw', Array.isArray(planNotifications()))

// — a focus block warns before it starts —

const focus = base({
  focusBlocks: [{ id: 'b1', sphereId: 'rec', sphereName: 'Recruiting', start: new Date(2026, 0, 15, 13, 0).toISOString() }],
}).filter(n => n.category === 'focus')
ok('a focus block warns you five minutes before it starts',
  focus.length === 1 && mins(focus[0].at) === 12 * 60 + 55, JSON.stringify(focus))
ok('and says logs there pay double', /pay double/i.test(focus[0]?.body || ''))
ok('it never talks about clearing a board that no longer exists', !/board|park/i.test(focus[0]?.body || ''))

ok('nudgeTimes is empty when the waking day is too short to fit one',
  nudgeTimes(8 * 60, 8 * 60 + 60).length === 0)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

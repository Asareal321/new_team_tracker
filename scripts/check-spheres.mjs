// Progress, not completion — the rules that make that true.
//
// The redesign rests on a few promises that are easy to break quietly: a
// garden grows from every log but rewards stop at a cap; the nudge only speaks
// when it has a fair point; a goal needs an end date and nothing else; and
// nothing is measured against a target, so there is nothing to "fail".

import {
  tally, balanceNudge, logReward, checkGoal, daysLeft, daysSince, loggedToday,
  LOG_REWARD, DAILY_LOG_CAP, NUDGE_MIN_WEEK_LOGS,
} from '../src/lib/spheres.js'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

let pass = 0, fail = 0
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const NOW = new Date(2026, 9, 13, 15, 0)
const ago = days => new Date(NOW.getTime() - days * 864e5).toISOString()
const log = (sphere_id, days, goal_id = null) => ({ sphere_id, goal_id, logged_at: ago(days) })

const ECON = { id: 'econ', name: 'ECON 2220' }
const REC = { id: 'rec', name: 'Recruiting' }
const GYM = { id: 'gym', name: 'Fitness' }

// — tallies —

const t = tally([log('econ', 0, 'g1'), log('econ', 3, 'g1'), log('econ', 9), log('rec', 1)], { now: NOW })
ok('a sphere counts its week', t.bySphere.econ.week === 2)
ok('and its all-time total', t.bySphere.econ.total === 3)
ok('a goal counts too', t.byGoal.g1.week === 2 && t.byGoal.g1.total === 2)
ok('the week total is across spheres', t.week === 3)
ok('the most recent log is remembered', t.bySphere.econ.last === ago(0))
ok('a log from the future counts toward the total but not the week', (() => {
  const f = tally([{ sphere_id: 'econ', logged_at: new Date(NOW.getTime() + 864e5).toISOString() }], { now: NOW })
  return f.bySphere.econ.total === 1 && f.bySphere.econ.week === 0
})())
ok('nothing in, nothing out', tally([], { now: NOW }).week === 0)
ok('junk rows are skipped, not counted', tally([null, {}, { sphere_id: null }], { now: NOW }).total === 0)

// — the nudge —

const heavy = [...Array(6)].map((_, i) => log('econ', i * 0.4)).concat([log('gym', 2), log('rec', 11)])
const n = balanceNudge({ spheres: [ECON, REC, GYM], logs: heavy, now: NOW })
ok('a lopsided week gets a nudge', !!n)
ok('it names the busy sphere', n?.busy.id === 'econ')
ok('it names the one with nothing this week, not the one with a little', n?.quiet.id === 'rec')
ok('and says how long it has been', /in 11 days/.test(n?.message || ''), n?.message)
ok('the message is a suggestion, not an instruction', /\?$/.test(n?.message || ''))

ok('a never-logged sphere is quieter than a skipped one', (() => {
  const x = balanceNudge({
    spheres: [ECON, REC, GYM],
    logs: [...Array(6)].map((_, i) => log('econ', i * 0.4)).concat([log('rec', 20)]),
    now: NOW,
  })
  return x?.quiet.id === 'gym' && /yet/.test(x.message)
})())

ok('one sphere has nothing to be balanced against',
  balanceNudge({ spheres: [ECON], logs: heavy, now: NOW }) === null)
ok(`too little logged (under ${NUDGE_MIN_WEEK_LOGS}) is not enough to judge`,
  balanceNudge({ spheres: [ECON, REC], logs: [log('econ', 0), log('econ', 1), log('econ', 2)], now: NOW }) === null)
ok('an even week gets no nudge', balanceNudge({
  spheres: [ECON, REC],
  logs: [log('econ', 0), log('econ', 1), log('econ', 2), log('rec', 0), log('rec', 1), log('rec', 2)],
  now: NOW,
}) === null)
ok('an archived sphere is never the one you are told to work on', (() => {
  const x = balanceNudge({
    spheres: [ECON, { ...REC, archived_at: ago(30) }, GYM],
    logs: [...Array(6)].map((_, i) => log('econ', i * 0.4)),
    now: NOW,
  })
  return x?.quiet.id === 'gym'
})())

// — rewards —

ok('a log pays the base reward', logReward({ daily: {} }).coins === LOG_REWARD.coins)
ok('a boosted log pays double', logReward({ daily: {}, boost: true }).coins === LOG_REWARD.coins * 2)
ok('the cap stops the coins', logReward({ daily: { logCoins: DAILY_LOG_CAP.coins } }).coins === 0)
ok('a log that straddles the cap pays the remainder', (() => {
  const r = logReward({ daily: { logCoins: DAILY_LOG_CAP.coins - 10 }, boost: true })
  return r.coins === 10 && r.capped
})())
ok('the boost does not get its own allowance past the cap',
  logReward({ daily: { logCoins: DAILY_LOG_CAP.coins }, boost: true }).coins === 0)
ok('a missing daily bucket is a fresh day', logReward({}).coins === LOG_REWARD.coins)

// — goals —

const good = checkGoal({ title: 'Read 12 chapters of the essay book', end_date: '2026-12-01' }, { now: NOW })
ok('a SMART goal passes with no hints', good.ok && good.hints.length === 0, JSON.stringify(good.hints))

const vague = checkGoal({ title: 'fitness', end_date: '2026-12-01' }, { now: NOW })
ok('a vague goal still saves — the user chooses', vague.ok)
ok('but is nudged to be specific', vague.hints.some(h => h.letter === 'S'))
ok('and measurable', vague.hints.some(h => h.letter === 'M'))

ok('no end date blocks it', !checkGoal({ title: 'Run a 5k', end_date: '' }, { now: NOW }).ok)
ok('a date in the past blocks it', !checkGoal({ title: 'Run a 5k', end_date: '2026-10-12' }, { now: NOW }).ok)
ok('today is allowed', checkGoal({ title: 'Run a 5k', end_date: '2026-10-13' }, { now: NOW }).ok)
ok('nonsense dates are rejected', !checkGoal({ title: 'Run a 5k', end_date: '2026-13-45' }, { now: NOW }).ok)
ok('no title blocks it', !checkGoal({ title: '   ', end_date: '2026-12-01' }, { now: NOW }).ok)
ok('every error names its field', checkGoal({}, { now: NOW }).errors.every(e => e.field && e.text))

ok('days left counts to the end date', daysLeft({ end_date: '2026-10-20' }, NOW) === 7)
ok('and goes negative after it', daysLeft({ end_date: '2026-10-10' }, NOW) === -3)
ok('daysSince is in whole calendar days', daysSince(new Date(2026, 9, 12, 23, 59).toISOString(), NOW) === 1)
ok('daysSince of nothing is nothing', daysSince(null, NOW) === null)

// — streak —

ok('a log today counts for the streak', loggedToday([log('econ', 0)], NOW))
ok('one from yesterday does not', !loggedToday([log('econ', 1)], NOW))

// — the stylesheet owns its prefixes —
//
// The first render of these pages came out with a 460px log box and invisible
// sphere chips, because the streak panel already used the sp- prefix and its
// fixed width and entrance-animation opacity landed on these elements. Nothing
// errors when that happens; the page just looks wrong. So each prefix this
// stylesheet uses must be defined nowhere else.

const OWN = ['sph-', 'st-', 'sg-', 'lb-', 'gf-']
const sheets = []
;(function walk(dir) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name)
    if (e.isDirectory()) walk(p)
    else if (p.endsWith('.css') && !p.endsWith('Spheres.css')) sheets.push(p)
  }
})('src')
for (const prefix of OWN) {
  const clash = sheets.filter(f => new RegExp(`\\.${prefix}[a-z]`).test(readFileSync(f, 'utf8')))
  ok(`no other stylesheet defines .${prefix}* classes`, clash.length === 0, clash.join(', '))
}

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

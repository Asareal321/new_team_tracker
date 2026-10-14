// Progress, not completion — the rules that make that true.
//
// The redesign rests on a few promises that are easy to break quietly: a
// garden grows from every log but rewards stop at a cap; the nudge only speaks
// when it has a fair point; a goal needs an end date and nothing else; and
// nothing is measured against a target, so there is nothing to "fail".

import {
  contributors, ownLogs,
  tally, balanceNudge, logReward, checkGoal, daysLeft, daysSince, loggedToday,
  pickPlant, takeSeed, logDaily, focusFor, boostFor, searchLogs, byDay, deadlineGroups,
  LOG_REWARD, DAILY_LOG_CAP, NUDGE_MIN_WEEK_LOGS,
} from '../src/lib/spheres.js'
import { BONUS_CAP } from '../src/lib/planningHours.js'
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
const paid = r => r.coins + r.bonusCoins
ok('a log inside a window pays double', paid(logReward({ daily: {}, window: 'morning' })) === LOG_REWARD.coins * 2)
ok('the cap stops the coins', logReward({ daily: { logCoins: DAILY_LOG_CAP.coins } }).coins === 0)
ok('a log that straddles the cap pays the remainder of the base', (() => {
  const r = logReward({ daily: { logCoins: DAILY_LOG_CAP.coins - 10 } })
  return r.coins === 10 && r.capped
})())

// The decision this protects: planning tomorrow at 11pm has to be worth
// something even on a day you already maxed out. The bonus half ignores the
// daily cap and meters only against its own window.
ok('the bonus half ignores the daily cap', (() => {
  const r = logReward({ daily: { logCoins: DAILY_LOG_CAP.coins, seeds: DAILY_LOG_CAP.seeds }, window: 'evening' })
  return r.coins === 0 && r.bonusCoins === LOG_REWARD.coins && r.bonusSeeds === LOG_REWARD.seeds
})())
ok('but each window has its own allowance', (() => {
  const r = logReward({ daily: { bonus: { evening: { coins: BONUS_CAP.coins, seeds: BONUS_CAP.seeds } } }, window: 'evening' })
  return r.bonusCoins === 0 && r.bonusSeeds === 0
})())
ok('spending the evening’s allowance leaves the morning’s alone', (() => {
  const r = logReward({ daily: { bonus: { evening: { coins: BONUS_CAP.coins, seeds: BONUS_CAP.seeds } } }, window: 'morning' })
  return r.bonusCoins === LOG_REWARD.coins
})())
ok('and each focus block is its own window', (() => {
  const d = { bonus: { 'focus:ev1': { coins: BONUS_CAP.coins, seeds: BONUS_CAP.seeds } } }
  return logReward({ daily: d, window: 'focus:ev1' }).bonusCoins === 0
    && logReward({ daily: d, window: 'focus:ev2' }).bonusCoins === LOG_REWARD.coins
})())
ok('no window, no bonus', logReward({ daily: {} }).bonusCoins === 0)
ok('the bonus is recorded against its window, not the daily cap', (() => {
  const d = logDaily({}, { sphereId: 'econ', coins: 25, seeds: 1, window: 'evening', bonusCoins: 25, bonusSeeds: 1 })
  return d.logCoins === 25 && d.seeds === 1 && d.bonus.evening.coins === 25 && d.bonus.evening.seeds === 1
})())
ok('a focus log names its block as the window', (() => {
  const f = { block: { id: 'ev9' }, sphere: { id: 'econ', name: 'ECON' } }
  return boostFor({ sphereId: 'econ', focus: f }).window === 'focus:ev9'
})())
ok('a planning log names its hour', boostFor({ sphereId: 'econ', planning: 'morning' }).window === 'morning')
ok('a missing daily bucket is a fresh day', logReward({}).coins === LOG_REWARD.coins)

ok('a log pays a sprout too', logReward({ daily: {} }).seeds === LOG_REWARD.seeds)
ok('sprouts stop at the seed cap on their own',
  logReward({ daily: { seeds: DAILY_LOG_CAP.seeds } }).seeds === 0
  && logReward({ daily: { seeds: DAILY_LOG_CAP.seeds } }).coins === LOG_REWARD.coins)
ok('coins stop at their cap on their own',
  logReward({ daily: { logCoins: DAILY_LOG_CAP.coins } }).seeds === LOG_REWARD.seeds)

// — what a log plants —

ok('an empty bag still plants something, for free',
  (() => { const p = pickPlant({ inventory: {}, id: 'x' }); return !!p.seedKey && p.consume === false })())
ok('a pinned seed you hold is planted and used up', (() => {
  const p = pickPlant({ inventory: { rose: 1, daisy: 9 }, pinned: 'rose', id: 'x' })
  return p.seedKey === 'rose' && p.consume
})())
ok('a pinned seed you have run out of falls back to the bag', (() => {
  const p = pickPlant({ inventory: { daisy: 2 }, pinned: 'rose', id: 'x' })
  return p.seedKey === 'daisy' && p.consume
})())
ok('the same log always draws the same plant', (() => {
  const inv = { rose: 3, daisy: 5, clover: 2 }
  return pickPlant({ inventory: inv, id: 'same' }).seedKey === pickPlant({ inventory: inv, id: 'same' }).seedKey
})())
ok('the draw is weighted by how many of each you hold', (() => {
  const inv = { rose: 1, daisy: 99 }
  let daisies = 0
  for (let i = 0; i < 400; i++) if (pickPlant({ inventory: inv, id: `log-${i}` }).seedKey === 'daisy') daisies++
  return daisies > 360
})())
ok('only seeds actually in the bag are ever drawn', (() => {
  for (let i = 0; i < 200; i++) {
    const k = pickPlant({ inventory: { tulip: 1 }, id: `l${i}` }).seedKey
    if (k !== 'tulip') return false
  }
  return true
})())

ok('taking a seed removes one', takeSeed({ rose: 2 }, 'rose').rose === 1)
ok('taking the last one removes the entry', !('rose' in takeSeed({ rose: 1 }, 'rose')))
ok('taking one you do not have changes nothing',
  JSON.stringify(takeSeed({ daisy: 1 }, 'rose')) === JSON.stringify({ daisy: 1 }))
ok('the bag passed in is not mutated', (() => { const b = { rose: 2 }; takeSeed(b, 'rose'); return b.rose === 2 })())

// — today's counters —

const d1 = logDaily({}, { sphereId: 'econ', goalId: 'g1', coins: 25, seeds: 1 })
const d2 = logDaily(d1, { sphereId: 'econ', coins: 25, seeds: 1 })
const d3 = logDaily(d2, { sphereId: 'gym', coins: 0, seeds: 0 })
ok('every log counts', d3.logs === 3)
ok('spheres touched is a distinct count, not a running total', d3.spheres === 2)
ok('goal logs only count logs that named a goal', d3.goalLogs === 1)
ok('coins and sprouts paid are added up for the caps', d3.logCoins === 50 && d3.seeds === 2)
ok('the bucket passed in is not mutated', d1.logs === 1)

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

// — focus blocks —

const at = (h, m = 0) => new Date(2026, 9, 13, h, m).toISOString()
const ev = (id, title, h1, h2) => ({ id, title, start: at(h1), end: at(h2) })
const SPH = [ECON, REC, GYM]

const f1 = focusFor({ events: [ev('e1', 'ECON 2220 problem set', 14, 16)], spheres: SPH, now: NOW })
ok('an event naming a sphere, happening now, is a focus block', f1.sphere?.id === 'econ')
ok('an event naming nothing is not', focusFor({ events: [ev('e2', 'Dentist', 14, 16)], spheres: SPH, now: NOW }).sphere === null)
ok('an event that has not started yet is not', focusFor({ events: [ev('e3', 'Recruiting prep', 16, 17)], spheres: SPH, now: NOW }).sphere === null)
ok('but it is listed as coming up', (() => {
  const f = focusFor({ events: [ev('e3', 'Recruiting prep', 16, 17)], spheres: SPH, now: NOW })
  return f.upcoming.length === 1 && f.upcoming[0].sphereId === 'rec'
})())
ok('an archived sphere never becomes a focus block',
  focusFor({ events: [ev('e1', 'Fitness', 14, 16)], spheres: [{ ...GYM, archived_at: ago(3) }], now: NOW }).sphere === null)
ok('all-day events never count', focusFor({
  events: [{ id: 'd', title: 'Fitness', start: '2026-10-13', end: '2026-10-14', allDay: true }], spheres: SPH, now: NOW,
}).sphere === null)

ok('a log in the focus sphere is boosted', boostFor({ sphereId: 'econ', focus: f1 }).why === 'focus')
ok('a log in another sphere is not', !boostFor({ sphereId: 'gym', focus: f1 }).boost)
ok('a planning hour boosts any sphere', boostFor({ sphereId: 'gym', planning: 'evening' }).why === 'planning')
ok('focus and planning together are still only double — and say focus',
  (() => { const b = boostFor({ sphereId: 'econ', focus: f1, planning: 'morning' }); return b.boost === true && b.why === 'focus' })())
ok('no reason, no boost', boostFor({ sphereId: 'econ' }).boost === false)

// — search —

const named = { econ: 'ECON 2220', gym: 'Fitness' }
const goalsT = { g1: 'Finish 3 practice midterms' }
const sLogs = [
  { id: 'a', sphere_id: 'econ', goal_id: 'g1', note: 'Timed practice', logged_at: ago(0) },
  { id: 'b', sphere_id: 'econ', note: 'Read chapter 4', logged_at: ago(1) },
  { id: 'c', sphere_id: 'gym', note: 'Read about running form', logged_at: ago(1.2) },
]
const opts = { sphereName: id => named[id], goalTitle: id => goalsT[id] }
ok('search matches the note', searchLogs(sLogs, ['chapter'], opts).map(l => l.id).join() === 'b')
ok('and the sphere name', searchLogs(sLogs, ['fitness'], opts).map(l => l.id).join() === 'c')
ok('and the goal title', searchLogs(sLogs, ['midterms'], opts).map(l => l.id).join() === 'a')
ok('every term has to match', searchLogs(sLogs, ['read', 'econ'], opts).map(l => l.id).join() === 'b')
ok('case does not matter', searchLogs(sLogs, ['READ'], opts).length === 2)
ok('no terms returns everything', searchLogs(sLogs, [], opts).length === 3)

const days = byDay(sLogs)
ok('logs are grouped by the day they were written', days.length === 2 && days[1].logs.length === 2)

// — goals by deadline —

const dGoals = [
  { id: 'late', status: 'active', end_date: '2026-10-10' },
  { id: 'soon', status: 'active', end_date: '2026-10-16' },
  { id: 'tenday', status: 'active', end_date: '2026-10-23' },
  { id: 'month', status: 'active', end_date: '2026-11-01' },
  { id: 'far', status: 'active', end_date: '2027-03-01' },
  { id: 'done', status: 'done', end_date: '2026-10-15' },
]
const dg = deadlineGroups(dGoals, { counts: { byGoal: { soon: { week: 2, total: 5 } } }, now: NOW })
ok('a passed end date is overdue', dg.overdue.map(r => r.goal.id).join() === 'late')
ok('within a week is this week', dg.week.map(r => r.goal.id).join() === 'soon')
ok('within a month is this month', dg.month.map(r => r.goal.id).join() === 'tenday,month')
ok('anything further is later', dg.later.map(r => r.goal.id).join() === 'far')
ok('closed goals are not deadlines any more',
  !Object.values(dg).flat().some(r => r.goal.id === 'done'))
ok('a goal ending within a fortnight with nothing logged this week is flagged quiet',
  dg.month[0].goal.id === 'tenday' && dg.month[0].quiet === true)
ok('one further out than a fortnight is not, yet', dg.month[1].quiet === false)
ok('one with logs this week is not', dg.week[0].quiet === false)

// — shared spheres —
{
  const N = new Date('2026-10-13T12:00:00Z')
  const at = d => new Date(N.getTime() - d * 86400000).toISOString()
  const L = [
    { user_id: 'a', logged_at: at(1) }, { user_id: 'a', logged_at: at(20) },
    { user_id: 'b', logged_at: at(2) }, { user_id: 'b', logged_at: at(3) },
    { user_id: 'c', logged_at: at(30) },
  ]
  const c = contributors(L, { now: N })
  ok('contributors: one row per person', c.length === 3)
  ok('busiest this week first', c[0].userId === 'b' && c[0].week === 2)
  ok('a member with nothing this week still appears', c[2].userId === 'c' && c[2].week === 0 && c[2].total === 1)
  ok('ownLogs keeps only yours', ownLogs(L, 'a').length === 2)
  ok('ownLogs with no user is empty', ownLogs(L, null).length === 0)
}

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

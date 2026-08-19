// Checks the daily-cap and streak arithmetic, and that every achievement is
// reachable. All of it is pure, so none of it needs a browser.
//
// Run with:  node scripts/check-progress.mjs

import {
  DAILY_CAPS, ADD_TASK_REWARD,
  localDay, previousDay, todayBucket, advanceStreak, liveStreak,
} from '../src/lib/garden.js'
import { ACHIEVEMENTS, evaluate, newlyUnlocked } from '../src/lib/achievements.js'

const checks = []
const check = (name, ok, detail = '') => checks.push({ name, ok, detail })

const today = localDay()
const yesterday = previousDay(today)
const longAgo = '2020-01-01'

// --- daily buckets --------------------------------------------------------
check('a bucket from an earlier day resets',
  todayBucket({ day: longAgo, seeds: 9, coins: 300, clouds: 10 }).seeds === 0)
check('today\'s bucket is kept',
  todayBucket({ day: today, seeds: 4, coins: 0, clouds: 0 }).seeds === 4)
check('a missing bucket starts empty', todayBucket(null).clouds === 0)
check('a rolled bucket is stamped with today', todayBucket(null).day === today)

// Adding tasks can't out-earn the cap however many are added.
let bucket = todayBucket(null)
let seeds = 0
for (let i = 0; i < 100; i++) {
  const gain = Math.min(ADD_TASK_REWARD.seeds, Math.max(0, DAILY_CAPS.seeds - bucket.seeds))
  seeds += gain
  bucket = { ...bucket, seeds: bucket.seeds + gain }
}
check('100 added tasks pay at most the daily cap', seeds === DAILY_CAPS.seeds, `${seeds} seeds`)

// Coins now come from adding tasks too, metered against their own cap.
let coins = 0, cb = todayBucket(null)
for (let i = 0; i < 100; i++) {
  const gain = Math.min(ADD_TASK_REWARD.coins, Math.max(0, DAILY_CAPS.coins - cb.coins))
  coins += gain
  cb = { ...cb, coins: cb.coins + gain }
}
check('100 added tasks pay at most the coin cap', coins === DAILY_CAPS.coins, `${coins} coins`)
check('the coin cap is a whole number of task adds',
  DAILY_CAPS.coins % ADD_TASK_REWARD.coins === 0,
  `${DAILY_CAPS.coins}/${ADD_TASK_REWARD.coins}`)

// The two caps are metered separately, so one running out mustn't stop the
// other. Seeds cap at 12 adds and coins at 20, so adds 13-20 pay coins alone.
let sb = todayBucket(null), paidSeed = 0, paidCoin = 0
for (let i = 0; i < 20; i++) {
  const s = Math.min(ADD_TASK_REWARD.seeds, Math.max(0, DAILY_CAPS.seeds - sb.seeds))
  const c = Math.min(ADD_TASK_REWARD.coins, Math.max(0, DAILY_CAPS.coins - sb.coins))
  if (s > 0) paidSeed++
  if (c > 0) paidCoin++
  sb = { ...sb, seeds: sb.seeds + s, coins: sb.coins + c }
}
check('the seed cap stops seeds', paidSeed === DAILY_CAPS.seeds, `${paidSeed} adds paid a seed`)
check('the seed cap does not stop coins', paidCoin > paidSeed, `${paidCoin} adds paid coins`)

// Emptying Doing is still counted even though it no longer pays — the quests
// and the Clean slate awards read it, and a counter nothing increments would
// make them unreachable.
check('clearing Doing is still counted, just not paid',
  ACHIEVEMENTS.some(a => String(a.value).includes('doingClears')))

// --- streaks --------------------------------------------------------------
check('a first task starts the streak at 1',
  advanceStreak(null, today).current === 1)
check('a second task the same day does not double-count',
  advanceStreak({ current: 3, best: 3, lastDay: today }, today).current === 3)
check('the next day extends it',
  advanceStreak({ current: 3, best: 3, lastDay: yesterday }, today).current === 4)
check('a missed day starts over',
  advanceStreak({ current: 9, best: 9, lastDay: longAgo }, today).current === 1)
check('the best is kept when the streak resets',
  advanceStreak({ current: 9, best: 9, lastDay: longAgo }, today).best === 9)
check('a streak is live the day after',
  liveStreak({ current: 5, best: 5, lastDay: yesterday }) === 5)
check('a stale streak reads as zero',
  liveStreak({ current: 5, best: 5, lastDay: longAgo }) === 0)
// A month boundary is where naive date arithmetic breaks.
check('previousDay crosses a month boundary', previousDay('2026-03-01') === '2026-02-28')
check('previousDay crosses a year boundary', previousDay('2026-01-01') === '2025-12-31')

// --- achievements ---------------------------------------------------------
check('every achievement has a unique key',
  new Set(ACHIEVEMENTS.map(a => a.key)).size === ACHIEVEMENTS.length)
check('every achievement has a positive goal',
  ACHIEVEMENTS.every(a => a.goal > 0))

const empty = evaluate({}, 0)
check('nothing is earned on a fresh garden',
  empty.every(a => !a.earned), `${empty.filter(a => a.earned).length} earned`)
check('a fresh garden reports no progress bars over 100',
  empty.every(a => a.pct >= 0 && a.pct <= 100))

// Maxed out: every achievement should be reachable, or it's decoration.
const maxed = {
  stats: {
    tasksDone: 99999, tasksAdded: 99999, doingClears: 99999,
    cloudsPopped: 99999, packetsOpened: 99999, flowersGrown: 99999, bestCloudTier: 5,
    questsDone: 99999,
  },
  streak: { current: 999, best: 999, lastDay: today },
  discovered: Object.fromEntries(
    (await import('../src/lib/garden.js')).SEEDS.map(s => [s.key, 1])),
}
const all = evaluate(maxed, 24)
check('every achievement is reachable', all.every(a => a.earned),
  all.filter(a => !a.earned).map(a => a.key).join(',') || 'all')

// Unlocks are announced once and then remembered.
const fresh = newlyUnlocked({ stats: { tasksDone: 1 } }, 0)
check('finishing one task unlocks exactly the first-task award',
  fresh.length === 1 && fresh[0].key === 'done-1',
  fresh.map(a => a.key).join(','))
const already = newlyUnlocked({ stats: { tasksDone: 1 }, achievements: { 'done-1': 'x' } }, 0)
check('an already-recorded award is not re-announced', already.length === 0)

let failed = 0
for (const c of checks) {
  if (!c.ok) failed++
  console.log(`${c.ok ? 'ok  ' : 'FAIL'}  ${c.name.padEnd(50)} ${c.detail}`)
}
console.log(`\n${checks.length - failed}/${checks.length} passed`)
if (failed) process.exit(1)

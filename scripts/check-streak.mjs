// Streak reward invariants, checked without a browser.

import {
  streakCoins, streakReward, streakWeek,
  STREAK_MILESTONES, STREAK_MAX_COINS, STREAK_BASE,
} from '../src/lib/streak.js'
import { PACKETS, DAILY_CAPS } from '../src/lib/garden.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const DAYS = Array.from({ length: 400 }, (_, i) => i + 1)

ok('a day-one streak still pays something', streakCoins(1) > 0)

ok('the payout never falls as the run grows',
  DAYS.every(d => streakCoins(d) >= streakCoins(d - 1)))

ok('the payout is capped', DAYS.every(d => streakCoins(d) <= STREAK_MAX_COINS))
ok('the cap is actually reached', streakCoins(365) === STREAK_MAX_COINS)

// The whole reason it sits outside the daily cap is that it can't be farmed.
// If one streak day could out-earn a whole day of capped work, that reasoning
// would stop holding.
ok('a streak day never out-earns a full day of work',
  STREAK_MAX_COINS < DAILY_CAPS.coins,
  `${STREAK_MAX_COINS} vs ${DAILY_CAPS.coins}`)

ok('the first day is worth at least the base', streakCoins(1) >= STREAK_BASE)

// — milestones —

ok('every milestone names a real packet',
  Object.values(STREAK_MILESTONES).every(k => PACKETS.some(p => p.key === k)))

ok('milestones escalate rather than repeat',
  new Set(Object.values(STREAK_MILESTONES)).size === Object.values(STREAK_MILESTONES).length)

const milestoneDays = Object.keys(STREAK_MILESTONES).map(Number).sort((a, b) => a - b)
ok('milestone packets get rarer as the run gets longer',
  milestoneDays.every((d, i) => {
    if (i === 0) return true
    const prev = PACKETS.find(p => p.key === STREAK_MILESTONES[milestoneDays[i - 1]])
    const here = PACKETS.find(p => p.key === STREAK_MILESTONES[d])
    return here.rarity >= prev.rarity
  }))

ok('a milestone day reports a packet', streakReward(milestoneDays[0]).milestone === true)
ok('an ordinary day reports none', streakReward(2).milestone === false && streakReward(2).packet === null)

ok('most days are not milestones',
  DAYS.filter(d => streakReward(d).milestone).length <= 6)

// — the week strip —

const noon = new Date(2026, 7, 17, 12)
ok('the strip is always seven days', [0, 1, 3, 7, 40].every(n => streakWeek(n, noon).length === 7))

ok('exactly today is marked today',
  streakWeek(5, noon).filter(d => d.today).length === 1
  && streakWeek(5, noon)[6].today === true)

ok('a short run only fills what it covers',
  streakWeek(3, noon).filter(d => d.done).length === 3)

ok('a long run fills the whole strip',
  streakWeek(40, noon).every(d => d.done))

ok('a run of nothing fills nothing',
  streakWeek(0, noon).every(d => !d.done))

// The filled days are the run, so they have to end at today rather than start
// at Monday.
ok('the filled days end at today',
  streakWeek(3, noon).slice(4).every(d => d.done)
  && streakWeek(3, noon).slice(0, 4).every(d => !d.done))

ok('weekday letters follow the calendar',
  streakWeek(7, noon)[6].letter === ['S', 'M', 'T', 'W', 'T', 'F', 'S'][noon.getDay()])

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

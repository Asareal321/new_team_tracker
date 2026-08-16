// Quest invariants, checked without a browser.
//
// The daily board is a pure function of the date and the day's counters, which
// is exactly what makes it checkable here: no rendering, no clock to mock
// beyond the date string itself.

import { QUEST_POOL, QUEST_TIERS, questsForDay, questView, claimableCount } from '../src/lib/quests.js'
import { DAILY_CAPS, localDay } from '../src/lib/garden.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

// A month of days, enough to see the rotation without pretending to be a
// distribution test.
const DAYS = Array.from({ length: 30 }, (_, i) => `2026-03-${String(i + 1).padStart(2, '0')}`)

// — the pool itself —

ok('every quest key is unique',
  new Set(QUEST_POOL.map(q => q.key)).size === QUEST_POOL.length)

ok('every quest names a known tier',
  QUEST_POOL.every(q => QUEST_TIERS[q.tier]))

ok('every tier has something to draw from',
  ['easy', 'standard', 'hard'].every(t => QUEST_POOL.some(q => q.tier === t)))

ok('harder tiers pay more',
  QUEST_TIERS.easy.coins < QUEST_TIERS.standard.coins
  && QUEST_TIERS.standard.coins < QUEST_TIERS.hard.coins)

// A quest asking for more than a day can produce would be permanently
// unclaimable — the caps are the ceiling on how much of a day exists.
const CEILING = {
  done: DAILY_CAPS.clouds, added: DAILY_CAPS.seeds, popped: DAILY_CAPS.clouds,
  clears: 5, packets: 5, grown: 3, planted: 5,
}
ok('no quest asks for more than a day holds',
  QUEST_POOL.every(q => q.goal <= (CEILING[q.counter] ?? 0)),
  QUEST_POOL.filter(q => q.goal > (CEILING[q.counter] ?? 0)).map(q => q.key).join(', '))

// — the daily draw —

ok('a day offers exactly three quests',
  DAYS.every(d => questsForDay(d).length === 3))

ok('a day offers one of each tier',
  DAYS.every(d => {
    const tiers = questsForDay(d).map(q => q.tier)
    return ['easy', 'standard', 'hard'].every(t => tiers.filter(x => x === t).length === 1)
  }))

ok('a day never asks for the same counter twice',
  DAYS.every(d => {
    const counters = questsForDay(d).map(q => q.counter)
    return new Set(counters).size === counters.length
  }))

ok('the same date always draws the same three',
  DAYS.every(d => questsForDay(d).map(q => q.key).join() === questsForDay(d).map(q => q.key).join()))

// If the draw were constant, the "resets at midnight" promise would be a lie.
const boards = new Set(DAYS.map(d => questsForDay(d).map(q => q.key).join()))
ok('the board changes across a month', boards.size > 3, `${boards.size} distinct boards in 30 days`)

// — progress and claiming —

const today = localDay()
const first = questsForDay(today)[0]

const empty = questView({}, { day: today })
ok('nothing is claimable on an empty day', empty.every(q => !q.claimable && !q.claimed))

const partial = questView({}, { day: today, [first.counter]: first.goal - 1 })
ok('an unfinished quest is not claimable', !partial.find(q => q.key === first.key).claimable)

const finished = questView({}, { day: today, [first.counter]: first.goal })
ok('a finished quest is claimable', finished.find(q => q.key === first.key).claimable)

ok('progress is clamped to the goal',
  questView({}, { day: today, [first.counter]: first.goal * 9 })
    .find(q => q.key === first.key).value === first.goal)

const claimedState = { quests: { day: today, claimed: [first.key] } }
const afterClaim = questView(claimedState, { day: today, [first.counter]: first.goal })
ok('a claimed quest stops being claimable',
  afterClaim.find(q => q.key === first.key).claimed
  && !afterClaim.find(q => q.key === first.key).claimable)

// The claim record is stamped with its day, so yesterday's can't suppress
// today's identical quest.
const staleClaim = { quests: { day: '2000-01-01', claimed: [first.key] } }
ok('a claim from another day is ignored',
  questView(staleClaim, { day: today, [first.counter]: first.goal })
    .find(q => q.key === first.key).claimable)

ok('claimableCount agrees with the view',
  claimableCount({}, { day: today, [first.counter]: first.goal }) === 1)

// A bucket left over from yesterday counts as nothing — the same rule the
// daily caps run on.
ok('yesterday’s counters do not carry',
  questView({}, { day: '2000-01-01', [first.counter]: 99 }).every(q => !q.done))

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

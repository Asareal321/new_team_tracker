// What continuing a streak is worth.
//
// The payout sits outside the daily coin cap, and for the same reason quest
// payouts do: it can only happen once a day and the amount is fixed by the
// streak's own length, so it can't be farmed. Capping it would mean the
// celebration panel sometimes announced a reward it hadn't paid, which reads
// as a bug rather than as a limit.

import { packetByKey } from './garden.js'

// Grows with the run, then flattens. Day 1 is worth having; day 200 isn't worth
// two hundred times day 1, and an unbounded curve would eventually out-earn
// every other source in the game put together.
export const STREAK_BASE = 25
export const STREAK_PER_DAY = 5
export const STREAK_MAX_COINS = 150

// A streak long enough to be worth marking gets a packet as well. Escalating
// rather than repeating: reaching 100 days and being handed the same packet as
// day 3 would be a worse moment than no packet at all.
export const STREAK_MILESTONES = {
  3: 'common',
  7: 'uncommon',
  30: 'rare',
  100: 'epic',
}

export function streakCoins(streak) {
  return Math.min(STREAK_MAX_COINS, STREAK_BASE + Math.max(0, streak) * STREAK_PER_DAY)
}

// Everything the panel needs to announce, and everything the provider needs to
// pay out. One function so the two can't disagree.
export function streakReward(streak) {
  const packetKey = STREAK_MILESTONES[streak] || null
  return {
    streak,
    coins: streakCoins(streak),
    packetKey,
    packet: packetKey ? packetByKey(packetKey) : null,
    milestone: !!packetKey,
  }
}

// The last seven days, today last.
//
// trakkit stores a streak as {current, best, lastDay} — there is no per-day
// history — so the strip is derived: the final `min(streak, 7)` tiles are the
// days this run covers. That's true about the run without pretending to know
// what happened before it started.
export function streakWeek(streak, now = new Date()) {
  const letters = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
  const filled = Math.max(0, Math.min(streak, 7))
  const week = []
  for (let back = 6; back >= 0; back--) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - back, 12)
    week.push({
      key: `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`,
      letter: letters[d.getDay()],
      done: back < filled,
      today: back === 0,
    })
  }
  return week
}

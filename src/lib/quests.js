// Quests — three a day, handed out by Trak.
//
// Like achievements, a quest's progress is *derived*: it reads counters that
// the day's bucket already keeps, so nothing has to listen for events and a
// quest can't be missed because the tab was closed at the wrong moment.
// Unlike achievements, quests reset — the bucket is `daily`, which any code
// reading it treats as zero once the local day changes, so the whole board
// rolls over at the user's own midnight with no reset job.
//
// The only thing stored is which quests have been claimed today. Which three
// quests you *get* isn't stored at all: it's a pure function of the date, so
// every device agrees and a reload can't reroll a quest you were halfway
// through.
//
// Payouts sit outside the daily caps on purpose. The caps exist to stop a
// cheap action being farmed; a quest is already bounded — three a day, fixed
// amounts — so capping it too would mean the quest you completed sometimes
// paid nothing, which reads as a bug rather than as a limit.

import { localDay } from './garden.js'

// Counters the day's bucket keeps for quests, on top of the three that the
// caps use. All are "how many times today".
//
// 'clears' is still written by recordDoingCleared and still listed here, but
// no quest reads it any more. Emptying Doing stopped being something to chase:
// it pays nothing, and asking for it turned a WIP limit into a target — the
// quickest way to empty Doing is to put less in it, which is the opposite of
// the point.
export const QUEST_COUNTERS = ['done', 'added', 'clears', 'popped', 'packets', 'grown', 'planted']

export const QUEST_TIERS = {
  easy:     { label: 'Warm-up', coins: 30,  seeds: 0 },
  standard: { label: 'Day’s work', coins: 60,  seeds: 1 },
  hard:     { label: 'Tall order', coins: 120, seeds: 2 },
}

// Goals are sized against the daily caps: 12 seeds means at most 12 tasks
// added, 10 clouds means at most 10 bursts, so no quest can ask for more of a
// day than a day contains.
export const QUEST_POOL = [
  // — warm-up —
  { key: 'e-done-2',   tier: 'easy', counter: 'done',    goal: 2, icon: '✅', name: 'Two down',        blurb: 'Finish 2 tasks' },
  { key: 'e-added-3',  tier: 'easy', counter: 'added',   goal: 3, icon: '📝', name: 'Write it down',   blurb: 'Add 3 tasks' },
  { key: 'e-pop-2',    tier: 'easy', counter: 'popped',  goal: 2, icon: '☁️', name: 'Light rain',      blurb: 'Burst 2 clouds' },
  { key: 'e-plant-1',  tier: 'easy', counter: 'planted', goal: 1, icon: '🌱', name: 'In the ground',   blurb: 'Plant a seed' },

  // — a day's work —
  { key: 's-done-5',   tier: 'standard', counter: 'done',    goal: 5, icon: '✅', name: 'A solid five',   blurb: 'Finish 5 tasks' },
  { key: 's-pop-5',    tier: 'standard', counter: 'popped',  goal: 5, icon: '🌧️', name: 'Steady weather', blurb: 'Burst 5 clouds' },
  { key: 's-packet-1', tier: 'standard', counter: 'packets', goal: 1, icon: '📦', name: 'Something new',  blurb: 'Tear open a seed packet' },
  { key: 's-plant-2',  tier: 'standard', counter: 'planted', goal: 2, icon: '🌱', name: 'Keep it turning', blurb: 'Plant 2 seeds' },

  // — tall order —
  { key: 'h-done-10',  tier: 'hard', counter: 'done',   goal: 10, icon: '🏅', name: 'Ten before dark', blurb: 'Finish 10 tasks' },
  { key: 'h-pop-10',   tier: 'hard', counter: 'popped', goal: 10, icon: '⚡', name: 'Downpour',        blurb: 'Burst 10 clouds' },
  { key: 'h-added-8',  tier: 'hard', counter: 'added',  goal: 8,  icon: '🗂️', name: 'Brain on paper',  blurb: 'Add 8 tasks' },
  { key: 'h-grown-1',  tier: 'hard', counter: 'grown',  goal: 1,  icon: '🌸', name: 'Full bloom',      blurb: 'Grow a flower all the way' },
]

// FNV-1a. Any stable hash would do; this one is short and has no dependencies.
function hash(str) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

// One quest per tier, chosen by the date. Tiers are drawn in order and each
// avoids the counter the previous one used, so a day never asks you to finish
// tasks three different ways.
export function questsForDay(day = localDay()) {
  const picked = []
  const usedCounters = new Set()
  for (const tier of ['easy', 'standard', 'hard']) {
    const all = QUEST_POOL.filter(q => q.tier === tier)
    const fresh = all.filter(q => !usedCounters.has(q.counter))
    const from = fresh.length ? fresh : all
    const q = from[hash(`${day}:${tier}`) % from.length]
    picked.push(q)
    usedCounters.add(q.counter)
  }
  return picked
}

// Today's quests with progress and claim state attached. `daily` is the
// garden's day bucket — already zeroed for a new day by todayBucket().
export function questView(state, daily) {
  const day = localDay()
  const record = state?.quests?.day === day ? state.quests : { day, claimed: [] }
  const claimed = new Set(record.claimed || [])

  // Callers pass todayBucket(), which already zeroes a stale bucket — but a
  // quest board showing yesterday's progress would be a quiet, plausible bug,
  // so the day is checked here too rather than assumed.
  const today = daily?.day === day ? daily : null

  return questsForDay(day).map(q => {
    const value = Math.max(0, (today?.[q.counter] || 0))
    const done = value >= q.goal
    return {
      ...q,
      reward: QUEST_TIERS[q.tier],
      value: Math.min(value, q.goal),
      done,
      claimed: claimed.has(q.key),
      claimable: done && !claimed.has(q.key),
      pct: Math.min(100, (value / q.goal) * 100),
    }
  })
}

// What the greenhouse strip and the garden tab badge on: how many are sitting
// there finished and unclaimed.
export function claimableCount(state, daily) {
  return questView(state, daily).filter(q => q.claimable).length
}

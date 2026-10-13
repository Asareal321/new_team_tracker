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

// Counters the day's bucket keeps for quests. All are "how many today", and
// all are written by lib/spheres' logDaily or by bumpDaily in the garden
// context — nothing here listens for events.
//
// Rewritten for spheres. The old pool asked for finished tasks and burst
// clouds, both of which are gone; what is worth asking for now is the thing
// the redesign is for — logging progress, and spreading it across the parts
// of your life rather than piling it onto one.
export const QUEST_COUNTERS = ['logs', 'spheres', 'goalLogs', 'goals', 'packets']

export const QUEST_TIERS = {
  easy:     { label: 'Warm-up', coins: 30,  seeds: 0 },
  standard: { label: 'Day’s work', coins: 60,  seeds: 1 },
  hard:     { label: 'Tall order', coins: 120, seeds: 2 },
}

// Sized against a real day. Twelve logs is where the daily reward cap sits,
// so nothing here asks for more than twelve; and "spheres" asks for at most
// three, since most people have four or five spheres and a quest that needs
// all of them is a quest most days cannot be done.
export const QUEST_POOL = [
  // — warm-up —
  { key: 'e-logs-2',    tier: 'easy', counter: 'logs',     goal: 2, icon: '✍️', name: 'Two steps forward', blurb: 'Log progress twice' },
  { key: 'e-goal-1',    tier: 'easy', counter: 'goalLogs', goal: 1, icon: '🎯', name: 'On target',         blurb: 'Log progress toward a goal' },
  { key: 'e-spheres-2', tier: 'easy', counter: 'spheres',  goal: 2, icon: '🧭', name: 'Look around',       blurb: 'Log in 2 different spheres' },

  // — a day's work —
  { key: 's-logs-5',    tier: 'standard', counter: 'logs',     goal: 5, icon: '📈', name: 'A solid five',     blurb: 'Log progress 5 times' },
  { key: 's-goal-3',    tier: 'standard', counter: 'goalLogs', goal: 3, icon: '🎯', name: 'Narrowing in',     blurb: 'Log 3 times toward goals' },
  { key: 's-packet-1',  tier: 'standard', counter: 'packets',  goal: 1, icon: '📦', name: 'Something new',    blurb: 'Tear open a seed packet' },
  { key: 's-goals-1',   tier: 'standard', counter: 'goals',    goal: 1, icon: '🏁', name: 'Aim',              blurb: 'Set a new goal' },

  // — tall order —
  { key: 'h-logs-8',    tier: 'hard', counter: 'logs',     goal: 8, icon: '🏅', name: 'Big day',        blurb: 'Log progress 8 times' },
  { key: 'h-spheres-3', tier: 'hard', counter: 'spheres',  goal: 3, icon: '🌍', name: 'Well rounded',   blurb: 'Log in 3 different spheres' },
  { key: 'h-goal-5',    tier: 'hard', counter: 'goalLogs', goal: 5, icon: '🎯', name: 'Locked in',      blurb: 'Log 5 times toward goals' },
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
// avoids the counter the previous one used, so a day never asks for the same
// thing three ways.
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

// Achievements.
//
// Every one of these is a pure function of progress that's already recorded
// elsewhere — lifetime counters, the herbarium, the streak, how many beds are
// planted. Nothing here decides when an achievement is earned by watching for
// an event; `evaluate` is re-run after any change and reports what's true now.
// That means an achievement can't be missed because the app was closed at the
// wrong moment, and adding a new one retroactively credits work already done.
//
// What IS stored is the date each one was first seen unlocked, so the awards
// shelf can show when it happened and a newly-earned one can be announced.

import { SEEDS } from './garden.js'

// `goal` and `value` drive the progress bar; `value` reads from the state the
// provider keeps. Tiers are just for grouping on the shelf.
export const ACHIEVEMENTS = [
  // — finishing work —
  { key: 'done-1',    group: 'Work',   icon: '✅', name: 'First light',      goal: 1,    value: s => s.stats.tasksDone,   blurb: 'Finish your first task' },
  { key: 'done-10',   group: 'Work',   icon: '✅', name: 'Getting going',    goal: 10,   value: s => s.stats.tasksDone,   blurb: 'Finish 10 tasks' },
  { key: 'done-50',   group: 'Work',   icon: '🏅', name: 'Reliable',         goal: 50,   value: s => s.stats.tasksDone,   blurb: 'Finish 50 tasks' },
  { key: 'done-250',  group: 'Work',   icon: '🏆', name: 'Machine',          goal: 250,  value: s => s.stats.tasksDone,   blurb: 'Finish 250 tasks' },
  { key: 'done-1000', group: 'Work',   icon: '👑', name: 'Thousand-yard',    goal: 1000, value: s => s.stats.tasksDone,   blurb: 'Finish 1,000 tasks' },

  { key: 'added-25',  group: 'Work',   icon: '📝', name: 'Written down',     goal: 25,   value: s => s.stats.tasksAdded,  blurb: 'Add 25 tasks' },
  { key: 'added-200', group: 'Work',   icon: '🗂️', name: 'Full ledger',      goal: 200,  value: s => s.stats.tasksAdded,  blurb: 'Add 200 tasks' },

  { key: 'clear-1',   group: 'Work',   icon: '🧹', name: 'Clean slate',      goal: 1,    value: s => s.stats.doingClears, blurb: 'Empty the Doing column' },
  { key: 'clear-10',  group: 'Work',   icon: '🧹', name: 'Housekeeper',      goal: 10,   value: s => s.stats.doingClears, blurb: 'Empty Doing 10 times' },
  { key: 'clear-50',  group: 'Work',   icon: '✨', name: 'Nothing pending',  goal: 50,   value: s => s.stats.doingClears, blurb: 'Empty Doing 50 times' },

  // — showing up —
  { key: 'streak-3',   group: 'Streak', icon: '🔥', name: 'Three in a row',  goal: 3,   value: s => s.streak.best, blurb: 'A 3-day streak' },
  { key: 'streak-7',   group: 'Streak', icon: '🔥', name: 'A full week',     goal: 7,   value: s => s.streak.best, blurb: 'A 7-day streak' },
  { key: 'streak-30',  group: 'Streak', icon: '🌟', name: 'A month of it',   goal: 30,  value: s => s.streak.best, blurb: 'A 30-day streak' },
  { key: 'streak-100', group: 'Streak', icon: '💎', name: 'Unbroken',        goal: 100, value: s => s.streak.best, blurb: 'A 100-day streak' },

  // — clouds —
  { key: 'cloud-10',  group: 'Clouds', icon: '☁️', name: 'Rainmaker',        goal: 10,  value: s => s.stats.cloudsPopped,  blurb: 'Burst 10 clouds' },
  { key: 'cloud-100', group: 'Clouds', icon: '🌧️', name: 'Weather system',   goal: 100, value: s => s.stats.cloudsPopped,  blurb: 'Burst 100 clouds' },
  { key: 'cloud-epic', group: 'Clouds', icon: '⚡', name: 'Storm chaser',    goal: 4,   value: s => s.stats.bestCloudTier, blurb: 'Grow a cloud to Epic' },
  { key: 'cloud-legend', group: 'Clouds', icon: '🌩️', name: 'Once in a while', goal: 5, value: s => s.stats.bestCloudTier, blurb: 'Grow a cloud to Legendary' },

  // — the garden —
  { key: 'packet-1',   group: 'Garden', icon: '📦', name: 'First packet',    goal: 1,  value: s => s.stats.packetsOpened, blurb: 'Tear open a seed packet' },
  { key: 'packet-25',  group: 'Garden', icon: '📦', name: 'Regular customer', goal: 25, value: s => s.stats.packetsOpened, blurb: 'Open 25 packets' },
  { key: 'grown-1',    group: 'Garden', icon: '🌸', name: 'Green thumb',     goal: 1,  value: s => s.stats.flowersGrown,  blurb: 'Grow a flower to full' },
  { key: 'grown-25',   group: 'Garden', icon: '🌻', name: 'Gardener',        goal: 25, value: s => s.stats.flowersGrown,  blurb: 'Grow 25 flowers' },
  { key: 'beds-full',  group: 'Garden', icon: '🏡', name: 'Every bed',       goal: 24, value: s => s.flowerCount,         blurb: 'Fill all 24 beds' },

  // — the herbarium —
  { key: 'species-5',  group: 'Collection', icon: '🌿', name: 'Taking root',  goal: 5,           value: s => s.speciesFound, blurb: 'Find 5 species' },
  { key: 'species-10', group: 'Collection', icon: '🪴', name: 'Well stocked', goal: 10,          value: s => s.speciesFound, blurb: 'Find 10 species' },
  { key: 'species-all',group: 'Collection', icon: '🥇', name: 'Complete set', goal: SEEDS.length, value: s => s.speciesFound, blurb: `Find all ${SEEDS.length} species` },
  { key: 'legend-1',   group: 'Collection', icon: '🌹', name: 'Heirloom',     goal: 1,
    value: s => SEEDS.filter(x => x.rarity === 5 && (s.discovered[x.key] || 0) > 0).length,
    blurb: 'Find a Legendary species' },
]

export const GROUPS = ['Work', 'Streak', 'Clouds', 'Garden', 'Collection']

// Everything an achievement can read, gathered in one shape so the definitions
// above stay one-liners and don't need to know where any of it is stored.
export function progressView(state, flowerCount = 0) {
  return {
    stats: {
      tasksDone: 0, tasksAdded: 0, doingClears: 0, cloudsPopped: 0,
      packetsOpened: 0, flowersGrown: 0, bestCloudTier: 0,
      ...(state?.stats || {}),
    },
    streak: { current: 0, best: 0, lastDay: null, ...(state?.streak || {}) },
    discovered: state?.discovered || {},
    speciesFound: SEEDS.filter(s => ((state?.discovered || {})[s.key] || 0) > 0).length,
    flowerCount,
  }
}

// Every achievement with its current progress, in shelf order: earned first
// within each group, then closest-to-earned.
export function evaluate(state, flowerCount = 0) {
  const view = progressView(state, flowerCount)
  const earnedAt = state?.achievements || {}
  return ACHIEVEMENTS.map(a => {
    const value = Math.max(0, a.value(view) || 0)
    return {
      ...a,
      value: Math.min(value, a.goal),
      earned: value >= a.goal,
      earnedAt: earnedAt[a.key] || null,
      pct: Math.min(100, (value / a.goal) * 100),
    }
  })
}

// Achievements true right now that haven't been recorded yet. The provider
// stamps these into `achievements` and announces them.
export function newlyUnlocked(state, flowerCount = 0) {
  const have = state?.achievements || {}
  return evaluate(state, flowerCount).filter(a => a.earned && !have[a.key])
}

// Grow a Garden — game balance lives here so the numbers are tunable in one
// place. Times are in seconds, prices/values in coins.

export const SEEDS = [
  { key: 'daisy',    name: 'Daisy',    emoji: '🌼', rarity: 1, rarityName: 'Common',    growSeconds: 4 * 3600,  unlockCost: 0,    sellValue: 10 },
  { key: 'tulip',    name: 'Tulip',    emoji: '🌷', rarity: 2, rarityName: 'Uncommon',  growSeconds: 8 * 3600,  unlockCost: 60,   sellValue: 35 },
  { key: 'orchid',   name: 'Orchid',   emoji: '🪷', rarity: 3, rarityName: 'Rare',      growSeconds: 12 * 3600, unlockCost: 250,  sellValue: 110 },
  { key: 'hibiscus', name: 'Hibiscus', emoji: '🌺', rarity: 4, rarityName: 'Epic',      growSeconds: 18 * 3600, unlockCost: 700,  sellValue: 300 },
  { key: 'rose',     name: 'Rose',     emoji: '🌹', rarity: 5, rarityName: 'Legendary', growSeconds: 24 * 3600, unlockCost: 1800, sellValue: 800 },
]

export const RARITY_COLORS = {
  1: '#8aa38f',
  2: '#5aa9d6',
  3: '#a97fd6',
  4: '#e08a4f',
  5: '#e0b93f',
}

export function seedByKey(key) {
  return SEEDS.find(s => s.key === key) || null
}

// A cloud is worth more the bigger you grow it. Index = clicks - 1.
export const CLOUD_SHAVE_MINUTES = [5, 11, 19, 30, 45]
export const CLOUD_IDLE_COINS    = [2, 5, 9, 14, 20]
export const CLOUD_MAX_CLICKS    = 5
export const CLOUD_LIFETIME_MS   = 8000

export function cloudShaveSeconds(clicks) {
  if (clicks < 1) return 0
  return CLOUD_SHAVE_MINUTES[Math.min(clicks, CLOUD_MAX_CLICKS) - 1] * 60
}

export function cloudIdleCoins(clicks) {
  if (clicks < 1) return 0
  return CLOUD_IDLE_COINS[Math.min(clicks, CLOUD_MAX_CLICKS) - 1]
}

// Garden starts at 3 x 4 = 12 plots and expands one row of 3 at a time.
export const PLOTS_PER_ROW  = 3
export const STARTING_PLOTS = 12
export const MAX_PLOTS      = 24
export const EXPANSION_COSTS = { 15: 150, 18: 350, 21: 800, 24: 1500 }

export function nextExpansion(plotCount) {
  const next = plotCount + PLOTS_PER_ROW
  if (next > MAX_PLOTS) return null
  return { plotCount: next, cost: EXPANSION_COSTS[next] }
}

// Remaining grow time for the seed currently in the ground, or null if
// nothing is planted. Returns 0 once the flower is ready to harvest.
export function remainingSeconds(state, now = Date.now()) {
  if (!state?.growing_seed || !state.growing_started_at) return null
  const elapsed = (now - new Date(state.growing_started_at).getTime()) / 1000
  const total = state.growing_grow_seconds ?? seedByKey(state.growing_seed)?.growSeconds ?? 0
  return Math.max(0, Math.ceil(total - elapsed - (state.shaved_seconds || 0)))
}

export function formatDuration(seconds) {
  if (seconds <= 0) return 'Ready!'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m > 0) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

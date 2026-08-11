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

// A cloud starts Common and may grow a tier on each tap — `growChance` is the
// probability that tapping a cloud at this tier bumps it to the next one, so a
// Legendary takes real luck. `shaveMinutes` is what the tier pays out.
//
// What matters is the chance of *finishing* at each tier, which must fall as
// rarity rises. Over CLOUD_MAX_TAPS taps these odds land roughly:
//   Common 30%  Uncommon 26%  Rare 25%  Epic 14%  Legendary 4%
// Note the per-tap chances are NOT themselves monotonic — the first hop is
// deliberately the hardest, because a cloud that clears it still has five taps
// to keep climbing. Retuning by eye doesn't work here; re-simulate the whole
// six-tap walk and check the finishing curve still decreases.
export const CLOUD_TIERS = [
  { tier: 1, name: 'Common',    color: '#b9c6cf', glow: 'rgba(185,198,207,0.5)', shaveMinutes: 5,  coins: 5,  growChance: 0.18 },
  { tier: 2, name: 'Uncommon',  color: '#5aa9d6', glow: 'rgba(90,169,214,0.55)', shaveMinutes: 10, coins: 10, growChance: 0.32 },
  { tier: 3, name: 'Rare',      color: '#a97fd6', glow: 'rgba(169,127,214,0.6)', shaveMinutes: 20, coins: 15, growChance: 0.30 },
  { tier: 4, name: 'Epic',      color: '#e08a4f', glow: 'rgba(224,138,79,0.65)', shaveMinutes: 35, coins: 25, growChance: 0.26 },
  { tier: 5, name: 'Legendary', color: '#e0b93f', glow: 'rgba(224,185,63,0.75)', shaveMinutes: 60, coins: 40, growChance: 0 },
]

export const CLOUD_MAX_TAPS    = 6
export const CLOUD_LIFETIME_MS = 11000

export function cloudTier(tier) {
  return CLOUD_TIERS[Math.min(Math.max(tier, 1), CLOUD_TIERS.length) - 1]
}

// Roll for growth. Returns the tier the cloud ends up at after one tap.
export function rollCloudGrowth(tier) {
  const current = cloudTier(tier)
  if (tier >= CLOUD_TIERS.length) return tier
  return Math.random() < current.growChance ? tier + 1 : tier
}

export function cloudShaveSeconds(tier) {
  return cloudTier(tier).shaveMinutes * 60
}

export function cloudIdleCoins(tier) {
  return cloudTier(tier).coins
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

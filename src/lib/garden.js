// Grow a Garden — game balance lives here so the numbers are tunable in one
// place. Times are in seconds, prices/values in coins.

// Flower species. Rarity drives grow time, sell value and how likely a packet
// is to drop it. Emoji are deliberately distinct at a glance — a plot shows a
// cluster of these, so near-identical glyphs would read as one smudge.
export const SEEDS = [
  // Common
  { key: 'daisy',      name: 'Daisy',      emoji: '🌼', rarity: 1, growSeconds: 3 * 3600,  sellValue: 10 },
  { key: 'clover',     name: 'Clover',     emoji: '🍀', rarity: 1, growSeconds: 3 * 3600,  sellValue: 12 },
  { key: 'buttercup',  name: 'Buttercup',  emoji: '🌾', rarity: 1, growSeconds: 4 * 3600,  sellValue: 14 },
  { key: 'sprig',      name: 'Sprig',      emoji: '🌿', rarity: 1, growSeconds: 3 * 3600,  sellValue: 10 },
  // Uncommon
  { key: 'tulip',      name: 'Tulip',      emoji: '🌷', rarity: 2, growSeconds: 6 * 3600,  sellValue: 30 },
  { key: 'hyacinth',   name: 'Hyacinth',   emoji: '💐', rarity: 2, growSeconds: 7 * 3600,  sellValue: 35 },
  { key: 'blossom',    name: 'Blossom',    emoji: '🌸', rarity: 2, growSeconds: 6 * 3600,  sellValue: 32 },
  { key: 'marigold',   name: 'Marigold',   emoji: '🏵️', rarity: 2, growSeconds: 8 * 3600,  sellValue: 40 },
  // Rare
  { key: 'orchid',     name: 'Orchid',     emoji: '🪷', rarity: 3, growSeconds: 10 * 3600, sellValue: 95 },
  { key: 'cactusbloom',name: 'Cactus bloom', emoji: '🌵', rarity: 3, growSeconds: 12 * 3600, sellValue: 110 },
  { key: 'lavender',   name: 'Lavender',   emoji: '🪻', rarity: 3, growSeconds: 11 * 3600, sellValue: 105 },
  { key: 'sunflower',  name: 'Sunflower',  emoji: '🌻', rarity: 3, growSeconds: 12 * 3600, sellValue: 120 },
  // Epic
  { key: 'hibiscus',   name: 'Hibiscus',   emoji: '🌺', rarity: 4, growSeconds: 16 * 3600, sellValue: 280 },
  { key: 'maple',      name: 'Maple',      emoji: '🍁', rarity: 4, growSeconds: 18 * 3600, sellValue: 300 },
  { key: 'bonsai',     name: 'Bonsai',     emoji: '🎍', rarity: 4, growSeconds: 20 * 3600, sellValue: 330 },
  // Legendary
  { key: 'rose',       name: 'Rose',       emoji: '🌹', rarity: 5, growSeconds: 24 * 3600, sellValue: 800 },
  { key: 'sakura',     name: 'Sakura',     emoji: '🌳', rarity: 5, growSeconds: 28 * 3600, sellValue: 900 },
  { key: 'moonflower', name: 'Moonflower', emoji: '🌙', rarity: 5, growSeconds: 30 * 3600, sellValue: 1000 },
]

export const RARITY_NAMES = { 1: 'Common', 2: 'Uncommon', 3: 'Rare', 4: 'Epic', 5: 'Legendary' }

// Seed packets. You buy a packet, not a species — what's inside is a roll
// against `odds` (weights over rarity tiers, normalised). Every packet can drop
// anything; the better packets just shift the mass upward. Showing the odds is
// deliberate: a packet whose chances are hidden feels like a trick.
export const PACKETS = [
  {
    key: 'common', name: 'Garden packet', emoji: '🟫', rarity: 1,
    cost: 3, currency: 'seeds',
    odds: { 1: 78, 2: 18, 3: 3.5, 4: 0.4, 5: 0.1 },
  },
  {
    key: 'uncommon', name: 'Nursery packet', emoji: '🟦', rarity: 2,
    cost: 120, currency: 'coins',
    odds: { 1: 45, 2: 38, 3: 14, 4: 2.5, 5: 0.5 },
  },
  {
    key: 'rare', name: 'Collector packet', emoji: '🟪', rarity: 3,
    cost: 420, currency: 'coins',
    odds: { 1: 18, 2: 32, 3: 38, 4: 10, 5: 2 },
  },
  {
    key: 'epic', name: 'Conservatory packet', emoji: '🟧', rarity: 4,
    cost: 1100, currency: 'coins',
    odds: { 1: 4, 2: 16, 3: 40, 4: 33, 5: 7 },
  },
  {
    key: 'legendary', name: 'Heirloom packet', emoji: '🟨', rarity: 5,
    cost: 2600, currency: 'coins',
    odds: { 1: 0, 2: 5, 3: 27, 4: 48, 5: 20 },
  },
]

export function packetByKey(key) {
  return PACKETS.find(p => p.key === key) || null
}

export function seedsOfRarity(rarity) {
  return SEEDS.filter(s => s.rarity === rarity)
}

// Roll a packet: pick a rarity by weight, then a uniform species within it.
export function rollPacket(packetKey, rand = Math.random) {
  const packet = packetByKey(packetKey)
  if (!packet) throw new Error('Unknown packet')
  const entries = Object.entries(packet.odds).filter(([, w]) => w > 0)
  const total = entries.reduce((sum, [, w]) => sum + w, 0)
  let roll = rand() * total
  let rarity = Number(entries[entries.length - 1][0])
  for (const [r, w] of entries) {
    if (roll < w) { rarity = Number(r); break }
    roll -= w
  }
  const pool = seedsOfRarity(rarity)
  return pool[Math.floor(rand() * pool.length)].key
}

export const RARITY_COLORS = {
  1: '#8aa38f',
  2: '#5aa9d6',
  3: '#a97fd6',
  4: '#e08a4f',
  5: '#e0b93f',
}

// What a completed task banks. The wireframes put this on the card as it
// leaves — "+1 seed · 12 coins" — so the numbers are deliberately small and
// legible rather than tuned.
export const TASK_REWARD = { seeds: 1, coins: 12 }

export function seedByKey(key) {
  return SEEDS.find(s => s.key === key) || null
}

// A cloud starts Common and may grow a tier on each tap — `growChance` is the
// probability that tapping a cloud at this tier bumps it to the next one, so a
// Legendary takes real luck. `shaveMinutes` is what the tier pays out.
//
// What matters is the chance of *finishing* at each tier. The curve peaks at
// Uncommon and falls from there — Common is the floor you land on when the
// rolls don't go your way, not the most likely result. Note the per-tap chances
// are NOT a readable proxy for that curve — the walk compounds them. Retuning by
// eye doesn't work; run scripts/check-cloud-odds.mjs after any change here.
//
// The payouts were originally token: a Legendary shaved an hour off a grow time
// measured in days, so the best possible cloud barely moved the bar and the
// interaction felt decorative. The shave times below are set outright; the coin
// payouts (what a cloud is worth when nothing is planted) track them so the two
// routes stay comparable.
//
// A Legendary now out-runs several of the shorter flowers on its own, which is
// why a cloud's shave can overflow — see `overflow_seconds` in GardenContext.
export const CLOUD_TIERS = [
  { tier: 1, name: 'Common',    color: '#b9c6cf', glow: 'rgba(185,198,207,0.5)', shaveMinutes: 30,  coins: 20,  growChance: 0.44 },
  { tier: 2, name: 'Uncommon',  color: '#5aa9d6', glow: 'rgba(90,169,214,0.55)', shaveMinutes: 60,  coins: 40,  growChance: 0.30 },
  { tier: 3, name: 'Rare',      color: '#a97fd6', glow: 'rgba(169,127,214,0.6)',  shaveMinutes: 120, coins: 80,  growChance: 0.26 },
  { tier: 4, name: 'Epic',      color: '#e08a4f', glow: 'rgba(224,138,79,0.65)',  shaveMinutes: 300, coins: 200, growChance: 0.24 },
  { tier: 5, name: 'Legendary', color: '#e0b93f', glow: 'rgba(224,185,63,0.75)',  shaveMinutes: 600, coins: 400, growChance: 0 },
]

export const CLOUD_MAX_TAPS = 4

// Chance that a tap which already grew the cloud keeps going and leaps another
// tier. Applied repeatedly, so a single very lucky tap can jump more than one.
export const CLOUD_SKIP_CHANCE = 0.14

export function cloudTier(tier) {
  return CLOUD_TIERS[Math.min(Math.max(tier, 1), CLOUD_TIERS.length) - 1]
}

// Roll for growth. Returns the tier the cloud ends up at after one tap, which
// may be more than one tier higher when the skip rolls keep landing.
export function rollCloudGrowth(tier) {
  if (tier >= CLOUD_TIERS.length) return tier
  if (Math.random() >= cloudTier(tier).growChance) return tier
  let next = tier + 1
  while (next < CLOUD_TIERS.length && Math.random() < CLOUD_SKIP_CHANCE) next += 1
  return next
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

// The pot's art through a grow. Previously three markers and then the flower,
// which on a 24-hour Legendary meant the pot looked identical for hours at a
// stretch — there was nothing to come back and check. Eight stages means the
// picture changes several times across even a short grow, and each one is
// named, so the pot reports progress in words as well as shape.
//
// `at` is the percentage complete the stage begins at. The last two stages are
// the flower's own emoji: a tight, pale bud, then the bloom itself — so the
// species reveals itself as it finishes rather than appearing from nowhere.
export const GROWTH_STAGES = [
  { at: 0,   key: 'sown',      label: 'Sown',         emoji: '·',   scale: 0.75, bud: false },
  { at: 6,   key: 'germ',      label: 'Germinating',  emoji: '🌰',  scale: 0.7,  bud: false },
  { at: 16,  key: 'sprout',    label: 'Sprouting',    emoji: '🌱',  scale: 0.8,  bud: false },
  { at: 30,  key: 'seedling',  label: 'Seedling',     emoji: '🌿',  scale: 0.9,  bud: false },
  { at: 45,  key: 'leafing',   label: 'Leafing out',  emoji: '☘️',  scale: 1,    bud: false },
  { at: 60,  key: 'stem',      label: 'Growing tall', emoji: '🪴',  scale: 1.05, bud: false },
  { at: 78,  key: 'bud',       label: 'Budding',      emoji: null,  scale: 0.72, bud: true },
  { at: 100, key: 'bloom',     label: 'In bloom',     emoji: null,  scale: 1.15, bud: false },
]

// The stage a grow is currently at. `seed` supplies the emoji for the last two
// stages; without one they fall back to the generic pot.
export function growthStage(progress, seed = null) {
  const pct = Math.max(0, Math.min(100, progress))
  let stage = GROWTH_STAGES[0]
  for (const s of GROWTH_STAGES) if (pct >= s.at) stage = s
  return { ...stage, emoji: stage.emoji ?? seed?.emoji ?? '🪴' }
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

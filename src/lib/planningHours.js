// Planning hours: the two times of day when writing things down pays double.
//
// The point is a habit, not a bonus. Deciding what the day is for, and then
// deciding what tomorrow is for, are the two moments where a task list is
// actually worth keeping — so those are the two hours the app pays for. They
// are anchored to when you personally get up and go to bed rather than to a
// clock the app picked, because 7am is the middle of the night for some people
// and mid-morning for others.
//
// Everything here is pure and works in minutes-past-local-midnight, which is
// the only representation in which "the hour before bed" is simple to state
// when bed is at 00:30.
//
// Three rules worth knowing, all checked by scripts/check-planning-hours.mjs:
//   • the bonus half of the reward ignores the daily cap. Capping it would
//     mean that on a productive day the planning habit paid nothing, which is
//     precisely backwards.
//   • the bonus has its own, separate cap, per window. Without one the morning
//     window is an unlimited seed faucet for anyone willing to type.
//   • changing your hours takes effect tomorrow. Otherwise "bedtime is now"
//     is the most efficient move in the game.

export const MORNING = 'morning'
export const EVENING = 'evening'

// One hour, on each side of the day.
export const WINDOW_MINUTES = 60

// What a single window will pay in bonus before it stops. The base reward is
// unaffected by this and goes on metering against DAILY_CAPS as usual.
export const BONUS_CAP = { seeds: 6, coins: 90 }

const DAY = 24 * 60

// "07:30" → 450. Anything else → null, which reads downstream as "not set".
export function parseTime(value) {
  const m = /^(\d{1,2}):(\d{2})$/.exec(String(value ?? '').trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (h > 23 || min > 59) return null
  return h * 60 + min
}

export function formatTime(minutes) {
  if (minutes == null) return ''
  const m = ((minutes % DAY) + DAY) % DAY
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`
}

export function minutesOfDay(date = new Date()) {
  return date.getHours() * 60 + date.getMinutes()
}

// The two windows, as half-open [start, end) ranges in minutes. A window that
// crosses midnight is returned with end < start and `wraps` set, rather than
// being split — the caller asks `within`, which knows about both shapes.
export function planningWindows(prefs) {
  const wake = parseTime(prefs?.wake)
  const bed = parseTime(prefs?.bed)
  const out = []
  // The hour AFTER you get up: you are awake, and the day is still undecided.
  if (wake != null) out.push({ kind: MORNING, start: wake, end: (wake + WINDOW_MINUTES) % DAY })
  // The hour BEFORE bed: the only time "what is tomorrow for" is a real
  // question rather than a hypothetical one.
  if (bed != null) out.push({ kind: EVENING, start: (bed - WINDOW_MINUTES + DAY) % DAY, end: bed })
  return out.map(w => ({ ...w, wraps: w.end < w.start }))
}

export function within(window, minutes) {
  if (!window) return false
  const m = ((minutes % DAY) + DAY) % DAY
  return window.wraps
    ? (m >= window.start || m < window.end)
    : (m >= window.start && m < window.end)
}

// Which window you are in, or null. Morning wins a tie, which can only happen
// if someone sets wake and bed within an hour of each other — nonsense input
// that should still resolve to something rather than throw.
export function activeWindow(prefs, now = new Date()) {
  if (!isActive(prefs, now)) return null
  const m = minutesOfDay(now)
  return planningWindows(prefs).find(w => within(w, m))?.kind ?? null
}

// Hours you changed today do not apply today. `effectiveFrom` is a local day
// string written when the times are saved; until that day arrives the old
// hours stand, and the very first time you set them there are no old hours,
// so nothing is active at all.
export function isActive(prefs, now = new Date()) {
  if (!prefs?.wake && !prefs?.bed) return false
  const from = prefs?.effectiveFrom
  if (!from) return false
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
  return today >= from
}

// What adding one task pays.
//
// `base` is ADD_TASK_REWARD, `daily` today's bucket, `caps` DAILY_CAPS, and
// `window` the result of activeWindow. The split matters: the base half is
// metered against the ordinary daily cap exactly as it always was, and the
// bonus half is metered only against this window's own cap. That is what makes
// planning at 11pm still worth something on a day you already capped out.
export function addTaskReward({ base, daily, caps, window = null } = {}) {
  const seedsBase = Math.min(base?.seeds ?? 0, Math.max(0, (caps?.seeds ?? 0) - (daily?.seeds ?? 0)))
  const coinsBase = Math.min(base?.coins ?? 0, Math.max(0, (caps?.coins ?? 0) - (daily?.coins ?? 0)))
  if (!window) {
    return { seeds: seedsBase, coins: coinsBase, bonusSeeds: 0, bonusCoins: 0, window: null }
  }
  const spent = daily?.bonus?.[window] || { seeds: 0, coins: 0 }
  const bonusSeeds = Math.min(base?.seeds ?? 0, Math.max(0, BONUS_CAP.seeds - (spent.seeds || 0)))
  const bonusCoins = Math.min(base?.coins ?? 0, Math.max(0, BONUS_CAP.coins - (spent.coins || 0)))
  return { seeds: seedsBase, coins: coinsBase, bonusSeeds, bonusCoins, window }
}

// Today's bucket with this reward's bonus recorded against the right window.
export function spendBonus(daily, { window, bonusSeeds = 0, bonusCoins = 0 } = {}) {
  if (!window) return daily?.bonus
  const prev = daily?.bonus || {}
  const spent = prev[window] || { seeds: 0, coins: 0 }
  return {
    ...prev,
    [window]: { seeds: (spent.seeds || 0) + bonusSeeds, coins: (spent.coins || 0) + bonusCoins },
  }
}

// Minutes until the active window closes — what the board strip counts down.
export function minutesLeft(prefs, now = new Date()) {
  const kind = activeWindow(prefs, now)
  if (!kind) return 0
  const w = planningWindows(prefs).find(x => x.kind === kind)
  const m = minutesOfDay(now)
  const left = w.end - m
  return left > 0 ? left : left + DAY
}

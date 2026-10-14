// Progress, not completion.
//
// The day's unit is a logged piece of progress against a sphere — a part of
// your life you want to get better at — optionally tied to one of its goals.
// Nothing here asks "is it finished?". It asks "have you moved it, and have you
// been moving everything, or only the one thing that is easy to move?"
//
// So there are no targets and no progress bars toward them. There are tallies
// — this week, all time — and one opinion: when one sphere is getting all the
// attention and another none, say so.
//
// Pure. Checked by scripts/check-spheres.mjs.

import { localDay, DAILY_CAPS, SEEDS } from './garden.js'
import { chooseBlock, matchProject } from './calendarFill.js'
import { BONUS_CAP, spendBonus } from './planningHours.js'

const DAY_MS = 24 * 60 * 60 * 1000

// What one log pays, and how many paid logs a day is worth. Logging is free
// to do and self-reported, so the cap is on the reward, never on the log: your
// garden still grows from every honest entry, it just stops paying after the
// twelfth, which removes the reason to split one hour into twelve sentences.
//
// Two currencies. Coins buy the better packets; a sprout is what the basic
// Garden packet costs, so three logs is always one more packet. Sprouts meter
// against the same daily seed cap the old add-a-task reward used, since both
// draw from one bucket while the old board still exists.
export const LOG_REWARD = { coins: 25, seeds: 1 }
export const DAILY_LOG_CAP = { coins: 300, seeds: DAILY_CAPS.seeds }

// How far back "this week" looks.
export const WEEK_DAYS = 7

// The nudge needs evidence before it has an opinion: at least this many logs
// in the week, and at least this many more on the busiest sphere than on the
// quietest one. Below that, telling someone they are unbalanced is noise.
export const NUDGE_MIN_WEEK_LOGS = 4
export const NUDGE_MIN_GAP = 3

// ── tallies ─────────────────────────────────────────────────────────────────

function ts(log) {
  const t = new Date(log?.logged_at || log?.created_at || 0).getTime()
  return Number.isFinite(t) ? t : 0
}

export function inLastDays(log, now, days) {
  const t = ts(log)
  return t <= now.getTime() && t > now.getTime() - days * DAY_MS
}

// Counts per sphere and per goal: this week and all time. Logs dated in the
// future (a clock that was wrong when they were written) count toward the
// total but never toward the week — a week cannot include next Tuesday.
export function tally(logs, { now = new Date(), days = WEEK_DAYS } = {}) {
  const bySphere = {}
  const byGoal = {}
  let week = 0
  for (const log of logs || []) {
    if (!log?.sphere_id) continue
    const recent = inLastDays(log, now, days)
    const s = (bySphere[log.sphere_id] ||= { week: 0, total: 0, last: null })
    s.total += 1
    if (recent) { s.week += 1; week += 1 }
    if (ts(log) <= now.getTime() && (!s.last || ts(log) > new Date(s.last).getTime())) {
      s.last = new Date(ts(log)).toISOString()
    }
    if (log.goal_id) {
      const g = (byGoal[log.goal_id] ||= { week: 0, total: 0 })
      g.total += 1
      if (recent) g.week += 1
    }
  }
  return { bySphere, byGoal, week, total: (logs || []).filter(l => l?.sphere_id).length }
}

// Whole days since a sphere was last logged, or null if never.
export function daysSince(iso, now = new Date()) {
  if (!iso) return null
  const then = new Date(iso)
  const a = new Date(then.getFullYear(), then.getMonth(), then.getDate())
  const b = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.max(0, Math.round((b - a) / DAY_MS))
}

// ── the nudge ───────────────────────────────────────────────────────────────

// "You've logged a lot on X this week. Y hasn't had any — maybe give it some
// time today." Null when there is nothing fair to say: one sphere, too little
// logged to judge, or a week that is already reasonably even.
//
// The quiet sphere is the one with the fewest logs this week, and among those
// the one that has gone longest untouched — so a sphere you have never logged
// in at all wins over one you merely skipped this week.
export function balanceNudge({ spheres = [], logs = [], now = new Date() } = {}) {
  const live = (spheres || []).filter(s => s && !s.archived_at)
  if (live.length < 2) return null

  const { bySphere, week } = tally(logs, { now })
  if (week < NUDGE_MIN_WEEK_LOGS) return null

  const rows = live.map(s => {
    const t = bySphere[s.id] || { week: 0, total: 0, last: null }
    return { sphere: s, week: t.week, last: t.last, since: daysSince(t.last, now) }
  })

  const busiest = rows.reduce((a, b) => (b.week > a.week ? b : a))
  const quiet = rows
    .filter(r => r !== busiest)
    .sort((a, b) =>
      a.week - b.week
      // Never logged sorts before any finite gap.
      || (b.since ?? Infinity) - (a.since ?? Infinity)
      || String(a.sphere.name).localeCompare(String(b.sphere.name)))[0]

  if (!quiet || busiest.week - quiet.week < NUDGE_MIN_GAP) return null

  const when = quiet.last == null
    ? 'hasn’t had anything logged yet'
    : quiet.week === 0
      ? `hasn’t had anything ${quiet.since === 1 ? 'since yesterday' : `in ${quiet.since} days`}`
      : `has had ${quiet.week} this week`

  return {
    busy: busiest.sphere,
    quiet: quiet.sphere,
    message: `${busiest.week} logs on ${busiest.sphere.name} this week. ${quiet.sphere.name} ${when} — maybe give it some time today?`,
  }
}

// ── rewards ─────────────────────────────────────────────────────────────────

// What a log pays given what today has already paid.
//
// Two halves, metered separately — the same rule planning hours always had,
// and the one you asked for. The base half counts against the ordinary daily
// cap. The bonus half, paid only inside a window (a planning hour, or a focus
// block), ignores the daily cap and counts only against that window's own
// allowance, BONUS_CAP. So planning tomorrow at 11pm still pays on a day you
// already maxed out, but no single window is a bottomless faucet.
//
// `window` is the key to meter the bonus under: 'morning' / 'evening' for a
// planning hour, `focus:<event id>` for a focus block. Null means no bonus.
export function logReward({ daily, window = null, base = LOG_REWARD, cap = DAILY_LOG_CAP } = {}) {
  const coins = Math.max(0, Math.min(base.coins, cap.coins - Math.max(0, daily?.logCoins || 0)))
  const seeds = Math.max(0, Math.min(base.seeds, cap.seeds - Math.max(0, daily?.seeds || 0)))
  let bonusCoins = 0
  let bonusSeeds = 0
  if (window) {
    const spent = daily?.bonus?.[window] || {}
    bonusCoins = Math.max(0, Math.min(base.coins, BONUS_CAP.coins - (spent.coins || 0)))
    bonusSeeds = Math.max(0, Math.min(base.seeds, BONUS_CAP.seeds - (spent.seeds || 0)))
  }
  return {
    coins, seeds, bonusCoins, bonusSeeds, window,
    capped: coins < base.coins || seeds < base.seeds,
  }
}

// ── what a log plants ─────────────────────────────────────────────────────

// Packets decide what grows. A log plants one seed from your bag and uses it
// up — the one you pinned if you still have it, otherwise one drawn at random
// in proportion to how many of each you hold, so a bag of nine daisies and one
// rose mostly plants daisies. An empty bag never stops a log: it plants a
// free common sprout, because progress has to count whether or not you have
// been shopping.
//
// Drawn from the log's own id, so the same log always resolves to the same
// plant and nothing about it changes after the fact.
const COMMON = SEEDS.filter(s => s.rarity === 1)

function hashOf(id) {
  let h = 2166136261
  for (const c of String(id)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  return h >>> 0
}

export function pickPlant({ inventory = {}, pinned = null, id = '' } = {}) {
  if (pinned && (inventory[pinned] || 0) > 0) return { seedKey: pinned, consume: true }

  const bag = SEEDS.filter(s => (inventory[s.key] || 0) > 0)
  const total = bag.reduce((n, s) => n + inventory[s.key], 0)
  if (total > 0) {
    let roll = hashOf(id) % total
    for (const s of bag) {
      roll -= inventory[s.key]
      if (roll < 0) return { seedKey: s.key, consume: true }
    }
  }
  return { seedKey: COMMON[hashOf(id) % COMMON.length]?.key ?? 'sprig', consume: false }
}

// Take one seed out of the bag. Never below zero, and an emptied slot is
// removed rather than left at 0, so "what do I own" stays a simple key check.
export function takeSeed(inventory = {}, key) {
  const next = { ...inventory }
  if (!next[key]) return next
  next[key] -= 1
  if (next[key] <= 0) delete next[key]
  return next
}

// ── the day's counters ────────────────────────────────────────────────────

// What a log adds to today's bucket. Quests read these, so they are kept as
// plain counts; the list of sphere ids is kept alongside so "spheres touched
// today" is a true distinct count rather than a running total of logs.
export function logDaily(daily, {
  sphereId, goalId = null, coins = 0, seeds = 0, window = null, bonusCoins = 0, bonusSeeds = 0,
} = {}) {
  const d = { ...(daily || {}) }
  // The bonus is recorded against its window, never against the daily cap.
  if (window && (bonusCoins || bonusSeeds)) {
    d.bonus = spendBonus(d, { window, bonusCoins, bonusSeeds })
  }
  const ids = new Set(d.sphereIds || [])
  if (sphereId) ids.add(sphereId)
  d.logs = (d.logs || 0) + 1
  d.logCoins = (d.logCoins || 0) + coins
  d.seeds = (d.seeds || 0) + seeds
  d.sphereIds = [...ids]
  d.spheres = ids.size
  if (goalId) d.goalLogs = (d.goalLogs || 0) + 1
  return d
}

// ── goals ───────────────────────────────────────────────────────────────────

// What blocks a goal from being saved (errors), and what the form should
// gently suggest (hints). Only the end date is required: a goal that was
// nagged into perfect SMART wording is no more yours than the one you typed.
export function checkGoal({ title, end_date } = {}, { now = new Date() } = {}) {
  const errors = []
  const hints = []
  const t = String(title ?? '').trim()

  if (!t) errors.push({ field: 'title', text: 'Say what the goal is.' })
  else if (t.length > 140) errors.push({ field: 'title', text: 'Keep it under 140 characters.' })

  if (!end_date) {
    errors.push({ field: 'end_date', text: 'Every goal needs an end date — it is what makes it a goal and not a wish.' })
  } else if (!/^\d{4}-\d{2}-\d{2}$/.test(end_date) || Number.isNaN(new Date(`${end_date}T00:00:00`).getTime())) {
    errors.push({ field: 'end_date', text: 'That is not a date.' })
  } else if (end_date < localDay(now)) {
    errors.push({ field: 'end_date', text: 'That date has already gone.' })
  }

  if (t) {
    // Specific: three words is roughly where "fitness" becomes "run a 5k".
    if (t.split(/\s+/).length < 3) {
      hints.push({ letter: 'S', text: 'Specific: what exactly does done look like?' })
    }
    // Measurable: a number, or a word that implies one.
    if (!/\d|\b(one|two|three|four|five|six|seven|eight|nine|ten|every|each|all|first)\b/i.test(t)) {
      hints.push({ letter: 'M', text: 'Measurable: is there a number you could hold yourself to?' })
    }
  }
  return { ok: errors.length === 0, errors, hints }
}

// Days left on a goal, negative once it has passed.
export function daysLeft(goal, now = new Date()) {
  if (!goal?.end_date) return null
  const end = new Date(`${goal.end_date}T00:00:00`)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  return Math.round((end - today) / DAY_MS)
}

// ── streak ──────────────────────────────────────────────────────────────────

// Whether a log today should advance the streak: the same rule as before (the
// day's first counts), just fed by logs instead of finished tasks.
export function loggedToday(logs, now = new Date()) {
  const today = localDay(now)
  return (logs || []).some(l => localDay(ts(l)) === today)
}

// ── focus blocks ──────────────────────────────────────────────────────────

// A calendar event that names one of your spheres, happening now. There is no
// board to clear any more, so a focus block does one thing: logs in that
// sphere pay double until it ends. The choosing rules are calendarFill's —
// the TRK marker first, then the more specific event, then the longer name —
// so a title that matched a project before matches a sphere the same way.
export function focusFor({ events = [], spheres = [], now = new Date() } = {}) {
  const live = (spheres || []).filter(s => s && !s.archived_at)
  const choice = chooseBlock({ events, projects: live, now: now.getTime() })
  const at = now.getTime()
  const upcoming = (events || [])
    .filter(e => !e.allDay && new Date(e.start).getTime() > at)
    .map(e => ({ e, sphere: matchProject(e.title, live) }))
    .filter(x => x.sphere)
    .map(({ e, sphere }) => ({ id: e.id, sphereId: sphere.id, sphereName: sphere.name, start: e.start, end: e.end }))
  return {
    block: choice.project ? choice.block : null,
    sphere: choice.project || null,
    overlapping: choice.overlapping,
    upcoming,
  }
}

// Whether a log in this sphere, right now, pays double — and why. Either a
// focus block on this sphere or an open planning hour; never both at once,
// because a doubled reward doubled again is a number nobody can reason about.
// Focus wins the label when both apply, since it is the more specific reason.
export function boostFor({ sphereId, focus = null, planning = null } = {}) {
  if (sphereId && focus?.sphere?.id === sphereId) {
    return {
      boost: true, why: 'focus', window: `focus:${focus.block?.id || focus.sphere.id}`,
      label: `Focus hour on ${focus.sphere.name} — this log pays double`,
    }
  }
  if (planning) {
    return {
      boost: true, why: 'planning', window: planning,
      label: planning === 'morning' ? 'Morning planning hour — logs pay double' : 'Evening planning hour — logs pay double',
    }
  }
  return { boost: false, why: null, window: null, label: null }
}

// ── search ────────────────────────────────────────────────────────────────

// Every log whose note, sphere or goal contains every term — "econ midterm"
// finds the midterm logs in ECON rather than every log that mentions either.
// Newest first, as the logs already are.
export function searchLogs(logs = [], terms = [], { sphereName = () => '', goalTitle = () => '' } = {}) {
  const want = (terms || []).map(t => String(t).toLowerCase()).filter(Boolean)
  if (!want.length) return logs || []
  return (logs || []).filter(l => {
    const hay = `${l?.note || ''} ${sphereName(l?.sphere_id) || ''} ${goalTitle(l?.goal_id) || ''}`.toLowerCase()
    return want.every(t => hay.includes(t))
  })
}

// Logs grouped by the local day they were written, in the order given.
export function byDay(logs = []) {
  const out = []
  for (const l of logs || []) {
    const day = localDay(ts(l))
    const last = out[out.length - 1]
    if (last && last.day === day) last.logs.push(l)
    else out.push({ day, logs: [l] })
  }
  return out
}

// ── goals by deadline ─────────────────────────────────────────────────────

// Open goals sorted into the four places a deadline can be. "Quiet" is the
// one that matters: a goal ending within a fortnight that has had nothing
// logged against it this week is the goal most likely to arrive unmet.
export const QUIET_WINDOW_DAYS = 14

export function deadlineGroups(goals = [], { counts = { byGoal: {} }, now = new Date() } = {}) {
  const groups = { overdue: [], week: [], month: [], later: [] }
  for (const g of goals || []) {
    if (!g || g.status !== 'active') continue
    const left = daysLeft(g, now)
    const t = counts.byGoal?.[g.id] || { week: 0, total: 0 }
    const row = { goal: g, left, week: t.week, total: t.total, quiet: left >= 0 && left <= QUIET_WINDOW_DAYS && t.week === 0 }
    if (left < 0) groups.overdue.push(row)
    else if (left <= 7) groups.week.push(row)
    else if (left <= 31) groups.month.push(row)
    else groups.later.push(row)
  }
  for (const k of Object.keys(groups)) groups[k].sort((a, b) => a.left - b.left)
  return groups
}

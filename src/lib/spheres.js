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

import { localDay } from './garden.js'

const DAY_MS = 24 * 60 * 60 * 1000

// What one log pays, and how many paid logs a day is worth. Logging is free
// to do and self-reported, so the cap is on the reward, never on the log: your
// garden still grows from every honest entry, it just stops paying after the
// twelfth, which removes the reason to split one hour into twelve sentences.
export const LOG_REWARD = { coins: 25 }
export const DAILY_LOG_CAP = { coins: 300 }

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

// What a log pays given what today has already paid. `boost` doubles it — a
// planning hour, or a focus block naming this sphere — and the boosted half is
// metered against the same daily cap rather than escaping it: there is no
// clock to game here, so a second, separate allowance would just be a bigger
// cap with extra steps.
export function logReward({ daily, boost = false, base = LOG_REWARD, cap = DAILY_LOG_CAP } = {}) {
  const already = Math.max(0, daily?.logCoins || 0)
  const want = base.coins * (boost ? 2 : 1)
  const coins = Math.max(0, Math.min(want, cap.coins - already))
  return { coins, capped: coins < want }
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

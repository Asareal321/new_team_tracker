// What the phone should say, and when.
//
// These are local notifications, not push: no server, no device tokens, no
// APNs. Everything here is worked out on the device and handed to iOS as a
// list of alarms. That is possible because almost everything worth being told
// about happens at a time the app already knows — a planning hour starts at a
// time you set yourself, a focus block starts when the calendar says, and the
// nudges run on your own waking hours.
//
// The whole plan is a pure function of state, which matters for two reasons.
// It can be tested without a device — see scripts/check-notification-plan.mjs
// — and it can be recomputed from scratch and handed over wholesale every time
// anything changes, so the shell never has to reason about which alarms are
// stale. It cancels everything pending and takes the new list.
//
// The catch, stated plainly because it shapes the copy: a scheduled alarm
// cannot re-check its condition at the moment it fires. If the plan says
// "nudge at 2pm unless they have finished something" and they finish something
// at 1pm without opening the app, the nudge still arrives. The app rebuilds
// the plan every time it is opened or its state changes, which closes most of
// the gap — and the nudges are worded as questions rather than accusations, so
// the worst case is a fair question rather than a wrong statement.

import { parseTime, planningWindows, MORNING } from './planningHours.js'
import { localDay } from './garden.js'
import { tally, daysSince } from './spheres.js'

// iOS keeps at most 64 pending local notifications per app and silently drops
// the rest, so the plan is bounded well under that and covers two days. Two
// days is the useful number: it survives a weekend of not opening the app
// without stacking up a week of stale nudges.
export const MAX_SCHEDULED = 40
export const HORIZON_DAYS = 2

// How often the intermittent nudges repeat.
export const NUDGE_INTERVAL_MINUTES = 120

// Where the morning turns into the afternoon. Before it the nudge asks what
// you mean to move forward today; after it, whether you have — and to log it
// if so. Asking "did you?" before you have had the chance is the wrong order.
export const AFTERNOON_FROM = 12 * 60

const DAY = 24 * 60
const MIN = 60 * 1000

export const CATEGORIES = ['planning', 'streak', 'focus', 'nudge']

// Sensible bounds for someone who has not set their hours. The nudges are
// worth having without the planning-hours feature turned on, but nobody wants
// one at 4am.
const DEFAULT_WAKE = 8 * 60
const DEFAULT_BED = 22 * 60

function at(base, dayOffset, minutes) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + dayOffset)
  d.setMinutes(minutes)
  return d
}

function enabled(settings, category) {
  return settings?.[category] !== false
}

// The sphere a nudge should name: the one you have been neglecting. Fewest
// logs this week, and among those the one untouched longest — a sphere never
// logged in at all beats one merely skipped. That is the whole point of the
// redesign said out loud, so the nudge is about balance, not about volume.
export function nudgeSubject(spheres = [], logs = [], now = new Date()) {
  const live = (spheres || []).filter(s => s && !s.archived_at)
  if (!live.length) return null
  const { bySphere } = tally(logs, { now })
  return live
    .map(s => {
      const t = bySphere[s.id] || { week: 0, last: null }
      return { sphere: s, week: t.week, since: daysSince(t.last, now) }
    })
    .sort((a, b) =>
      a.week - b.week
      || (b.since ?? Infinity) - (a.since ?? Infinity)
      || String(a.sphere.name).localeCompare(String(b.sphere.name)))[0]
}

function sinceText(since) {
  if (since == null) return 'hasn’t had anything logged yet'
  if (since === 0) return 'had something today'
  if (since === 1) return 'last had something yesterday'
  return `hasn’t had anything in ${since} days`
}

// Questions, not claims. A scheduled alarm cannot re-check itself when it
// fires, so "you haven't logged anything" could be false by the time it lands;
// "moved anything forward?" is fair either way.
export function nudgeCopy({ afternoon, subject }) {
  if (!subject) {
    return afternoon
      ? { title: 'Moved anything forward?', body: 'Log it — every bit of progress plants something in its garden.' }
      : { title: 'What is today for?', body: 'Make a sphere for something you want to get better at, and log the first step.' }
  }
  const name = subject.sphere.name
  if (!afternoon) {
    return {
      title: 'What will you move forward today?',
      body: `${name} ${sinceText(subject.since)}. Maybe start there?`,
    }
  }
  return {
    title: 'Moved anything forward?',
    body: `Log it and it plants in that sphere’s garden. ${name} ${sinceText(subject.since)}.`,
  }
}

// How long before bed the nudges stop, so the last one does not land on top
// of the evening planning hour.
export const NUDGE_MARGIN = 90

// Every nudge time between the start of the day's window and its end.
export function nudgeTimes(wake, bed) {
  const out = []
  for (let t = wake + NUDGE_INTERVAL_MINUTES; t <= bed - NUDGE_MARGIN; t += NUDGE_INTERVAL_MINUTES) {
    out.push(t)
  }
  return out
}

export function planNotifications({
  now = new Date(),
  garden = null,
  spheres = [],
  logs = [],
  focusBlocks = [],
  settings = {},
} = {}) {
  const out = []
  const prefs = garden?.prefs || {}
  const wake = parseTime(prefs.wake) ?? DEFAULT_WAKE
  const bed = parseTime(prefs.bed) ?? DEFAULT_BED
  const quiet = !!garden?.quiet_mode

  const add = (id, category, when, title, body) => {
    if (!(when instanceof Date) || Number.isNaN(when.getTime())) return
    if (when.getTime() <= now.getTime()) return
    if (when.getTime() > now.getTime() + HORIZON_DAYS * DAY * MIN) return
    out.push({ id, category, at: when.toISOString(), title, body })
  }

  // — planning hours ————————————————————————————————————————
  //
  // Only if they have been set. An unasked-for bonus window firing at a time
  // the app chose teaches the wrong habit, and this is the alarm for it.
  if (enabled(settings, 'planning') && parseTime(prefs.wake) != null && parseTime(prefs.bed) != null) {
    const windows = planningWindows(prefs)
    for (let day = 0; day <= HORIZON_DAYS; day++) {
      for (const w of windows) {
        const label = w.kind === MORNING ? 'Planning hour' : 'Last call for tomorrow'
        const body = w.kind === MORNING
          ? 'For the next hour, everything you write down pays double.'
          : 'An hour left to set up tomorrow, at double rewards.'
        add(`planning-${w.kind}-${day}`, 'planning', at(now, day, w.start), label, body)
      }
    }
  }

  // — the streak ————————————————————————————————————————————
  //
  // The most likely of these to feel like nagging, which is why it is last in
  // the evening, once, and separately switchable.
  if (enabled(settings, 'streak') && (garden?.streak?.current || 0) > 0) {
    for (let day = 0; day <= HORIZON_DAYS; day++) {
      add(`streak-${day}`, 'streak', at(now, day, Math.max(bed - 45, 0)),
        `Your ${garden.streak.current}-day streak`,
        'One finished task keeps it alive. There is still time.')
    }
  }

  // — a focus block about to start ——————————————————————————
  //
  // Worth a warning because it is money on the table: for the length of the
  // event, logs in that sphere pay double.
  if (enabled(settings, 'focus')) {
    for (const b of focusBlocks) {
      const start = b?.start ? new Date(b.start) : null
      const name = b?.sphereName || b?.projectName
      if (!start || !name) continue
      add(`focus-${b.id}`, 'focus', new Date(start.getTime() - 5 * MIN),
        `${name} in 5 minutes`,
        `A focus hour — logs on ${name} pay double until it ends.`)
    }
  }

  // — the intermittent nudges ————————————————————————————————
  //
  // Quiet mode turns the game layer down, and a notification every two hours
  // is the loudest part of it.
  if (enabled(settings, 'nudge') && !quiet) {
    // "…if they have not done so yet" — as far as it can be known. A future
    // day's nudges cannot be conditional on anything, but today's can be
    // dropped outright, and the plan is rebuilt every time the app opens, so
    // in practice logging something does silence the rest of today. Setting a
    // goal answers the morning's question too, so it silences the morning.
    const today = localDay(now)
    const daily = garden?.daily?.day === today ? garden.daily : null
    const loggedToday = (daily?.logs || 0) > 0
    const plannedToday = loggedToday || (daily?.goals || 0) > 0
    const subject = nudgeSubject(spheres, logs, now)

    const times = nudgeTimes(wake, bed)
    for (let day = 0; day <= HORIZON_DAYS; day++) {
      for (const t of times) {
        const afternoon = t >= AFTERNOON_FROM
        if (day === 0 && (afternoon ? loggedToday : plannedToday)) continue
        const { title, body } = nudgeCopy({ afternoon, subject })
        add(`nudge-${day}-${t}`, 'nudge', at(now, day, t), title, body)
      }
    }
  }

  out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
  return out.slice(0, MAX_SCHEDULED)
}

// What the phone should say, and when.
//
// These are local notifications, not push: no server, no device tokens, no
// APNs. Everything here is worked out on the device and handed to iOS as a
// list of alarms. That is possible because almost everything worth being told
// about happens at a time the app already knows — a flower finishes at a
// computable instant, a planning hour starts at a time you set yourself, a
// calendar block starts when the calendar says.
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
import { remainingSeconds, localDay } from './garden.js'

// iOS keeps at most 64 pending local notifications per app and silently drops
// the rest, so the plan is bounded well under that and covers two days. Two
// days is the useful number: it survives a weekend of not opening the app
// without stacking up a week of stale nudges.
export const MAX_SCHEDULED = 40
export const HORIZON_DAYS = 2

// How often the intermittent nudges repeat.
export const NUDGE_INTERVAL_MINUTES = 120

// Where the morning turns into the afternoon. Before it the nudge is about
// writing tasks down, after it about finishing them — a morning spent being
// told to finish things you have not planned yet is the wrong order.
export const AFTERNOON_FROM = 12 * 60

const DAY = 24 * 60
const MIN = 60 * 1000

export const CATEGORIES = ['flower', 'planning', 'streak', 'focus', 'nudge']

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

// The task a nudge should name. Doing, never Up next: Up next is a queue you
// have deliberately not started, and being chased about it is being chased
// about a decision you already made. Doing is the promise you made this
// morning, so it is the fair thing to ask after.
export function nudgeSubject(tasks, pick = 0) {
  const doing = (tasks || []).filter(t => t?.status === 'in_progress' && t?.title)
  if (!doing.length) return null
  const n = Math.floor(pick * doing.length)
  return doing[Math.min(Math.max(n, 0), doing.length - 1)] || null
}

// The morning line asks you to write something down; the afternoon line asks
// after something you already started. Both name the flower, because that is
// what makes it a consequence rather than a scolding.
export function nudgeCopy({ afternoon, subject, growing }) {
  if (!afternoon) {
    return subject
      ? { title: 'What else is today?', body: `“${subject.title}” is on the go. Anything else worth writing down while you think of it?` }
      : { title: 'What is today for?', body: 'Nothing on the board yet. Write down two or three things and the rest of the day has a shape.' }
  }
  if (subject) {
    return {
      title: 'How is it going?',
      body: growing
        ? `Made any progress on “${subject.title}”? Finishing it drops a cloud, and your flower is still growing.`
        : `Made any progress on “${subject.title}”? Mark it done and it pays out.`,
    }
  }
  return { title: 'Nothing in Doing', body: 'Pull something across from Up next and give the afternoon a job.' }
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
  tasks = [],
  focusBlocks = [],
  settings = {},
  rand = Math.random,
} = {}) {
  const out = []
  const prefs = garden?.prefs || {}
  const wake = parseTime(prefs.wake) ?? DEFAULT_WAKE
  const bed = parseTime(prefs.bed) ?? DEFAULT_BED
  const quiet = !!garden?.quiet_mode
  const growing = !!garden?.growing_seed

  const add = (id, category, when, title, body) => {
    if (!(when instanceof Date) || Number.isNaN(when.getTime())) return
    if (when.getTime() <= now.getTime()) return
    if (when.getTime() > now.getTime() + HORIZON_DAYS * DAY * MIN) return
    out.push({ id, category, at: when.toISOString(), title, body })
  }

  // — the flower ————————————————————————————————————————————
  //
  // The one notification nobody could call nagging: you asked for a thing to
  // finish, and it has.
  if (enabled(settings, 'flower') && growing) {
    // Measured from the `now` this plan is for, not from the wall clock —
    // otherwise the one function here that is supposed to be pure quietly
    // isn't, and it cannot be tested at a fixed instant.
    const left = remainingSeconds(garden, now.getTime())
    if (left != null && left > 0) {
      add('flower-ready', 'flower', new Date(now.getTime() + left * 1000),
        'Your flower is ready', 'It has finished growing. Come and put it in the ground.')
    }
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
  // Worth a warning specifically because the board is about to change under
  // you: everything not from that project is about to be parked.
  if (enabled(settings, 'focus')) {
    for (const b of focusBlocks) {
      const start = b?.start ? new Date(b.start) : null
      if (!start || !b?.projectName) continue
      add(`focus-${b.id}`, 'focus', new Date(start.getTime() - 5 * MIN),
        `${b.projectName} in 5 minutes`,
        'The board is about to clear down to that project. Anything else gets parked, not lost.')
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
    // in practice writing a task down in the morning does silence the morning.
    const today = localDay(now)
    const daily = garden?.daily?.day === today ? garden.daily : null
    const wroteToday = (daily?.added || 0) > 0
    // The streak advances on the day's first finished task and only then, so
    // this is exactly "have they completed something today".
    const finishedToday = garden?.streak?.lastDay === today

    const times = nudgeTimes(wake, bed)
    for (let day = 0; day <= HORIZON_DAYS; day++) {
      for (const t of times) {
        const afternoon = t >= AFTERNOON_FROM
        if (day === 0 && (afternoon ? finishedToday : wroteToday)) continue
        const { title, body } = nudgeCopy({
          afternoon, growing, subject: nudgeSubject(tasks, rand()),
        })
        add(`nudge-${day}-${t}`, 'nudge', at(now, day, t), title, body)
      }
    }
  }

  out.sort((a, b) => (a.at < b.at ? -1 : a.at > b.at ? 1 : 0))
  return out.slice(0, MAX_SCHEDULED)
}

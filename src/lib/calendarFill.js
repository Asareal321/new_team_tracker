// Filling the board from a calendar block.
//
// If your calendar says "Work on Product" from 1 to 2, the board should already
// be six Product tasks when you sit down, and you should not have had to choose
// which six. That is the whole feature: the deciding is the part being removed,
// not the typing.
//
// Everything here is pure. It is a scheduler that moves other people's work
// around without being asked, so the rules have to be inspectable and the
// randomness has to be injectable — an untestable version of this would be a
// bad idea however carefully it was written.
//
// The rules, in the order they matter:
//
//   • A block only counts if its title names a project you actually have.
//     No match means the block is ignored, never guessed at.
//   • Work you put on the board yourself outranks the calendar, but only if it
//     belongs to the block. Tasks from other projects go back to the pile;
//     tasks from this one stay and count toward the six.
//   • Picks come due-date-first, then random. Random alone is what was asked
//     for, but it can leave something due today sitting in the braindump.
//   • When the block ends, nothing happens. Work half-done does not get tidied
//     away from under you.

import { MAX_DOING, MAX_UP_NEXT } from './boardLimits.js'

export const BRAINDUMP = 'braindump'
export const UP_NEXT = 'todo'
export const DOING = 'in_progress'

// Lead-ins people put in front of a project name. Stripped so that "Work on
// Product", "product", and "🚀 Product time" all land on the same project.
const LEAD_INS = [
  'work on', 'working on', 'focus on', 'focus', 'block', 'blocked',
  'deep work', 'deep work on', 'time for', 'do', 'doing', 'on',
]

// Everything that isn't a letter or a digit becomes a space, so emoji,
// punctuation and stray brackets can't stop a title matching.
export function normaliseTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

export function stripLeadIn(title) {
  let out = normaliseTitle(title)
  // Longest first, so "deep work on" wins over "deep work" and then "on".
  const ordered = [...LEAD_INS].sort((a, b) => b.length - a.length)
  let changed = true
  while (changed) {
    changed = false
    for (const lead of ordered) {
      if (out === lead) return ''
      if (out.startsWith(`${lead} `)) {
        out = out.slice(lead.length + 1).trim()
        changed = true
        break
      }
    }
  }
  return out
}

// Which project a calendar event is about, or null. Exact match on the
// normalised name — a fuzzy match here would quietly rearrange the board for
// an event that had nothing to do with it, which is much worse than doing
// nothing.
export function matchProject(title, projects = []) {
  const wanted = stripLeadIn(title)
  if (!wanted) return null
  const hit = projects.find(p => normaliseTitle(p.name) === wanted)
  return hit || null
}

// The event covering `now`, if any. All-day events are ignored: a day-long
// "Product" would hold the board hostage from midnight to midnight.
export function activeBlock(events = [], now = Date.now()) {
  const at = now instanceof Date ? now.getTime() : now
  return events.find(e => {
    if (e.allDay) return false
    const start = new Date(e.start).getTime()
    const end = new Date(e.end).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false
    return start <= at && at < end
  }) || null
}

// Due on or before today comes first, oldest due date leading. Everything else
// is shuffled, which is the "don't make me choose" part.
export function pickOrder(tasks, { today, rand = Math.random } = {}) {
  const dueNow = []
  const rest = []
  for (const t of tasks) {
    if (t.due_date && t.due_date <= today) dueNow.push(t)
    else rest.push(t)
  }
  dueNow.sort((a, b) => (a.due_date < b.due_date ? -1 : a.due_date > b.due_date ? 1 : 0))
  // Fisher-Yates with an injected source, so a test can pin the outcome.
  const shuffled = [...rest]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return [...dueNow, ...shuffled]
}

// What to change, as a list of {id, status} moves. Empty when there is nothing
// to do — the caller writes nothing rather than writing the same thing again.
export function planFill({ block, projects = [], tasks = [], today, rand = Math.random } = {}) {
  const project = block ? matchProject(block.title, projects) : null
  if (!project) return { project: null, moves: [] }

  const moves = []
  const onBoard = tasks.filter(t => t.status === UP_NEXT || t.status === DOING)

  // Work from another project goes back to the pile to make room. Work from
  // this one stays exactly where it is and counts toward the capacity.
  const kept = { [UP_NEXT]: [], [DOING]: [] }
  for (const t of onBoard) {
    if (t.project_id === project.id) kept[t.status].push(t)
    else moves.push({ id: t.id, status: BRAINDUMP, reason: 'displaced' })
  }

  const displacedIds = new Set(moves.map(m => m.id))
  const pool = tasks.filter(t =>
    t.project_id === project.id
    && (t.status === BRAINDUMP || displacedIds.has(t.id))
    && !kept[UP_NEXT].includes(t)
    && !kept[DOING].includes(t))

  const ordered = pickOrder(pool, { today, rand })

  // Doing is filled first: it is the band you are actually working out of, and
  // a block that only half-fills should leave you something to start on.
  let n = 0
  for (const band of [DOING, UP_NEXT]) {
    const limit = band === DOING ? MAX_DOING : MAX_UP_NEXT
    const room = limit - kept[band].length
    for (let i = 0; i < room && n < ordered.length; i++, n++) {
      moves.push({ id: ordered[n].id, status: band, reason: 'filled' })
    }
  }

  return { project, moves }
}

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
//   • A block only counts if its title NAMES a project you actually have —
//     as whole words, anywhere in the title. Real calendar entries are
//     sentences ("Case with Jake from BCG"), not labels, so requiring the
//     title to *equal* the project name meant almost nothing ever matched.
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

// Everything that isn't a letter or a digit becomes a space, so emoji,
// punctuation and stray brackets can't stop a title matching.
export function normaliseTitle(title) {
  return String(title || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
}

// Does `needle` appear in `hay` as a run of whole words?
function containsRun(hay, needle) {
  if (!needle.length || needle.length > hay.length) return false
  for (let i = 0; i <= hay.length - needle.length; i++) {
    let all = true
    for (let j = 0; j < needle.length; j++) {
      if (hay[i + j] !== needle[j]) { all = false; break }
    }
    if (all) return true
  }
  return false
}

// Which project a calendar event is about, or null.
//
// Matched on whole words rather than on the whole string. "Case with Jake from
// BCG" is what a calendar actually contains, and an exact-match rule ignored
// every entry like it. Words, not substrings, so "Production planning" does
// not match a project called Product — the false positives that a substring
// search invites are the ones that would quietly rearrange your board for an
// event that had nothing to do with it.
//
// When two projects both appear, the longer name wins: "McKinsey Phase 2" is
// more specific than "McKinsey". When two equally specific names both appear,
// there is no way to tell which the hour is for, so nothing happens.
export function matchProject(title, projects = []) {
  const tokens = normaliseTitle(stripMarker(title)).split(' ').filter(Boolean)
  if (!tokens.length) return null

  const hits = []
  for (const p of projects) {
    const want = normaliseTitle(p.name).split(' ').filter(Boolean)
    if (want.length && containsRun(tokens, want)) hits.push({ project: p, size: want.length })
  }
  if (!hits.length) return null
  hits.sort((a, b) => b.size - a.size)
  if (hits.length > 1 && hits[0].size === hits[1].size) return null
  return hits[0].project
}

// An explicit "this one is for the board" mark, written anywhere in an event's
// title: [trakkit] or [trak]. It is the override, and it exists because no
// ranking rule can know that today's 1pm is really about Product when three
// things are booked over it. If any live event carries the mark, only marked
// events are considered at all.
//
// The mark is stripped before the title is read for a project name, so
// "[trakkit] Case with Jake from BCG" still matches BCG.
const MARKER_RE = /\[\s*trak(?:kit)?\s*\]/i

export const MARKER = '[trakkit]'

export function hasMarker(title) {
  return MARKER_RE.test(String(title || ''))
}

export function stripMarker(title) {
  return String(title || '').replace(MARKER_RE, ' ')
}

// Every event covering `now`. All-day events are ignored: a day-long "Product"
// would hold the board hostage from midnight to midnight.
export function blocksAt(events = [], now = Date.now()) {
  const at = now instanceof Date ? now.getTime() : now
  return events.filter(e => {
    if (e.allDay) return false
    const start = new Date(e.start).getTime()
    const end = new Date(e.end).getTime()
    if (!Number.isFinite(start) || !Number.isFinite(end)) return false
    return start <= at && at < end
  })
}

const spanOf = e => new Date(e.end).getTime() - new Date(e.start).getTime()

// Which of the overlapping events the board should follow.
//
// This used to be "the first event covering now", and the calendar hands them
// back ordered by start time — so a standup that began at 1:00 beat the
// Product block that began at 1:30, and the board did nothing for the hour.
// Worse, the project was matched only AFTER an event had been chosen, so one
// unrelated meeting was enough to hide a block that would have worked.
//
// So: matching comes first, and only events that name a project are
// candidates. Among those, in order:
//
//   1. Marked events win outright. An explicit answer beats any heuristic.
//   2. The shorter event wins. A 1-hour block inside a 4-hour "Deep work" is
//      the more specific statement about this minute.
//   3. The later start wins. Of two equal blocks, the one you just moved into
//      is the one you meant.
//   4. The more specific project name wins, so a tie is still deterministic
//      rather than depending on the order the calendar happened to return.
export function chooseBlock({ events = [], projects = [], now = Date.now() } = {}) {
  const live = blocksAt(events, now)
  const marked = live.filter(e => hasMarker(e.title))
  const pool = marked.length ? marked : live

  const candidates = pool
    .map(e => ({ block: e, project: matchProject(e.title, projects) }))
    .filter(c => c.project)

  if (!candidates.length) {
    return { block: live[0] || null, project: null, candidates: [], overlapping: live.length }
  }

  candidates.sort((a, b) => {
    const mark = Number(hasMarker(b.block.title)) - Number(hasMarker(a.block.title))
    if (mark) return mark
    const span = spanOf(a.block) - spanOf(b.block)
    if (span) return span
    const start = new Date(b.block.start).getTime() - new Date(a.block.start).getTime()
    if (start) return start
    return normaliseTitle(b.project.name).length - normaliseTitle(a.project.name).length
  })

  return {
    block: candidates[0].block,
    project: candidates[0].project,
    candidates,
    overlapping: live.length,
  }
}

// Kept for the single-event case and for tests: the first event covering now,
// with no opinion about which of several is right.
export function activeBlock(events = [], now = Date.now()) {
  return blocksAt(events, now)[0] || null
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

  const onBoard = tasks.filter(t => t.status === UP_NEXT || t.status === DOING)

  // Work from this project stays exactly where it is and counts toward the
  // capacity. Everything else on the board is a candidate for displacement —
  // but only a candidate, see below.
  const kept = { [UP_NEXT]: [], [DOING]: [] }
  const others = { [UP_NEXT]: [], [DOING]: [] }
  for (const t of onBoard) {
    if (t.project_id === project.id) kept[t.status].push(t)
    else others[t.status].push(t)
  }

  const keptTotal = kept[UP_NEXT].length + kept[DOING].length
  const othersTotal = others[UP_NEXT].length + others[DOING].length
  const TOTAL = MAX_DOING + MAX_UP_NEXT

  const pool = tasks.filter(t => t.project_id === project.id && t.status === BRAINDUMP)
  const ordered = pickOrder(pool, { today, rand })

  // How many we can actually seat, which is the crux: displacement is bounded
  // by what there is to put in the freed seats.
  //
  // Clearing the board and then discovering the pile has nothing of this
  // project in it would leave you staring at an empty board — strictly worse
  // than the mismatched one you had. So work out the fills first and evict
  // only enough to seat them. No tasks to bring in, nothing is moved at all.
  const placeCount = Math.min(ordered.length, TOTAL - keptTotal)
  const freeNow = TOTAL - keptTotal - othersTotal
  let toEvict = Math.max(0, placeCount - freeNow)

  const moves = []
  // Evicted in the same order the seats get filled — Doing first.
  //
  // The gentler-looking alternative, emptying Up next and leaving Doing alone,
  // produced a board whose Doing band was still last hour's project. Sitting
  // down in a BCG hour to find Product in front of you is the exact thing this
  // feature exists to stop, and nothing is lost either way: an evicted task
  // goes back to the pile, not away.
  for (const band of [DOING, UP_NEXT]) {
    for (const t of others[band]) {
      if (toEvict <= 0) break
      moves.push({ id: t.id, status: BRAINDUMP, reason: 'displaced' })
      others[band] = others[band].filter(x => x !== t)
      toEvict--
    }
  }

  // Doing is filled first: it is the band you work out of, and a block that
  // only half-fills should still leave you something to start on.
  let n = 0
  for (const band of [DOING, UP_NEXT]) {
    const limit = band === DOING ? MAX_DOING : MAX_UP_NEXT
    const room = limit - kept[band].length - others[band].length
    for (let i = 0; i < room && n < placeCount; i++, n++) {
      moves.push({ id: ordered[n].id, status: band, reason: 'filled' })
    }
  }

  return { project, moves }
}

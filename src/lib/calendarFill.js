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
//   • The board becomes the block, and only the block. Everything not from
//     this project is PARKED — sent to the pile with the band it was in
//     recorded, so the board can be rebuilt afterwards. Being on the board
//     already is not a claim to the hour you just sat down for.
//   • A half-empty board is the correct outcome, not a failure to fill one.
//     Three tasks in the project means three tasks and three empty seats, and
//     that emptiness is the whole point of the hour.
//   • Work you put on the board yourself outranks the calendar, but only if it
//     belongs to the block. Tasks from this project stay where they are and
//     count toward the six.
//   • Picks come due-date-first, then random. Random alone is what was asked
//     for, but it can leave something due today sitting in the braindump.
//   • When the block ends, the parked work comes back — see planRestore. Only
//     the parking is undone: what you did during the hour stays exactly as you
//     left it, and anything finished in the meantime is not resurrected.

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
// title: TRK, or [TRK] if you prefer it to read as a tag. It is the override,
// and it exists because no ranking rule can know that today's 1pm is really
// about Product when three things are booked over it. If any live event
// carries the mark, only marked events are considered at all.
//
// Matched on a word boundary, not as a substring, so it cannot fire on a
// project or a name that merely contains those letters. It is stripped before
// the title is read for a project, so "TRK Case with Jake from BCG" still
// matches BCG — which does mean a project actually called TRK cannot be named
// this way. Three letters is a short marker and that is the trade.
const MARKER_RE = /(?:\[\s*trk\s*\]|\btrk\b)/i

export const MARKER = 'TRK'

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
  // capacity. Everything else on the board keeps a seat only if the block
  // doesn't want it.
  const kept = { [UP_NEXT]: [], [DOING]: [] }
  const others = { [UP_NEXT]: [], [DOING]: [] }
  for (const t of onBoard) {
    if (t.project_id === project.id) kept[t.status].push(t)
    else others[t.status].push(t)
  }

  const pool = tasks.filter(t => t.project_id === project.id && t.status === BRAINDUMP)
  const ordered = pickOrder(pool, { today, rand })
  const keptTotal = kept[DOING].length + kept[UP_NEXT].length

  // The one refusal. A project with nothing anywhere — none on the board, none
  // in the pile — would clear the board and put nothing back. That is not a
  // focus hour, it is a wipe, and it is strictly worse than the mismatched
  // board you had. Everything else proceeds, gaps and all.
  if (keptTotal === 0 && ordered.length === 0) return { project, moves: [], parked: [] }

  const moves = []

  // Parked, not discarded. Each one carries the band it was in, and that
  // record is the only reason "put them back" can exist — without it this is
  // a shove into the pile and the board you had is gone for good.
  const parked = []
  for (const band of [DOING, UP_NEXT]) {
    for (const t of others[band]) {
      moves.push({ id: t.id, status: BRAINDUMP, reason: 'parked' })
      parked.push({ id: t.id, status: band })
    }
  }

  // Seats for the hour's work, Doing first. Nothing is stretched to fill what
  // is left: an empty Up next during a focus hour is the point being made.
  const placeDoing = Math.min(ordered.length, Math.max(0, MAX_DOING - kept[DOING].length))
  const placeUpNext = Math.min(ordered.length - placeDoing, Math.max(0, MAX_UP_NEXT - kept[UP_NEXT].length))

  // Negative and descending, so the block's tasks sort above whatever shares
  // their priority band — positions the app writes itself are positive. The
  // first pick is the top of Doing, which is where the hour starts.
  let n = 0
  const seat = (band, count) => {
    for (let i = 0; i < count; i++, n++) {
      moves.push({ id: ordered[n].id, status: band, position: -(ordered.length - n), reason: 'filled' })
    }
  }
  seat(DOING, placeDoing)
  seat(UP_NEXT, placeUpNext)

  return { project, moves, parked }
}

// Putting the board back when the hour is over.
//
// `parked` is what planFill recorded. Anything that has been finished,
// archived or deleted since is skipped: an hour is long enough for the board
// to have moved on, and resurrecting a task you completed during the block
// would be worse than not restoring at all.
export function planRestore({ parked = [], tasks = [] } = {}) {
  const byId = new Map(tasks.map(t => [t.id, t]))
  const room = { [DOING]: MAX_DOING, [UP_NEXT]: MAX_UP_NEXT }
  for (const t of tasks) {
    if (t.status === DOING || t.status === UP_NEXT) room[t.status] -= 1
  }
  const moves = []
  for (const p of parked) {
    const task = byId.get(p.id)
    // Gone, or dealt with while it was parked.
    if (!task || task.status !== BRAINDUMP) continue
    if (room[p.status] > 0) {
      moves.push({ id: p.id, status: p.status, reason: 'restored' })
      room[p.status] -= 1
    } else if (p.status === DOING && room[UP_NEXT] > 0) {
      // Its old seat was taken during the hour. Up next is the honest second
      // choice — leaving it in the pile would quietly lose it.
      moves.push({ id: p.id, status: UP_NEXT, reason: 'restored' })
      room[UP_NEXT] -= 1
    }
  }
  return moves
}

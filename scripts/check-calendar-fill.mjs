// Filling the board from a calendar block.
//
// This moves other people's work around without being asked, on a timer. The
// failure modes are all "it rearranged my board and I don't know why", so the
// cases below are mostly about it NOT acting: no match, no block, nothing to
// do, and never touching work that belongs where it is.

import {
  normaliseTitle, matchProject, activeBlock, blocksAt, chooseBlock,
  hasMarker, stripMarker, MARKER, pickOrder, planFill,
  BRAINDUMP, UP_NEXT, DOING,
} from '../src/lib/calendarFill.js'
import { MAX_DOING, MAX_UP_NEXT } from '../src/lib/boardLimits.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const PROJECTS = [
  { id: 'p1', name: 'Product' },
  { id: 'p2', name: 'BCG' },
  { id: 'p3', name: 'McKinsey' },
  { id: 'p4', name: 'Marketing' },
]
const TODAY = '2026-08-24'
// A fixed source, so "random" is checkable.
const fixedRand = () => 0

// — reading the title —

ok('a bare project name matches', matchProject('Product', PROJECTS)?.id === 'p1')
ok('"Work on Product" matches', matchProject('Work on Product', PROJECTS)?.id === 'p1')
ok('case is ignored', matchProject('PRODUCT', PROJECTS)?.id === 'p1')
ok('emoji and punctuation are ignored', matchProject('🚀 Product!', PROJECTS)?.id === 'p1')
ok('"Focus on Marketing" matches', matchProject('Focus on Marketing', PROJECTS)?.id === 'p4')
ok('"Deep work on Product" matches', matchProject('Deep work on Product', PROJECTS)?.id === 'p1')

// The case this was rebuilt for. A calendar holds sentences, not labels, and
// requiring the title to EQUAL the project name meant almost nothing matched:
// a real day of entries produced zero fills while the strip claimed to be
// following along.
ok('a project named inside a sentence matches',
  matchProject('Case with Jake from BCG', PROJECTS)?.id === 'p2')
ok('so does one at the front', matchProject('Product sync with Sam', PROJECTS)?.id === 'p1')
ok('and one in the middle', matchProject('Prep McKinsey deck for Friday', PROJECTS)?.id === 'p3')

// Whole words, not substrings — this is what keeps the looser rule honest.
ok('"Production planning" does not match Product',
  matchProject('Production planning', PROJECTS) === null)
ok('"Products" does not match Product', matchProject('Products review', PROJECTS) === null)

// Not guessing is still the point — a wrong guess rearranges your board.
ok('an unrelated event matches nothing', matchProject('Dentist', PROJECTS) === null)
ok('a lead-in on its own matches nothing', matchProject('Work on', PROJECTS) === null)
ok('a time and a name match nothing', matchProject('1:1 with Sam', PROJECTS) === null)

// Two projects named at once: no way to tell which the hour is for.
ok('an ambiguous title matches nothing',
  matchProject('BCG and McKinsey sync', PROJECTS) === null)
// Unless one is plainly more specific than the other.
const NESTED = [{ id: 'a', name: 'McKinsey' }, { id: 'b', name: 'McKinsey Phase 2' }]
ok('the more specific name wins',
  matchProject('McKinsey Phase 2 review', NESTED)?.id === 'b')
ok('an empty title matches nothing', matchProject('', PROJECTS) === null)
ok('a null title does not throw', matchProject(null, PROJECTS) === null)
ok('no projects means no match', matchProject('Product', []) === null)
ok('normalise collapses whitespace', normaliseTitle('  Product   Team  ') === 'product team')

// — finding the block —

const noon = new Date('2026-08-24T12:00:00Z').getTime()
const events = [
  { title: 'Standup', start: '2026-08-24T09:00:00Z', end: '2026-08-24T09:15:00Z' },
  { title: 'Product', start: '2026-08-24T11:00:00Z', end: '2026-08-24T13:00:00Z' },
]
ok('the covering block is found', activeBlock(events, noon)?.title === 'Product')
ok('a finished block is not active',
  activeBlock(events, new Date('2026-08-24T14:00:00Z').getTime()) === null)
ok('the start instant counts as inside',
  activeBlock(events, new Date('2026-08-24T11:00:00Z').getTime())?.title === 'Product')
// Half-open, or two adjacent blocks would both be live for one instant.
ok('the end instant counts as outside',
  activeBlock(events, new Date('2026-08-24T13:00:00Z').getTime()) === null)
ok('an all-day event never holds the board',
  activeBlock([{ title: 'Product', allDay: true, start: '2026-08-24', end: '2026-08-25' }], noon) === null)
ok('a malformed event is skipped',
  activeBlock([{ title: 'Product', start: 'nonsense', end: 'nonsense' }], noon) === null)
ok('no events, no block', activeBlock([], noon) === null)

// — overlapping events —
//
// A real calendar double-books. The old rule was "the first event covering
// now", and the API returns them ordered by start time, so a standup that
// began at 1:00 beat a Product block that began at 1:30 — and because the
// project was matched only after an event was chosen, one unrelated meeting
// was enough to hide a block that would have worked.

const T = t => new Date(`2026-08-24T${t}:00Z`).getTime()
const ev = (id, title, from, to) => ({
  id, title, start: `2026-08-24T${from}:00Z`, end: `2026-08-24T${to}:00Z`,
})

const standup = ev('a', 'Team standup', '13:00', '14:00')
const product = ev('b', 'Work on Product', '13:30', '14:30')
const bcgShort = ev('c', 'Case with Jake from BCG', '13:40', '13:50')

ok('both events are seen as live', blocksAt([standup, product], T('13:45')).length === 2)

const overlap = chooseBlock({ events: [standup, product], projects: PROJECTS, now: T('13:45') })
ok('an unrelated meeting no longer hides a real block', overlap.block?.id === 'b')
ok('and the project comes back with it', overlap.project?.id === 'p1')
ok('the overlap count is reported', overlap.overlapping === 2)

// Two that both match: the shorter one is the more specific statement about
// this minute.
const two = chooseBlock({ events: [standup, product, bcgShort], projects: PROJECTS, now: T('13:45') })
ok('the shorter of two matching blocks wins', two.block?.id === 'c')
ok('and it brings its own project', two.project?.id === 'p2')

// Same length: the one you just moved into.
const early = ev('d', 'Product', '13:00', '14:00')
const late = ev('e', 'BCG', '13:30', '14:30')
ok('of two equal blocks the later start wins',
  chooseBlock({ events: [early, late], projects: PROJECTS, now: T('13:45') }).block?.id === 'e')

// — the marker, which is the user's override —

ok('a bare TRK is recognised', hasMarker('TRK Product'))
ok('at the end too', hasMarker('Product TRK'))
ok('bracketed reads as a tag and works', hasMarker('[TRK] Product'))
ok('case does not matter', hasMarker('trk Product'))
ok('spacing inside brackets does not matter', hasMarker('[ TRK ] Product'))
ok('an unmarked title has none', !hasMarker('Product'))

// A three-letter marker has to match on a word boundary or it fires on
// ordinary words — this is the whole reason it is not a substring search.
ok('it does not fire mid-word', !hasMarker('Portrko meeting'))
ok('nor inside a longer token', !hasMarker('TRKKIT sync'))
ok('nor on a hyphenated lookalike', !hasMarker('BTRK review'))

ok('the marker is stripped before matching',
  matchProject('TRK Case with Jake from BCG', PROJECTS)?.id === 'p2')
ok('bracketed strips too', matchProject('[TRK] Work on Product', PROJECTS)?.id === 'p1')
ok('stripping leaves the rest intact', normaliseTitle(stripMarker('TRK Product')) === 'product')
ok('MARKER is the form shown to people', hasMarker(MARKER))

// A mark beats every heuristic — that is the point of having one. Here the
// marked block is both longer and earlier, and still wins.
const markedLong = ev('f', 'TRK Product', '13:00', '17:00')
const marked = chooseBlock({ events: [markedLong, bcgShort], projects: PROJECTS, now: T('13:45') })
ok('a marked block beats a shorter unmarked one', marked.block?.id === 'f')
ok('and beats a later one too',
  chooseBlock({ events: [markedLong, late], projects: PROJECTS, now: T('13:45') }).block?.id === 'f')

// Marking something that names no project does not fall back to an unmarked
// block: an explicit instruction that cannot be honoured should do nothing,
// not something else.
const markedJunk = ev('g', 'TRK Dentist', '13:00', '14:00')
const junk = chooseBlock({ events: [markedJunk, product], projects: PROJECTS, now: T('13:45') })
ok('a marked block naming no project does nothing', junk.project === null)

// — nothing live —

ok('no events, no choice',
  chooseBlock({ events: [], projects: PROJECTS, now: T('13:45') }).block === null)
ok('nothing matching reports the overlap anyway',
  chooseBlock({ events: [standup], projects: PROJECTS, now: T('13:45') }).overlapping === 1)

// — choosing what to pull in —

const order = pickOrder([
  { id: 'a', due_date: null },
  { id: 'b', due_date: '2026-08-20' },   // overdue
  { id: 'c', due_date: '2026-08-24' },   // today
  { id: 'd', due_date: '2027-01-01' },   // far off
], { today: TODAY, rand: fixedRand })
ok('overdue comes first', order[0].id === 'b')
ok('then today', order[1].id === 'c')
ok('undated and far-off are left to the shuffle',
  order.slice(2).map(t => t.id).sort().join('') === 'ad')
ok('nothing is lost in the ordering', order.length === 4)

// — the plan —

const dump = n => Array.from({ length: n }, (_, i) => ({
  id: `d${i}`, status: BRAINDUMP, project_id: 'p1', due_date: null,
}))

const plan = planFill({
  block: { title: 'Work on Product' }, projects: PROJECTS,
  tasks: dump(10), today: TODAY, rand: fixedRand,
})
ok('a matched block fills the board', plan.moves.length === MAX_DOING + MAX_UP_NEXT)
ok('and that is six', plan.moves.length === 6)
ok('Doing gets its two', plan.moves.filter(m => m.status === DOING).length === MAX_DOING)
ok('Up next gets its four', plan.moves.filter(m => m.status === UP_NEXT).length === MAX_UP_NEXT)
ok('the project is reported back', plan.project?.id === 'p1')

ok('an unmatched block changes nothing',
  planFill({ block: { title: 'Dentist' }, projects: PROJECTS, tasks: dump(10), today: TODAY }).moves.length === 0)
ok('no block changes nothing',
  planFill({ block: null, projects: PROJECTS, tasks: dump(10), today: TODAY }).moves.length === 0)
ok('an empty braindump changes nothing',
  planFill({ block: { title: 'Product' }, projects: PROJECTS, tasks: [], today: TODAY }).moves.length === 0)

// Only that project's tasks are eligible — this is the one that would be most
// embarrassing to get wrong.
const mixed = [
  { id: 'x', status: BRAINDUMP, project_id: 'p2', due_date: null },
  { id: 'y', status: BRAINDUMP, project_id: null, due_date: null },
  { id: 'z', status: BRAINDUMP, project_id: 'p1', due_date: null },
]
const onlyMine = planFill({ block: { title: 'Product' }, projects: PROJECTS, tasks: mixed, today: TODAY, rand: fixedRand })
ok('only the block\'s project is pulled in',
  onlyMine.moves.length === 1 && onlyMine.moves[0].id === 'z')

// — your own work outranks the calendar, if it belongs to the block —

const withMine = [
  { id: 'keep1', status: DOING, project_id: 'p1', due_date: null },
  { id: 'keep2', status: UP_NEXT, project_id: 'p1', due_date: null },
  ...dump(10),
]
const kept = planFill({ block: { title: 'Product' }, projects: PROJECTS, tasks: withMine, today: TODAY, rand: fixedRand })
ok('a Product task already on the board is left alone',
  !kept.moves.some(m => m.id === 'keep1' || m.id === 'keep2'))
ok('and it counts toward the six', kept.moves.length === 4, `${kept.moves.length} moves`)
ok('so Doing is not overfilled',
  kept.moves.filter(m => m.status === DOING).length === MAX_DOING - 1)

const withOthers = [
  { id: 'mk1', status: DOING, project_id: 'p2', due_date: null },
  { id: 'mk2', status: UP_NEXT, project_id: 'p2', due_date: null },
  ...dump(10),
]
const displaced = planFill({ block: { title: 'Product' }, projects: PROJECTS, tasks: withOthers, today: TODAY, rand: fixedRand })
ok('another project\'s tasks are returned to the pile',
  displaced.moves.filter(m => m.status === BRAINDUMP).map(m => m.id).sort().join() === 'mk1,mk2')
ok('and the freed slots are refilled',
  displaced.moves.filter(m => m.status !== BRAINDUMP).length === 6)

// A displaced task must not be pulled straight back in on the same pass.
const selfDisplace = [
  { id: 'other', status: DOING, project_id: 'p2', due_date: null },
  ...dump(10),
]
const sd = planFill({ block: { title: 'Product' }, projects: PROJECTS, tasks: selfDisplace, today: TODAY, rand: fixedRand })
ok('a displaced task is not immediately re-filled',
  !sd.moves.some(m => m.id === 'other' && m.status !== BRAINDUMP))
ok('no task is moved twice in one plan',
  new Set(sd.moves.map(m => m.id)).size === sd.moves.length)

// — displacement is bounded by what there is to replace with —
//
// The board full of one project, a block naming another, and nothing of that
// other project waiting. Clearing the board would leave it empty, which is
// strictly worse than the mismatched board it started with.

const fullOfProduct = [
  ...Array.from({ length: MAX_DOING }, (_, i) => ({ id: `D${i}`, status: DOING, project_id: 'p1' })),
  ...Array.from({ length: MAX_UP_NEXT }, (_, i) => ({ id: `U${i}`, status: UP_NEXT, project_id: 'p1' })),
]
ok('an empty pile never empties the board',
  planFill({ block: { title: 'Case with Jake from BCG' }, projects: PROJECTS, tasks: fullOfProduct, today: TODAY, rand: fixedRand }).moves.length === 0)

const oneWaiting = [
  ...fullOfProduct,
  { id: 'bcg1', status: BRAINDUMP, project_id: 'p2', due_date: null },
]
const one = planFill({ block: { title: 'BCG' }, projects: PROJECTS, tasks: oneWaiting, today: TODAY, rand: fixedRand })
ok('one waiting task evicts exactly one', one.moves.filter(m => m.status === BRAINDUMP).length === 1)
ok('and seats it', one.moves.filter(m => m.status !== BRAINDUMP).length === 1)
// The band you sit down in should hold the hour's work, so Doing is the first
// thing swapped, not the last.
ok('Doing is the first band handed over',
  one.moves.find(m => m.status === BRAINDUMP)?.id.startsWith('D'),
  JSON.stringify(one.moves))
ok('and the single task lands in Doing',
  one.moves.find(m => m.status !== BRAINDUMP)?.status === DOING)
ok('the board never shrinks', one.moves.filter(m => m.status === BRAINDUMP).length
  <= one.moves.filter(m => m.status !== BRAINDUMP).length)

const threeWaiting = [
  ...fullOfProduct,
  ...Array.from({ length: 3 }, (_, i) => ({ id: `b${i}`, status: BRAINDUMP, project_id: 'p2', due_date: null })),
]
const three = planFill({ block: { title: 'BCG' }, projects: PROJECTS, tasks: threeWaiting, today: TODAY, rand: fixedRand })
ok('three waiting evict exactly three', three.moves.filter(m => m.status === BRAINDUMP).length === 3)
ok('Doing is filled before Up next',
  three.moves.filter(m => m.status === DOING).length === MAX_DOING)
ok('and the third goes to Up next',
  three.moves.filter(m => m.status === UP_NEXT).length === 1)

// — a thin pile —

const thin = planFill({ block: { title: 'Product' }, projects: PROJECTS, tasks: dump(3), today: TODAY, rand: fixedRand })
ok('three tasks fill three slots, not six', thin.moves.length === 3)
ok('and Doing is filled before Up next',
  thin.moves.filter(m => m.status === DOING).length === MAX_DOING)

// — a full board of the right project is already correct —

const alreadyRight = [
  ...Array.from({ length: MAX_DOING }, (_, i) => ({ id: `D${i}`, status: DOING, project_id: 'p1' })),
  ...Array.from({ length: MAX_UP_NEXT }, (_, i) => ({ id: `U${i}`, status: UP_NEXT, project_id: 'p1' })),
  ...dump(5),
]
ok('a board already full of the right work is left completely alone',
  planFill({ block: { title: 'Product' }, projects: PROJECTS, tasks: alreadyRight, today: TODAY, rand: fixedRand }).moves.length === 0)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

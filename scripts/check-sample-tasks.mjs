// The first-run seed.
//
// This board is the first thing a new account sees and the thing the tour
// points at, so the two ways it can go wrong are both silent: it can quietly
// overfill a band — making the limit the tour just explained visibly false —
// or it can leave a section empty and send the tour pointing at nothing.

import { sampleTasks, seededClouds, MAX_DOING, MAX_UP_NEXT } from '../src/lib/sampleTasks.js'

let pass = 0, fail = 0
const ok = (name, cond, detail = '') => {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const today = new Date(2026, 0, 15)
const rows = sampleTasks({ today, projectId: 'p1' })
const of = s => rows.filter(t => t.status === s)

ok('the bands the board enforces are not overfilled by the seed itself',
  of('in_progress').length <= MAX_DOING && of('todo').length <= MAX_UP_NEXT,
  `${of('in_progress').length} doing, ${of('todo').length} up next`)

ok('Doing is full, so the limit is visible on day one', of('in_progress').length === MAX_DOING)
ok('Up next is full, so the limit is visible on day one', of('todo').length === MAX_UP_NEXT)

for (const status of ['done', 'braindump', 'archived']) {
  ok(`${status} is not empty — the tour points at it`, of(status).length > 0)
}

ok('finishing something is worth a cloud to pop', seededClouds(rows) >= 1)

ok('Deadlines has dates to draw, spread over more than one day',
  new Set(of('todo').filter(t => t.due_date).map(t => t.due_date)).size >= 3)

ok('every due date is on or after today',
  rows.every(t => !t.due_date || t.due_date >= '2026-01-15'),
  rows.filter(t => t.due_date && t.due_date < '2026-01-15').map(t => t.due_date).join(', '))

ok('every seeded task is filed under the project you named',
  rows.every(t => t.project_id === 'p1'))

ok('every row is a complete task row',
  rows.every(t => t.title && t.status && t.priority && 'notes' in t && 'due_date' in t))

const titles = rows.map(t => t.title)
ok('no two seeded tasks read the same', new Set(titles).size === titles.length)
ok('the seed is small enough to clear out in a minute', rows.length <= 20, `${rows.length}`)

// A straight apostrophe here would render as one in the middle of a board that
// uses curly ones everywhere else.
ok('the copy uses real apostrophes, not entities or straight quotes',
  titles.every(t => !t.includes('&') && !t.includes("'")),
  titles.filter(t => t.includes('&') || t.includes("'")).join(' | '))

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

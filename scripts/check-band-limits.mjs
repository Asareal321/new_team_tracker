// The bands hold what they hold, and a full board never refuses a capture.
//
// The second half is the rule that matters: a task typed into a full Up next
// is filed to the braindump rather than bounced. Capture is the one thing the
// board must never block — a thought you can't write down is lost, and the
// braindump exists precisely to catch it.

import { MAX_DOING, MAX_UP_NEXT, BAND_LIMITS, bandFull } from '../src/lib/boardLimits.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const BRAINDUMP = 'braindump'
const fill = (status, n) => Array.from({ length: n }, (_, i) => ({ id: `${status}-${i}`, status }))

// What handleSubmit does with a new task aimed at `status`.
function fileNewTask(tasks, status) {
  return bandFull(tasks, status) ? BRAINDUMP : status
}
// What it does with an *edit* moving an existing task into `status`.
function fileEdit(tasks, status, id) {
  return bandFull(tasks, status, id) ? null : status   // null = refused
}

// — the limits —

ok('Doing holds two', MAX_DOING === 2)
ok('Up next holds four', MAX_UP_NEXT === 4)
ok('the braindump is unbounded', bandFull(fill(BRAINDUMP, 500), BRAINDUMP) === false)
ok('Done is unbounded', bandFull(fill('done', 500), 'done') === false)
ok('only the two live bands are limited',
  Object.keys(BAND_LIMITS).sort().join(',') === 'in_progress,todo')

// — the boundary, said out loud in both directions —

ok('Doing is not full at one', bandFull(fill('in_progress', 1), 'in_progress') === false)
ok('Doing is full at two', bandFull(fill('in_progress', 2), 'in_progress') === true)
ok('Up next is not full at three', bandFull(fill('todo', 3), 'todo') === false)
ok('Up next is full at four', bandFull(fill('todo', 4), 'todo') === true)

// Over the limit still counts as full — a band can exceed it through a direct
// DB edit or an older client, and that must not read as room.
ok('a band over its limit is still full', bandFull(fill('todo', 9), 'todo') === true)

// Tasks in other bands never count toward a band's limit.
ok('other bands do not fill this one',
  bandFull([...fill('todo', 4), ...fill(BRAINDUMP, 20)], 'in_progress') === false)

// — capture is never refused —

ok('a new task lands in Up next when there is room',
  fileNewTask(fill('todo', 2), 'todo') === 'todo')
ok('a new task diverts to the braindump when Up next is full',
  fileNewTask(fill('todo', MAX_UP_NEXT), 'todo') === BRAINDUMP)
ok('a new task diverts to the braindump when Doing is full',
  fileNewTask(fill('in_progress', MAX_DOING), 'in_progress') === BRAINDUMP)
ok('a new task is never refused, whatever the board looks like',
  [0, 1, 4, 40].every(n => fileNewTask(fill('todo', n), 'todo') !== null))
ok('a divert never lands anywhere but the braindump',
  fileNewTask(fill('todo', MAX_UP_NEXT), 'todo') === BRAINDUMP)

// — but an edit into a full band is still stopped —
//
// Moving an existing task is a deliberate act with a target; silently filing
// it somewhere else would lose the user's intent. Only *new* work diverts.

ok('editing a task into a full band is refused',
  fileEdit(fill('todo', MAX_UP_NEXT), 'todo', 'nobody') === null)
ok('a task already in the band does not count against itself',
  fileEdit(fill('todo', MAX_UP_NEXT), 'todo', 'todo-0') === 'todo')

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

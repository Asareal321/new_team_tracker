// Swipe-to-reveal on a task row.
//
// Three gestures share one row on a phone: tap opens the task, press-and-hold
// drags it between bands, and a sideways drag reveals the move actions. Most
// of what can go wrong is arithmetic — a swipe that eats the page scroll, a
// row left half-open, a swipe that also opens the task it was moving — so the
// arithmetic is out of React and checked here.

import {
  AXIS_LOCK, REVEAL_WIDTH, COMMIT_AT, RESISTANCE,
  axisOf, offsetFor, settle, shouldSuppressClick,
} from '../src/lib/swipe.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

// — choosing an axis —

ok('a still pointer has no axis', axisOf(0, 0) === null)
ok('a tiny wobble has no axis', axisOf(3, 4) === null,
  'a tap is never perfectly still')
ok('a clear sideways drag is horizontal', axisOf(-40, 3) === 'h')
ok('a clear downward drag is vertical', axisOf(2, 40) === 'v')

// The page scrolls constantly and a row is swiped rarely. A scroll swallowed
// by a row is far worse than a swipe that needs a second try, so ties go to
// the browser.
ok('a diagonal tie is vertical', axisOf(20, 20) === 'v')
ok('mostly-down but sideways is still vertical', axisOf(14, 15) === 'v')
ok('the axis only locks past the threshold',
  axisOf(AXIS_LOCK - 1, AXIS_LOCK - 1) === null && axisOf(AXIS_LOCK + 1, 0) === 'h')

// — where the row sits mid-drag —

ok('a closed row starts at zero', offsetFor(0, false) === 0)
ok('dragging left moves it left', offsetFor(-50, false) === -50)
ok('the row stops at the reveal width', offsetFor(-REVEAL_WIDTH, false) === -REVEAL_WIDTH)

// Past the stop it keeps moving, but grudgingly — the usual signal that
// you've reached the end of something rather than that it's stuck.
const past = offsetFor(-REVEAL_WIDTH - 100, false)
ok('past the stop it resists', past < -REVEAL_WIDTH && past > -REVEAL_WIDTH - 100, `${past}`)
ok('resistance is proportional',
  Math.abs(past + REVEAL_WIDTH + 100 * RESISTANCE) < 0.001)

// A closed row has nothing to reveal on its right, so dragging that way is
// resisted from the very first pixel rather than sliding freely.
ok('a closed row resists being dragged right',
  offsetFor(100, false) > 0 && offsetFor(100, false) < 100)

ok('an open row starts at the reveal width', offsetFor(0, true) === -REVEAL_WIDTH)
ok('an open row closes as you drag right', offsetFor(REVEAL_WIDTH, true) === 0)
ok('an open row dragged further left resists', offsetFor(-40, true) > -REVEAL_WIDTH - 40)

// — where it lands —
//
// Two resting places only. Half-open is a state nobody wants to be left in.

ok('a decisive left flick opens it', settle(-COMMIT_AT - 1, false) === 'open')
ok('a small left nudge springs back', settle(-COMMIT_AT + 1, false) === 'closed')
ok('exactly the threshold does not commit', settle(-COMMIT_AT, false) === 'closed',
  'the boundary is stated rather than left to a rounding')
ok('a right flick on an open row closes it', settle(COMMIT_AT + 1, true) === 'closed')
ok('a small right nudge leaves it open', settle(COMMIT_AT - 1, true) === 'open')
ok('no movement leaves a closed row closed', settle(0, false) === 'closed')
ok('no movement leaves an open row open', settle(0, true) === 'open')
ok('it only ever settles open or closed',
  [-300, -50, 0, 50, 300].every(dx =>
    [true, false].every(w => ['open', 'closed'].includes(settle(dx, w)))))

// Dragging the wrong way never commits the opposite state.
ok('dragging right cannot open a closed row', settle(300, false) === 'closed')
ok('dragging left cannot close an open row', settle(-300, true) === 'open')

// — the click afterwards —
//
// A pointer that goes down and up on a button is a click however far it
// travelled in between, so a swipe ending over the row body would also open
// the task it was busy moving.

ok('a swipe suppresses the click that follows', shouldSuppressClick(-60, 2) === true)
ok('a tap does not', shouldSuppressClick(0, 0) === false)
ok('a shaky tap does not', shouldSuppressClick(3, 4) === false)
ok('an aborted vertical drag suppresses too', shouldSuppressClick(1, 40) === true,
  'a scroll that ends on a row must not open it either')

// — the shape of the thing —

ok('the reveal fits two 44px targets', REVEAL_WIDTH >= 88, `${REVEAL_WIDTH}`)
ok('the reveal is well under a phone', REVEAL_WIDTH < 375 * 0.45)
ok('committing takes less than half the reveal', COMMIT_AT < REVEAL_WIDTH / 2,
  'a flick should be enough; a careful drag to the stop should not be needed')
ok('the axis locks before a swipe can commit', AXIS_LOCK < COMMIT_AT)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

// The arithmetic behind swipe-to-reveal, kept away from React so it can be
// checked without a browser or a finger.
//
// A row on a phone has three gestures living on top of each other: tap opens
// the task, press-and-hold drags it between bands, and a horizontal drag
// reveals the move actions. They stay distinct because each one claims the
// pointer at a different moment — the hold after 220ms (dnd-kit), the swipe
// after AXIS_LOCK px of mostly-sideways movement, and the tap only if neither
// of the others took it.

// How far a pointer travels before the gesture commits to an axis. Below this
// nothing moves: a tap is never perfectly still, and a row that slid under
// every fingertip would be unusable.
export const AXIS_LOCK = 8

// How far the row slides, which is what the actions behind it are worth.
export const REVEAL_WIDTH = 132

// How far past halfway a swipe has to get before releasing commits it. Well
// under half the reveal, because the common case is a decisive flick, not a
// careful drag to the exact stop.
export const COMMIT_AT = 40

// Beyond the stop the row keeps moving, but grudgingly — the standard signal
// that you've reached the end of something rather than that it's broken.
export const RESISTANCE = 0.28

// Which way this gesture is going, or null while it's still ambiguous.
// Vertical wins ties: the page scrolls far more often than a row is swiped,
// and a scroll that gets swallowed by a row is much worse than a swipe that
// needs a second try.
export function axisOf(dx, dy) {
  if (Math.abs(dx) < AXIS_LOCK && Math.abs(dy) < AXIS_LOCK) return null
  return Math.abs(dx) > Math.abs(dy) ? 'h' : 'v'
}

// Where the row sits mid-gesture, given how far the pointer has moved and
// whether the row was already open when it started.
export function offsetFor(dx, wasOpen, width = REVEAL_WIDTH) {
  const raw = (wasOpen ? -width : 0) + dx
  // Closed and dragging right: nothing to reveal on that side.
  if (raw > 0) return raw * RESISTANCE
  // Open and dragging further left: past the stop.
  if (raw < -width) return -width - (Math.abs(raw) - width) * RESISTANCE
  return raw
}

// Where it lands when the finger lifts. Only two resting places — half-open
// is a state nobody wants to be left in.
export function settle(dx, wasOpen, width = REVEAL_WIDTH) {
  if (wasOpen) return dx > COMMIT_AT ? 'closed' : 'open'
  return dx < -COMMIT_AT ? 'open' : 'closed'
}

// Whether the click that follows this gesture should be swallowed. A swipe
// that ends over the row's body would otherwise also open the task, because a
// pointer going down and up on a button is a click however far it travelled
// in between.
export function shouldSuppressClick(dx, dy) {
  return Math.abs(dx) > AXIS_LOCK || Math.abs(dy) > AXIS_LOCK
}

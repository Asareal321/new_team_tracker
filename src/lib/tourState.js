// Whether this account has been walked round the place yet.
//
// Kept in localStorage rather than on the row, deliberately: the tour teaches
// you where things are, the garden row is the game's state, and adding a column
// would mean another migration to run before anything works. Keyed by user so
// two accounts on one machine each get their own walk.

const KEY = 'trakkit.tour.done'

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function tourDone(userId) {
  if (!userId) return true
  return read()[userId] === true
}

export function markTourDone(userId) {
  if (!userId) return
  try {
    const all = read()
    all[userId] = true
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* a private-mode browser just gets the tour again */ }
}

export function resetTour(userId) {
  try {
    const all = read()
    delete all[userId]
    localStorage.setItem(KEY, JSON.stringify(all))
  } catch { /* nothing to do */ }
}

// Setup and the account page both ask for the tour; Layout runs it. They sit
// on opposite sides of the router, so a prop won't reach.
//
// The flag alone isn't enough — Layout has no reason to re-render when a
// sessionStorage key changes, so a request could sit there unnoticed until
// something else happened to wake it. The event is the signal; the flag is
// what survives the reload that setup may cause on the way.
const PENDING = 'trakkit.tour.pending'
export const TOUR_EVENT = 'trakkit:tour'

export function requestTour() {
  try { sessionStorage.setItem(PENDING, '1') } catch { /* ignore */ }
  try { window.dispatchEvent(new Event(TOUR_EVENT)) } catch { /* ignore */ }
}
export const tourRequested = () => { try { return sessionStorage.getItem(PENDING) === '1' } catch { return false } }
export const clearTourRequest = () => { try { sessionStorage.removeItem(PENDING) } catch { /* ignore */ } }

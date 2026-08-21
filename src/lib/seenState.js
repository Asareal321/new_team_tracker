// What the nav has already shown you.
//
// Per user, on the device. A signal is about *your* attention, and attention
// doesn't follow you between machines — a packet you noticed on your laptop is
// still worth pointing out on your phone. Keeping it local also means no
// migration stands between this feature and working.

const KEY = 'trakkit.seen'

// The rail and the garden's room tabs each run their own copy of the hook, so
// a write from one has to reach the other — otherwise visiting a room clears
// its own dot and leaves the rail lit for a cause nobody is still being shown.
export const SEEN_EVENT = 'trakkit:seen'

function all() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function readSeen(userId) {
  if (!userId) return {}
  return all()[userId] || {}
}

// One signature string per scope — the cause you were last shown there.
export function writeSeen(userId, scope, signature) {
  if (!userId) return {}
  try {
    const everyone = all()
    const mine = everyone[userId] || {}
    if (mine[scope] === signature) return mine   // don't churn state for nothing
    const next = { ...mine, [scope]: signature }
    everyone[userId] = next
    localStorage.setItem(KEY, JSON.stringify(everyone))
    try { window.dispatchEvent(new Event(SEEN_EVENT)) } catch { /* not a browser */ }
    return next
  } catch {
    return readSeen(userId)
  }
}

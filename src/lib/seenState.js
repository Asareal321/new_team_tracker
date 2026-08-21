// What the nav has already shown you.
//
// Per user, on the device. A signal is about *your* attention, and attention
// doesn't follow you between machines — a packet you noticed on your laptop is
// still worth pointing out on your phone. Keeping it local also means no
// migration stands between this feature and working.

const KEY = 'trakkit.seen'

function all() {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {} }
}

export function readSeen(userId) {
  if (!userId) return {}
  return all()[userId] || {}
}

export function writeSeen(userId, route, patch) {
  if (!userId) return {}
  try {
    const everyone = all()
    const mine = everyone[userId] || {}
    const next = { ...mine, [route]: { ...(mine[route] || {}), ...patch } }
    everyone[userId] = next
    localStorage.setItem(KEY, JSON.stringify(everyone))
    return next
  } catch {
    return readSeen(userId)
  }
}

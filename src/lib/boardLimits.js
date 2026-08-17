// How much the board holds.
//
// In a module of its own rather than in TaskBoard.jsx because the garden reads
// them too: a Doing "clear" is defined as a full column's worth of finished
// work (lib/garden.js, DOING_CLEAR_TASKS), and a headless script can't import
// a file with JSX in it to check the two agree.
//
// The point was always "only a few things at once", and it applies to the
// backlog as well: an Up next that grows without bound is just a second
// braindump with more ceremony. The braindump is the overflow — it exists
// precisely so that a full board never blocks capture, which is why a new task
// aimed at a full band is filed there instead of being refused.

export const MAX_DOING = 2
export const MAX_UP_NEXT = 4

export const BAND_LIMITS = { todo: MAX_UP_NEXT, in_progress: MAX_DOING }

// One check, used by every route into a band: the form, drag-and-drop, the
// ∧ / ∨ controls, the action bar, and the braindump tray. Each of those was
// previously its own check, or no check at all.
export function bandFull(tasks, status, exceptId) {
  const limit = BAND_LIMITS[status]
  if (!limit) return false
  return tasks.filter(t => t.status === status && t.id !== exceptId).length >= limit
}

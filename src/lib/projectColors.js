// Shared project color mapping so a project reads as "the blue one" in both
// the task-creation project pills (saturated dot) and the Teams-tab tiles
// (pastel tint of the same hue). Both derive from the same id hash, so a
// given project always lands on the same color.

// Saturated dot colors — used for the small dots on the task-creation screen.
export const PROJECT_DOT_COLORS = ['#378ADD', '#1D9E75', '#D4537E', '#BA7517', '#7F77DD', '#D85A30']

export function projectColorIndex(id) {
  const s = String(id)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % PROJECT_DOT_COLORS.length
}

export function projectDotColor(id) {
  return PROJECT_DOT_COLORS[projectColorIndex(id)]
}

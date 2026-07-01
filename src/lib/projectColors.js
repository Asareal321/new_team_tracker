// Shared project color mapping so a project reads as "the blue one" in both
// the task-creation project pills (saturated dot) and the Teams-tab tiles
// (pastel tint of the same hue). Both derive from the same id hash, so a
// given project always lands on the same color.

// Saturated dot colors — one per theme hue ramp. Used for the small dots on
// the task-creation screen. The Teams-tab tiles use a pale tint of the same
// hue (see the .pc-N rules in TeamsPage.css). Order must stay in sync with
// those rules. Keep to one entry per ramp: each ramp has a single pale tint,
// so two shades of the same hue would collide on the tile background.
export const PROJECT_DOT_COLORS = [
  '#378ADD', // blue
  '#1D9E75', // teal
  '#D4537E', // pink
  '#BA7517', // amber
  '#7F77DD', // purple
  '#D85A30', // coral
  '#639922', // green
  '#E24B4A', // red
  '#888780', // slate
]

export function projectColorIndex(id) {
  const s = String(id)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % PROJECT_DOT_COLORS.length
}

export function projectDotColor(id) {
  return PROJECT_DOT_COLORS[projectColorIndex(id)]
}

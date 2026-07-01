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

// Pale tint + readable same-hue text per project, aligned with PROJECT_DOT_COLORS
// and the .pc-N tiles on the Teams page. Used for calendar chips (a colored pill
// with dark text reads fine on both light and dark calendars).
const PROJECT_TINTS = [
  { bg: '#E6F1FB', text: '#0C447C' }, // blue
  { bg: '#E1F5EE', text: '#085041' }, // teal
  { bg: '#FBEAF0', text: '#72243E' }, // pink
  { bg: '#FAEEDA', text: '#633806' }, // amber
  { bg: '#EEEDFE', text: '#3C3489' }, // purple
  { bg: '#FAECE7', text: '#712B13' }, // coral
  { bg: '#EAF3DE', text: '#27500A' }, // green
  { bg: '#FCEBEB', text: '#791F1F' }, // red
  { bg: '#F1EFE8', text: '#2C2C2A' }, // slate
]

export function projectTint(id) {
  return PROJECT_TINTS[projectColorIndex(id)]
}

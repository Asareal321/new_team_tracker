// Shared project color mapping so a project reads as "the blue one" everywhere:
// the saturated dot on task-creation and tiles, and the pale tinted pill on the
// Teams tiles and the deadlines calendar. Both derive from the same id hash, so
// a given project always lands on the same color.
//
// Built on the Beech & Baize curve (see DESIGN.md → Colors). Two rules govern
// this palette and neither is cosmetic:
//
// 1. Project hues live in the COOL half of the wheel, plus rose. The warm
//    quadrant is reserved: flag/priority sits at hue 29, due/deadline at 68,
//    the accent at 133 and beech at 66. Every hue below clears all four by at
//    least 20 degrees, so a project color can never be mistaken for a state.
// 2. Every entry sits at the same lightness as its peers — dots at OKLCH L
//    0.62, tints at L 0.93 (light) / L 0.29 (dark) — so no project looks louder
//    or more urgent than another. Ordering carries no meaning and must not.
//
// Every tint/text pair clears WCAG AA in both themes (measured 6.89-7.74:1).
// Dots clear 3:1 against both row surfaces. If you add a tenth entry, generate
// it at the same L/C and check it, rather than eyeballing a hex.

// Saturated dot colors, OKLCH L 0.62 / C 0.15. Theme-independent: at this
// lightness a dot clears 3:1 against both the light and the dark row surface,
// so it does not need a per-theme variant.
export const PROJECT_DOT_COLORS = [
  '#9C8600', // olive    h100
  '#00A062', // green    h158
  '#00A19A', // teal     h190
  '#0099C4', // sky      h220
  '#3689DD', // blue     h252
  '#8374DA', // violet   h288
  '#AB65C0', // magenta  h318
  '#C55B96', // rose     h348
  '#7D8792', // slate    low chroma
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

// Pale tint + readable same-hue text, per theme. Aligned index-for-index with
// PROJECT_DOT_COLORS above and with the .pc-N rules in index.css.
//
// Prefer the CSS classes: put `pc-${projectColorIndex(id)}` on the element and
// read var(--pj-bg) / var(--pj-text). That is what makes the dark variant
// switch with the theme. These exports exist for the rare case where a value
// has to be computed in JS (canvas, an export, an emailed summary) and there
// is no cascade to lean on.
export const PROJECT_TINTS = [
  { bg: '#EFE9C5', text: '#554800' }, // olive
  { bg: '#CEF2DC', text: '#005732' }, // green
  { bg: '#C4F3EF', text: '#005854' }, // teal
  { bg: '#C5F0FE', text: '#00536C' }, // sky
  { bg: '#D1EBFF', text: '#17497B' }, // blue
  { bg: '#E6E4FF', text: '#463D7A' }, // violet
  { bg: '#F6DEFD', text: '#5E346A' }, // magenta
  { bg: '#FFDCED', text: '#6D2E51' }, // rose
  { bg: '#EBE7E1', text: '#4D4740' }, // slate
]

export const PROJECT_TINTS_DARK = [
  { bg: '#312C08', text: '#C7B967' }, // olive
  { bg: '#113321', text: '#7ACC9E' }, // green
  { bg: '#003331', text: '#59CDC6' }, // teal
  { bg: '#01313D', text: '#5FC7E6' }, // sky
  { bg: '#172D44', text: '#85BCF9' }, // blue
  { bg: '#2A2744', text: '#B4ADF7' }, // violet
  { bg: '#36233C', text: '#D4A2E3' }, // magenta
  { bg: '#3E2030', text: '#EA9CC3' }, // rose
  { bg: '#2F2A25', text: '#BBB7AF' }, // slate
]

// `dark` defaults to false so existing light-only callers keep working.
export function projectTint(id, dark = false) {
  const table = dark ? PROJECT_TINTS_DARK : PROJECT_TINTS
  return table[projectColorIndex(id)]
}

// Class name to hand to an element that should carry the project's tint via CSS
// custom properties. Pairs with the .pc-N rules in index.css.
export function projectTintClass(id) {
  return `pc-${projectColorIndex(id)}`
}

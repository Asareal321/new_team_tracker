/**
 * Stable per-project color assignment.
 *
 * A project is always "the teal one" — the slot is a hash of its id, so it never
 * shifts as projects are added or renamed. Nine slots; see `tokens.css` for the
 * values and the hue-reservation rule that keeps project colors out of the warm
 * quadrant reserved for state.
 */
export const PROJECT_SLOT_COUNT = 9

/** Slot index (0-8) for a project id. Stable across sessions and machines. */
export function projectSlot(id: string | number): number {
  const s = String(id)
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h % PROJECT_SLOT_COUNT
}

/**
 * Class name carrying a project's tint as CSS custom properties.
 * Always consume the colors through this class rather than an inline style —
 * that is what makes the dark variant follow the theme.
 */
export function projectSlotClass(id: string | number): string {
  return `bb-pc-${projectSlot(id)}`
}

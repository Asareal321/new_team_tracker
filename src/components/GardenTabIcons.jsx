// The garden's five rooms, as glyphs.
//
// Drawn to the same rules as NavIcons: one 24-box, 2px strokes, round caps,
// currentColor throughout — so a tab's icon takes the tab's colour, including
// when it is the selected one, and nothing has to be re-drawn per theme.
//
// Deliberately object-like rather than abstract. These sit where words were,
// and a shape you can name ("that's a watering can") is recallable in a way
// that a generic circle is not.

const S = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

export function IconGreenhouse() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {/* A glasshouse: pitched roof, and the panes that make it glass. */}
      <path d="M4 20V10l8-6 8 6v10z" {...S} />
      <path d="M12 4v16M4 12h16" {...S} strokeWidth="1.4" />
    </svg>
  )
}

export function IconBeds() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {/* Four beds seen from above — the plot grid itself. */}
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.8" {...S} />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.8" {...S} />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.8" {...S} />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.8" {...S} />
    </svg>
  )
}

export function IconHerbarium() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {/* A pressed specimen in a book: spine, and a stem with two leaves. */}
      <path d="M5 4h14v16H5z" {...S} />
      <path d="M9 4v16" {...S} strokeWidth="1.4" />
      <path d="M14.5 17V9" {...S} strokeWidth="1.6" />
      <path d="M14.5 12c0-1.7 1.2-3 2.8-3 0 1.7-1.2 3-2.8 3z" {...S} strokeWidth="1.4" />
      <path d="M14.5 14.5c0-1.7-1.2-3-2.8-3 0 1.7 1.2 3 2.8 3z" {...S} strokeWidth="1.4" />
    </svg>
  )
}

export function IconAwards() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {/* A rosette on ribbons. */}
      <circle cx="12" cy="9" r="5.2" {...S} />
      <path d="M8.6 13.6 7 21l5-2.6L17 21l-1.6-7.4" {...S} />
    </svg>
  )
}

export function IconShop() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      {/* A seed packet with its torn top. */}
      <path d="M5.5 7h13v13.5h-13z" {...S} />
      <path d="M5.5 7 8 3.5l2.4 2 2.4-2 2.4 2L18.5 7" {...S} />
      <circle cx="12" cy="14" r="2.4" {...S} strokeWidth="1.6" />
    </svg>
  )
}

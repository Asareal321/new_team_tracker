// The navigation icons, drawn from the set you picked.
//
// SVG rather than image files, for the same reason Trak is: there's no asset
// pipeline here, and a stroked path takes `currentColor` — so one icon works
// on the rail's dark wood, on the light bottom bar, in either theme, and at
// whatever size the bar happens to be. A PNG would need four copies.
//
// One grid (24×24), one weight (1.8), round caps and joins throughout, so the
// set reads as a set.

const S = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
}

function Icon({ children, label }) {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" role="img" aria-label={label} focusable="false">
      <g {...S}>{children}</g>
    </svg>
  )
}

// Taskboard — a clipboard with its list.
export function IconBoard() {
  return (
    <Icon label="Taskboard">
      {/* The board's top edge breaks either side of the clip. */}
      <path d="M8.7 4.4 H4.5 V20.6 H19.5 V4.4 H15.3" />
      {/* The clip: a pill with a bump, and the rivet in it. */}
      <path d="M9.2 6.2 a1.8 1.8 0 0 1 0-3.6 a2.9 2.9 0 0 1 5.6 0 a1.8 1.8 0 0 1 0 3.6 Z" />
      <circle cx="12" cy="3.3" r="0.75" />
      {/* Four bulleted lines. */}
      <circle cx="7.7" cy="9.6" r="0.85" fill="currentColor" stroke="none" />
      <path d="M10 9.6 h6.6" />
      <circle cx="7.7" cy="12.6" r="0.85" fill="currentColor" stroke="none" />
      <path d="M10 12.6 h6.6" />
      <circle cx="7.7" cy="15.6" r="0.85" fill="currentColor" stroke="none" />
      <path d="M10 15.6 h6.6" />
      <circle cx="7.7" cy="18.1" r="0.85" fill="currentColor" stroke="none" />
      <path d="M10 18.1 h6.6" />
    </Icon>
  )
}

// Deadlines — a clock, with something the matter.
export function IconDeadlines() {
  return (
    <Icon label="Deadlines">
      {/* The badge sits over the clock's lower right, so the clock is masked
          where it lands rather than the two outlines crossing. */}
      <mask id="ni-deadline-cut">
        <rect x="0" y="0" width="24" height="24" fill="#fff" />
        <circle cx="16.8" cy="16.8" r="6.4" fill="#000" />
      </mask>
      <g mask="url(#ni-deadline-cut)">
        <circle cx="10" cy="10" r="7.4" />
      </g>
      {/* One bent stroke: down from twelve, then out to the left. */}
      <path d="M10 5.2 V10 H6.3" />
      <circle cx="16.8" cy="16.8" r="5" />
      <path d="M16.8 14.4 v2.6" />
      <circle cx="16.8" cy="19.3" r="0.6" fill="currentColor" stroke="none" />
    </Icon>
  )
}

// Community — people over a pair of leaves.
export function IconCommunity() {
  return (
    <Icon label="Community">
      <circle cx="12" cy="4.9" r="2.3" />
      <circle cx="5.8" cy="7.2" r="1.9" />
      <circle cx="18.2" cy="7.2" r="1.9" />
      <path d="M8.4 12 a3.8 3.8 0 0 1 7.2 0" />
      <path d="M3.1 12.6 a2.9 2.9 0 0 1 5.1-1.5" />
      <path d="M20.9 12.6 a2.9 2.9 0 0 0-5.1-1.5" />
      {/* The two leaves the set uses for anything that grows. */}
      <path d="M12 20.6 A7.4 7.4 0 0 1 3.4 14 A7.4 7.4 0 0 1 12 20.6 Z" />
      <path d="M12 20.6 A7.4 7.4 0 0 0 20.6 14 A7.4 7.4 0 0 0 12 20.6 Z" />
      <path d="M13.6 19.6 a5.6 5.6 0 0 1 3.9-2.9" />
    </Icon>
  )
}

// Garden — a row of seedlings under the sun.
export function IconGarden() {
  return (
    <Icon label="Garden">
      <circle cx="12" cy="5.2" r="2.5" />
      <path d="M12 0.8 v1.3 M12 8.3 v1.3 M7.6 5.2 H6.3 M17.7 5.2 h1.3 M8.9 2.1 l-0.9-0.9 M15.1 8.3 l0.9 0.9 M15.1 2.1 l0.9-0.9 M8.9 8.3 l-0.9 0.9" />
      <path d="M2.6 21.4 h18.8" />
      {/* Each plant is a stem with two leaves, the middle one taller. */}
      <path d="M12 21.4 v-6.5" />
      <path d="M12 15.6 A3.4 3.4 0 0 1 8.8 11.6 A3.4 3.4 0 0 1 12 15.6 Z" />
      <path d="M12 15.6 A3.4 3.4 0 0 0 15.2 11.6 A3.4 3.4 0 0 0 12 15.6 Z" />
      <path d="M5.6 21.4 v-4.9" />
      <path d="M5.6 17.2 A2.8 2.8 0 0 1 2.9 14 A2.8 2.8 0 0 1 5.6 17.2 Z" />
      <path d="M5.6 17.2 A2.8 2.8 0 0 0 8.3 14 A2.8 2.8 0 0 0 5.6 17.2 Z" />
      <path d="M18.4 21.4 v-4.9" />
      <path d="M18.4 17.2 A2.8 2.8 0 0 1 15.7 14 A2.8 2.8 0 0 1 18.4 17.2 Z" />
      <path d="M18.4 17.2 A2.8 2.8 0 0 0 21.1 14 A2.8 2.8 0 0 0 18.4 17.2 Z" />
    </Icon>
  )
}

// Account — one person, in a ring.
export function IconAccount() {
  return (
    <Icon label="Account">
      <circle cx="12" cy="12" r="9.4" />
      <circle cx="12" cy="9.4" r="2.9" />
      <path d="M6.6 17.6 a6.2 6.2 0 0 1 10.8 0 a6.2 6.2 0 0 1-10.8 0 Z" />
    </Icon>
  )
}

// Dashboard — not in the set you sent, drawn to match it: the same grid,
// weight and caps, so it doesn't read as borrowed from somewhere else.
export function IconDashboard() {
  return (
    <Icon label="Dashboard">
      <rect x="2.6" y="3.4" width="18.8" height="17.2" rx="2" />
      <path d="M7 16.4 v-3.6 M12 16.4 v-7.4 M17 16.4 v-5.4" />
    </Icon>
  )
}

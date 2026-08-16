import './Trak.css'

// Trak — the rabbit who shows you around.
//
// Drawn rather than imported: the app has no asset pipeline, and a character
// who has to change expression eight times during onboarding is easier to keep
// consistent as markup than as eight PNGs.
//
// His colours are literals, not tokens. He's a character, not chrome — a
// rabbit whose fur changes with the theme reads as a bug. Everything he sits
// on is themed, so he only has to hold up on a light card and a dark one, and
// his outline is dark enough for both.

const FUR = '#F6F1E7'
const FUR_SHADE = '#E2D8C6'
const LINE = '#2A2118'
const EAR = '#F0B3AC'
const NOSE = '#D4726A'
const LEAF = '#6FA83F'
const LEAF_DARK = '#4E7C2A'

// Eyes carry the whole performance, so each mood is just a pair of shapes.
const EYES = {
  idle:  { left: 'dot',  right: 'dot',  brow: 0 },
  happy: { left: 'arc',  right: 'arc',  brow: 0 },
  point: { left: 'dot',  right: 'dot',  brow: -2 },
  think: { left: 'look', right: 'look', brow: -3 },
  wink:  { left: 'arc',  right: 'dot',  brow: 0 },
}

function Eye({ kind, x }) {
  if (kind === 'arc') {
    return <path d={`M ${x - 5} 40 q 5 -6 10 0`} stroke={LINE} strokeWidth="2.6" fill="none" strokeLinecap="round" />
  }
  if (kind === 'look') {
    return (
      <g>
        <circle cx={x} cy="39" r="4.2" fill={LINE} />
        <circle cx={x + 1.2} cy="37.4" r="1.4" fill="#fff" />
      </g>
    )
  }
  return (
    <g>
      <circle cx={x} cy="40" r="4.2" fill={LINE} />
      <circle cx={x + 1.3} cy="38.6" r="1.5" fill="#fff" />
    </g>
  )
}

export default function Trak({ mood = 'idle', size = 96, className = '' }) {
  const eyes = EYES[mood] || EYES.idle
  const pointing = mood === 'point'

  return (
    <svg
      className={`trak trak-${mood} ${className}`}
      width={size}
      height={size}
      viewBox="0 0 100 100"
      role="img"
      aria-label="Trak, the garden rabbit"
    >
      {/* ears — the near one tips when he's making a point */}
      <g className="trak-ears" style={{ transformOrigin: '50px 46px' }}>
        <g transform="rotate(-8 42 46)">
          <rect x="34" y="6" width="14" height="34" rx="7" fill={FUR} stroke={LINE} strokeWidth="2.4" />
          <rect x="38" y="11" width="6" height="24" rx="3" fill={EAR} />
        </g>
        <g transform={`rotate(${pointing ? 22 : 10} 58 46)`}>
          <rect x="52" y="6" width="14" height="34" rx="7" fill={FUR} stroke={LINE} strokeWidth="2.4" />
          <rect x="56" y="11" width="6" height="24" rx="3" fill={EAR} />
        </g>
      </g>

      {/* body */}
      <path
        d="M 28 92 q 0 -22 22 -22 q 22 0 22 22 z"
        fill={FUR} stroke={LINE} strokeWidth="2.4" strokeLinejoin="round"
      />
      <path d="M 40 92 q 10 -8 20 0 z" fill={FUR_SHADE} />

      {/* the sprout he carries — the thing all of this is about */}
      <g transform={pointing ? 'translate(0 -6) rotate(-10 74 78)' : ''}>
        <rect x="70" y="74" width="14" height="14" rx="3" fill={LEAF_DARK} stroke={LINE} strokeWidth="2" />
        <path d="M 77 74 v -9" stroke={LEAF_DARK} strokeWidth="2.4" strokeLinecap="round" />
        <ellipse cx="72.5" cy="65" rx="5" ry="3.2" fill={LEAF} stroke={LINE} strokeWidth="1.6" transform="rotate(-24 72.5 65)" />
        <ellipse cx="81.5" cy="67" rx="5" ry="3.2" fill={LEAF} stroke={LINE} strokeWidth="1.6" transform="rotate(24 81.5 67)" />
      </g>

      {/* head */}
      <circle cx="50" cy="44" r="24" fill={FUR} stroke={LINE} strokeWidth="2.4" />

      <g transform={`translate(0 ${eyes.brow})`}>
        <Eye kind={eyes.left} x={41} />
        <Eye kind={eyes.right} x={59} />
      </g>

      {/* nose and mouth */}
      <path d="M 47 50 h 6 l -3 3.4 z" fill={NOSE} stroke={LINE} strokeWidth="1.4" strokeLinejoin="round" />
      {mood === 'think' ? (
        <path d="M 45 58 h 10" stroke={LINE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      ) : (
        <path d="M 50 54 q -4 5 -8 2 M 50 54 q 4 5 8 2" stroke={LINE} strokeWidth="2.2" fill="none" strokeLinecap="round" />
      )}

      {/* whiskers */}
      <g stroke={LINE} strokeWidth="1.5" strokeLinecap="round" opacity="0.55">
        <path d="M 34 50 h -9 M 34 54 l -8 3" />
        <path d="M 66 50 h 9 M 66 54 l 8 3" />
      </g>

      {/* the raised paw only exists when he's pointing at something */}
      {pointing && (
        <ellipse cx="27" cy="66" rx="7" ry="5.5" fill={FUR} stroke={LINE} strokeWidth="2.2" transform="rotate(-30 27 66)" />
      )}
    </svg>
  )
}

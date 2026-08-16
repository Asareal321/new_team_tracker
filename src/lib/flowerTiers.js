// Shared surface for the garden's two cinematics — the pack opening and the
// fully-grown payoff. Both come from the same design project, so they share its
// Beech & Baize material palette, its type stack, and its tier colours; keeping
// one copy is what stops them drifting apart.

import { RARITY_COLORS } from './garden.js'

export const CO = {
  ground: '#64B468', wood: '#89582C', woodEdge: '#653C1F', woodInk: '#FEFCF7',
  surface: '#FEFCF7', sunk: '#EDE7DC', ink: '#18110C', muted: '#6A6258',
  border: '#D9D0C1', accent: '#90D94F', accentBorder: '#63B739',
  accentEdge: '#3E8637', accentInk: '#0C511A', accentTint: '#D3EEB4',
  due: '#DC8818', dueInk: '#894C06', dueTint: '#FBE9CA',
  soil: '#6E451E', soilEdge: '#371E0D',
  lime: '#C3F73A', brandInk: '#071013',
}

export const FONT_TOY = 'Fredoka, "Baloo 2", "Trebuchet MS", sans-serif'
export const FONT_UI = 'Inter, -apple-system, "Segoe UI", sans-serif'
export const FONT_NUM = 'Sono, "DM Mono", ui-monospace, Menlo, monospace'

export const edge = (px, color) => `0 ${px}px 0 ${color}`

// Promoted to its own compositor layer and told exactly what will change, so
// the browser doesn't re-rasterise it every frame.
export const LAYER = { willChange: 'transform, opacity', backfaceVisibility: 'hidden' }

// The designs name three tiers; the garden has five. Common / Rare / Legendary
// are the design's palettes verbatim. Uncommon and Epic are built to the same
// shape from the rarity colour the rest of the app already uses for them, so
// every rarity gets its own flower rather than sharing a neighbour's.
function shade(hex, amount) {
  const n = parseInt(hex.slice(1), 16)
  const mix = c => Math.round(amount < 0 ? c * (1 + amount) : c + (255 - c) * amount)
  return `#${[(n >> 16) & 255, (n >> 8) & 255, n & 255].map(c => mix(c).toString(16).padStart(2, '0')).join('')}`
}

function derivedTier(rarity) {
  const base = RARITY_COLORS[rarity]
  return {
    petal: base, petalEdge: shade(base, -0.35), petalLight: shade(base, 0.45),
    core: '#E8C766', coreEdge: '#B2913A', flare: `${base}e0`,
    chipBg: shade(base, 0.72), chipInk: shade(base, -0.55),
  }
}

export const TIERS = {
  1: {
    petal: '#9CC6DE', petalEdge: '#5E93B0', petalLight: '#C8DFEC',
    core: '#E8C766', coreEdge: '#B2913A', flare: 'rgba(156,198,222,0.85)',
    chipBg: '#DCEAF2', chipInk: '#245A76',
  },
  2: derivedTier(2),
  3: {
    petal: '#E58AAE', petalEdge: '#B45B80', petalLight: '#F3C3D5',
    core: CO.due, coreEdge: CO.dueInk, flare: 'rgba(229,138,174,0.9)',
    chipBg: '#FBDCE7', chipInk: '#8E2B5A',
  },
  4: derivedTier(4),
  5: {
    petal: '#C79BE8', petalEdge: '#8E62B4', petalLight: '#E3CDF4',
    core: '#F0B93C', coreEdge: '#9B6C0C', flare: 'rgba(240,185,60,0.9)',
    chipBg: '#F6E4B8', chipInk: '#7A4E06',
  },
}

export const tierFor = rarity => TIERS[rarity] || TIERS[3]

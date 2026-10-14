// The mosaic on Today: every area as a block of one colour, every sphere in
// it a tile in a shade of that colour, each sized by how much you have logged
// there lately. Big means you have been working on it; small means you have
// not. It is also the picker — click a tile to log to that sphere.
//
// Pure. Checked by scripts/check-mosaic.mjs.

const DAY_MS = 24 * 60 * 60 * 1000

// How far back a tile's size looks. A week swings too hard (every Monday is
// a reset); all time never lets an old sphere shrink. A month shows where
// your effort is going now.
export const MOSAIC_DAYS = 30

// The smallest share a tile may have, as a fraction of the whole. A sphere you
// have not touched still has to be big enough to click — small enough that the
// neglect shows, never so small that it vanishes.
export const MIN_SHARE = 0.04

// One hue per area, in the order areas were made. Chosen to sit apart from
// each other and from the app's green accent.
export const AREA_HUES = [172, 252, 14, 38, 208, 330, 96, 282]

// Logs per sphere within the window.
export function recentCounts(logs = [], { now = new Date(), days = MOSAIC_DAYS } = {}) {
  const from = now.getTime() - days * DAY_MS
  const out = {}
  for (const l of logs) {
    const t = new Date(l.logged_at).getTime()
    if (t > from && t <= now.getTime()) out[l.sphere_id] = (out[l.sphere_id] || 0) + 1
  }
  return out
}

// Weights with a floor, so nothing rounds to nothing. With no logs anywhere,
// everything is the same size — there is nothing yet to say about balance.
export function floored(values, minShare = MIN_SHARE) {
  const total = values.reduce((a, b) => a + b, 0)
  if (total <= 0) return values.map(() => 1)
  const floor = total * minShare / Math.max(1 - minShare * values.length, minShare)
  return values.map(v => Math.max(v, floor))
}

// Lay weighted items into a rectangle. Splits the list into two runs of
// roughly equal weight and cuts across the longer side, recursively — tiles
// stay close to square, and items keep their order (busiest first).
// Rect and output are in percent of the container.
export function splitLayout(items, rect = { x: 0, y: 0, w: 100, h: 100 }, aspect = 1) {
  if (!items.length) return []
  if (items.length === 1) return [{ ...items[0], ...rect }]
  const total = items.reduce((a, i) => a + i.weight, 0)
  let acc = 0
  let cut = 1
  for (let k = 0; k < items.length - 1; k++) {
    acc += items[k].weight
    cut = k + 1
    if (acc >= total / 2) break
  }
  const a = items.slice(0, cut)
  const b = items.slice(cut)
  const share = a.reduce((s, i) => s + i.weight, 0) / total
  // `aspect` is the container's width / height in pixels, so "longer side"
  // means longer on screen, not longer in percent.
  const wide = rect.w * aspect >= rect.h
  if (wide) {
    const w1 = rect.w * share
    return [
      ...splitLayout(a, { x: rect.x, y: rect.y, w: w1, h: rect.h }, aspect),
      ...splitLayout(b, { x: rect.x + w1, y: rect.y, w: rect.w - w1, h: rect.h }, aspect),
    ]
  }
  const h1 = rect.h * share
  return [
    ...splitLayout(a, { x: rect.x, y: rect.y, w: rect.w, h: h1 }, aspect),
    ...splitLayout(b, { x: rect.x, y: rect.y + h1, w: rect.w, h: rect.h - h1 }, aspect),
  ]
}

// A shade of an area's hue: the first (busiest) sphere darkest, the rest
// stepping lighter. Text flips to dark ink once the tile is light enough.
export function shade(hue, index, count) {
  const steps = Math.max(count - 1, 1)
  const light = count === 1 ? 40 : 30 + (index / steps) * 40
  return {
    bg: `hsl(${hue} 42% ${Math.round(light)}%)`,
    ink: light < 52 ? '#fff' : `hsl(${hue} 45% 14%)`,
  }
}

// The whole overview: areas (personal only — shared spheres are picked from a
// list) laid out by their total weight, spheres laid out inside each area.
export function mosaicTiles({ areas = [], spheres = [], logs = [], now = new Date(), aspect = 2 } = {}) {
  const counts = recentCounts(logs, { now })
  const live = spheres.filter(s => !s.archived_at && !s.team_id)
  const groups = areas
    .map((a, n) => ({
      area: a,
      hue: AREA_HUES[n % AREA_HUES.length],
      spheres: live.filter(s => s.area_id === a.id)
        .map(s => ({ sphere: s, count: counts[s.id] || 0 }))
        .sort((x, y) => y.count - x.count),
    }))
    .filter(g => g.spheres.length)

  const all = groups.flatMap(g => g.spheres)
  const weights = floored(all.map(s => s.count))
  all.forEach((s, i) => { s.weight = weights[i] })

  const areaItems = groups
    .map(g => ({ ...g, weight: g.spheres.reduce((t, s) => t + s.weight, 0) }))
    .sort((x, y) => y.weight - x.weight)

  return splitLayout(areaItems, undefined, aspect).flatMap(g => {
    const inner = splitLayout(g.spheres, { x: g.x, y: g.y, w: g.w, h: g.h }, aspect)
    return inner.map((t, i) => ({
      id: t.sphere.id,
      sphere: t.sphere,
      area: g.area,
      hue: g.hue,
      count: t.count,
      x: t.x, y: t.y, w: t.w, h: t.h,
      ...shade(g.hue, i, inner.length),
    }))
  })
}

// Zoomed in on one sphere: its open goals, plus "no goal", sized the same way
// by their own recent logs.
export function goalTiles({ sphere, goals = [], logs = [], hue = AREA_HUES[0], now = new Date(), aspect = 2 } = {}) {
  if (!sphere) return []
  const from = now.getTime() - MOSAIC_DAYS * DAY_MS
  const recent = logs.filter(l => l.sphere_id === sphere.id && new Date(l.logged_at).getTime() > from)
  const open = goals.filter(g => g.sphere_id === sphere.id && g.status === 'active')
  const items = [
    ...open.map(g => ({ id: g.id, goal: g, count: recent.filter(l => l.goal_id === g.id).length })),
    { id: null, goal: null, count: recent.filter(l => !l.goal_id).length },
  ]
  const weights = floored(items.map(i => i.count), 0.12)
  items.forEach((it, i) => { it.weight = weights[i] })
  return splitLayout(items, undefined, aspect).map((t, i, arr) => ({
    ...t, ...shade(hue, t.goal ? i : arr.length - 1, arr.length),
  }))
}

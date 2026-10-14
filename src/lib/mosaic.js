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

// ── angular layout ──────────────────────────────────────────────────────────
//
// The rectangles above are cut again into triangles and wedges: a convex shape
// is split by a straight line from one of its corners to the opposite side, at
// exactly the point that gives each half its share of the weight. So area is
// still honest — a tile twice the size had twice the logs — but the seams run
// on the diagonal. Of the corners it could cut from, it takes the one that
// leaves both halves least sliver-like.

export function polyArea(pts) {
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    a += x1 * y2 - x2 * y1
  }
  return Math.abs(a) / 2
}

function perimeter(pts) {
  let p = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    p += Math.hypot(x2 - x1, y2 - y1)
  }
  return p
}

// 1 for the most compact shape, falling toward 0 for a sliver.
const compactness = pts => (4 * Math.PI * polyArea(pts)) / (perimeter(pts) ** 2 || 1)

// Cut a convex polygon from vertex `k` so the first piece has `share` of it.
function cutFrom(pts, k, share) {
  const n = pts.length
  const v = i => pts[(k + i) % n]
  const total = polyArea(pts)
  const want = total * share
  let acc = 0
  for (let i = 1; i < n - 1; i++) {
    const tri = polyArea([v(0), v(i), v(i + 1)])
    if (acc + tri >= want - 1e-9) {
      const t = tri ? (want - acc) / tri : 0
      const [x1, y1] = v(i)
      const [x2, y2] = v(i + 1)
      const p = [x1 + (x2 - x1) * t, y1 + (y2 - y1) * t]
      const first = [v(0)]
      for (let j = 1; j <= i; j++) first.push(v(j))
      first.push(p)
      const second = [v(0), p]
      for (let j = i + 1; j < n; j++) second.push(v(j))
      const clean = poly => poly.filter((q, j, arr) => {
        const r = arr[(j + 1) % arr.length]
        return Math.hypot(q[0] - r[0], q[1] - r[1]) > 1e-6
      })
      return [clean(first), clean(second)]
    }
    acc += tri
  }
  return [pts, []]
}

export function polyLayout(items, pts) {
  if (!items.length) return []
  if (items.length === 1) return [{ ...items[0], points: pts }]
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
  let best = null
  for (let k = 0; k < pts.length; k++) {
    const [p1, p2] = cutFrom(pts, k, share)
    if (p1.length < 3 || p2.length < 3) continue
    const score = Math.min(compactness(p1), compactness(p2))
    if (!best || score > best.score) best = { score, p1, p2 }
  }
  if (!best) return [{ ...items[0], points: pts }]
  return [...polyLayout(a, best.p1), ...polyLayout(b, best.p2)]
}

export function centroid(pts) {
  let cx = 0
  let cy = 0
  let a = 0
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1] = pts[i]
    const [x2, y2] = pts[(i + 1) % pts.length]
    const f = x1 * y2 - x2 * y1
    cx += (x1 + x2) * f
    cy += (y1 + y2) * f
    a += f
  }
  if (!a) return pts[0] || [0, 0]
  return [cx / (3 * a), cy / (3 * a)]
}

// Where a label fits: the centre and radius of (roughly) the largest circle
// inside the shape. A thin wedge's centroid sits near its narrow end, where
// no text fits; this point sits where the shape is widest. Coarse grid, then
// refine around the best — plenty for a handful of convex tiles.
export function labelSpot(pts) {
  const edges = pts.map((p, i) => [p, pts[(i + 1) % pts.length]])
  // Signed distance to the nearest edge. Works for either winding: the
  // sign is fixed so the centroid (always inside a convex shape) is positive.
  const raw = (x, y) => {
    let min = Infinity
    for (const [[x1, y1], [x2, y2]] of edges) {
      const len = Math.hypot(x2 - x1, y2 - y1) || 1
      min = Math.min(min, ((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) / len)
    }
    return min
  }
  const [cx0, cy0] = centroid(pts)
  const sign = raw(cx0, cy0) < 0 ? -1 : 1
  const dist = (x, y) => {
    let min = Infinity
    for (const [[x1, y1], [x2, y2]] of edges) {
      const len = Math.hypot(x2 - x1, y2 - y1) || 1
      min = Math.min(min, sign * ((x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)) / len)
    }
    return min
  }
  const xs = pts.map(p => p[0])
  const ys = pts.map(p => p[1])
  let best = [cx0, cy0, dist(cx0, cy0)]
  let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
  for (let round = 0; round < 4; round++) {
    const n = 14
    for (let i = 0; i <= n; i++) {
      for (let j = 0; j <= n; j++) {
        const x = x0 + ((x1 - x0) * i) / n
        const y = y0 + ((y1 - y0) * j) / n
        const d = dist(x, y)
        if (d > best[2]) best = [x, y, d]
      }
    }
    const wx = (x1 - x0) / 4
    const wy = (y1 - y0) / 4
    x0 = best[0] - wx; x1 = best[0] + wx; y0 = best[1] - wy; y1 = best[1] + wy
  }
  return { x: best[0], y: best[1], r: Math.max(best[2], 0) }
}

// Lay out in real proportions (width = aspect × height), then hand back
// points in percent of the box, plus what a label needs.
function finish(tile, W) {
  const pts = tile.points.map(([x, y]) => [(x / W) * 100, y])
  const spot = labelSpot(tile.points)
  const cx = (spot.x / W) * 100
  const cy = spot.y
  const xs = pts.map(p => p[0])
  const ys = pts.map(p => p[1])
  const x = Math.min(...xs)
  const y = Math.min(...ys)
  return {
    ...tile, points: pts, cx, cy,
    x, y, w: Math.max(...xs) - x, h: Math.max(...ys) - y,
    size: polyArea(pts),
    // Room for a label: radius of the largest circle inside, as a fraction
    // of the box's height (multiply by the height in pixels to get pixels).
    r: spot.r / 100,
  }
}

const box = W => [[0, 0], [W, 0], [W, 100], [0, 100]]

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

  const W = aspect * 100
  return polyLayout(areaItems, box(W)).flatMap(g => {
    const inner = polyLayout(g.spheres, g.points)
    return inner.map((t, i) => finish({
      id: t.sphere.id,
      sphere: t.sphere,
      area: g.area,
      hue: g.hue,
      count: t.count,
      points: t.points,
      ...shade(g.hue, i, inner.length),
    }, W))
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
  const W = aspect * 100
  return polyLayout(items, box(W)).map((t, i, arr) => finish({
    ...t, ...shade(hue, t.goal ? i : arr.length - 1, arr.length),
  }, W))
}

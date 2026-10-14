// The mosaic on Today: sizes, floors and layout.
import { recentCounts, floored, splitLayout, mosaicTiles, goalTiles, shade, MIN_SHARE, polyLayout, polyArea, labelSpot } from '../src/lib/mosaic.js'

let pass = 0, fail = 0
function ok(name, cond, detail = '') {
  if (cond) { pass++; console.log(`ok    ${name}`) }
  else { fail++; console.log(`FAIL  ${name}${detail ? `  — ${detail}` : ''}`) }
}

const NOW = new Date('2026-10-14T12:00:00Z')
const ago = d => new Date(NOW.getTime() - d * 86400000).toISOString()
const log = (s, d, g = null) => ({ sphere_id: s, goal_id: g, logged_at: ago(d) })

const c = recentCounts([log('a', 1), log('a', 29), log('a', 31), log('b', 2), log('b', -1)], { now: NOW })
ok('counts the last 30 days', c.a === 2)
ok('ignores the future', c.b === 1)

const f = floored([10, 0, 0])
const total = f.reduce((a, b) => a + b, 0)
ok('an untouched sphere still gets a minimum share', f[1] / total >= MIN_SHARE * 0.99, String(f[1] / total))
ok('and stays smaller than the busy one', f[1] < f[0])
ok('with nothing logged, everything is equal', floored([0, 0, 0]).every(v => v === 1))

const L = splitLayout([{ weight: 3 }, { weight: 1 }])
const area = t => t.w * t.h
ok('areas are proportional to weight', Math.abs(area(L[0]) / area(L[1]) - 3) < 0.01)
ok('tiles fill the box', Math.abs(L.reduce((a, t) => a + area(t), 0) - 10000) < 0.01)
const many = splitLayout(Array.from({ length: 9 }, () => ({ weight: 1 })), undefined, 1)
ok('tiles never overlap or leave the box', many.every(t => t.x >= -1e-9 && t.y >= -1e-9 && t.x + t.w <= 100 + 1e-9 && t.y + t.h <= 100 + 1e-9))

const areas = [{ id: 'A', name: 'Academics' }, { id: 'P', name: 'Personal' }, { id: 'E', name: 'Empty' }]
const spheres = [
  { id: 'econ', area_id: 'A' }, { id: 'bus', area_id: 'A' }, { id: 'gym', area_id: 'P' },
  { id: 'old', area_id: 'A', archived_at: ago(3) }, { id: 'team', team_id: 'T' },
]
const logs = [...Array(8)].map(() => log('econ', 2)).concat([log('bus', 3), log('gym', 40)])
const tiles = mosaicTiles({ areas, spheres, logs, now: NOW })
ok('one tile per live personal sphere', tiles.map(t => t.id).sort().join() === 'bus,econ,gym')
ok('shared and archived spheres are left out', !tiles.some(t => t.id === 'team' || t.id === 'old'))
const size = id => tiles.find(x => x.id === id).size
ok('more logs, bigger tile', size('econ') > size('bus') && size('bus') > size('gym'))
ok('a sphere is the colour of its area', tiles.find(t => t.id === 'econ').hue === tiles.find(t => t.id === 'bus').hue)
ok('different areas, different colours', tiles.find(t => t.id === 'econ').hue !== tiles.find(t => t.id === 'gym').hue)
ok('spheres in one area are different shades', tiles.find(t => t.id === 'econ').bg !== tiles.find(t => t.id === 'bus').bg)
ok('the mosaic covers the whole box', Math.abs(tiles.reduce((a, t) => a + t.size, 0) - 10000) < 0.01)

// — the angular cut —
const sq = [[0, 0], [200, 0], [200, 100], [0, 100]]
const pl = polyLayout([{ weight: 5 }, { weight: 2 }, { weight: 2 }, { weight: 1 }], sq)
ok('angular pieces keep area proportional to weight', pl.every(t => Math.abs(polyArea(t.points) / 20000 - t.weight / 10) < 1e-6))
ok('and cover the box exactly', Math.abs(pl.reduce((a, t) => a + polyArea(t.points), 0) - 20000) < 1e-6)
ok('and at least one is a triangle', pl.some(t => t.points.length === 3))
ok('every point stays inside the box', pl.every(t => t.points.every(([x, y]) => x > -1e-6 && x < 200 + 1e-6 && y > -1e-6 && y < 100 + 1e-6)))
ok('tiles carry a label position inside the box', tiles.every(t => t.cx >= 0 && t.cx <= 100 && t.cy >= 0 && t.cy <= 100))
ok('no spheres, no tiles', mosaicTiles({ areas, spheres: [] }).length === 0)

const goals = [{ id: 'g1', sphere_id: 'econ', status: 'active' }, { id: 'g2', sphere_id: 'econ', status: 'done' }]
const gt = goalTiles({ sphere: spheres[0], goals, logs: [log('econ', 1, 'g1'), log('econ', 1)], now: NOW })
ok('zoomed in: open goals plus "no goal"', gt.length === 2 && gt.some(t => t.goal === null) && gt.some(t => t.goal?.id === 'g1'))
ok('closed goals are not offered', !gt.some(t => t.goal?.id === 'g2'))
ok('a sphere with no goals still offers "no goal"', goalTiles({ sphere: spheres[1], goals, logs: [] }).length === 1)

ok('dark shades get white text', shade(170, 0, 3).ink === '#fff')
ok('light shades get dark text', shade(170, 2, 3).ink !== '#fff')

const wedge = [[0, 0], [100, 0], [0, 10]]
const ls = labelSpot(wedge)
ok('a wedge’s label sits where it is widest, not at its tip', ls.x < 40 && ls.r > 2, JSON.stringify(ls))
const sqs = labelSpot([[0, 0], [10, 0], [10, 10], [0, 10]])
ok('a square’s label sits in its middle', Math.abs(sqs.x - 5) < 0.3 && Math.abs(sqs.y - 5) < 0.3 && Math.abs(sqs.r - 5) < 0.3)
ok('either winding works', Math.abs(labelSpot([[0, 10], [10, 10], [10, 0], [0, 0]]).r - 5) < 0.3)

console.log(`\n${pass}/${pass + fail} passed`)
process.exit(fail ? 1 : 0)

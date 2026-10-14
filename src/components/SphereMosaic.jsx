import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpheres } from '../context/SpheresContext'
import { mosaicTiles, goalTiles, MOSAIC_DAYS } from '../lib/mosaic'

// The picker on Today, drawn as a map of where your effort has gone.
//
// Zoomed out: one block per area, one tile per sphere, sized by the last
// month of logs. Click a tile and it becomes the sphere you are logging to,
// and the mosaic zooms in on its goals — pick one, or "no goal". The trail
// above takes you back out. See lib/mosaic.js for the sizing.

export default function SphereMosaic({ sphereId, goalId, onPick }) {
  const { areas, spheres, goals, myLogs } = useSpheres()
  const box = useRef(null)
  const [aspect, setAspect] = useState(2)

  // Tiles split along the longer side as it is on screen, so the layout has
  // to know the box's real shape — a phone's is nearly square.
  useEffect(() => {
    const el = box.current
    if (!el || typeof ResizeObserver === 'undefined') return undefined
    const ro = new ResizeObserver(([e]) => {
      const { width, height } = e.contentRect
      if (width && height) setAspect(width / height)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const tiles = useMemo(
    () => mosaicTiles({ areas, spheres, logs: myLogs, aspect }),
    [areas, spheres, myLogs, aspect],
  )
  const zoomed = tiles.find(t => t.id === sphereId) || null
  const inner = useMemo(
    () => (zoomed ? goalTiles({ sphere: zoomed.sphere, goals, logs: myLogs, hue: zoomed.hue, aspect }) : []),
    [zoomed, goals, myLogs, aspect],
  )

  if (!tiles.length) return null

  const view = (zoomed ? inner : tiles).map(t => {
    const name = zoomed ? (t.goal ? t.goal.title : 'No goal') : t.sphere.name
    const plural = t.count === 1 ? '' : 's'
    return {
      ...t,
      key: t.id || 'none',
      name,
      meta: zoomed && !t.goal ? 'general progress' : `${t.count} log${plural}`,
      picked: zoomed ? (t.id || '') === (goalId || '') : false,
      pick: () => (zoomed ? onPick({ sphereId, goalId: t.id || '' }) : onPick({ sphereId: t.id, goalId: '' })),
    }
  })

  return (
    <div className="mo">
      <div className="mo-trail">
        {zoomed ? (
          <>
            <button type="button" className="mo-back" onClick={() => onPick({ sphereId: '', goalId: '' })}>All spheres</button>
            <span aria-hidden="true">/</span> <span>{zoomed.area.name}</span>
            <span aria-hidden="true">/</span> <strong>{zoomed.sphere.name}</strong>
            <Link className="mo-open" to={`/spheres/${zoomed.id}`}>Open its page</Link>
          </>
        ) : (
          <span>Pick a sphere · bigger tiles are where you’ve logged most in the last {MOSAIC_DAYS} days</span>
        )}
      </div>
      <div className="mo-box" ref={box} role="group" aria-label={zoomed ? `Goals in ${zoomed.sphere.name}` : 'Spheres'}>
        {/* Keyed by view, so switching replays the zoom animation. */}
        <div className={`mo-layer ${zoomed ? 'mo-in' : 'mo-out'}`} key={zoomed ? zoomed.id : 'all'}
          style={zoomed ? { transformOrigin: `${zoomed.x + zoomed.w / 2}% ${zoomed.y + zoomed.h / 2}%` } : undefined}>
          {/* Shapes in SVG so the seams can run on the diagonal; labels in
              HTML on top, so they wrap and stay crisp. */}
          <svg className="mo-svg" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="false">
            {view.map(t => (
              <polygon
                key={t.key}
                points={t.points.map(p => p.join(',')).join(' ')}
                className={`mo-poly${t.picked ? ' picked' : ''}`}
                style={{ fill: t.bg, '--ink': t.ink }}
                vectorEffect="non-scaling-stroke"
                role="button"
                tabIndex={0}
                aria-label={`${t.name} — ${t.meta}`}
                aria-pressed={zoomed ? t.picked : undefined}
                onClick={t.pick}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); t.pick() } }}
              >
                <title>{`${t.name} — ${t.meta}`}</title>
              </polygon>
            ))}
          </svg>
          {view.map(t => t.room >= 11 && (
            <span key={`l-${t.key}`} className={`mo-label${t.room < 22 ? ' small' : ''}`}
              style={{ left: `${t.cx}%`, top: `${t.cy}%`, color: t.ink, maxWidth: `${(t.room / (aspect * 100)) * 100 * 1.1}%` }}>
              <span className="mo-name">{t.name}</span>
              <span className="mo-meta">{t.meta}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

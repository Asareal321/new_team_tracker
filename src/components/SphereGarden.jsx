import { seedByKey } from '../lib/garden'

// A sphere's garden: one plant per logged piece of progress.
//
// Its size is the point. Nothing here is decorative scaling — a sphere with
// forty logs has forty plants and a sphere with three has three, so lining the
// gardens up side by side is an honest picture of where the time has gone.
// Plants are drawn oldest first, so a garden fills from the top-left the way
// a bed is planted, and nothing ever comes out of it.
//
// `limit` is for the small versions on the Today page: past it the bed stops
// drawing and says how many more there are, rather than shrinking every plant
// until a busy garden and a quiet one look the same size.

export default function SphereGarden({ logs = [], limit = null, size = 'md', label }) {
  const planted = [...logs].reverse()
  const shown = limit ? planted.slice(0, limit) : planted
  const more = planted.length - shown.length

  return (
    <div className={`sg-bed sg-${size}${planted.length ? '' : ' sg-empty'}`} role="img"
      aria-label={label || `${planted.length} plant${planted.length === 1 ? '' : 's'}`}>
      {planted.length === 0 ? (
        <span className="sg-bare">Nothing planted yet</span>
      ) : (
        <>
          {shown.map(l => (
            <span key={l.id} className="sg-plant" title={l.note}>
              {seedByKey(l.seed_key)?.emoji || '🌱'}
            </span>
          ))}
          {more > 0 && <span className="sg-more">+{more}</span>}
        </>
      )}
    </div>
  )
}

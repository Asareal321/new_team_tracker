import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useSpheres } from '../context/SpheresContext'
import { daysLeft, daysSince } from '../lib/spheres'
import { seedByKey } from '../lib/garden'
import { projectColorIndex } from '../lib/projectColors'
import LogBox from '../components/LogBox'
import GoalForm from '../components/GoalForm'
import SphereGarden from '../components/SphereGarden'
import './Spheres.css'

// One sphere: its garden, its goals, and everything logged there.
//
// Goals show tallies, not progress bars. "9 logs, 3 this week" is a fact about
// effort; "40% complete" would be a guess dressed as one, and it would turn a
// goal you are steadily working at into one you are failing at.

function when(goal, now) {
  const d = daysLeft(goal, now)
  if (d == null) return ''
  if (d < 0) return `ended ${-d} day${d === -1 ? '' : 's'} ago`
  if (d === 0) return 'ends today'
  if (d === 1) return 'ends tomorrow'
  return `${d} days left`
}

export default function SpherePage() {
  const { sphereId } = useParams()
  const { spheres, areas, goals, logs, counts, setGoalStatus, deleteLog, loading } = useSpheres()
  const [adding, setAdding] = useState(false)
  const [showClosed, setShowClosed] = useState(false)
  const now = new Date()

  if (loading) return <div className="loading">Loading…</div>
  const sphere = spheres.find(s => s.id === sphereId)
  if (!sphere) {
    return (
      <div className="sph-page">
        <p className="sph-sub">That sphere isn’t here — it may have been deleted. <Link to="/">Back to Today</Link></p>
      </div>
    )
  }

  const area = areas.find(a => a.id === sphere.area_id)
  const mine = logs.filter(l => l.sphere_id === sphere.id)
  const c = counts.bySphere[sphere.id] || { week: 0, total: 0, last: null }
  const since = daysSince(c.last, now)
  const sphereGoals = goals.filter(g => g.sphere_id === sphere.id)
  const open = sphereGoals.filter(g => g.status === 'active')
  const closed = sphereGoals.filter(g => g.status !== 'active')
  const goalById = Object.fromEntries(sphereGoals.map(g => [g.id, g]))

  return (
    <div className={`sph-page pc-${projectColorIndex(sphere.id)}`}>
      <header className="sph-head">
        <p className="sph-crumb">{area ? area.name : 'Shared'}</p>
        <h1>{sphere.name}</h1>
        <p className="sph-sub">
          <strong>{c.week}</strong> this week · {c.total} logged in all
          {since != null && since > 0 && ` · last ${since === 1 ? 'yesterday' : `${since} days ago`}`}
        </p>
      </header>

      <section className="sph-card">
        <LogBox sphereId={sphere.id} key={sphere.id} />
      </section>

      <section className="sph-section">
        <h2>Garden</h2>
        <SphereGarden logs={mine} size="lg"
          label={`${sphere.name}'s garden: ${mine.length} plant${mine.length === 1 ? '' : 's'}`} />
      </section>

      <section className="sph-section">
        <div className="sph-section-head">
          <h2>Goals</h2>
          {!adding && <button className="btn-ghost btn-sm" onClick={() => setAdding(true)}>+ Goal</button>}
        </div>
        {adding && <div className="sph-card"><GoalForm sphereId={sphere.id} onDone={() => setAdding(false)} /></div>}
        {!open.length && !adding && <p className="sph-empty">No open goals. A goal is optional — logging here still grows the garden.</p>}
        <ul className="sph-goals">
          {open.map(g => {
            const t = counts.byGoal[g.id] || { week: 0, total: 0 }
            const late = daysLeft(g, now) < 0
            return (
              <li key={g.id} className={`sph-goal${late ? ' late' : ''}`}>
                <div className="sph-goal-main">
                  <span className="sph-goal-title">{g.title}</span>
                  <span className="sph-goal-meta">
                    {t.total} logged{t.week ? `, ${t.week} this week` : ''} · {when(g, now)}
                  </span>
                </div>
                <div className="sph-goal-actions">
                  <button className="btn-ghost btn-sm" onClick={() => setGoalStatus(g.id, 'done')}>Reached it</button>
                  <button className="btn-ghost btn-sm sph-quiet" onClick={() => setGoalStatus(g.id, 'dropped')}>Drop</button>
                </div>
              </li>
            )
          })}
        </ul>
        {closed.length > 0 && (
          <>
            <button className="sph-toggle" onClick={() => setShowClosed(v => !v)}>
              {showClosed ? 'Hide' : 'Show'} {closed.length} closed goal{closed.length === 1 ? '' : 's'}
            </button>
            {showClosed && (
              <ul className="sph-goals sph-goals-closed">
                {closed.map(g => (
                  <li key={g.id} className="sph-goal">
                    <div className="sph-goal-main">
                      <span className="sph-goal-title">{g.title}</span>
                      <span className="sph-goal-meta">
                        {g.status === 'done' ? 'Reached' : 'Dropped'} · {(counts.byGoal[g.id]?.total) || 0} logged
                      </span>
                    </div>
                    <button className="btn-ghost btn-sm" onClick={() => setGoalStatus(g.id, 'active')}>Reopen</button>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </section>

      <section className="sph-section">
        <h2>Everything logged here</h2>
        {!mine.length && <p className="sph-empty">Nothing yet. The first log plants the first seed.</p>}
        <ul className="sph-logs">
          {mine.map(l => (
            <li key={l.id} className="sph-log">
              <span className="sph-log-plant" aria-hidden="true">{seedByKey(l.seed_key)?.emoji || '🌱'}</span>
              <span className="sph-log-note">{l.note}</span>
              <span className="sph-log-where">
                {l.goal_id && goalById[l.goal_id] && <span className="sph-log-goal">{goalById[l.goal_id].title}</span>}
                <time dateTime={l.logged_at}>
                  {new Date(l.logged_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </time>
                <button className="sph-log-del" aria-label="Delete this log"
                  onClick={() => window.confirm('Delete this log? Its plant comes out of the garden with it.') && deleteLog(l.id)}>×</button>
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

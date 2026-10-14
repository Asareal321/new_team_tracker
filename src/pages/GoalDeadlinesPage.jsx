import { Link } from 'react-router-dom'
import { useSpheres } from '../context/SpheresContext'
import { deadlineGroups, QUIET_WINDOW_DAYS } from '../lib/spheres'
import { projectColorIndex } from '../lib/projectColors'
import './Spheres.css'

// Deadlines: every open goal, by when it ends.
//
// Tasks had due dates; goals have end dates, and those are the only deadlines
// left. Grouped by distance rather than drawn on a calendar, because the
// question this page answers is "what is closing in", not "what is on the
// 14th". The one flag worth raising is a goal that ends within a fortnight and
// has had nothing logged against it this week — the goal most likely to
// arrive unmet, and the one you can still do something about.

const SECTIONS = [
  ['overdue', 'Past their end date', 'Reached it, or let it go — either way, close it so it stops counting down.'],
  ['week', 'Ending this week', null],
  ['month', 'Ending this month', null],
  ['later', 'Later', null],
]

function when(left) {
  if (left < 0) return `${-left} day${left === -1 ? '' : 's'} ago`
  if (left === 0) return 'today'
  if (left === 1) return 'tomorrow'
  return `in ${left} days`
}

export default function GoalDeadlinesPage() {
  const { goals, spheres, counts, setGoalStatus, loading } = useSpheres()
  if (loading) return <div className="loading">Loading…</div>

  const sphereById = Object.fromEntries(spheres.map(s => [s.id, s]))
  const groups = deadlineGroups(goals, { counts })
  const any = Object.values(groups).some(g => g.length)

  return (
    <div className="sph-page">
      <header className="sph-head">
        <h1>Deadlines</h1>
        <p className="sph-sub">Every open goal, by when it ends.</p>
      </header>

      {!any && (
        <section className="sph-card sph-start">
          <h2>No goals with an end date yet</h2>
          <p>
            Open a sphere and add a goal — a goal needs an end date, and this is where those
            dates line up.
          </p>
        </section>
      )}

      {SECTIONS.map(([key, title, note]) => groups[key].length > 0 && (
        <section key={key} className="sph-section">
          <h2>{title}</h2>
          {note && <p className="sph-empty">{note}</p>}
          <ul className="sph-goals">
            {groups[key].map(({ goal, left, week, total, quiet }) => {
              const sphere = sphereById[goal.sphere_id]
              return (
                <li key={goal.id} className={`sph-goal pc-${projectColorIndex(goal.sphere_id)}${left < 0 ? ' late' : ''}`}>
                  <div className="sph-goal-main">
                    <span className="sph-goal-title">{goal.title}</span>
                    <span className="sph-goal-meta">
                      {sphere && <Link className="sph-chip" to={`/spheres/${sphere.id}`}>{sphere.name}</Link>}
                      {' '}Ends {when(left)} · {total} logged{week ? `, ${week} this week` : ''}
                    </span>
                    {quiet && (
                      <span className="sph-goal-quiet">
                        Nothing logged this week, and it ends within {QUIET_WINDOW_DAYS} days.
                      </span>
                    )}
                  </div>
                  {left < 0 && (
                    <div className="sph-goal-actions">
                      <button className="btn-ghost btn-sm" onClick={() => setGoalStatus(goal.id, 'done')}>Reached it</button>
                      <button className="btn-ghost btn-sm sph-quiet" onClick={() => setGoalStatus(goal.id, 'dropped')}>Let it go</button>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}

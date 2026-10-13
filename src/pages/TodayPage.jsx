import { Link } from 'react-router-dom'
import { useSpheres } from '../context/SpheresContext'
import { balanceNudge } from '../lib/spheres'
import { localDay, seedByKey } from '../lib/garden'
import LogBox from '../components/LogBox'
import SphereGarden from '../components/SphereGarden'
import { projectColorIndex } from '../lib/projectColors'
import './Spheres.css'

// Today: what you moved, and where everything stands.
//
// Three things in order of how often they matter. The log box, because that is
// the reason to open the app. Today's logs, so you can see the day add up. And
// every sphere's garden side by side, at the same scale, so neglect is
// something you see rather than something you are told.

const GARDEN_PREVIEW = 30

export default function TodayPage() {
  const { spheres, areas, goals, logs, counts, loading, error } = useSpheres()
  const now = new Date()
  const today = localDay(now)
  const todays = logs.filter(l => localDay(l.logged_at) === today)
  const nudge = balanceNudge({ spheres, logs, now })
  const byId = Object.fromEntries(spheres.map(s => [s.id, s]))
  const goalById = Object.fromEntries(goals.map(g => [g.id, g]))
  const areaName = id => areas.find(a => a.id === id)?.name

  if (loading) return <div className="loading">Loading…</div>

  const live = spheres.filter(s => !s.archived_at)
  // Busiest garden first, so the eye travels from what is thriving to what is
  // not — the bottom of the grid is the part worth noticing.
  const ordered = [...live].sort((a, b) =>
    (counts.bySphere[b.id]?.total || 0) - (counts.bySphere[a.id]?.total || 0))

  return (
    <div className="sph-page">
      <header className="sph-head">
        <h1>Today</h1>
        <p className="sph-sub">
          {now.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          {' · '}{todays.length ? `${todays.length} logged so far` : 'nothing logged yet'}
        </p>
      </header>

      {error && <p className="sph-error">{error}</p>}

      <section className="sph-card">
        <LogBox autoFocus />
        {nudge && (
          <p className="sph-nudge">
            {nudge.message}{' '}
            <Link to={`/spheres/${nudge.quiet.id}`}>Open {nudge.quiet.name}</Link>
          </p>
        )}
      </section>

      {todays.length > 0 && (
        <section className="sph-section">
          <h2>Logged today</h2>
          <ul className="sph-logs">
            {todays.map(l => (
              <li key={l.id} className={`sph-log pc-${projectColorIndex(l.sphere_id)}`}>
                <span className="sph-log-plant" aria-hidden="true">{seedByKey(l.seed_key)?.emoji || '🌱'}</span>
                <span className="sph-log-note">{l.note}</span>
                <span className="sph-log-where">
                  <Link to={`/spheres/${l.sphere_id}`} className="sph-chip">{byId[l.sphere_id]?.name || 'Sphere'}</Link>
                  {l.goal_id && goalById[l.goal_id] && <span className="sph-log-goal">{goalById[l.goal_id].title}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {ordered.length > 0 && (
        <section className="sph-section">
          <h2>Your gardens</h2>
          <div className="sph-gardens">
            {ordered.map(s => {
              const c = counts.bySphere[s.id] || { week: 0, total: 0 }
              return (
                <Link key={s.id} to={`/spheres/${s.id}`} className={`sph-garden-card pc-${projectColorIndex(s.id)}`}>
                  <span className="sph-garden-top">
                    <span className="sph-garden-name">{s.name}</span>
                    <span className="sph-garden-area">{areaName(s.area_id) || 'Shared'}</span>
                  </span>
                  <SphereGarden logs={logs.filter(l => l.sphere_id === s.id)} limit={GARDEN_PREVIEW} size="sm" />
                  <span className="sph-garden-tally">
                    <strong>{c.week}</strong> this week · {c.total} total
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      )}

      {!live.length && (
        <section className="sph-card sph-start">
          <h2>Start with the parts of your life you want to move forward</h2>
          <p>
            An <strong>area</strong> is broad — Academics, Personal, Clubs, Recruiting.
            A <strong>sphere</strong> sits inside one, as broad or as narrow as you like — a
            single class, or the whole of your job search. Add an area in the sidebar, then a
            sphere inside it, and every bit of progress you log there grows its garden.
          </p>
        </section>
      )}
    </div>
  )
}

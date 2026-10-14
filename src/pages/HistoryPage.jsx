import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useSpheres } from '../context/SpheresContext'
import { searchLogs, byDay } from '../lib/spheres'
import { parseQuery, highlight } from '../lib/archiveSearch'
import { seedByKey, localDay } from '../lib/garden'
import { projectColorIndex } from '../lib/projectColors'
import './Spheres.css'

// Everything you have logged, newest first, searchable.
//
// The old archive was where finished tasks went. This is the same idea for
// progress — a record of what you actually did, and where — and it is what
// makes "I did a lot on ECON this month" checkable rather than a feeling.
// Search covers the note, the sphere and the goal, and every word has to
// match, so "econ midterm" narrows rather than widens.

function Marked({ text, terms }) {
  return highlight(text, terms).map((run, i) =>
    run.hit ? <mark key={i} className="sph-hit">{run.text}</mark> : <span key={i}>{run.text}</span>)
}

function dayLabel(day) {
  const today = localDay()
  const y = new Date(); y.setDate(y.getDate() - 1)
  if (day === today) return 'Today'
  if (day === localDay(y)) return 'Yesterday'
  return new Date(`${day}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })
}

export default function HistoryPage() {
  const { logs, spheres, goals, loading } = useSpheres()
  const [query, setQuery] = useState('')
  const [sphereId, setSphereId] = useState('')

  const sphereName = id => spheres.find(s => s.id === id)?.name || ''
  const goalTitle = id => goals.find(g => g.id === id)?.title || ''
  const terms = parseQuery(query)

  const results = useMemo(() => {
    const scoped = sphereId ? logs.filter(l => l.sphere_id === sphereId) : logs
    return searchLogs(scoped, terms, { sphereName, goalTitle })
  // sphereName/goalTitle read spheres and goals, which are listed instead.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logs, sphereId, query, spheres, goals])

  if (loading) return <div className="loading">Loading…</div>
  const days = byDay(results)

  return (
    <div className="sph-page">
      <header className="sph-head">
        <h1>History</h1>
        <p className="sph-sub">
          {logs.length.toLocaleString()} logged in all
          {(terms.length || sphereId) ? ` · ${results.length.toLocaleString()} shown` : ''}
        </p>
      </header>

      <div className="sph-card sph-search">
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search what you logged — a note, a sphere, a goal"
          aria-label="Search your history"
        />
        <select value={sphereId} onChange={e => setSphereId(e.target.value)} aria-label="Only one sphere" className="lb-select">
          <option value="">Every sphere</option>
          {spheres.filter(s => !s.archived_at).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {!logs.length && <p className="sph-empty">Nothing logged yet. Everything you log on Today ends up here.</p>}
      {logs.length > 0 && !results.length && <p className="sph-empty">Nothing matches that.</p>}

      {days.map(({ day, logs: dayLogs }) => (
        <section key={day} className="sph-section">
          <h2 className="sph-day">{dayLabel(day)} <small>{dayLogs.length}</small></h2>
          <ul className="sph-logs">
            {dayLogs.map(l => (
              <li key={l.id} className={`sph-log pc-${projectColorIndex(l.sphere_id)}`}>
                <span className="sph-log-plant" aria-hidden="true">{seedByKey(l.seed_key)?.emoji || '🌱'}</span>
                <span className="sph-log-note"><Marked text={l.note} terms={terms} /></span>
                <span className="sph-log-where">
                  <Link to={`/spheres/${l.sphere_id}`} className="sph-chip"><Marked text={sphereName(l.sphere_id) || 'Sphere'} terms={terms} /></Link>
                  {l.goal_id && goalTitle(l.goal_id) && <span className="sph-log-goal"><Marked text={goalTitle(l.goal_id)} terms={terms} /></span>}
                  <time dateTime={l.logged_at}>
                    {new Date(l.logged_at).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' })}
                  </time>
                </span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  )
}

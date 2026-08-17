import { useState } from 'react'
import { projectDotColor } from '../lib/projectColors'
import './PersonalProjectsModal.css'

// Projects manager for the Personal (no-team) board.
//
// One level. This used to be two — sprints, grouped into projects — and the
// grouping is gone: a solo board rarely has enough buckets to need buckets of
// buckets, and the board only ever grouped by the lower level anyway. What was
// called a sprint is now simply a project.
//
// The table is still `projects` and the column is still `group_id`; the column
// is no longer read or written. See the note in TeamsPage for the same story.
export default function PersonalProjectsModal({
  projects, onAddProject, onUpdateProject, onDeleteProject, onClose,
}) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editingName, setEditingName] = useState('')
  const [error, setError] = useState('')

  // Any save can fail if the personal-projects migration hasn't run yet
  // (projects.team_id still NOT NULL). Surface that instead of the click doing
  // nothing.
  async function run(fn) {
    setError('')
    try {
      await fn()
      return true
    } catch (e) {
      const msg = e?.message || String(e)
      setError(/null value|not-null|violates|does not exist|policy|column/i.test(msg)
        ? 'Personal projects need a one-time database migration — run migration-personal-projects.sql in the Supabase SQL editor, then try again.'
        : `Couldn't save: ${msg}`)
      return false
    }
  }

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    if (await run(() => onAddProject({ name, status: 'active' }))) setNewName('')
  }

  function startEdit(p) { setEditingId(p.id); setEditingName(p.name) }
  async function saveEdit(id) {
    const name = editingName.trim()
    setEditingId(null)
    if (name) await run(() => onUpdateProject(id, { name }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ppm-modal" onClick={e => e.stopPropagation()}>
        <div className="ppm-head">
          <h2>Projects</h2>
          <button className="ppm-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <p className="ppm-hint">Every task can belong to a project. Tasks without one are unfiled.</p>

        <section className="ppm-section">
          {projects.length === 0 && <p className="ppm-empty">No projects yet — add one below to start filing tasks.</p>}
          <div className="ppm-list">
            {projects.map(p => (
              <div key={p.id} className="ppm-row">
                <span className="ppm-dot" style={{ background: projectDotColor(p.id) }} />
                {editingId === p.id ? (
                  <input
                    autoFocus className="ppm-inline-input" value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEdit(p.id)}
                    onBlur={() => saveEdit(p.id)}
                  />
                ) : (
                  <span className="ppm-row-name">{p.name}</span>
                )}
                <button className="ppm-icon-btn" onClick={() => startEdit(p)} title="Rename">✎</button>
                <button className="ppm-icon-btn danger" onClick={() => run(() => onDeleteProject(p.id))} title="Delete">✕</button>
              </div>
            ))}
          </div>
          <form className="ppm-add-row" onSubmit={handleAdd}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New project name" />
            <button type="submit" className="btn-primary btn-sm">+ Add</button>
          </form>
        </section>

        {error && <p className="ppm-error">{error}</p>}

        <div className="ppm-foot">
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

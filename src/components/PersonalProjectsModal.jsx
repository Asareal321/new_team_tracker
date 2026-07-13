import { useState } from 'react'
import { projectDotColor } from '../lib/projectColors'
import './PersonalProjectsModal.css'

// Lightweight projects/sprints manager for the Personal (no-team) board.
// Teams get the full two-level Projects/Sprints UI on the Teams page; a solo
// user has no such page, so this compact modal is the equivalent entry point
// for creating the sprints (and optional project groupings) that tasks can
// be assigned to.
export default function PersonalProjectsModal({
  projects, projectGroups,
  onAddSprint, onUpdateSprint, onDeleteSprint,
  onAddGroup, onUpdateGroup, onDeleteGroup,
  onSetSprintGroup, onClose,
}) {
  const [newGroupName, setNewGroupName] = useState('')
  const [newSprintName, setNewSprintName] = useState('')
  const [newSprintGroup, setNewSprintGroup] = useState('')
  const [editingGroupId, setEditingGroupId] = useState(null)
  const [editingGroupName, setEditingGroupName] = useState('')
  const [editingSprintId, setEditingSprintId] = useState(null)
  const [editingSprintName, setEditingSprintName] = useState('')
  const [error, setError] = useState('')

  // Any save can fail if the personal-projects migration hasn't run yet
  // (projects.team_id / project_groups.team_id still NOT NULL). Surface that
  // instead of the click doing nothing.
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

  async function handleAddGroup(e) {
    e.preventDefault()
    const name = newGroupName.trim()
    if (!name) return
    if (await run(() => onAddGroup(name))) setNewGroupName('')
  }

  async function handleAddSprint(e) {
    e.preventDefault()
    const name = newSprintName.trim()
    if (!name) return
    if (await run(() => onAddSprint({ name, status: 'active', group_id: newSprintGroup || null }))) {
      setNewSprintName('')
      setNewSprintGroup('')
    }
  }

  function startEditGroup(g) { setEditingGroupId(g.id); setEditingGroupName(g.name) }
  async function saveEditGroup(id) {
    const name = editingGroupName.trim()
    setEditingGroupId(null)
    if (name) await run(() => onUpdateGroup(id, name))
  }

  function startEditSprint(p) { setEditingSprintId(p.id); setEditingSprintName(p.name) }
  async function saveEditSprint(id) {
    const name = editingSprintName.trim()
    setEditingSprintId(null)
    if (name) await run(() => onUpdateSprint(id, { name }))
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="ppm-modal" onClick={e => e.stopPropagation()}>
        <div className="ppm-head">
          <h2>Projects &amp; sprints</h2>
          <button className="ppm-close" aria-label="Close" onClick={onClose}>✕</button>
        </div>
        <p className="ppm-hint">Organize your tasks into sprints, and group sprints into projects.</p>

        <section className="ppm-section">
          <h3>Projects</h3>
          {projectGroups.length === 0 && <p className="ppm-empty">No projects yet — group sprints together below.</p>}
          <div className="ppm-list">
            {projectGroups.map(g => {
              const count = projects.filter(p => p.group_id === g.id).length
              return (
                <div key={g.id} className="ppm-row">
                  <span className="ppm-dot" style={{ background: projectDotColor(g.id) }} />
                  {editingGroupId === g.id ? (
                    <input
                      autoFocus className="ppm-inline-input" value={editingGroupName}
                      onChange={e => setEditingGroupName(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && saveEditGroup(g.id)}
                      onBlur={() => saveEditGroup(g.id)}
                    />
                  ) : (
                    <span className="ppm-row-name">{g.name}</span>
                  )}
                  <span className="ppm-row-count">{count} sprint{count === 1 ? '' : 's'}</span>
                  <button className="ppm-icon-btn" onClick={() => startEditGroup(g)} title="Rename">✎</button>
                  <button className="ppm-icon-btn danger" onClick={() => run(() => onDeleteGroup(g.id))} title="Delete">✕</button>
                </div>
              )
            })}
          </div>
          <form className="ppm-add-row" onSubmit={handleAddGroup}>
            <input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} placeholder="New project name" />
            <button type="submit" className="btn-primary btn-sm">+ Add</button>
          </form>
        </section>

        <section className="ppm-section">
          <h3>Sprints</h3>
          {projects.length === 0 && <p className="ppm-empty">No sprints yet — add one below to start assigning tasks.</p>}
          <div className="ppm-list">
            {projects.map(p => (
              <div key={p.id} className="ppm-row">
                <span className="ppm-dot" style={{ background: projectDotColor(p.id) }} />
                {editingSprintId === p.id ? (
                  <input
                    autoFocus className="ppm-inline-input" value={editingSprintName}
                    onChange={e => setEditingSprintName(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && saveEditSprint(p.id)}
                    onBlur={() => saveEditSprint(p.id)}
                  />
                ) : (
                  <span className="ppm-row-name">{p.name}</span>
                )}
                <select
                  className="ppm-group-select"
                  value={p.group_id || ''}
                  onChange={e => run(() => onSetSprintGroup(p.id, e.target.value || null))}
                >
                  <option value="">No project</option>
                  {projectGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
                <button className="ppm-icon-btn" onClick={() => startEditSprint(p)} title="Rename">✎</button>
                <button className="ppm-icon-btn danger" onClick={() => run(() => onDeleteSprint(p.id))} title="Delete">✕</button>
              </div>
            ))}
          </div>
          <form className="ppm-add-row" onSubmit={handleAddSprint}>
            <input value={newSprintName} onChange={e => setNewSprintName(e.target.value)} placeholder="New sprint name" />
            <select value={newSprintGroup} onChange={e => setNewSprintGroup(e.target.value)}>
              <option value="">No project</option>
              {projectGroups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
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

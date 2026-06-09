import { useState } from 'react'
import './TaskBoard.css'

const STATUSES = ['todo', 'in_progress', 'done']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const PRIORITIES = ['low', 'medium', 'high']

export default function TaskBoard({ tasks, team, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm())

  function defaultForm() {
    return { title: '', notes: '', owner: team[0], status: 'todo', priority: 'medium' }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    if (editingId) {
      onUpdate(editingId, form)
      setEditingId(null)
    } else {
      onAdd({ ...form, created_at: new Date().toISOString() })
    }
    setForm(defaultForm())
    setShowForm(false)
  }

  function startEdit(task) {
    setForm({ title: task.title, notes: task.notes || '', owner: task.owner, status: task.status, priority: task.priority })
    setEditingId(task.id)
    setShowForm(true)
  }

  function cancelForm() {
    setForm(defaultForm())
    setEditingId(null)
    setShowForm(false)
  }

  const byStatus = (status) => tasks.filter(t => t.status === status)

  return (
    <div className="board">
      <div className="board-toolbar">
        <button className="btn-primary" onClick={() => { setShowForm(true); setEditingId(null); setForm(defaultForm()) }}>
          + Add Task
        </button>
      </div>

      {showForm && (
        <div className="modal-overlay" onClick={cancelForm}>
          <form className="task-form" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Task' : 'New Task'}</h2>
            <label>Title
              <input
                autoFocus
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="What needs to be done?"
              />
            </label>
            <label>Notes
              <textarea
                rows={3}
                value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any context or details…"
              />
            </label>
            <div className="form-row">
              <label>Owner
                <select value={form.owner} onChange={e => setForm(f => ({ ...f, owner: e.target.value }))}>
                  {team.map(m => <option key={m}>{m}</option>)}
                </select>
              </label>
              <label>Status
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </label>
              <label>Priority
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>
            </div>
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={cancelForm}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save' : 'Add Task'}</button>
            </div>
          </form>
        </div>
      )}

      <div className="columns">
        {STATUSES.map(status => (
          <div key={status} className="column">
            <div className="column-header">
              <span className={`status-dot ${status}`} />
              <span className="column-title">{STATUS_LABELS[status]}</span>
              <span className="column-count">{byStatus(status).length}</span>
            </div>
            <div className="column-tasks">
              {byStatus(status).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onEdit={() => startEdit(task)}
                  onDelete={() => onDelete(task.id)}
                  onStatusChange={(s) => onUpdate(task.id, { status: s })}
                  statuses={STATUSES}
                  statusLabels={STATUS_LABELS}
                />
              ))}
              {byStatus(status).length === 0 && (
                <div className="empty-col">No tasks</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskCard({ task, onEdit, onDelete, onStatusChange, statuses, statusLabels }) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className={`task-card priority-${task.priority}`}>
      <div className="task-card-top">
        <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
        <div className="task-menu-wrap">
          <button className="menu-btn" onClick={() => setShowMenu(m => !m)}>•••</button>
          {showMenu && (
            <div className="task-menu" onMouseLeave={() => setShowMenu(false)}>
              <button onClick={() => { onEdit(); setShowMenu(false) }}>Edit</button>
              {statuses.filter(s => s !== task.status).map(s => (
                <button key={s} onClick={() => { onStatusChange(s); setShowMenu(false) }}>
                  → {statusLabels[s]}
                </button>
              ))}
              <button className="danger" onClick={() => { onDelete(); setShowMenu(false) }}>Delete</button>
            </div>
          )}
        </div>
      </div>
      <p className="task-title">{task.title}</p>
      {task.notes && <p className="task-notes">{task.notes}</p>}
      <div className="task-card-footer">
        <span className="owner-tag">{task.owner}</span>
      </div>
    </div>
  )
}

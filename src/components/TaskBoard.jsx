import { useState } from 'react'
import './TaskBoard.css'

const STATUSES = ['todo', 'in_progress', 'done']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const PRIORITIES = ['low', 'medium', 'high']

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function dueClass(dateStr) {
  if (!dateStr) return ''
  const today = todayStr()
  if (dateStr < today) return 'overdue'
  if (dateStr === today) return 'today'
  return ''
}

export default function TaskBoard({ tasks, teamMembers, projects, currentUserId, currentTeamId, onAdd, onUpdate, onDelete }) {
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(defaultForm())

  function defaultForm() {
    return {
      title: '',
      notes: '',
      status: 'todo',
      priority: 'medium',
      due_date: '',
      assignee_id: currentTeamId ? (teamMembers[0]?.id ?? null) : currentUserId,
      project_id: null,
    }
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = { ...form, due_date: form.due_date || null, project_id: form.project_id || null }
    if (editingId) {
      onUpdate(editingId, payload)
      setEditingId(null)
    } else {
      onAdd(payload)
    }
    setForm(defaultForm())
    setShowForm(false)
  }

  function startEdit(task) {
    setForm({
      title: task.title,
      notes: task.notes || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date || '',
      assignee_id: task.assignee_id,
      project_id: task.project_id,
    })
    setEditingId(task.id)
    setShowForm(true)
  }

  function cancelForm() {
    setForm(defaultForm())
    setEditingId(null)
    setShowForm(false)
  }

  const byStatus = (status) => tasks.filter(t => t.status === status)
  const memberName = (id) => teamMembers.find(m => m.id === id)?.display_name
  const projectName = (id) => projects.find(p => p.id === id)?.name

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
              <label>Due Date
                <input
                  type="date"
                  value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                />
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
            {currentTeamId && (
              <div className="form-row-2">
                <label>Assignee
                  <select
                    value={form.assignee_id || ''}
                    onChange={e => setForm(f => ({ ...f, assignee_id: e.target.value || null }))}
                  >
                    <option value="">Unassigned</option>
                    {teamMembers.map(m => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                  </select>
                </label>
                <label>Project
                  <select
                    value={form.project_id || ''}
                    onChange={e => setForm(f => ({ ...f, project_id: e.target.value || null }))}
                  >
                    <option value="">No project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
              </div>
            )}
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
                  assigneeName={memberName(task.assignee_id)}
                  projectName={projectName(task.project_id)}
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

function TaskCard({ task, assigneeName, projectName, onEdit, onDelete, onStatusChange, statuses, statusLabels }) {
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
        {task.due_date && (
          <span className={`due-badge ${dueClass(task.due_date)}`}>
            {dueClass(task.due_date) === 'overdue' ? 'Overdue · ' : ''}{formatDate(task.due_date)}
          </span>
        )}
        {assigneeName && <span className="owner-tag">{assigneeName}</span>}
        {projectName && <span className="project-tag">{projectName}</span>}
      </div>
    </div>
  )
}

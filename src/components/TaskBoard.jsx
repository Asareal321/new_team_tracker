import { useState, useCallback } from 'react'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import './TaskBoard.css'

const STATUSES     = ['todo', 'in_progress', 'done', 'archived']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', archived: 'Archived' }
const FORM_STATUSES = ['todo', 'in_progress', 'done']
const PRIORITIES    = ['high', 'medium', 'low']
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }

function initials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return (parts.length === 1 ? parts[0][0] : parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

function todayStr() { return new Date().toISOString().slice(0, 10) }

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatTime(isoStr) {
  return new Date(isoStr).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

function formatHistoryDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function dueClass(dateStr) {
  if (!dateStr) return ''
  const today = todayStr()
  if (dateStr < today) return 'overdue'
  if (dateStr === today) return 'today'
  return ''
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function TaskBoard({
  tasks, teamMembers, projects, taskUpdates,
  currentUserId, currentTeamId,
  onAdd, onUpdate, onDelete, onAddUpdate, onDeleteUpdate, onUpdateAssignees,
}) {
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(defaultForm())
  const [activeTab, setActiveTab] = useState('todo')

  function defaultForm() {
    return { title: '', notes: '', status: 'todo', priority: 'medium', due_date: '', project_id: null, assigneeIds: [] }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const { assigneeIds, ...rest } = form
    const payload = { ...rest, due_date: rest.due_date || null, project_id: rest.project_id || null }
    if (editingId) {
      await onUpdate(editingId, payload)
      await onUpdateAssignees(editingId, assigneeIds)
      setEditingId(null)
    } else {
      const newId = await onAdd({ ...payload, assigneeIds })
      // newId returned by BoardPage
    }
    setForm(defaultForm())
    setShowForm(false)
  }

  function startEdit(task) {
    setForm({
      title:       task.title,
      notes:       task.notes || '',
      status:      task.status,
      priority:    task.priority,
      due_date:    task.due_date || '',
      project_id:  task.project_id,
      assigneeIds: (task.task_assignees || []).map(a => a.user_id),
    })
    setEditingId(task.id)
    setShowForm(true)
  }

  function cancelForm() { setForm(defaultForm()); setEditingId(null); setShowForm(false) }

  function toggleAssignee(id) {
    setForm(f => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id)
        ? f.assigneeIds.filter(x => x !== id)
        : [...f.assigneeIds, id],
    }))
  }

  const projectName    = (id) => projects.find(p => p.id === id)?.name
  const updatesForTask = (taskId) => taskUpdates.filter(u => u.task_id === taskId).slice().reverse()
  const byStatus       = (status) => tasks.filter(t => t.status === status)

  function resolveAssignees(task) {
    return (task.task_assignees || [])
      .map(a => teamMembers.find(m => m.id === a.user_id))
      .filter(Boolean)
  }

  return (
    <div className="board">
      {showForm && (
        <div className="modal-overlay" onClick={cancelForm}>
          <form className="task-form" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
            <h2>{editingId ? 'Edit Task' : 'New Task'}</h2>
            <label>Title
              <input autoFocus value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="What needs to be done?" />
            </label>
            <label>Notes
              <textarea rows={3} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any context or details…" />
            </label>
            <div className="form-row">
              <label>Due Date
                <input type="date" value={form.due_date}
                  onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
              </label>
              <label>Status
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                  {FORM_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </label>
              <label>Priority
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>
            </div>
            {currentTeamId && (
              <>
                <label>Project
                  <select value={form.project_id || ''}
                    onChange={e => setForm(f => ({ ...f, project_id: e.target.value || null }))}>
                    <option value="">No project</option>
                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                </label>
                <div className="assignee-field">
                  <span className="assignee-field-label">Assignees</span>
                  <div className="assignee-picker">
                    {teamMembers.map(m => (
                      <button
                        key={m.id} type="button"
                        className={`assignee-chip${form.assigneeIds.includes(m.id) ? ' selected' : ''}`}
                        onClick={() => toggleAssignee(m.id)}
                      >
                        <span className="chip-avatar">{initials(m.display_name)}</span>
                        {m.display_name}
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={cancelForm}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save' : 'Add Task'}</button>
            </div>
          </form>
        </div>
      )}

      <PriorityBoard
        tasks={tasks}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        byStatus={byStatus}
        projectName={projectName}
        updatesForTask={updatesForTask}
        resolveAssignees={resolveAssignees}
        teamMembers={teamMembers}
        onAdd={onAdd}
        onUpdate={onUpdate}
        onDelete={onDelete}
        onAddUpdate={onAddUpdate}
        onDeleteUpdate={onDeleteUpdate}
        onUpdateAssignees={onUpdateAssignees}
        onStartEdit={startEdit}
        onOpenForm={() => { setShowForm(true); setEditingId(null); setForm(defaultForm()) }}
      />
    </div>
  )
}

// ─── Priority board (owns DndContext) ────────────────────────────────────────

function PriorityBoard({
  tasks, activeTab, setActiveTab, byStatus,
  projectName, updatesForTask, resolveAssignees, teamMembers,
  onUpdate, onDelete, onAddUpdate, onDeleteUpdate, onUpdateAssignees, onStartEdit, onOpenForm,
}) {
  const [activeId, setActiveId] = useState(null)
  const [draftUpdates, setDraftUpdates] = useState(() => {
    try { return JSON.parse(localStorage.getItem('trakkit-drafts') || '{}') } catch { return {} }
  })

  function setDraft(taskId, text) {
    setDraftUpdates(d => {
      const next = text ? { ...d, [taskId]: text } : (({ [taskId]: _, ...rest }) => rest)(d)
      localStorage.setItem('trakkit-drafts', JSON.stringify(next))
      return next
    })
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  function getZoneTasks(priority) {
    return tasks
      .filter(t => t.priority === priority && t.status === activeTab)
      .sort((a, b) => {
        const pa = a.position ?? 0, pb = b.position ?? 0
        if (pa !== pb) return pa - pb
        return new Date(a.created_at) - new Date(b.created_at)
      })
  }

  function handleDragStart({ active }) {
    setActiveId(active.id)
  }

  function handleDragEnd({ active, over }) {
    setActiveId(null)
    if (!over || active.id === over.id) return

    const srcTask = tasks.find(t => t.id === active.id)
    if (!srcTask) return

    const overId = String(over.id)
    const tgtPriority = overId.startsWith('zone-')
      ? overId.replace('zone-', '')
      : (tasks.find(t => t.id === over.id)?.priority ?? srcTask.priority)

    const zoneTasks = getZoneTasks(tgtPriority).filter(t => t.id !== active.id)

    let insertIdx = zoneTasks.length
    if (!overId.startsWith('zone-')) {
      const idx = zoneTasks.findIndex(t => t.id === over.id)
      if (idx !== -1) insertIdx = idx
    }

    const prev = zoneTasks[insertIdx - 1]
    const next = zoneTasks[insertIdx]
    let newPosition
    if (!prev && !next)   newPosition = 1000
    else if (!prev)       newPosition = (next.position ?? 0) - 1
    else if (!next)       newPosition = (prev.position ?? 0) + 1
    else                  newPosition = ((prev.position ?? 0) + (next.position ?? 0)) / 2

    onUpdate(active.id, { priority: tgtPriority, position: newPosition })
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board-panel">
        <div className="tabs">
          <div className="tabs-left">
            {FORM_STATUSES.map(status => (
              <button key={status}
                className={`tab ${activeTab === status ? 'active' : ''}`}
                onClick={() => setActiveTab(status)}
              >
                <span className={`status-dot ${status}`} />
                {STATUS_LABELS[status]}
                <span className="tab-count">{byStatus(status).length}</span>
              </button>
            ))}
            <div className="tab-divider" />
            <button
              className={`tab tab-archived ${activeTab === 'archived' ? 'active' : ''}`}
              onClick={() => setActiveTab('archived')}
            >
              <span className="status-dot archived" />
              Archived
              <span className="tab-count">{byStatus('archived').length}</span>
            </button>
          </div>
          <button className="btn-primary btn-sm" onClick={onOpenForm}>+ Add Task</button>
        </div>

        {activeTab === 'archived' ? (
          <div className="task-list">
            {byStatus('archived').map(task => (
              <TaskRow key={task.id} task={task}
                assignees={resolveAssignees(task)}
                projectName={projectName(task.project_id)}
                updates={updatesForTask(task.id)}
                teamMembers={teamMembers}
                onEdit={() => onStartEdit(task)}
                onDelete={() => onDelete(task.id)}
                onStatusChange={s => onUpdate(task.id, { status: s })}
                onAddUpdate={body => onAddUpdate(task.id, body)}
                onDeleteUpdate={onDeleteUpdate}
                onUpdateAssignees={ids => onUpdateAssignees(task.id, ids)}
                statuses={FORM_STATUSES} statusLabels={STATUS_LABELS}
                showPriorityBadge
                draftText={draftUpdates[task.id] || ''}
                onDraftChange={text => setDraft(task.id, text)}
              />
            ))}
            {byStatus('archived').length === 0 && <div className="empty-col">No archived tasks</div>}
          </div>
        ) : (
          <div className="priority-zones">
            {PRIORITIES.map(priority => (
              <PriorityZone key={priority} priority={priority}
                tasks={getZoneTasks(priority)}
                resolveAssignees={resolveAssignees}
                projectName={projectName}
                updatesForTask={updatesForTask}
                teamMembers={teamMembers}
                onEdit={onStartEdit}
                onDelete={onDelete}
                onUpdate={onUpdate}
                onAddUpdate={onAddUpdate}
                onDeleteUpdate={onDeleteUpdate}
                onUpdateAssignees={onUpdateAssignees}
                draftUpdates={draftUpdates}
                setDraft={setDraft}
              />
            ))}
          </div>
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeTask && (
          <div className={`task-row priority-${activeTask.priority} drag-overlay-row`}>
            <div className="task-row-main">
              <span className="drag-handle">⠿</span>
              <div className="task-row-info">
                <p className="task-title">{activeTask.title}</p>
                {activeTask.notes && <p className="task-notes">{activeTask.notes}</p>}
              </div>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

// ─── Priority zone ───────────────────────────────────────────────────────────

function PriorityZone({ priority, tasks, resolveAssignees, projectName, updatesForTask, teamMembers, onEdit, onDelete, onUpdate, onAddUpdate, onDeleteUpdate, onUpdateAssignees, draftUpdates, setDraft }) {
  const { setNodeRef, isOver } = useDroppable({ id: `zone-${priority}` })
  const items = tasks.map(t => t.id)

  return (
    <div className={`priority-zone zone-${priority}${isOver ? ' zone-over' : ''}`}>
      <div className="zone-header">
        <span className="zone-label">{PRIORITY_LABELS[priority]}</span>
        <span className="zone-count">{tasks.length}</span>
      </div>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div ref={setNodeRef} className="zone-body">
          {tasks.map(task => (
            <SortableTaskRow key={task.id} task={task}
              assignees={resolveAssignees(task)}
              projectName={projectName(task.project_id)}
              updates={updatesForTask(task.id)}
              teamMembers={teamMembers}
              onEdit={() => onEdit(task)}
              onDelete={() => onDelete(task.id)}
              onStatusChange={s => onUpdate(task.id, { status: s })}
              onAddUpdate={body => onAddUpdate(task.id, body)}
              onDeleteUpdate={onDeleteUpdate}
              onUpdateAssignees={ids => onUpdateAssignees(task.id, ids)}
              statuses={FORM_STATUSES} statusLabels={STATUS_LABELS}
              draftText={draftUpdates[task.id] || ''}
              onDraftChange={text => setDraft(task.id, text)}
            />
          ))}
          {tasks.length === 0 && (
            <div className="zone-empty">Drop tasks here</div>
          )}
        </div>
      </SortableContext>
    </div>
  )
}

// ─── Sortable wrapper ────────────────────────────────────────────────────────

function SortableTaskRow({ task, ...props }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: task.id })
  return (
    <div ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }}>
      <TaskRow task={task} {...props} dragListeners={listeners} dragAttributes={attributes} />
    </div>
  )
}

// ─── Task row ────────────────────────────────────────────────────────────────

const PRIMARY_NEXT = { todo: 'in_progress', in_progress: 'done' }

function TaskRow({
  task, assignees, projectName, updates,
  teamMembers = [], onUpdateAssignees,
  onEdit, onDelete, onStatusChange, onAddUpdate, onDeleteUpdate,
  statuses, statusLabels, showPriorityBadge,
  dragListeners, dragAttributes,
  draftText = '', onDraftChange,
}) {
  const assigneeIds = (task.task_assignees || []).map(a => a.user_id)
  const [showActions, setShowActions] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [expanded, setExpanded] = useState(() => draftText.length > 0)
  const isArchived = task.status === 'archived'

  const today = todayStr()
  const todaysUpdates  = updates.filter(u => u.created_at.slice(0, 10) === today)
  const historyUpdates = updates.filter(u => u.created_at.slice(0, 10) !== today)
  const historyByDate  = historyUpdates.reduce((acc, u) => {
    const d = u.created_at.slice(0, 10)
    if (!acc[d]) acc[d] = []
    acc[d].push(u)
    return acc
  }, {})
  const historyDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a))

  function submitUpdate(e) {
    e.preventDefault()
    const text = draftText.trim()
    if (!text) return
    onAddUpdate(text)
    onDraftChange?.('')
    setExpanded(false)
  }

  function cancelUpdate() {
    onDraftChange?.('')
    setExpanded(false)
  }

  const primaryNext  = PRIMARY_NEXT[task.status]
  const secondaryNext = statuses.filter(s => s !== task.status && s !== primaryNext)

  return (
    <div className={`task-row priority-${task.priority}${isArchived ? ' archived' : ''}`}>
      <div className="task-row-main">
        {dragListeners && (
          <button className="drag-handle" type="button"
            aria-label="Drag to reorder"
            {...dragListeners} {...dragAttributes}>⠿</button>
        )}
        <div className="task-row-info">
          <div className="task-row-top">
            {showPriorityBadge && (
              <span className={`priority-badge ${task.priority}`}>{task.priority}</span>
            )}
            <p className="task-title">{task.title}</p>
          </div>
          {task.notes && <p className="task-notes">{task.notes}</p>}
        </div>

        <div className="task-row-tags">
          {task.due_date && (
            <span className={`due-badge ${isArchived ? '' : dueClass(task.due_date)}`}>
              {!isArchived && dueClass(task.due_date) === 'overdue' ? 'Overdue · ' : ''}
              {formatDate(task.due_date)}
            </span>
          )}
          {assignees.length > 0 && <AvatarStack assignees={assignees} />}
          {projectName && <span className="project-tag">{projectName}</span>}
        </div>
        <button
          className={`menu-btn${showActions ? ' active' : ''}`}
          onClick={() => setShowActions(s => !s)}
          aria-label="Actions"
        >•••</button>
      </div>

      <div className={`task-action-bar${showActions ? ' open' : ''}`}>
        {isArchived ? (
          <>
            <button className="action-btn action-primary" onClick={() => { onStatusChange('done'); setShowActions(false) }}>Unarchive</button>
            <button className="action-btn action-danger" onClick={() => { onDelete(); setShowActions(false) }}>Delete</button>
          </>
        ) : (
          <>
            {primaryNext && (
              <button className="action-btn action-primary" onClick={() => { onStatusChange(primaryNext); setShowActions(false) }}>
                → {statusLabels[primaryNext]}
              </button>
            )}
            {secondaryNext.map(s => (
              <button key={s} className="action-btn" onClick={() => { onStatusChange(s); setShowActions(false) }}>
                → {statusLabels[s]}
              </button>
            ))}
            {task.status === 'done' && (
              <button className="action-btn" onClick={() => { onStatusChange('archived'); setShowActions(false) }}>Archive</button>
            )}
            {teamMembers.length > 0 && (
              <div className="action-assign">
                {teamMembers.map(m => {
                  const assigned = assigneeIds.includes(m.id)
                  const toggle = () => {
                    const next = assigned
                      ? assigneeIds.filter(id => id !== m.id)
                      : [...assigneeIds, m.id]
                    onUpdateAssignees?.(next)
                  }
                  return (
                    <button key={m.id} type="button" title={m.display_name}
                      className={`action-assign-chip${assigned ? ' assigned' : ''}`}
                      onClick={toggle}>
                      {initials(m.display_name)}
                    </button>
                  )
                })}
              </div>
            )}
            <button className="action-btn" onClick={() => { onEdit(); setShowActions(false) }}>Edit</button>
            <button className="action-btn action-danger" onClick={() => { onDelete(); setShowActions(false) }}>Delete</button>
          </>
        )}
      </div>

      {/* Show update history for archived tasks; full update UI for active tasks */}
      {isArchived && updates.length > 0 && (
        <div className="task-row-update">
          <div className="updates-section">
            {updates.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
              .reduce((acc, u) => {
                const d = u.created_at.slice(0, 10)
                if (!acc.find(g => g.date === d)) acc.push({ date: d, items: [] })
                acc.find(g => g.date === d).items.push(u)
                return acc
              }, [])
              .map(({ date, items }) => (
                <div key={date} className="history-day">
                  <span className="history-date-label">
                    {date === todayStr() ? 'Today' : formatHistoryDate(date)}
                  </span>
                  <div className="update-items">
                    {items.map(u => (
                      <div key={u.id} className="update-item">
                        <span className="update-body">{u.body}</span>
                        <span className="update-meta">{u.profiles?.display_name && <>{u.profiles.display_name} · </>}{formatTime(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>
        </div>
      )}

      {!isArchived && (
        <div className="task-row-update">
          <div className="updates-section">
            {todaysUpdates.length > 0 ? (
              <div className="updates-today">
                <span className="update-today-label">Today</span>
                <div className="update-items">
                  {todaysUpdates.map(u => (
                    <div key={u.id} className="update-item">
                      <span className="update-body">{u.body}</span>
                      <span className="update-meta">
                        {u.profiles?.display_name && <>{u.profiles.display_name} · </>}
                        {formatTime(u.created_at)}
                      </span>
                      <button className="update-delete-btn" title="Delete update"
                        onClick={() => onDeleteUpdate?.(u.id)}>×</button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <span className="update-today-label muted">No update yet today</span>
            )}
            {historyDates.length > 0 && (
              <button className="history-toggle" onClick={() => setShowHistory(h => !h)}>
                {showHistory ? '▲' : '▼'} {historyUpdates.length} past update{historyUpdates.length !== 1 ? 's' : ''}
              </button>
            )}
            {showHistory && (
              <div className="updates-history">
                {historyDates.map(date => (
                  <div key={date} className="history-day">
                    <span className="history-date-label">{formatHistoryDate(date)}</span>
                    <div className="update-items">
                      {historyByDate[date].map(u => (
                        <div key={u.id} className="update-item">
                          <span className="update-body">{u.body}</span>
                          {u.profiles?.display_name && (
                            <span className="update-meta">{u.profiles.display_name}</span>
                          )}
                          <button className="update-delete-btn" title="Delete update"
                            onClick={() => onDeleteUpdate?.(u.id)}>×</button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {expanded ? (
            <div className="update-expanded-area">
              <textarea
                autoFocus
                rows={3}
                value={draftText}
                onChange={e => onDraftChange?.(e.target.value)}
                placeholder="What happened today? What's the current status?"
              />
              <div className="update-expanded-actions">
                <button type="button" className="btn-ghost btn-sm" onClick={cancelUpdate}>Cancel</button>
                <button type="button" className="btn-primary btn-sm" onClick={submitUpdate}>Post</button>
              </div>
            </div>
          ) : (
            <div
              className={`update-input-collapsed${draftText ? ' has-draft' : ''}`}
              onClick={() => setExpanded(true)}
            >
              {draftText || 'Add today\'s update…'}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Avatar stack ─────────────────────────────────────────────────────────────

function AvatarStack({ assignees }) {
  const visible = assignees.slice(0, 3)
  const overflow = assignees.length - 3
  return (
    <div className="avatar-stack">
      {visible.map((a, i) => (
        <span key={a.id} className="avatar-chip" style={{ zIndex: visible.length - i }} title={a.display_name}>
          {initials(a.display_name)}
        </span>
      ))}
      {overflow > 0 && (
        <span className="avatar-chip avatar-overflow">+{overflow}</span>
      )}
    </div>
  )
}

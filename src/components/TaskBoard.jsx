import { useState, useCallback, useMemo, useEffect } from 'react'
import {
  DndContext, DragOverlay, PointerSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { projectDotColor } from '../lib/projectColors'
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

// Local-timezone YYYY-MM-DD for a timestamp (or now). Used by the archive
// calendar so tasks land on the day they were finished in the user's own
// timezone, not the UTC day.
function localDayStr(ts) {
  const d = ts ? new Date(ts) : new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

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
  onAdd, onUpdate, onDelete, onAddUpdate, onDeleteUpdate, onUpdateAssignees, onTaskDone, onArchiveAll,
}) {
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(defaultForm())
  const [activeTab, setActiveTab] = useState('todo')
  const [datePickerOpen, setDatePickerOpen] = useState(false)

  // People filter: which teammates' tasks to show. Default = only me (tasks
  // I'm assigned to). "Everyone" shows the whole team board.
  const [peopleEveryone, setPeopleEveryone] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState(() => new Set(currentUserId ? [currentUserId] : []))

  // Reset the filter to "just me" whenever the team (or user) changes.
  useEffect(() => {
    setSelectedMembers(new Set(currentUserId ? [currentUserId] : []))
    setPeopleEveryone(false)
  }, [currentTeamId, currentUserId])

  function defaultForm() {
    return { title: '', notes: '', status: 'todo', priority: '', due_date: '', project_id: null, assigneeIds: [] }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const { assigneeIds, ...rest } = form
    const payload = { ...rest, priority: rest.priority || 'medium', due_date: rest.due_date || null, project_id: rest.project_id || null }
    if (editingId) {
      await onUpdate(editingId, payload)
      await onUpdateAssignees(editingId, assigneeIds)
      setEditingId(null)
    } else {
      const newId = await onAdd({ ...payload, assigneeIds })
      // newId returned by BoardPage
    }
    setForm(defaultForm())
    setDatePickerOpen(false)
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

  function cancelForm() { setForm(defaultForm()); setEditingId(null); setDatePickerOpen(false); setShowForm(false) }

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

  // The people filter only applies on a team board with a roster to filter by.
  const showPeopleFilter = !!currentTeamId && teamMembers.length > 0
  const meMember = teamMembers.find(m => m.id === currentUserId)
  const otherMembers = teamMembers.filter(m => m.id !== currentUserId)

  function taskAssigneeIds(task) {
    const ids = new Set((task.task_assignees || []).map(a => a.user_id))
    if (task.assignee_id) ids.add(task.assignee_id)
    return ids
  }

  const visibleTasks = useMemo(() => {
    if (!showPeopleFilter || peopleEveryone) return tasks
    if (selectedMembers.size === 0) return []
    return tasks.filter(t => {
      const ids = taskAssigneeIds(t)
      for (const id of selectedMembers) if (ids.has(id)) return true
      return false
    })
  }, [tasks, showPeopleFilter, peopleEveryone, selectedMembers])

  function toggleMember(id) {
    setPeopleEveryone(false)
    setSelectedMembers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      // Never leave the board empty — snap back to "just me".
      if (next.size === 0) return new Set(currentUserId ? [currentUserId] : [])
      return next
    })
  }

  const byStatus = (status) => visibleTasks.filter(t => t.status === status)

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
              <textarea rows={2} value={form.notes}
                onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                placeholder="Any context or details…" />
            </label>

            <div className="qc-bar">
              <div className="qc-prio" role="group" aria-label="Priority">
                {PRIORITIES.map(p => (
                  <button
                    key={p} type="button"
                    className={`qc-dot prio-${p}${form.priority === p ? ' selected' : ''}`}
                    aria-pressed={form.priority === p}
                    aria-label={PRIORITY_LABELS[p]}
                    title={PRIORITY_LABELS[p]}
                    onClick={() => setForm(f => ({ ...f, priority: f.priority === p ? '' : p }))}
                  ><span /></button>
                ))}
              </div>
              <span className="qc-vr" />
              <button
                type="button"
                className={`qc-date${form.due_date ? ' set' : ''}`}
                onClick={() => setDatePickerOpen(o => !o)}
              >
                <span className="qc-cal">📅</span>
                {form.due_date ? formatDate(form.due_date) : 'Due date'}
              </button>
              {form.due_date && (
                <button type="button" className="qc-clear" aria-label="Clear due date"
                  onClick={() => { setForm(f => ({ ...f, due_date: '' })); setDatePickerOpen(false) }}>×</button>
              )}
              {currentTeamId && teamMembers.length > 0 && (
                <>
                  <span className="qc-vr" />
                  <div className="qc-avatars" role="group" aria-label="Assignees">
                    {teamMembers.map(m => (
                      <button
                        key={m.id} type="button"
                        className={`qc-av${form.assigneeIds.includes(m.id) ? ' selected' : ''}`}
                        aria-pressed={form.assigneeIds.includes(m.id)}
                        title={m.display_name}
                        onClick={() => toggleAssignee(m.id)}
                      >{initials(m.display_name)}</button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {datePickerOpen && (
              <input type="date" className="qc-datefield" autoFocus value={form.due_date}
                onChange={e => { setForm(f => ({ ...f, due_date: e.target.value })); setDatePickerOpen(false) }} />
            )}

            {currentTeamId && projects.length > 0 && (
              <div className="qc-projects">
                <span className="qc-plabel">Project</span>
                <div className="qc-pills">
                  {projects.map(p => (
                    <button
                      key={p.id} type="button"
                      className={`qc-pj${form.project_id === p.id ? ' selected' : ''}`}
                      aria-pressed={form.project_id === p.id}
                      onClick={() => setForm(f => ({ ...f, project_id: f.project_id === p.id ? null : p.id }))}
                    >
                      <span className="qc-pjdot" style={{ background: projectDotColor(p.id) }} />
                      {p.name}
                    </button>
                  ))}
                  <button
                    type="button"
                    className={`qc-pj qc-pj-none${!form.project_id ? ' selected' : ''}`}
                    aria-pressed={!form.project_id}
                    onClick={() => setForm(f => ({ ...f, project_id: null }))}
                  >None</button>
                </div>
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={cancelForm}>Cancel</button>
              <button type="submit" className="btn-primary">{editingId ? 'Save' : 'Add Task'}</button>
            </div>
          </form>
        </div>
      )}

      <PriorityBoard
        tasks={visibleTasks}
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
        onTaskDone={onTaskDone}
        onArchiveAll={onArchiveAll}
        onOpenForm={() => { setShowForm(true); setEditingId(null); setForm(defaultForm()) }}
      />
    </div>
  )
}

// ─── Priority board (owns DndContext) ────────────────────────────────────────

function PriorityBoard({
  tasks, activeTab, setActiveTab, byStatus,
  projectName, updatesForTask, resolveAssignees, teamMembers,
  onUpdate, onDelete, onAddUpdate, onDeleteUpdate, onUpdateAssignees, onStartEdit, onOpenForm, onTaskDone, onArchiveAll,
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
        {showPeopleFilter && (
          <div className="people-bar">
            <span className="people-label">Viewing</span>
            {meMember && (
              <button
                type="button"
                className={`people-chip${!peopleEveryone && selectedMembers.has(currentUserId) ? ' selected' : ''}`}
                aria-pressed={!peopleEveryone && selectedMembers.has(currentUserId)}
                onClick={() => toggleMember(currentUserId)}
              >
                <span className="people-ini">{initials(meMember.display_name)}</span>
                My tasks
              </button>
            )}
            {otherMembers.length > 0 && <span className="people-vr" />}
            {otherMembers.map(m => (
              <button
                key={m.id}
                type="button"
                className={`people-chip${!peopleEveryone && selectedMembers.has(m.id) ? ' selected' : ''}`}
                aria-pressed={!peopleEveryone && selectedMembers.has(m.id)}
                title={m.display_name}
                onClick={() => toggleMember(m.id)}
              >
                <span className="people-ini">{initials(m.display_name)}</span>
                {m.display_name.split(/\s+/)[0]}
              </button>
            ))}
            <span className="people-vr" />
            <button
              type="button"
              className={`people-chip people-everyone${peopleEveryone ? ' selected' : ''}`}
              aria-pressed={peopleEveryone}
              onClick={() => setPeopleEveryone(true)}
            >Everyone</button>
          </div>
        )}
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
          <div className="tabs-actions">
            {activeTab === 'done' && byStatus('done').length > 0 && (
              <button className="btn-ghost btn-sm" onClick={() => {
                if (window.confirm(`Archive all ${byStatus('done').length} completed task(s)?`)) onArchiveAll()
              }}>
                Archive all ({byStatus('done').length})
              </button>
            )}
            <button className="btn-primary btn-sm" onClick={onOpenForm}>+ Add Task</button>
          </div>
        </div>

        {activeTab === 'archived' ? (
          <ArchiveCalendar
            tasks={byStatus('archived')}
            updatesForTask={updatesForTask}
            projectName={projectName}
          />
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
                onTaskDone={onTaskDone}
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

function PriorityZone({ priority, tasks, resolveAssignees, projectName, updatesForTask, teamMembers, onEdit, onDelete, onUpdate, onAddUpdate, onDeleteUpdate, onUpdateAssignees, draftUpdates, setDraft, onTaskDone }) {
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
              onAddUpdate={(body, status) => onAddUpdate(task.id, body, status)}
              onDeleteUpdate={onDeleteUpdate}
              onUpdateAssignees={ids => onUpdateAssignees(task.id, ids)}
              statuses={FORM_STATUSES} statusLabels={STATUS_LABELS}
              draftText={draftUpdates[task.id] || ''}
              onDraftChange={text => setDraft(task.id, text)}
              onTaskDone={onTaskDone}
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
  draftText = '', onDraftChange, onTaskDone,
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

  function submitUpdate(newStatus) {
    const text = draftText.trim()
    if (!text) return
    onAddUpdate(text, newStatus)
    onDraftChange?.('')
    setExpanded(false)
    if (newStatus === 'done') onTaskDone?.(task)
  }

  function cancelUpdate() {
    onDraftChange?.('')
    setExpanded(false)
  }

  const primaryNext  = PRIMARY_NEXT[task.status]
  const secondaryNext = statuses.filter(s => s !== task.status && s !== primaryNext)

  return (
    <div className={`task-row priority-${task.priority}${isArchived ? ' archived' : ''}`}
      onMouseLeave={() => setShowActions(false)}>
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
          onMouseEnter={() => setShowActions(true)}
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
                <button type="button" className="status-submit-btn todo" onClick={() => submitUpdate('todo')}>To-do</button>
                <button type="button" className="status-submit-btn inprogress" onClick={() => submitUpdate('in_progress')}>In Progress</button>
                <button type="button" className="status-submit-btn done" onClick={() => submitUpdate('done')}>Done</button>
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

// ─── Archive calendar ────────────────────────────────────────────────────────

function ArchiveCalendar({ tasks, updatesForTask, projectName }) {
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  const tasksByDate = {}
  tasks.forEach(t => {
    const ts = t.archived_at || t.updated_at || t.created_at
    if (ts) {
      const d = localDayStr(ts)
      if (!tasksByDate[d]) tasksByDate[d] = []
      tasksByDate[d].push(t)
    }
  })

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells = [...Array(firstDay).fill(null), ...Array.from({ length: daysInMonth }, (_, i) => i + 1)]

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })

  function dayStr(day) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  }

  const selectedTasks = selectedDay ? (tasksByDate[selectedDay] || []) : []

  if (tasks.length === 0) return <div className="empty-col">No archived tasks yet</div>

  return (
    <div className="archive-cal">
      <div className="archive-cal-header">
        <button className="cal-nav" onClick={() => { setViewDate(new Date(year, month - 1)); setSelectedDay(null) }}>‹</button>
        <span className="cal-month-label">{monthLabel}</span>
        <button className="cal-nav" onClick={() => { setViewDate(new Date(year, month + 1)); setSelectedDay(null) }}>›</button>
      </div>
      <div className="archive-cal-grid">
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
          <div key={d} className="cal-weekday">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={`e${i}`} className="cal-cell cal-empty" />
          const ds = dayStr(day)
          const count = (tasksByDate[ds] || []).length
          const isSelected = selectedDay === ds
          const isToday = ds === localDayStr()
          return (
            <div key={ds}
              className={`cal-cell${count ? ' has-tasks' : ''}${isSelected ? ' selected' : ''}${isToday ? ' is-today' : ''}`}
              onClick={() => count && setSelectedDay(isSelected ? null : ds)}
            >
              <span className="cal-day-num">{day}</span>
              {count > 0 && <span className="cal-day-count">{count}</span>}
            </div>
          )
        })}
      </div>
      {selectedDay && (
        <div className="archive-day-panel">
          <div className="archive-day-header">
            <span className="archive-day-date">
              {new Date(selectedDay + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="archive-day-count-badge">{selectedTasks.length} task{selectedTasks.length !== 1 ? 's' : ''}</span>
          </div>
          {selectedTasks.map(task => {
            const taskUpdates = updatesForTask(task.id)
            return (
              <div key={task.id} className="archive-task-card">
                <div className="archive-task-main">
                  <span className={`status-dot ${task.priority}`} style={{ width: 8, height: 8 }} />
                  <span className="archive-task-title">{task.title}</span>
                  {projectName(task.project_id) && (
                    <span className="project-tag">{projectName(task.project_id)}</span>
                  )}
                </div>
                {task.notes && <p className="task-notes" style={{ paddingLeft: '1.1rem' }}>{task.notes}</p>}
                {taskUpdates.length > 0 && (
                  <div className="archive-task-updates">
                    {taskUpdates.map(u => (
                      <div key={u.id} className="update-item">
                        <span className="update-body">{u.body}</span>
                        <span className="update-meta">
                          {u.profiles?.display_name && <>{u.profiles.display_name} · </>}
                          {formatDate(u.created_at.slice(0, 10))}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
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

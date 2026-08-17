import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import {
  DndContext, DragOverlay, MouseSensor, TouchSensor,
  useSensor, useSensors, closestCenter,
} from '@dnd-kit/core'
import {
  SortableContext, useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { useNavigate } from 'react-router-dom'
import { projectDotColor, projectTintClass } from '../lib/projectColors'
import { MAX_DOING, MAX_UP_NEXT, BAND_LIMITS, bandFull } from '../lib/boardLimits'
import { useGarden } from '../context/GardenContext'
import DailyCaps from './DailyCaps'
import Trak from './Trak'
import {
  seedByKey, remainingSeconds, formatDuration, growthStage, GROWTH_STAGES, liveStreak,
} from '../lib/garden'
import './TaskBoard.css'

const STATUSES     = ['todo', 'in_progress', 'done', 'archived']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done', archived: 'Archived' }
const FORM_STATUSES = ['todo', 'in_progress', 'done']
const PRIORITIES    = ['high', 'medium', 'low']
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }

// Recurring tasks. A repeat isn't a schedule that fires on its own — finishing
// the task is what mints the next one, so a weekly chore you did late moves
// with you rather than piling up unfinished copies behind you.
export const RECURRENCES = [
  { key: 'daily',   label: 'Daily',   short: 'Daily' },
  { key: 'weekly',  label: 'Weekly',  short: 'Weekly' },
  { key: 'monthly', label: 'Monthly', short: 'Monthly' },
]
const RECURRENCE_LABELS = Object.fromEntries(RECURRENCES.map(r => [r.key, r.short]))

// The board is laid out as full-width horizontal bands, one per status, with
// each band's tasks in a two-column grid — the Beech & Baize taskboard design.
// Reading order inside a band is down the left column, then the right.
//
// The band order is also the advance order and the braindump tray order: one
// source of truth, as the handoff asks.
const BANDS = [
  { key: 'todo',        label: 'Up next' },
  { key: 'in_progress', label: 'Doing' },
  { key: 'done',        label: 'Done today' },
]
const BAND_KEYS = BANDS.map(b => b.key)

// Names used on the move controls and limit notices. STATUS_LABELS is the
// form's vocabulary ("To Do"); these are the board's ("Up next").
const MOVE_LABELS = {
  braindump: 'Braindump', todo: 'Up next', in_progress: 'Doing',
  done: 'Done today', archived: 'Archived',
}

// BANDS above is the *canonical* order: it drives which way ∧ and ∨ move a
// task, and the braindump tray's 1–3 keys. The board is *displayed* bottom-up —
// greenhouse, then Done today, Doing, Up next — so the freshest state is at the
// top and the backlog is what you scroll down into.
const BANDS_DISPLAY = [...BANDS].reverse()



// Captured but not yet triaged. These are real task rows — same table, same
// realtime — carrying a status the board deliberately doesn't render.
const BRAINDUMP = 'braindump'

// The limits and the one full-band check now live in lib/boardLimits.js — the
// garden defines a Doing "clear" as a full column's worth of finished work and
// needs to read MAX_DOING without importing JSX. Re-exported here because
// BoardPage and others already import them from this module.
export { MAX_DOING, MAX_UP_NEXT }

// A capture that couldn't land where it was aimed. Said out loud rather than
// silently: a task that isn't where you put it is worse than one that was
// refused, unless you're told.
function divertNotice(status) {
  return `${MOVE_LABELS[status]} is full — filed to the braindump instead.`
}

function bandFullNotice(status) {
  return `${MOVE_LABELS[status]} holds ${BAND_LIMITS[status]}.`
    + (status === 'todo'
      ? ' Finish something, or send this to the braindump.'
      : ' Finish one to free a slot.')
}

// The move controls' arrow. Drawn rather than typed: ‹ and › are ordinary
// punctuation, but their vertical counterparts (⌃ ⌄ ∧ ∨) render at wildly
// different weights and baselines across platforms.
function Chevron({ up }) {
  return (
    <svg width="14" height="14" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
      <path
        d={up ? 'M3 7.5 L6 4.5 L9 7.5' : 'M3 4.5 L6 7.5 L9 4.5'}
        fill="none" stroke="currentColor" strokeWidth="2"
        strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}

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

// A task is pending approval if any assignee OTHER than its creator hasn't
// yet accepted (still pending, or has suggested a change awaiting the
// creator's review). Declining removes the row entirely (see the
// respond_to_task_assignment RPC), so it can never block a task here.
function isPendingApproval(task) {
  return (task.task_assignees || []).some(a => a.user_id !== task.user_id && a.response_status !== 'accepted')
}

// ─── Main component ─────────────────────────────────────────────────────────

export default function TaskBoard({
  tasks, teamMembers, projects, projectMembers, taskUpdates,
  currentUserId, currentTeamId,
  onAdd, onUpdate, onDelete, onAddUpdate, onDeleteUpdate, onUpdateAssignees,
  onRespondToAssignment, onResolveChangeRequest, onTaskDone, onManageProjects,
}) {
  const [showForm, setShowForm]   = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm]           = useState(defaultForm())
  const [activeTab, setActiveTab] = useState('board')
  const [datePickerOpen, setDatePickerOpen] = useState(false)
  const [formNotice, setFormNotice] = useState('')
  const titleRef = useRef(null)
  // The garden's toast layer, so a diverted capture is still announced once the
  // drawer has closed behind it.
  const { notify } = useGarden() || {}

  // People filter: which teammates' tasks to show. Default = only me (tasks
  // I'm assigned to). "Everyone" shows the whole team board.
  const [peopleEveryone, setPeopleEveryone] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState(() => new Set(currentUserId ? [currentUserId] : []))

  // With no scrim, Escape is the keyboard route out of the drawer.
  useEffect(() => {
    if (!showForm) return
    function onKey(e) { if (e.key === 'Escape') cancelForm() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [showForm])

  // Reset the filter to "just me" whenever the team (or user) changes.
  useEffect(() => {
    setSelectedMembers(new Set(currentUserId ? [currentUserId] : []))
    setPeopleEveryone(false)
  }, [currentTeamId, currentUserId])

  function defaultForm() {
    return { title: '', notes: '', status: 'todo', priority: '', due_date: '', project_id: null, recurrence: null, assigneeIds: [] }
  }

  // Quick capture: keeping the drawer open after an add lets you type the next
  // task straight away. The chips (priority, project, due date) deliberately
  // survive — a capture run is usually several tasks of the same shape.
  // `overrides` lets a control commit a value *and* submit in the same click —
  // the project pills do exactly that, and reading `form` here would still see
  // the pre-click state.
  async function handleSubmit(e, keepGoing = false, overrides = {}) {
    e.preventDefault()
    if (!form.title.trim()) return
    const { assigneeIds, ...rest } = { ...form, ...overrides }
    const payload = { ...rest, priority: rest.priority || 'medium', due_date: rest.due_date || null, project_id: rest.project_id || null }
    // The limits hold on create and edit too, or the form is the way around
    // them — but a full board must never refuse a capture. Editing a task into
    // a full band is a deliberate move and still gets stopped; a NEW task with
    // nowhere to land goes to the braindump, which exists for exactly this.
    let divertedTo = null
    if (bandFull(tasks, payload.status, editingId)) {
      if (editingId) {
        setFormNotice(bandFullNotice(payload.status))
        return
      }
      divertedTo = payload.status
      payload.status = BRAINDUMP
      notify?.(divertNotice(divertedTo), 'capped')
    }
    if (editingId) {
      await onUpdate(editingId, payload)
      await onUpdateAssignees(editingId, assigneeIds)
      setEditingId(null)
    } else {
      const newId = await onAdd({ ...payload, assigneeIds })
      // newId returned by BoardPage
    }
    if (keepGoing && !editingId) {
      setForm(f => ({ ...defaultForm(), priority: f.priority, status: f.status, project_id: f.project_id, recurrence: f.recurrence }))
      setDatePickerOpen(false)
      setFormNotice(divertedTo ? divertNotice(divertedTo) : 'Added — keep typing.')
      titleRef.current?.focus()
      return
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
      recurrence:  task.recurrence || null,
      assigneeIds: (task.task_assignees || []).map(a => a.user_id),
    })
    setEditingId(task.id)
    setShowForm(true)
  }

  function cancelForm() { setForm(defaultForm()); setEditingId(null); setDatePickerOpen(false); setShowForm(false); setFormNotice('') }

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

  // Individual filter chips are scoped to teammates who share at least one
  // project with the current user — you can only "view" someone's tasks if
  // you're on a project together. (The underlying task data isn't restricted
  // by this — it's just which people are offered as filter choices.)
  const projectMateIds = useMemo(() => {
    const myProjectIds = new Set(
      (projectMembers || []).filter(pm => pm.user_id === currentUserId).map(pm => pm.project_id)
    )
    const mates = new Set()
    ;(projectMembers || []).forEach(pm => { if (myProjectIds.has(pm.project_id)) mates.add(pm.user_id) })
    mates.delete(currentUserId)
    return mates
  }, [projectMembers, currentUserId])

  const otherMembers = teamMembers.filter(m => m.id !== currentUserId && projectMateIds.has(m.id))

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

  // Pending-approval tasks stay on the board in their normal status zones with
  // a "Pending" badge; the Pending Assignments tab is just a focused shortcut
  // for the people who need to accept/decline them.
  const byStatus = (status) => visibleTasks.filter(t => t.status === status)

  // The pile is deliberately outside the people filter: it's your own capture
  // buffer, not shared work, and nothing in it has an assignee yet.
  const dumpTasks = useMemo(
    () => tasks.filter(t => t.status === BRAINDUMP)
      .sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
    [tasks],
  )

  // Tasks needing attention in the Pending tab:
  //  • pending-approval tasks that involve me (I created them and am waiting on
  //    responses, or I'm a still-pending assignee myself), and
  //  • tasks with nobody attached at all — they need someone assigned, so they
  //    surface here for triage regardless of who created them.
  // This intentionally bypasses the people filter.
  const pendingTasksForMe = useMemo(() => tasks.filter(t => {
    if (t.status === 'archived' || t.status === 'done' || t.status === BRAINDUMP) return false
    const unassigned = (t.task_assignees || []).length === 0 && !t.assignee_id
    if (unassigned) return true
    return isPendingApproval(t) && (
      t.user_id === currentUserId ||
      (t.task_assignees || []).some(a => a.user_id === currentUserId)
    )
  }), [tasks, currentUserId])

  // Capture drops a bare title into the pile: no priority, no date. The project
  // is the one exception, and it's optional — it costs a click you've usually
  // already made (the pill stays selected between captures), and knowing which
  // project a thought belongs to is the thing you forget first and can least
  // reconstruct later. Everything else can still wait for triage.
  async function captureToDump(title, projectId = null) {
    await onAdd({
      title, notes: '', status: BRAINDUMP, priority: 'medium',
      due_date: null, project_id: projectId, recurrence: null, assigneeIds: [],
    })
  }

  // Triage is a plain status change, so an item can't be lost between tables.
  // Landing straight in Done counts as a completion like any other.
  async function sortFromDump(task, status) {
    if (bandFull(tasks, status)) return bandFullNotice(status)
    await onUpdate(task.id, { status })
    if (status === 'done') onTaskDone?.({ ...task, status: BRAINDUMP })
    return null
  }

  function resolveAssignees(task) {
    return (task.task_assignees || [])
      .map(a => teamMembers.find(m => m.id === a.user_id))
      .filter(Boolean)
  }

  return (
    <div className="board">
      {showForm && (
        // A drawer, not a modal: no scrim, so the board behind stays live and
        // you can keep dragging cards while a task is open. That's the whole
        // point of the side-drawer direction — it's built for triage runs.
        <div className="task-drawer-wrap">
          <form className="task-form task-drawer" onSubmit={handleSubmit}>
            <div className="drawer-head">
              <h2>{editingId ? 'Edit Task' : 'New Task'}</h2>
              <button type="button" className="drawer-close" aria-label="Close" onClick={cancelForm}>✕</button>
            </div>
            <label>Title
              <input autoFocus ref={titleRef} value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !editingId) { e.preventDefault(); handleSubmit(e, true) }
                }}
                placeholder="What needs to be done?" />
            </label>
            {!editingId && <p className="capture-hint">⏎ add &amp; keep going</p>}
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
                    onClick={() => { setForm(f => ({ ...f, priority: f.priority === p ? '' : p })); setFormNotice('') }}
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
              <span className="qc-vr" />
              {/* Repeat is off unless chosen — clicking the active one clears
                  it, same as the priority dots. */}
              <div className="qc-repeat" role="group" aria-label="Repeats">
                <span className="qc-cal" aria-hidden="true">🔁</span>
                {RECURRENCES.map(r => (
                  <button
                    key={r.key} type="button"
                    className={`qc-rep${form.recurrence === r.key ? ' selected' : ''}`}
                    aria-pressed={form.recurrence === r.key}
                    onClick={() => setForm(f => ({ ...f, recurrence: f.recurrence === r.key ? null : r.key }))}
                  >{r.short}</button>
                ))}
              </div>
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

            {/* On a new task the project pills ARE the submit: picking where it
                goes is the last decision, so it may as well be the one that
                files the card. "No project" is always offered — including when
                there are no projects at all, which is otherwise a dead end.
                While editing they stay a plain selector, because saving an
                edit shouldn't be a side effect of retagging it. */}
            <div className="qc-projects">
              <span className="qc-plabel">{editingId ? 'Project' : 'Add to'}</span>
              <div className="qc-pills">
                {projects.map(p => (
                  <button
                    key={p.id} type="button"
                    className={`qc-pj${form.project_id === p.id ? ' selected' : ''}${editingId ? '' : ' qc-pj-submit'}`}
                    aria-pressed={editingId ? form.project_id === p.id : undefined}
                    disabled={!editingId && !form.title.trim()}
                    onClick={e => {
                      if (editingId) {
                        setForm(f => ({ ...f, project_id: f.project_id === p.id ? null : p.id }))
                      } else {
                        setForm(f => ({ ...f, project_id: p.id }))
                        handleSubmit(e, false, { project_id: p.id })
                      }
                    }}
                  >
                    <span className="qc-pjdot" style={{ background: projectDotColor(p.id) }} />
                    {p.name}
                  </button>
                ))}
                <button
                  type="button"
                  className={`qc-pj qc-pj-none${!form.project_id ? ' selected' : ''}${editingId ? '' : ' qc-pj-submit'}`}
                  aria-pressed={editingId ? !form.project_id : undefined}
                  disabled={!editingId && !form.title.trim()}
                  onClick={e => {
                    if (editingId) setForm(f => ({ ...f, project_id: null }))
                    else handleSubmit(e, false, { project_id: null })
                  }}
                >No project</button>
              </div>
            </div>
            {formNotice && <p className="form-notice">{formNotice}</p>}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={cancelForm}>Cancel</button>
              {editingId
                ? <button type="submit" className="btn-primary">Save</button>
                : <span className="form-actions-hint">Pick a project above to add it</span>}
            </div>
          </form>
        </div>
      )}

      <PriorityBoard
        tasks={visibleTasks}
        pendingTasks={pendingTasksForMe}
        currentUserId={currentUserId}
        onRespondToAssignment={onRespondToAssignment}
        onResolveChangeRequest={onResolveChangeRequest}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        byStatus={byStatus}
        dumpTasks={dumpTasks}
        onCapture={captureToDump}
        onSortFromDump={sortFromDump}
        peopleFilter={{
          show: showPeopleFilter,
          me: meMember,
          others: otherMembers,
          currentUserId,
          selected: selectedMembers,
          everyone: peopleEveryone,
          onToggle: toggleMember,
          onEveryone: () => setPeopleEveryone(true),
        }}
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
        onOpenForm={() => { setShowForm(true); setEditingId(null); setForm(defaultForm()) }}
        onManageProjects={onManageProjects}
      />
    </div>
  )
}

// ─── Priority board (owns DndContext) ────────────────────────────────────────

function PriorityBoard({
  tasks, pendingTasks, currentUserId, onRespondToAssignment, onResolveChangeRequest,
  activeTab, setActiveTab, byStatus, peopleFilter,
  dumpTasks, onCapture, onSortFromDump,
  projectName, updatesForTask, resolveAssignees, teamMembers,
  onUpdate, onDelete, onAddUpdate, onDeleteUpdate, onUpdateAssignees, onStartEdit, onOpenForm, onTaskDone, onManageProjects,
}) {
  const [activeId, setActiveId] = useState(null)
  const [zoneNotice, setZoneNotice] = useState('')
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

  // Mouse and touch split apart rather than one PointerSensor, matching the
  // garden. A pointer sensor treats a finger like a mouse: 5px of movement
  // starts a drag, and 5px is inside the slop of an ordinary tap, so on a
  // phone tapping a task to open it could pick it up instead. Touch gets a
  // deliberate press-and-hold; the mouse keeps its instant 5px.
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } })
  )

  useEffect(() => {
    if (!zoneNotice) return
    const t = setTimeout(() => setZoneNotice(''), 4000)
    return () => clearTimeout(t)
  }, [zoneNotice])

  // Within a column, High floats to the top — priority stops being the board's
  // structure but still decides order inside a lane.
  const PRIORITY_RANK = { high: 0, medium: 1, low: 2 }
  function getColumnTasks(status) {
    return tasks
      .filter(t => t.status === status)
      .sort((a, b) => {
        const ra = PRIORITY_RANK[a.priority] ?? 1, rb = PRIORITY_RANK[b.priority] ?? 1
        if (ra !== rb) return ra - rb
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
    const tgtStatus = overId.startsWith('col-')
      ? overId.replace('col-', '')
      : (tasks.find(t => t.id === over.id)?.status ?? srcTask.status)

    const colTasks = getColumnTasks(tgtStatus).filter(t => t.id !== active.id)

    if (tgtStatus !== srcTask.status && bandFull(tasks, tgtStatus, active.id)) {
      setZoneNotice(bandFullNotice(tgtStatus))
      return
    }

    let insertIdx = colTasks.length
    if (!overId.startsWith('col-')) {
      const idx = colTasks.findIndex(t => t.id === over.id)
      if (idx !== -1) insertIdx = idx
    }

    const prev = colTasks[insertIdx - 1]
    const next = colTasks[insertIdx]
    let newPosition
    if (!prev && !next)   newPosition = 1000
    else if (!prev)       newPosition = (next.position ?? 0) - 1
    else if (!next)       newPosition = (prev.position ?? 0) + 1
    else                  newPosition = ((prev.position ?? 0) + (next.position ?? 0)) / 2

    onUpdate(active.id, { status: tgtStatus, position: newPosition })
    // Dropping into Done is a completion like any other — it should bank the
    // reward and fire the cloud, not just move the card.
    if (tgtStatus === 'done' && srcTask.status !== 'done') onTaskDone?.(srcTask)
  }

  const activeTask = activeId ? tasks.find(t => t.id === activeId) : null
  // Dragging already enforced this; the ∧ / ∨ controls and the action bar were
  // routes around it.
  const isFull = status => bandFull(tasks, status)

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter}
      onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="board-panel">
        {peopleFilter.show && (
          <div className="people-bar">
            <span className="people-label">Viewing</span>
            {peopleFilter.me && (
              <button
                type="button"
                className={`people-chip${!peopleFilter.everyone && peopleFilter.selected.has(peopleFilter.currentUserId) ? ' selected' : ''}`}
                aria-pressed={!peopleFilter.everyone && peopleFilter.selected.has(peopleFilter.currentUserId)}
                onClick={() => peopleFilter.onToggle(peopleFilter.currentUserId)}
              >
                <span className="people-ini">{initials(peopleFilter.me.display_name)}</span>
                My tasks
              </button>
            )}
            {peopleFilter.others.length > 0 && <span className="people-vr" />}
            {peopleFilter.others.map(m => (
              <button
                key={m.id}
                type="button"
                className={`people-chip${!peopleFilter.everyone && peopleFilter.selected.has(m.id) ? ' selected' : ''}`}
                aria-pressed={!peopleFilter.everyone && peopleFilter.selected.has(m.id)}
                title={m.display_name}
                onClick={() => peopleFilter.onToggle(m.id)}
              >
                <span className="people-ini">{initials(m.display_name)}</span>
                {(m.display_name || '?').split(/\s+/)[0]}
              </button>
            ))}
            <span className="people-vr" />
            <button
              type="button"
              className={`people-chip people-everyone${peopleFilter.everyone ? ' selected' : ''}`}
              aria-pressed={peopleFilter.everyone}
              onClick={peopleFilter.onEveryone}
            >Everyone</button>
          </div>
        )}
        <div className="tabs">
          <div className="tabs-left">
            {peopleFilter.show && (
              <>
                <button
                  className={`tab tab-pending ${activeTab === 'pending' ? 'active' : ''}${pendingTasks.length ? ' has-pending' : ''}`}
                  onClick={() => setActiveTab('pending')}
                >
                  <span className="status-dot pending" />
                  Pending Assignments
                  <span className="tab-count">{pendingTasks.length}</span>
                </button>
                <div className="tab-divider" />
              </>
            )}
            <button
              className={`tab ${activeTab === 'board' ? 'active' : ''}`}
              onClick={() => setActiveTab('board')}
            >
              <span className="status-dot todo" />
              Board
            </button>
            <div className="tab-divider" />
            <button
              className={`tab tab-dump ${activeTab === 'braindump' ? 'active' : ''}${dumpTasks.length ? ' has-pending' : ''}`}
              onClick={() => setActiveTab('braindump')}
            >
              <span className="status-dot pending" />
              Braindump
            </button>
            <div className="tab-divider" />
            <button
              className={`tab tab-archived ${activeTab === 'archived' ? 'active' : ''}`}
              onClick={() => setActiveTab('archived')}
            >
              <span className="status-dot archived" />
              Archived
            </button>
          </div>
          <div className="tabs-actions">
            {/* Personal boards only — a team's projects are managed from the
                community page, which has room for the two-column version. */}
            {onManageProjects && (
              <button className="btn-ghost btn-sm" onClick={onManageProjects}>Projects</button>
            )}
            <button className="btn-primary btn-sm" onClick={onOpenForm}>+ Add Task</button>
          </div>
        </div>

        {activeTab === 'pending' ? (
          <PendingAssignmentsList
            tasks={pendingTasks}
            currentUserId={currentUserId}
            teamMembers={teamMembers}
            projectName={projectName}
            onRespond={onRespondToAssignment}
            onResolve={onResolveChangeRequest}
            onAssign={onUpdateAssignees}
            onDelete={onDelete}
          />
        ) : activeTab === 'archived' ? (
          <ArchiveCalendar
            tasks={byStatus('archived')}
            updatesForTask={updatesForTask}
            projectName={projectName}
          />
        ) : activeTab === 'braindump' ? (
          <Braindump
            items={dumpTasks}
            bands={BANDS}
            laneCounts={Object.fromEntries(BAND_KEYS.map(k => [k, byStatus(k).length]))}
            projectName={projectName}
            projects={projects}
            onCapture={onCapture}
            onSort={onSortFromDump}
            onDelete={onDelete}
            onBack={() => setActiveTab('board')}
          />
        ) : (
          <div className="board-bands">
            {zoneNotice && <div className="zone-notice">{zoneNotice}</div>}

            <GreenhouseStrip doneToday={byStatus('done').length} />

            {BANDS_DISPLAY.map(band => (
              <Band key={band.key} status={band.key} label={band.label}
                isFull={isFull}
                onBlocked={setZoneNotice}
                tasks={getColumnTasks(band.key)}
                limit={BAND_LIMITS[band.key] ?? null}
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

            {/* Under Up next, which is the bottom of the board: the bands are
                what you came for, and the quests are what to do once you've
                read them. */}
            <QuestStrip />
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

// ─── Pending assignments ─────────────────────────────────────────────────────

function memberName(teamMembers, id) {
  return teamMembers.find(m => m.id === id)?.display_name || 'Unknown'
}

function PendingAssignmentsList({ tasks, currentUserId, teamMembers, projectName, onRespond, onResolve, onAssign, onDelete }) {
  if (tasks.length === 0) {
    return <div className="empty-col">No pending assignments — everyone's accepted.</div>
  }
  return (
    <div className="pending-list">
      {tasks.map(task => (
        <PendingAssignmentRow
          key={task.id}
          task={task}
          currentUserId={currentUserId}
          teamMembers={teamMembers}
          projectName={projectName(task.project_id)}
          onRespond={onRespond}
          onResolve={onResolve}
          onAssign={onAssign}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}

function PendingAssignmentRow({ task, currentUserId, teamMembers, projectName, onRespond, onResolve, onAssign, onDelete }) {
  const [formMode, setFormMode] = useState(null) // null | 'decline' | 'suggest'
  const [busy, setBusy] = useState(false)
  const isCreator = task.user_id === currentUserId
  const myRow = (task.task_assignees || []).find(a => a.user_id === currentUserId)
  const otherRows = (task.task_assignees || []).filter(a => a.user_id !== task.user_id)
  const isUnassigned = (task.task_assignees || []).length === 0 && !task.assignee_id

  async function handle(response, extra) {
    setBusy(true)
    try {
      await onRespond(task.id, response, extra)
      setFormMode(null)
    } finally {
      setBusy(false)
    }
  }

  async function handleResolve(assigneeId, apply) {
    setBusy(true)
    try {
      await onResolve(task.id, assigneeId, apply)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="pending-card">
      <div className="pending-card-top">
        <span className={`status-dot ${task.priority}`} style={{ width: 8, height: 8 }} />
        <span className="pending-title">{task.title}</span>
        {projectName && <span className="project-tag">{projectName}</span>}
        {task.due_date && <span className="due-badge">{formatDate(task.due_date)}</span>}
      </div>
      {task.notes && <p className="task-notes" style={{ paddingLeft: '1.1rem' }}>{task.notes}</p>}

      <div className="pending-assignees">
        <span className="pending-created-by">
          Created by {isCreator ? 'you' : memberName(teamMembers, task.user_id)}
        </span>
        {isUnassigned && <span className="pending-status-chip status-pending">Unassigned</span>}
        {otherRows.map(a => (
          <span key={a.user_id} className={`pending-status-chip status-${a.response_status}`}>
            {memberName(teamMembers, a.user_id)}
            {a.response_status === 'accepted' && ' · Accepted'}
            {a.response_status === 'pending' && ' · Waiting'}
            {a.response_status === 'change_requested' && ' · Suggested a change'}
          </span>
        ))}
      </div>

      {isUnassigned && (
        <div className="pending-my-actions pending-assign-row">
          <span className="pending-assign-label">Assign to:</span>
          <div className="action-assign">
            {teamMembers.map(m => (
              <button key={m.id} type="button" title={m.display_name}
                className="action-assign-chip"
                disabled={busy}
                onClick={async () => { setBusy(true); try { await onAssign(task.id, [m.id]) } finally { setBusy(false) } }}>
                {initials(m.display_name)}
              </button>
            ))}
          </div>
          <button className="action-btn action-danger btn-sm" disabled={busy}
            onClick={() => onDelete(task.id)}>Delete</button>
        </div>
      )}

      {isCreator && otherRows.filter(a => a.response_status === 'change_requested').map(a => (
        <div key={a.user_id} className="pending-suggestion">
          <p className="pending-suggestion-text">
            <strong>{memberName(teamMembers, a.user_id)}</strong> suggested
            {a.suggested_priority && <> priority <strong>{PRIORITY_LABELS[a.suggested_priority]}</strong></>}
            {a.suggested_priority && a.suggested_due_date && ' and'}
            {a.suggested_due_date && <> due date <strong>{formatDate(a.suggested_due_date)}</strong></>}
            : &ldquo;{a.response_reason}&rdquo;
          </p>
          <div className="pending-suggestion-actions">
            <button className="btn-primary btn-sm" disabled={busy} onClick={() => handleResolve(a.user_id, true)}>Apply suggestion</button>
            <button className="btn-ghost btn-sm" disabled={busy} onClick={() => handleResolve(a.user_id, false)}>Keep original</button>
          </div>
        </div>
      ))}

      {myRow && myRow.response_status === 'pending' && (
        formMode ? (
          <AssignmentResponseForm
            mode={formMode}
            busy={busy}
            onCancel={() => setFormMode(null)}
            onSubmit={extra => handle(formMode === 'decline' ? 'declined' : 'change_requested', extra)}
          />
        ) : (
          <div className="pending-my-actions">
            <button className="btn-primary btn-sm" disabled={busy} onClick={() => handle('accepted')}>Accept</button>
            <button className="btn-ghost btn-sm" disabled={busy} onClick={() => setFormMode('suggest')}>Suggest change</button>
            <button className="action-btn action-danger btn-sm" disabled={busy} onClick={() => setFormMode('decline')}>Decline</button>
          </div>
        )
      )}
      {myRow && myRow.response_status === 'change_requested' && (
        <p className="pending-waiting-note">Waiting for {memberName(teamMembers, task.user_id)} to review your suggested change.</p>
      )}
    </div>
  )
}

function AssignmentResponseForm({ mode, busy, onCancel, onSubmit }) {
  const [reason, setReason] = useState('')
  const [priority, setPriority] = useState('')
  const [dueDate, setDueDate] = useState('')

  function submit() {
    if (!reason.trim()) return
    onSubmit(mode === 'suggest'
      ? { reason: reason.trim(), suggestedPriority: priority || null, suggestedDueDate: dueDate || null }
      : { reason: reason.trim() })
  }

  return (
    <div className="response-form">
      {mode === 'suggest' && (
        <div className="response-form-row">
          <div className="qc-prio" role="group" aria-label="Suggested priority">
            {PRIORITIES.map(p => (
              <button key={p} type="button"
                className={`qc-dot prio-${p}${priority === p ? ' selected' : ''}`}
                aria-pressed={priority === p} title={PRIORITY_LABELS[p]}
                onClick={() => setPriority(pr => pr === p ? '' : p)}
              ><span /></button>
            ))}
          </div>
          <input type="date" className="response-date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
        </div>
      )}
      <textarea
        autoFocus
        rows={2}
        className="response-reason"
        value={reason}
        onChange={e => setReason(e.target.value)}
        placeholder={mode === 'decline' ? 'Reason for declining (required)…' : 'Why suggest this change? (required)…'}
      />
      <div className="response-form-actions">
        <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
        <button type="button" className="btn-primary btn-sm" disabled={busy || !reason.trim()} onClick={submit}>
          {mode === 'decline' ? 'Confirm decline' : 'Send suggestion'}
        </button>
      </div>
    </div>
  )
}

// ─── Priority zone ───────────────────────────────────────────────────────────

function Band({ status, label, tasks, limit, isFull, onBlocked, resolveAssignees, projectName, updatesForTask, teamMembers, onEdit, onDelete, onUpdate, onAddUpdate, onDeleteUpdate, onUpdateAssignees, draftUpdates, setDraft, onTaskDone }) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${status}` })
  const atLimit = limit != null && tasks.length >= limit

  // Done today is a tally, not a list. Finished work is the one thing you never
  // need to read — it just needs to be countable — and listing it pushed the
  // live bands off the screen. It still opens, because a mis-clicked task has
  // to be recoverable and each row's ∨ is the way back.
  const isTally = status === 'done'
  const [open, setOpen] = useState(false)
  const collapsed = isTally && !open

  // Up next used to cluster under project headings. Every row now carries its
  // project as a coloured pill and wears the same colour as its outline, which
  // says the same thing without spending a heading on it — and keeps the band
  // in two columns.
  const items = tasks.map(t => t.id)

  const renderRow = task => (
    <SortableTaskRow key={task.id} task={task}
      assignees={resolveAssignees(task)}
      project={task.project_id ? { id: task.project_id, name: projectName(task.project_id) || 'Unknown project' } : null}
      updates={updatesForTask(task.id)}
      teamMembers={teamMembers}
      onEdit={() => onEdit(task)}
      onDelete={() => onDelete(task.id)}
      onStatusChange={s => {
        if (s !== task.status && isFull?.(s)) { onBlocked?.(bandFullNotice(s)); return }
        onUpdate(task.id, { status: s })
        // Any route into Done banks the reward, not just the drag.
        if (s === 'done' && task.status !== 'done') onTaskDone?.(task)
      }}
      onAddUpdate={(body, status) => onAddUpdate(task.id, body, status)}
      onDeleteUpdate={onDeleteUpdate}
      onUpdateAssignees={ids => onUpdateAssignees(task.id, ids)}
      statuses={FORM_STATUSES} statusLabels={STATUS_LABELS}
      draftText={draftUpdates[task.id] || ''}
      onDraftChange={text => setDraft(task.id, text)}
      onTaskDone={onTaskDone}
    />
  )

  return (
    <section className={`band band-${status}${isOver ? ' band-over' : ''}${atLimit ? ' band-full' : ''}`}>
      <header className="band-head">
        <span className="band-pill">{label}</span>
        {/* Only where there's a limit: "2/2 tasks" is what explains a band
            refusing a task, and with one shown the noun agrees with the limit
            rather than the count. A bare count is decoration. */}
        {limit != null && (
          <span className="band-count">{tasks.length}/{limit} tasks</span>
        )}
        <span className="band-rule" />
        {/* One toggle, on the header line beside the band's own name — it acts
            on the whole band, so it belongs to the band and not to the tally
            that happens to be showing. */}
        {isTally && tasks.length > 0 && (
          <button className="tally-toggle" onClick={() => setOpen(o => !o)}>
            {open ? 'Hide' : 'Show'}
          </button>
        )}
      </header>
      <SortableContext items={items} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`band-body${collapsed ? ' tally' : ''}`}
        >
          {collapsed ? (
            <div className="band-tally">
              <span className="tally-num">{tasks.length}</span>
              <span className="tally-label">
                {tasks.length === 1 ? 'task finished today' : 'tasks finished today'}
              </span>
            </div>
          ) : tasks.map(task => renderRow(task))}
          {!collapsed && tasks.length === 0 && (
            <div className="band-empty">
              {status === 'done'
                ? 'Empty on purpose — finished cards leave for the garden.'
                : 'Nothing here. Drop a task in, or sort one from the braindump.'}
            </div>
          )}
        </div>
      </SortableContext>
    </section>
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

// The advance order is the canonical band order — one source of truth. Going
// back from the first band returns the task to the braindump rather than
// dead-ending, so a task can always be put back where it came from.
const NEXT_BAND = { todo: 'in_progress', in_progress: 'done' }
const PREV_BAND = { todo: BRAINDUMP, in_progress: 'todo', done: 'in_progress' }

// What the leading stripe and the chip say. They are always the same signal:
// the handoff is explicit that a stripe never appears without its matching
// chip, so both come from here.
function rowKind(task) {
  if (task.status === 'done') return 'done'
  if (task.priority === 'high') return 'hi'
  if (task.due_date) return 'due'
  return 'plain'
}

// Null for an ordinary row. "no date" was a slot spent saying nothing, and
// the stripe is only coloured for the kinds that still return something here,
// so the pairing between stripe and chip survives.
function rowChip(task, kind) {
  if (kind === 'done') return `done ${formatTime(task.updated_at || task.created_at)}`
  if (kind === 'hi') return 'high'
  if (kind === 'due') return formatDate(task.due_date)
  return null
}

// A project is worth a colour, not a heading: the pill names it and the row
// wears the same colour as its outline.
function rowStyle(project) {
  return project ? { '--sprint': projectDotColor(project.id) } : undefined
}

// A row: stripe, title, meta, and — permanently — the newest update. Folding
// the update behind a click was the wrong trade: the update IS the status, and
// it's the one line you come to the board to read. So the newest one is always
// on the row, with the composer under it; only the history costs a click.
function TaskRow({
  task, assignees, project, updates,
  teamMembers = [], onUpdateAssignees,
  onEdit, onDelete, onStatusChange, onAddUpdate, onDeleteUpdate,
  statuses, statusLabels,
  dragListeners, dragAttributes,
  draftText = '', onDraftChange, onTaskDone,
}) {
  const [detail, setDetail] = useState(false)
  const isArchived = task.status === 'archived'
  const isPending = isPendingApproval(task)

  const kind = rowKind(task)
  const chip = rowChip(task, kind)
  const owner = assignees.length
    ? (assignees.length > 1
        ? `${(assignees[0].display_name || '?').split(/\s+/)[0].toLowerCase()} +${assignees.length - 1}`
        : (assignees[0].display_name || '?').split(/\s+/)[0].toLowerCase())
    : 'unassigned'

  const next = NEXT_BAND[task.status]
  const prev = PREV_BAND[task.status]

  return (
    <>
      <div
        className={`paper-row kind-${kind}${isArchived ? ' archived' : ''}${project ? ' has-sprint' : ''}`}
        style={rowStyle(project)}
      >
        <div className="paper-main">
          {/* The stripe doubles as the drag handle: it runs the full height of
              the row and is the one part with nothing else to click. */}
          <span
            className="row-stripe"
            {...(dragListeners || {})} {...(dragAttributes || {})}
            aria-label={`Drag ${task.title}`}
          />
          {/* The row itself opens the task. Everything that used to unfold in
              place — notes, the update history, the composer, the action bar —
              lives in that panel now, so a band of four tasks stays four lines
              tall however much has been written on them. */}
          <button
            type="button"
            className="row-body"
            onClick={() => setDetail(true)}
            aria-label={`Open ${task.title}`}
          >
            <span className="row-title">
              {isPending && <span className="pending-badge" title="Waiting on assignment acceptance">Pending</span>}
              {task.recurrence && (
                <span className="repeat-badge" title={`Repeats ${RECURRENCE_LABELS[task.recurrence]?.toLowerCase()}`}>
                  🔁 {RECURRENCE_LABELS[task.recurrence]}
                </span>
              )}
              {task.title}
            </span>
            {/* Date, then who has it, then which project — and each is simply
                absent when there's nothing to say. A row that has to announce
                "no date, unassigned" is spending two slots on nothing. */}
            <span className="row-meta">
              {chip && <span className="row-chip">{chip}</span>}
              {assignees.length > 0 && <span>{owner}</span>}
              {project && (
                <span className={`row-sprint ${projectTintClass(project.id)}`}>{project.name}</span>
              )}
              {/* Not the update itself — just that there is one, so the row
                  says whether it's worth opening. */}
              {updates.length > 0 && (
                <span className="row-count">{updates.length} update{updates.length === 1 ? '' : 's'}</span>
              )}
              {!updates.length && task.notes && <span className="row-count">notes</span>}
            </span>
          </button>
          <span className="row-tail">
            {!isArchived && (
              <>
                <button
                  className="row-advance"
                  disabled={!next}
                  title={next ? `Move up to ${MOVE_LABELS[next]}` : 'Already done'}
                  aria-label={next ? `Move ${task.title} up to ${MOVE_LABELS[next]}` : 'Already done'}
                  onClick={() => next && onStatusChange(next)}
                ><Chevron up /></button>
                <button
                  className="row-back"
                  disabled={!prev}
                  title={prev === BRAINDUMP ? 'Send down to the braindump' : `Move down to ${MOVE_LABELS[prev]}`}
                  aria-label={prev === BRAINDUMP
                    ? `Send ${task.title} down to the braindump`
                    : `Move ${task.title} down to ${MOVE_LABELS[prev]}`}
                  onClick={() => prev && onStatusChange(prev)}
                ><Chevron /></button>
              </>
            )}
          </span>
        </div>
      </div>

      {detail && (
        <TaskDetail
          task={task} project={project} assignees={assignees} updates={updates}
          teamMembers={teamMembers} onUpdateAssignees={onUpdateAssignees}
          onEdit={onEdit} onDelete={onDelete} onStatusChange={onStatusChange}
          onAddUpdate={onAddUpdate} onDeleteUpdate={onDeleteUpdate}
          draftText={draftText} onDraftChange={onDraftChange} onTaskDone={onTaskDone}
          onClose={() => setDetail(false)}
        />
      )}
    </>
  )
}

// Everything about one task, in one place. This is where the writing happens:
// the board shows a task's name and shape, and the moment you want to know
// what has actually been going on you open it.
function TaskDetail({
  task, project, assignees, updates, teamMembers, onUpdateAssignees,
  onEdit, onDelete, onStatusChange,
  onAddUpdate, onDeleteUpdate, draftText = '', onDraftChange, onTaskDone, onClose,
}) {
  const assigneeIds = (task.task_assignees || []).map(a => a.user_id)
  const isArchived = task.status === 'archived'

  useEffect(() => {
    function onKey(e) { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Sorted here rather than trusted from the caller: `updatesForTask` hands
  // these over oldest-first.
  const recent = [...updates].sort((a, b) => b.created_at.localeCompare(a.created_at))
  const today = todayStr()
  const byDate = recent.reduce((acc, u) => {
    const d = u.created_at.slice(0, 10)
    if (!acc[d]) acc[d] = []
    acc[d].push(u)
    return acc
  }, {})
  const dates = Object.keys(byDate).sort((a, b) => b.localeCompare(a))

  function submitUpdate(newStatus) {
    const text = draftText.trim()
    if (!text) return
    onAddUpdate(text, newStatus)
    onDraftChange?.('')
    if (newStatus === 'done') onTaskDone?.(task)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="task-detail" onClick={e => e.stopPropagation()}>
        <header className="td-head">
          <div className="td-headings">
            <h3 className="td-title">{task.title}</h3>
            <div className="td-facts">
              <span className={`td-status s-${task.status}`}>{MOVE_LABELS[task.status]}</span>
              {project && (
                <span className={`row-sprint ${projectTintClass(project.id)}`}>{project.name}</span>
              )}
              {task.due_date && (
                <span className={`td-fact ${dueClass(task.due_date)}`}>due {formatDate(task.due_date)}</span>
              )}
              <span className="td-fact">{PRIORITY_LABELS[task.priority] || 'No'} priority</span>
              <span className="td-fact">
                {assignees.length
                  ? assignees.map(a => a.display_name).join(', ')
                  : 'Unassigned'}
              </span>
              {/* Up here with the pills rather than in a footer. Moving the
                  task is what the composer's buttons and the row's chevrons
                  are for, so only the two that change the task itself are
                  left — and Edit is the only route to its due date, priority
                  and project. */}
              {isArchived && (
                <button className="td-action" onClick={() => { onStatusChange('done'); onClose() }}>Unarchive</button>
              )}
              {!isArchived && <button className="td-action" onClick={() => { onEdit(); onClose() }}>Edit</button>}
              <button className="td-action danger" onClick={() => { onDelete(); onClose() }}>Delete</button>
            </div>
          </div>
          <button className="td-x" onClick={onClose} aria-label="Close">✕</button>
        </header>

        <div className="td-scroll">
          {task.notes && (
            <section className="td-section">
              <span className="td-label">Notes</span>
              <p className="td-notes">{task.notes}</p>
            </section>
          )}

          <section className="td-section">
            <span className="td-label">Updates</span>
            {!isArchived && (
              <div className="td-composer">
                <textarea
                  autoFocus
                  rows={3}
                  value={draftText}
                  onChange={e => onDraftChange?.(e.target.value)}
                  placeholder="What happened? What's the status now?"
                />
                <div className="composer-actions">
                  <span className="m-spacer" />
                  <button type="button" className="status-submit-btn todo" disabled={!draftText.trim()}
                    onClick={() => submitUpdate('todo')}>Up next</button>
                  <button type="button" className="status-submit-btn inprogress" disabled={!draftText.trim()}
                    onClick={() => submitUpdate('in_progress')}>Doing</button>
                  <button type="button" className="status-submit-btn done" disabled={!draftText.trim()}
                    onClick={() => submitUpdate('done')}>Done</button>
                </div>
              </div>
            )}

            {recent.length === 0 && <p className="td-empty">Nothing written down yet.</p>}
            {dates.map(date => (
              <div key={date} className="td-day">
                <span className="td-date">{date === today ? 'Today' : formatHistoryDate(date)}</span>
                {byDate[date].map(u => (
                  <div key={u.id} className="td-update">
                    <p className="td-update-body">{u.body}</p>
                    <span className="td-update-when">
                      {u.profiles?.display_name ? `${u.profiles.display_name} · ` : ''}
                      {formatTime(u.created_at)}
                    </span>
                    <button className="update-delete-btn" title="Delete update"
                      onClick={() => onDeleteUpdate?.(u.id)}>×</button>
                  </div>
                ))}
              </div>
            ))}
          </section>

          {teamMembers.length > 0 && !isArchived && (
            <section className="td-section">
              <span className="td-label">Assigned to</span>
              <div className="action-assign">
                {teamMembers.map(m => {
                  const assigned = assigneeIds.includes(m.id)
                  return (
                    <button key={m.id} type="button" title={m.display_name}
                      className={`action-assign-chip${assigned ? ' assigned' : ''}`}
                      onClick={() => onUpdateAssignees?.(assigned
                        ? assigneeIds.filter(id => id !== m.id)
                        : [...assigneeIds, m.id])}>
                      {initials(m.display_name)}
                    </button>
                  )
                })}
              </div>
            </section>
          )}
        </div>

      </div>
    </div>
  )
}

// ─── Braindump ───────────────────────────────────────────────────────────────

// How long an item has been sitting in the pile. The design shows this as the
// item's age, which is the only pressure the pile applies.
function ageOf(iso) {
  const mins = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.round(hrs / 24)}d`
}

// The pile, grouped by project, unfiled last.
//
// Order inside a group stays oldest-first — the age is the only pressure the
// pile applies, and re-sorting by project shouldn't cost you that. Unfiled
// sits at the bottom because it's the group you're trying to empty: anything
// still there is a thought you haven't placed yet.
function groupByProject(items, projectName) {
  const groups = new Map()
  for (const item of items) {
    const key = item.project_id || ''
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(item)
  }
  const named = [...groups.entries()]
    .filter(([key]) => key)
    .map(([key, list]) => ({ key, name: projectName(key) || 'Unknown project', list }))
    .sort((a, b) => a.name.localeCompare(b.name))
  const unfiled = groups.get('')
  return unfiled ? [...named, { key: '', name: 'Unfiled', list: unfiled }] : named
}

function Braindump({ items, bands, laneCounts, projectName, projects = [], onCapture, onSort, onDelete, onBack }) {
  const [draft, setDraft] = useState('')
  const [selected, setSelected] = useState(null)
  const [busy, setBusy] = useState(false)
  const [notice, setNotice] = useState('')
  // Which project the next capture lands in. Sticky across captures for the
  // same reason the composer's chips are: a dump run is usually one project's
  // worth of thinking, and re-picking it every line would be the friction the
  // braindump exists to avoid.
  const [captureProject, setCaptureProject] = useState(null)

  const groups = useMemo(() => groupByProject(items, projectName), [items, projectName])

  // A project that's been deleted shouldn't leave the next capture pointing at
  // nothing.
  useEffect(() => {
    if (captureProject && !projects.some(p => p.id === captureProject)) setCaptureProject(null)
  }, [projects, captureProject])

  // Selection follows the pile: if the selected item leaves, take the first
  // one that's left so a triage run never needs the mouse between items.
  useEffect(() => {
    if (selected && !items.some(i => i.id === selected)) {
      setSelected(items.length ? items[0].id : null)
    }
  }, [items, selected])

  const sortInto = useCallback(async status => {
    const item = items.find(i => i.id === selected)
    if (!item || busy) return
    setBusy(true)
    try {
      const err = await onSort(item, status)
      setNotice(err || '')
    } finally { setBusy(false) }
  }, [items, selected, busy, onSort])

  // 1–3 send the selected item to the matching band. Ignored while typing, or
  // the capture field would be unusable.
  useEffect(() => {
    function onKey(e) {
      if (selected == null) return
      if (e.target && /input|textarea/i.test(e.target.tagName)) return
      const i = bands.findIndex((_, n) => String(n + 1) === e.key)
      if (i >= 0) { e.preventDefault(); sortInto(bands[i].key) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [bands, selected, sortInto])

  async function submit(e) {
    e.preventDefault()
    const title = draft.trim()
    if (!title || busy) return
    setBusy(true)
    try { await onCapture(title, captureProject); setDraft(''); setNotice('') }
    finally { setBusy(false) }
  }

  return (
    <div className="dump-wrap">
      <div className="board-head">
        <span className="board-plaque">Braindump</span>
        <span className="board-summary">{items.length} unsorted</span>
        <div className="board-head-spacer" />
        <button className="bb-btn" onClick={onBack}>Back to board</button>
      </div>

      <div className="dump-grid">
        <div className="dump-pile">
          <form className="dump-capture" onSubmit={submit}>
            <input
              value={draft}
              onChange={e => setDraft(e.target.value)}
              placeholder="Dump it here — one line, one task"
              aria-label="Capture a task"
            />
            <button type="submit" className="bb-btn primary" disabled={!draft.trim() || busy}>Add</button>
          </form>

          {/* Where the next capture lands. Directly under the field because
              it's part of the same act — you pick it once and keep typing.
              "Unfiled" is always offered and is the default, so the pile can
              still take a thought that doesn't belong anywhere yet. */}
          {projects.length > 0 && (
            <div className="dump-projects" role="group" aria-label="File captures under">
              <span className="dump-plabel">File under</span>
              <div className="dump-pills">
                <button
                  type="button"
                  className={`dump-pj${captureProject === null ? ' selected' : ''}`}
                  aria-pressed={captureProject === null}
                  onClick={() => setCaptureProject(null)}
                >Unfiled</button>
                {projects.map(p => (
                  <button
                    key={p.id}
                    type="button"
                    className={`dump-pj${captureProject === p.id ? ' selected' : ''}`}
                    aria-pressed={captureProject === p.id}
                    onClick={() => setCaptureProject(captureProject === p.id ? null : p.id)}
                  >
                    <span className="dump-pjdot" style={{ background: projectDotColor(p.id) }} />
                    {p.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="dump-hint">
            click an item, then press 1–{bands.length} or hit a tray slot · oldest first
          </p>
          {notice && <p className="form-notice">{notice}</p>}

          {/* Grouped under project headers. The per-item chip goes with them —
              it said the same thing on every row of a group, and the header
              says it once. */}
          <div className="dump-list">
            {groups.map(group => (
              <div className="dump-group" key={group.key || 'unfiled'}>
                <div className={`dump-group-head${group.key ? '' : ' unfiled'}`}>
                  {group.key && (
                    <span className="dump-pjdot" style={{ background: projectDotColor(group.key) }} />
                  )}
                  <span className="dump-group-name">{group.name}</span>
                  <span className="dump-group-count">{group.list.length}</span>
                </div>
                {group.list.map(item => (
                  <div
                    key={item.id}
                    className={`dump-item${item.id === selected ? ' on' : ''}`}
                    tabIndex={0}
                    role="button"
                    aria-pressed={item.id === selected}
                    onClick={() => setSelected(item.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelected(item.id) } }}
                  >
                    <span className="dump-grab" />
                    <span className="dump-body">
                      <span className="dump-title">{item.title}</span>
                      <span className="dump-meta">
                        <span>{ageOf(item.created_at)}</span>
                        <span>typed</span>
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            ))}
            {items.length === 0 && (
              <div className="dump-empty">Nothing left in the pile. The board has it all.</div>
            )}
          </div>
        </div>

        <div className="dump-tray">
          <span className="tray-title">Sort into</span>
          {bands.map((band, i) => (
            <button
              key={band.key}
              className="tray-slot"
              disabled={selected == null || busy}
              onClick={() => sortInto(band.key)}
            >
              <span className="tray-key">{i + 1}</span>
              <span className="tray-name">{band.label}</span>
              <span className="tray-spacer" />
              <span className="tray-n">{laneCounts[band.key] ?? 0}</span>
            </button>
          ))}
          <span className="tray-rule" />
          <button
            className="tray-discard"
            disabled={selected == null || busy}
            onClick={() => {
              const item = items.find(i => i.id === selected)
              if (item && window.confirm(`Discard "${item.title}"?`)) onDelete(item.id)
            }}
          >Discard selected</button>
          <p className="tray-note">
            {selected == null
              ? 'Nothing selected — click an item on the left.'
              : `1 selected · hit a slot or press its number.`}
          </p>
        </div>
      </div>
    </div>
  )
}

// ─── Greenhouse strip ────────────────────────────────────────────────────────

// Pinned below the last band. The design carries its own toy economy — growth
// percentages and a "Water — 12 coins" button — but trakkit already has a real
// garden with grow timers, packets, clouds and banked overflow. Rather than
// running a second, contradictory economy, this reads the real one: the flower
// actually in the ground, its real stage, and the balances the board's own
// rewards feed. The button goes to the garden instead of watering.
function GreenhouseStrip({ doneToday }) {
  const { state, ready, quests } = useGarden()
  const navigate = useNavigate()
  const [, setTick] = useState(0)

  const growing = seedByKey(state?.growing_seed)
  // The remaining time is a live number, so it needs a heartbeat to stay true.
  useEffect(() => {
    if (!growing) return
    const id = setInterval(() => setTick(t => t + 1), 1000)
    return () => clearInterval(id)
  }, [growing])

  if (!ready) return null

  const remaining = remainingSeconds(state)
  const total = state?.growing_grow_seconds ?? growing?.growSeconds ?? 1
  const pct = growing ? Math.min(100, ((total - remaining) / total) * 100) : 0
  const stage = growthStage(pct, growing)
  const stageNo = GROWTH_STAGES.findIndex(s => s.key === stage.key) + 1
  const isReady = growing && remaining === 0
  const streak = liveStreak(state?.streak)

  const best = state?.streak?.best || 0
  // Only shown when there's something to collect. A permanent quest counter
  // would be one more number on a strip whose whole point is being short.
  const claimable = (quests || []).filter(q => q.claimable).length

  // Two lines: what's growing, then what today has paid out. The strip sits
  // above the bands, and the bands are the page — anything taller than this
  // pushes the actual work below the fold.
  // Trak stands at the left of the strip rather than in a tile of his own: it
  // is the only place on the board with two lines of vertical room already
  // spoken for, so he costs width and no height. What he says is whatever is
  // most actionable right now, and he's the way through to his quests.
  const say = claimable
    ? `${claimable === 1 ? 'A quest is' : `${claimable} quests are`} finished — claim it below`
    : isReady ? `Your ${growing.name.toLowerCase()} is done — keep it or sell it`
    : !growing ? 'Nothing growing. Plant a seed and I’ll watch it'
    : streak > 0 ? `${streak}-day streak. Finish one today to keep it`
    : 'Finish a task today and I’ll start your streak'

  return (
    <section className="greenhouse-strip">
      <div className={`gh-trak${claimable ? ' has-quest' : ''}`} title={say}>
        <Trak
          mood={claimable ? 'happy' : isReady ? 'point' : growing ? 'idle' : 'think'}
          size={88}
          pettable
        />
        {claimable > 0 && <span className="gh-trak-dot" aria-hidden="true" />}
      </div>

      <div className="gh-stack">
      <div className="gh-line">
        <span className="gh-emoji" aria-hidden="true">{growing ? stage.emoji : '🪴'}</span>
        <span className="gh-name">{growing ? growing.name : 'Greenhouse'}</span>
        {growing ? (
          <>
            <span className="gh-stage">stage {stageNo} of {GROWTH_STAGES.length} · {stage.label}</span>
            <div className="gh-bar" role="img" aria-label={`${Math.round(pct)}% grown`}>
              <span style={{ width: `${pct}%` }} />
            </div>
            <span className="gh-left">
              {isReady ? 'ready to harvest' : `${formatDuration(remaining)} left`}
            </span>
          </>
        ) : (
          <span className="gh-stage gh-idle">
            Nothing growing — open a packet and plant a seed.
          </span>
        )}
        <button
          className="bb-btn primary gh-go"
          onClick={() => navigate('/garden')}
          title={isReady
            ? 'Finished — keep it or sell it'
            : growing ? 'Clouds from finished tasks cut the wait' : 'Seeds come from adding tasks'}
        >
          {isReady ? 'Harvest →' : 'Garden →'}
        </button>
      </div>

      <div className="gh-chips">
        <span className="gh-chip" title="Coins you can spend in the shop">
          <span aria-hidden="true">🪙</span>{(state?.coins ?? 0).toLocaleString()} coins
        </span>
        <span
          className="gh-chip"
          title={streak > 0
            ? `Finish at least one task tomorrow to keep it going.${best > 0 ? ` Best: ${best} ${best === 1 ? 'day' : 'days'}.` : ''}`
            : `Finish a task today to start a streak.${best > 0 ? ` Best: ${best} ${best === 1 ? 'day' : 'days'}.` : ''}`}
        >
          <span aria-hidden="true">{streak > 0 ? '🔥' : '🌑'}</span>
          {streak} {streak === 1 ? 'day' : 'days'}
        </span>
        <span className="gh-chip" title="Tasks you've finished today">
          <span aria-hidden="true">✅</span>{doneToday} done today
        </span>
        <span className="gh-chip-rule" aria-hidden="true" />
        <DailyCaps state={state} />
      </div>
      </div>
    </section>
  )
}

// Trak's three quests. They live here and nowhere else: they're earned by
// working the board, so making you visit the garden to read them put the rules
// in a different room from the work that satisfies them.
//
// Because this is the only place they appear, it has to explain them — what
// each one asks, what it pays, when they change, and why the payout doesn't
// count against the day's caps.
function questLine(quests) {
  const claimable = quests.filter(q => q.claimable).length
  const claimed = quests.filter(q => q.claimed).length
  if (claimable) return `${claimable === 1 ? 'One is' : `${claimable} are`} finished — collect below.`
  if (claimed === quests.length) return 'All three done and paid. New ones at midnight.'
  if (claimed) return 'Good. Here’s what’s left of today’s three.'
  return 'Three a day, drawn from the date — everyone gets the same three.'
}

function QuestStrip() {
  const { quests, claimQuest, ready } = useGarden()
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState('')

  if (!ready || !quests?.length) return null

  async function claim(key) {
    setBusy(key)
    setError('')
    try { await claimQuest(key) }
    catch (e) { setError(e?.message || String(e)) }
    finally { setBusy(null) }
  }

  return (
    <section className="quest-strip">
      <div className="qs-head">
        <span className="qs-rabbit" aria-hidden="true">🐇</span>
        <span className="qs-title">Trak’s quests</span>
        <span className="qs-line">{questLine(quests)}</span>
      </div>

      {error && <p className="qs-error">{error}</p>}

      <div className="qs-list">
        {quests.map(q => (
          <div key={q.key} className={`qs-item${q.claimed ? ' done' : ''}${q.claimable ? ' ready' : ''}`}>
            <span className="qs-icon" aria-hidden="true">{q.icon}</span>
            <div className="qs-body">
              <p className="qs-name">{q.name}</p>
              {/* The rule, stated. A quest you have to infer from a name and a
                  fraction is a puzzle rather than a task. */}
              <p className="qs-blurb">{q.blurb}</p>
              <div className="qs-track">
                <span className="qs-bar"><span style={{ width: `${q.pct}%` }} /></span>
                <span className="qs-count">{q.value}/{q.goal}</span>
              </div>
            </div>
            <div className="qs-pay">
              <span className="qs-reward">
                {q.reward.coins} 🪙{q.reward.seeds ? ` · ${q.reward.seeds} 🌱` : ''}
              </span>
              {q.claimed ? (
                <span className="qs-state">Claimed</span>
              ) : (
                <button className="qs-claim" disabled={!q.claimable || busy === q.key} onClick={() => claim(q.key)}>
                  {busy === q.key ? '…' : 'Claim'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <p className="qs-foot">
        All three change at midnight and nothing carries over. What they pay is on top of
        your daily caps — a quest can only be done once a day, so there’s nothing to farm.
      </p>
    </section>
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

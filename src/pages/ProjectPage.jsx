import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import './ProjectPage.css'

const PRIORITIES      = ['high', 'medium', 'low']
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }
const STATUSES        = ['todo', 'in_progress', 'done']
const STATUS_LABELS   = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const PROJECT_STATUS_LABELS = { active: 'Active', on_hold: 'On Hold', completed: 'Completed' }

function todayStr() { return new Date().toISOString().slice(0, 10) }
function formatDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function formatTime(iso) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}
function formatHistDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase()
}

// A task is pending approval if any assignee other than its creator hasn't
// yet accepted. Pending tasks are hidden here — they only appear on the
// Taskboard's "Pending Assignments" tab until fully accepted.
function isPendingApproval(task) {
  return (task.task_assignees || []).some(a => a.user_id !== task.user_id && a.response_status !== 'accepted')
}

function defaultForm() {
  return { title: '', notes: '', priority: 'medium', status: 'todo', due_date: '', assigneeIds: [] }
}

export default function ProjectPage() {
  const { projectId } = useParams()
  const navigate      = useNavigate()
  const { user }      = useAuth()

  const [project, setProject]         = useState(null)
  const [tasks, setTasks]             = useState([])
  const [taskUpdates, setTaskUpdates] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading]         = useState(true)
  const [view, setView]               = useState('status')
  const [activeStatus, setActiveStatus] = useState('todo')
  const [showArchived, setShowArchived] = useState(false)
  const [showForm, setShowForm]       = useState(false)
  const [form, setForm]               = useState(defaultForm())

  const fetchProject = useCallback(async () => {
    const { data } = await supabase.from('projects').select('*, teams(name)').eq('id', projectId).single()
    setProject(data)
  }, [projectId])

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, task_assignees(user_id, response_status, response_reason, suggested_priority, suggested_due_date)')
      .eq('project_id', projectId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    setTasks(data || [])
    const ids = (data || []).map(t => t.id)
    if (ids.length) {
      const { data: u } = await supabase
        .from('task_updates')
        .select('id, task_id, body, created_at, profiles(display_name)')
        .in('task_id', ids)
        .order('created_at', { ascending: false })
      setTaskUpdates(u || [])
    } else {
      setTaskUpdates([])
    }
  }, [projectId])

  const fetchTeamMembers = useCallback(async () => {
    if (!project?.team_id) return
    const { data } = await supabase
      .from('team_members')
      .select('user_id, profiles(id, display_name)')
      .eq('team_id', project.team_id)
    setTeamMembers((data || []).map(r => ({ id: r.profiles.id, display_name: r.profiles.display_name })))
  }, [project?.team_id])

  useEffect(() => {
    setLoading(true)
    fetchProject().then(() => setLoading(false))
  }, [fetchProject])

  useEffect(() => {
    if (project) { fetchTasks(); fetchTeamMembers() }
  }, [project, fetchTasks, fetchTeamMembers])

  useEffect(() => {
    if (!project?.team_id) return
    const channel = supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_updates' }, fetchTasks)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [projectId, project?.team_id, fetchTasks])

  if (loading) return <div className="loading">Loading project…</div>
  if (!project) return <div className="loading">Project not found.</div>

  // Pending-approval tasks stay in the list (with a "Pending" badge) rather
  // than being hidden; the banner just summarises how many still need action.
  const activeTasks  = tasks.filter(t => t.status !== 'archived')
  const pendingTasks = tasks.filter(t => t.status !== 'archived' && isPendingApproval(t))
  const archivedTasks = tasks.filter(t => t.status === 'archived')
  const outstanding  = activeTasks.filter(t => t.status !== 'done')
  const done         = activeTasks.filter(t => t.status === 'done')
  const completion   = activeTasks.length ? Math.round((done.length / activeTasks.length) * 100) : 0

  const resolveAssignees = (task) =>
    (task.task_assignees || []).map(a => teamMembers.find(m => m.id === a.user_id)).filter(Boolean)

  const updatesFor = (taskId) =>
    taskUpdates.filter(u => u.task_id === taskId).slice().reverse()

  function getByPriority(priority) {
    return activeTasks
      .filter(t => t.priority === priority)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  function getByStatus(status) {
    return activeTasks
      .filter(t => t.status === status)
      .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] ?? 1) - ({ high: 0, medium: 1, low: 2 }[b.priority] ?? 1))
  }

  async function changeStatus(taskId, status) {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    fetchTasks()
  }

  async function addUpdate(taskId, body) {
    await supabase.from('task_updates').insert([{ task_id: taskId, user_id: user.id, body }])
    fetchTasks()
  }

  async function handleAddTask(e) {
    e.preventDefault()
    if (!form.title.trim()) return
    const { assigneeIds, ...rest } = form
    const samePriority = tasks.filter(t => t.priority === rest.priority && t.status === rest.status)
    const maxPos = samePriority.reduce((m, t) => Math.max(m, t.position ?? 0), 0)
    const { data } = await supabase
      .from('tasks')
      .insert([{
        ...rest,
        due_date: rest.due_date || null,
        project_id: projectId,
        team_id: project.team_id,
        user_id: user.id,
        position: maxPos + 1000,
      }])
      .select('id')
      .single()
    if (data?.id && assigneeIds.length) {
      await supabase.from('task_assignees').insert(
        assigneeIds.map(uid => ({
          task_id: data.id, user_id: uid,
          response_status: uid === user.id ? 'accepted' : 'pending',
        }))
      )
    }
    setForm(defaultForm())
    setShowForm(false)
    fetchTasks()
  }

  function toggleAssignee(id) {
    setForm(f => ({
      ...f,
      assigneeIds: f.assigneeIds.includes(id) ? f.assigneeIds.filter(x => x !== id) : [...f.assigneeIds, id],
    }))
  }

  const archivedSection = archivedTasks.length > 0 && (
    <div className="pp-archived-section">
      <button className="pp-archived-toggle" onClick={() => setShowArchived(s => !s)}>
        {showArchived ? '▲' : '▼'} Archived ({archivedTasks.length})
      </button>
      {showArchived && (
        <div className="pp-archived-list">
          {archivedTasks.map(task => (
            <ProjectTaskRow
              key={task.id}
              task={task}
              assignees={resolveAssignees(task)}
              updates={updatesFor(task.id)}
              onStatusChange={s => changeStatus(task.id, s)}
              onAddUpdate={body => addUpdate(task.id, body)}
              showPriority
            />
          ))}
        </div>
      )}
    </div>
  )

  return (
    <div className="project-page">
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <form className="task-form" onSubmit={handleAddTask} onClick={e => e.stopPropagation()}>
            <h2>New Task — {project.name}</h2>
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
                  {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select>
              </label>
              <label>Priority
                <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}>
                  {PRIORITIES.map(p => <option key={p}>{p}</option>)}
                </select>
              </label>
            </div>
            {teamMembers.length > 0 && (
              <div className="assignee-field">
                <span className="assignee-field-label">Assignees</span>
                <div className="assignee-picker">
                  {teamMembers.map(m => (
                    <button key={m.id} type="button"
                      className={`assignee-chip${form.assigneeIds.includes(m.id) ? ' selected' : ''}`}
                      onClick={() => toggleAssignee(m.id)}>
                      <span className="chip-avatar">{initials(m.display_name)}</span>
                      {m.display_name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div className="form-actions">
              <button type="button" className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Add Task</button>
            </div>
          </form>
        </div>
      )}

      <div className="project-page-header">
        <div className="project-hero">
          <div className="project-hero-left">
            <div className="project-hero-top">
              <h2 className="project-hero-name">{project.name}</h2>
              <span className={`project-status-badge ${project.status}`}>{PROJECT_STATUS_LABELS[project.status]}</span>
            </div>
            {project.description && <p className="project-hero-desc">{project.description}</p>}
            {(project.start_date || project.target_date) && (
              <p className="project-hero-dates">
                {formatDate(project.start_date) || 'No start'} → {formatDate(project.target_date) || 'No deadline'}
              </p>
            )}
            <button className="back-btn" onClick={() => navigate('/teams')}>← {project.teams?.name || 'Teams'}</button>
          </div>
          <div className="project-hero-right">
            <div className="hero-stat-row">
              <div className="hero-stat">
                <span className="hero-stat-num">{outstanding.length}</span>
                <span className="hero-stat-label">Outstanding</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">{activeTasks.filter(t => t.priority === 'high' && t.status !== 'done').length}</span>
                <span className="hero-stat-label">High priority</span>
              </div>
              <div className="hero-stat">
                <span className="hero-stat-num">{completion}%</span>
                <span className="hero-stat-label">Complete</span>
              </div>
            </div>
            <div className="progress-group">
              <span className="progress-title">Progress</span>
              <div className="project-progress-bar">
                <div className="progress-fill" style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {pendingTasks.length > 0 && (
        <div className="pp-pending-banner">
          <span>{pendingTasks.length} task{pendingTasks.length !== 1 ? 's' : ''} waiting on assignment approval</span>
          <button className="btn-ghost btn-sm" onClick={() => navigate('/')}>Review on Taskboard →</button>
        </div>
      )}

      <div className="project-view-controls">
        <div className="view-toggle">
          <button className={`view-btn${view === 'priority' ? ' active' : ''}`} onClick={() => setView('priority')}>By Priority</button>
          <button className={`view-btn${view === 'status' ? ' active' : ''}`} onClick={() => setView('status')}>By Status</button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <span className="task-total">{activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}</span>
          <button className="btn-primary btn-sm" onClick={() => setShowForm(true)}>+ Add Task</button>
        </div>
      </div>

      {view === 'priority' ? (
        <div className="project-priority-view">
          {PRIORITIES.map(priority => {
            const zoneTasks = getByPriority(priority)
            return (
              <div key={priority} className={`pp-zone zone-${priority}`}>
                <div className="pp-zone-header">
                  <span className="pp-zone-label">{PRIORITY_LABELS[priority]}</span>
                  <span className="pp-zone-count">{zoneTasks.length}</span>
                  <span className="pp-zone-done">{zoneTasks.filter(t => t.status === 'done').length}/{zoneTasks.length} done</span>
                </div>
                <div className="pp-zone-body">
                  {zoneTasks.length === 0 && <p className="pp-empty">No tasks</p>}
                  {zoneTasks.map(task => (
                    <ProjectTaskRow key={task.id} task={task}
                      assignees={resolveAssignees(task)}
                      updates={updatesFor(task.id)}
                      onStatusChange={s => changeStatus(task.id, s)}
                      onAddUpdate={body => addUpdate(task.id, body)} />
                  ))}
                </div>
              </div>
            )
          })}
          {archivedSection}
        </div>
      ) : (
        <div className="project-status-view">
          <div className="pp-status-tabs">
            {STATUSES.map(s => (
              <button key={s} className={`pp-status-tab${activeStatus === s ? ' active' : ''}`}
                onClick={() => setActiveStatus(s)}>
                {STATUS_LABELS[s]}
                <span className="pp-tab-count">{getByStatus(s).length}</span>
              </button>
            ))}
          </div>
          <div className="pp-status-list">
            {getByStatus(activeStatus).length === 0 && <p className="pp-empty">No tasks</p>}
            {getByStatus(activeStatus).map(task => (
              <ProjectTaskRow key={task.id} task={task}
                assignees={resolveAssignees(task)}
                updates={updatesFor(task.id)}
                onStatusChange={s => changeStatus(task.id, s)}
                onAddUpdate={body => addUpdate(task.id, body)}
                showPriority />
            ))}
          </div>
          {archivedSection}
        </div>
      )}
    </div>
  )
}

function ProjectTaskRow({ task, assignees, updates, onStatusChange, onAddUpdate, showPriority }) {
  const [showHistory, setShowHistory] = useState(false)
  const [updateText, setUpdateText]   = useState('')
  const today      = todayStr()
  const isArchived = task.status === 'archived'
  const isDone     = task.status === 'done'
  const isOverdue  = task.due_date && task.due_date < today && !isDone && !isArchived

  const todaysUpdates  = updates.filter(u => u.created_at.slice(0, 10) === today)
  const historyUpdates = updates.filter(u => u.created_at.slice(0, 10) !== today)
  const historyByDate  = historyUpdates.reduce((acc, u) => {
    const d = u.created_at.slice(0, 10); if (!acc[d]) acc[d] = []; acc[d].push(u); return acc
  }, {})
  const historyDates = Object.keys(historyByDate).sort((a, b) => b.localeCompare(a))

  const nextStatuses = { todo: ['in_progress', 'done'], in_progress: ['done', 'todo'], done: ['todo', 'in_progress'], archived: ['done'] }

  function submitUpdate(e) {
    e.preventDefault()
    const text = updateText.trim()
    if (!text) return
    onAddUpdate(text)
    setUpdateText('')
  }

  return (
    <div className={`pp-task${isDone ? ' pp-task-done' : ''}${isArchived ? ' pp-task-archived' : ''}`}>
      <div className="pp-task-main">
        {showPriority && <span className={`pp-priority-dot dot-${task.priority}`} title={task.priority} />}
        <div className="pp-task-info">
          <p className="pp-task-title">
            {isPendingApproval(task) && <span className="pending-badge">Pending</span>}
            {task.title}
          </p>
          {task.notes && <p className="pp-task-notes">{task.notes}</p>}
        </div>
        <div className="pp-task-meta">
          {task.due_date && (
            <span className={`pp-due${isOverdue ? ' overdue' : ''}`}>
              {isOverdue ? 'Overdue · ' : ''}{new Date(task.due_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          )}
          {assignees.length > 0 && (
            <div className="pp-avatars">
              {assignees.slice(0, 3).map((a, i) => (
                <span key={a.id} className="pp-avatar" style={{ zIndex: 3 - i }} title={a.display_name}>{initials(a.display_name)}</span>
              ))}
            </div>
          )}
        </div>
        <div className="pp-task-actions">
          {(nextStatuses[task.status] || []).map(s => (
            <button key={s}
              className={`pp-action-btn${s === 'done' || (task.status === 'todo' && s === 'in_progress') ? ' primary' : ''}`}
              onClick={() => onStatusChange(s)}>
              → {STATUS_LABELS[s] || s}
            </button>
          ))}
        </div>
      </div>

      {/* Updates — shown for all tasks including archived */}
      {(updates.length > 0 || !isArchived) && (
        <div className="pp-updates">
          {isArchived ? (
            // Archived: show all updates as history, no add form
            updates.length > 0 && (
              <div className="pp-update-history-inline">
                {Object.keys(historyByDate).concat(todaysUpdates.length ? [today] : [])
                  .sort((a, b) => b.localeCompare(a))
                  .map(date => {
                    const dayUpdates = date === today ? todaysUpdates : historyByDate[date]
                    if (!dayUpdates?.length) return null
                    return (
                      <div key={date} className="pp-hist-day">
                        <span className="pp-hist-label">{date === today ? 'Today' : formatHistDate(date)}</span>
                        <div className="pp-hist-items">
                          {dayUpdates.map(u => (
                            <div key={u.id} className="pp-hist-item">
                              <span className="pp-hist-body">{u.body}</span>
                              <span className="pp-hist-meta">{u.profiles?.display_name} · {formatTime(u.created_at)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
              </div>
            )
          ) : (
            <>
              {todaysUpdates.length > 0 ? (
                <div className="pp-today-updates">
                  <span className="pp-update-label">Today</span>
                  <div className="pp-update-items">
                    {todaysUpdates.map(u => (
                      <div key={u.id} className="pp-update-item">
                        <span className="pp-update-body">{u.body}</span>
                        <span className="pp-update-meta">{u.profiles?.display_name && <>{u.profiles.display_name} · </>}{formatTime(u.created_at)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <span className="pp-update-label muted">No update yet today</span>
              )}
              {historyDates.length > 0 && (
                <button className="pp-history-toggle" onClick={() => setShowHistory(h => !h)}>
                  {showHistory ? '▲' : '▼'} {historyUpdates.length} past update{historyUpdates.length !== 1 ? 's' : ''}
                </button>
              )}
              {showHistory && (
                <div className="pp-history">
                  {historyDates.map(date => (
                    <div key={date} className="pp-hist-day">
                      <span className="pp-hist-label">{formatHistDate(date)}</span>
                      <div className="pp-hist-items">
                        {historyByDate[date].map(u => (
                          <div key={u.id} className="pp-hist-item">
                            <span className="pp-hist-body">{u.body}</span>
                            {u.profiles?.display_name && <span className="pp-hist-meta">{u.profiles.display_name}</span>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <form className="pp-update-form" onSubmit={submitUpdate}>
                <input value={updateText} onChange={e => setUpdateText(e.target.value)} placeholder="Add today's update…" />
                <button type="submit" className="btn-ghost btn-sm">Post</button>
              </form>
            </>
          )}
        </div>
      )}
    </div>
  )
}

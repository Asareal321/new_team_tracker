import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import './ProjectPage.css'

const PRIORITIES    = ['high', 'medium', 'low']
const PRIORITY_LABELS = { high: 'High', medium: 'Medium', low: 'Low' }
const STATUSES      = ['todo', 'in_progress', 'done']
const STATUS_LABELS = { todo: 'To Do', in_progress: 'In Progress', done: 'Done' }
const PROJECT_STATUS_LABELS = { active: 'Active', on_hold: 'On Hold', completed: 'Completed' }

function todayStr() { return new Date().toISOString().slice(0, 10) }
function formatDate(d) {
  if (!d) return null
  return new Date(d + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase()
}

export default function ProjectPage() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [project, setProject]       = useState(null)
  const [tasks, setTasks]           = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [loading, setLoading]       = useState(true)
  const [view, setView]             = useState('priority') // 'priority' | 'status'
  const [activeStatus, setActiveStatus] = useState('todo')

  const fetchProject = useCallback(async () => {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()
    setProject(data)
  }, [projectId])

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('*, task_assignees(user_id)')
      .eq('project_id', projectId)
      .order('position', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: true })
    setTasks(data || [])
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
    if (project) {
      fetchTasks()
      fetchTeamMembers()
    }
  }, [project, fetchTasks, fetchTeamMembers])

  useEffect(() => {
    if (!project?.team_id) return
    const channel = supabase
      .channel(`project-${projectId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `project_id=eq.${projectId}` }, fetchTasks)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [projectId, project?.team_id, fetchTasks])

  if (loading) return <div className="loading">Loading project…</div>
  if (!project) return <div className="loading">Project not found.</div>

  const activeTasks   = tasks.filter(t => t.status !== 'archived')
  const outstanding   = activeTasks.filter(t => t.status !== 'done')
  const done          = activeTasks.filter(t => t.status === 'done')
  const completion    = activeTasks.length ? Math.round((done.length / activeTasks.length) * 100) : 0

  const memberName = (id) => teamMembers.find(m => m.id === id)?.display_name
  const resolveAssignees = (task) =>
    (task.task_assignees || []).map(a => teamMembers.find(m => m.id === a.user_id)).filter(Boolean)

  function getByPriority(priority) {
    return activeTasks
      .filter(t => t.priority === priority)
      .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
  }

  function getByStatus(status) {
    return activeTasks
      .filter(t => t.status === status)
      .sort((a, b) => {
        const order = { high: 0, medium: 1, low: 2 }
        return (order[a.priority] ?? 1) - (order[b.priority] ?? 1)
      })
  }

  async function changeStatus(taskId, status) {
    await supabase.from('tasks').update({ status }).eq('id', taskId)
    await fetchTasks()
  }

  return (
    <div className="project-page">
      <div className="project-page-header">
        <button className="back-btn" onClick={() => navigate('/teams')}>← Teams</button>

        <div className="project-hero">
          <div className="project-hero-left">
            <div className="project-hero-top">
              <h2 className="project-hero-name">{project.name}</h2>
              <span className={`project-status-badge ${project.status}`}>
                {PROJECT_STATUS_LABELS[project.status]}
              </span>
            </div>
            {project.description && (
              <p className="project-hero-desc">{project.description}</p>
            )}
            {(project.start_date || project.target_date) && (
              <p className="project-hero-dates">
                {formatDate(project.start_date) || 'No start'} → {formatDate(project.target_date) || 'No deadline'}
              </p>
            )}
          </div>

          <div className="project-hero-stats">
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
            <div className="project-progress-bar">
              <div className="progress-fill" style={{ width: `${completion}%` }} />
            </div>
          </div>
        </div>
      </div>

      <div className="project-view-controls">
        <div className="view-toggle">
          <button className={`view-btn${view === 'priority' ? ' active' : ''}`} onClick={() => setView('priority')}>
            By Priority
          </button>
          <button className={`view-btn${view === 'status' ? ' active' : ''}`} onClick={() => setView('status')}>
            By Status
          </button>
        </div>
        <span className="task-total">{activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}</span>
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
                  <span className="pp-zone-done">
                    {zoneTasks.filter(t => t.status === 'done').length}/{zoneTasks.length} done
                  </span>
                </div>
                <div className="pp-zone-body">
                  {zoneTasks.length === 0 && <p className="pp-empty">No tasks</p>}
                  {zoneTasks.map(task => (
                    <ProjectTaskRow
                      key={task.id}
                      task={task}
                      assignees={resolveAssignees(task)}
                      onStatusChange={s => changeStatus(task.id, s)}
                    />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="project-status-view">
          <div className="pp-status-tabs">
            {STATUSES.map(s => (
              <button
                key={s}
                className={`pp-status-tab${activeStatus === s ? ' active' : ''}`}
                onClick={() => setActiveStatus(s)}
              >
                {STATUS_LABELS[s]}
                <span className="pp-tab-count">{getByStatus(s).length}</span>
              </button>
            ))}
          </div>
          <div className="pp-status-list">
            {getByStatus(activeStatus).length === 0 && <p className="pp-empty">No tasks</p>}
            {getByStatus(activeStatus).map(task => (
              <ProjectTaskRow
                key={task.id}
                task={task}
                assignees={resolveAssignees(task)}
                onStatusChange={s => changeStatus(task.id, s)}
                showPriority
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectTaskRow({ task, assignees, onStatusChange, showPriority }) {
  const today = todayStr()
  const isOverdue = task.due_date && task.due_date < today && task.status !== 'done'
  const isDone = task.status === 'done'

  const nextStatuses = {
    todo:        ['in_progress', 'done'],
    in_progress: ['done', 'todo'],
    done:        ['todo', 'in_progress'],
  }

  return (
    <div className={`pp-task${isDone ? ' pp-task-done' : ''}`}>
      <div className="pp-task-main">
        {showPriority && (
          <span className={`pp-priority-dot dot-${task.priority}`} title={task.priority} />
        )}
        <div className="pp-task-info">
          <p className="pp-task-title">{task.title}</p>
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
                <span key={a.id} className="pp-avatar" style={{ zIndex: 3 - i }} title={a.display_name}>
                  {initials(a.display_name)}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="pp-task-actions">
          {(nextStatuses[task.status] || []).map(s => (
            <button key={s} className={`pp-action-btn${s === 'done' || (task.status === 'todo' && s === 'in_progress') ? ' primary' : ''}`}
              onClick={() => onStatusChange(s)}>
              → {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

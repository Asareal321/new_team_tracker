import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import { projectColorIndex, projectDotColor } from '../lib/projectColors'
import './TeamsPage.css'

const PROJECT_STATUSES = ['active', 'on_hold', 'completed']
const PROJECT_STATUS_LABELS = { active: 'Active', on_hold: 'On Hold', completed: 'Completed' }

// Countdown label + tone for a project deadline.
function deadlineInfo(targetDate, status) {
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const target = new Date(targetDate + 'T00:00:00')
  const days = Math.round((target - today) / 86400000)
  if (status === 'completed') return { count: 'completed', tone: 'done' }
  if (days < 0)  return { count: `${Math.abs(days)} day${Math.abs(days) === 1 ? '' : 's'} overdue`, tone: 'overdue' }
  if (days === 0) return { count: 'due today', tone: 'soon' }
  if (days <= 7)  return { count: `${days} day${days === 1 ? '' : 's'} left`, tone: 'soon' }
  return { count: `${days} days left`, tone: 'normal' }
}

export default function TeamsPage() {
  const { user } = useAuth()
  const { teams, currentTeamId, setCurrentTeam, refreshTeams } = useTeam()

  const [newTeamName, setNewTeamName] = useState('')
  const [joinCode, setJoinCode] = useState('')
  const [teamError, setTeamError] = useState('')

  const [members, setMembers] = useState([])
  const [copied, setCopied] = useState(false)

  const [projects, setProjects] = useState([])
  const [projectMembers, setProjectMembers] = useState([])
  const [taskStats, setTaskStats] = useState({})
  const [sortOrder, setSortOrder] = useState('high')
  const [projectFilter, setProjectFilter] = useState('mine')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState(null)
  const [assignMode, setAssignMode] = useState(false)
  const navigate = useNavigate()

  const fetchMembers = useCallback(async () => {
    if (!currentTeamId) { setMembers([]); return }
    const { data } = await supabase
      .from('team_members')
      .select('user_id, role, profiles(display_name, email)')
      .eq('team_id', currentTeamId)
    setMembers((data || []).map(r => ({
      id: r.user_id,
      role: r.role,
      display_name: r.profiles?.display_name || r.profiles?.email || 'Unknown',
    })))
  }, [currentTeamId])

  const fetchProjects = useCallback(async () => {
    if (!currentTeamId) { setProjects([]); setTaskStats({}); setProjectMembers([]); return }
    const { data: pData } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', currentTeamId)
      .order('created_at', { ascending: true })
    setProjects(pData || [])

    const projectIds = (pData || []).map(p => p.id)
    if (projectIds.length) {
      const { data: mData } = await supabase
        .from('project_members')
        .select('project_id, user_id')
        .in('project_id', projectIds)
      setProjectMembers(mData || [])
    } else {
      setProjectMembers([])
    }

    // Count every non-archived task (including pending-approval ones, which now
    // show on the board and project with a "Pending" badge). Matches the
    // project page's active-task set.
    const { data: tData } = await supabase
      .from('tasks')
      .select('project_id, priority, status')
      .eq('team_id', currentTeamId)
      .not('project_id', 'is', null)
      .neq('status', 'archived')
    const stats = {}
    ;(tData || []).forEach(t => {
      if (!stats[t.project_id]) stats[t.project_id] = { high: 0, outstanding: 0, done: 0, total: 0 }
      stats[t.project_id].total++
      if (t.status === 'done') {
        stats[t.project_id].done++
      } else {
        stats[t.project_id].outstanding++
        if (t.priority === 'high') stats[t.project_id].high++
      }
    })
    setTaskStats(stats)
  }, [currentTeamId])

  useEffect(() => {
    fetchMembers()
    fetchProjects()

    if (!currentTeamId) return
    const channel = supabase
      .channel(`team-detail-${currentTeamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${currentTeamId}` }, fetchMembers)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `team_id=eq.${currentTeamId}` }, fetchProjects)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_members' }, fetchProjects)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `team_id=eq.${currentTeamId}` }, fetchProjects)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, fetchProjects)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [currentTeamId, fetchMembers, fetchProjects])

  async function handleCreateTeam(e) {
    e.preventDefault()
    if (!newTeamName.trim()) return
    setTeamError('')
    const { data, error } = await supabase.rpc('create_team', { _name: newTeamName.trim() })
    if (error) { setTeamError(error.message); return }
    setNewTeamName('')
    await refreshTeams()
    setCurrentTeam(data)
  }

  async function handleJoinTeam(e) {
    e.preventDefault()
    if (!joinCode.trim()) return
    setTeamError('')
    const { data, error } = await supabase.rpc('join_team_with_code', { _code: joinCode.trim() })
    if (error) { setTeamError(error.message); return }
    setJoinCode('')
    await refreshTeams()
    setCurrentTeam(data)
  }

  function copyInvite() {
    navigator.clipboard.writeText(currentTeam?.invite_code || '')
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  async function addProject({ memberIds = [], ...project }) {
    const { data } = await supabase
      .from('projects')
      .insert([{ ...project, team_id: currentTeamId, created_by: user.id }])
      .select('id')
      .single()
    const ids = new Set([user.id, ...memberIds])
    if (data?.id && ids.size) {
      await supabase.from('project_members').insert(
        [...ids].map(uid => ({ project_id: data.id, user_id: uid }))
      )
    }
  }

  async function updateProject(id, { memberIds, ...updates } = {}) {
    if (Object.keys(updates).length) {
      await supabase.from('projects').update(updates).eq('id', id)
    }
    if (memberIds) {
      await supabase.from('project_members').delete().eq('project_id', id)
      if (memberIds.length) {
        await supabase.from('project_members').insert(
          memberIds.map(uid => ({ project_id: id, user_id: uid }))
        )
      }
    }
  }

  async function deleteProject(id) {
    await supabase.from('projects').delete().eq('id', id)
  }

  const currentTeam = teams.find(t => t.id === currentTeamId)
  const isOwner = members.find(m => m.id === user.id)?.role === 'owner'
  const editingProject = projects.find(p => p.id === editingProjectId) || null

  return (
    <div className="teams-page">
      <div className="teams-list-col">
        <h2>Your Teams</h2>
        {teams.length === 0 && <p className="empty-hint">You're not on any teams yet.</p>}
        {teams.map(t => (
          <button
            key={t.id}
            className={t.id === currentTeamId ? 'team-item active' : 'team-item'}
            onClick={() => setCurrentTeam(t.id)}
          >
            <span>{t.name}</span>
            <span className="role-tag">{t.role}</span>
          </button>
        ))}

        <div className="team-actions">
          <form onSubmit={handleCreateTeam}>
            <input
              value={newTeamName}
              onChange={e => setNewTeamName(e.target.value)}
              placeholder="New team name"
            />
            <button type="submit" className="btn-primary">Create</button>
          </form>
          <form onSubmit={handleJoinTeam}>
            <input
              value={joinCode}
              onChange={e => setJoinCode(e.target.value)}
              placeholder="Invite code"
            />
            <button type="submit" className="btn-ghost">Join</button>
          </form>
          {teamError && <p className="auth-error">{teamError}</p>}
        </div>
      </div>

      <div className="team-detail-col">
        {!currentTeam ? (
          <p className="empty-hint">Create a team or select one from the list to see its members and projects.</p>
        ) : (
          <>
            <h2>{currentTeam.name}</h2>

            <section className="members-section">
              <h3>Members</h3>
              <div className="member-list">
                {members.map(m => (
                  <div key={m.id} className="member-row">
                    <span>{m.display_name}{m.id === user.id ? ' (you)' : ''}</span>
                    {m.role === 'owner' && <span className="role-tag">owner</span>}
                  </div>
                ))}
              </div>
              {isOwner && currentTeam?.invite_code && (
                <div className="invite-code-row">
                  <span className="invite-code-label">Invite code</span>
                  <div className="invite-code">
                    <span className="invite-code-value">{currentTeam.invite_code}</span>
                    <button className="btn-copy" onClick={copyInvite}>{copied ? '✓ Copied' : 'Copy'}</button>
                  </div>
                  <p className="invite-code-hint">Share this code with teammates — it never changes.</p>
                </div>
              )}
            </section>

            <section className="projects-section">
              <div className="section-header">
                <h3>Projects</h3>
                <div className="project-controls">
                  <div className="sort-toggle">
                    <button className={`sort-btn${projectFilter === 'mine' ? ' active' : ''}`} onClick={() => setProjectFilter('mine')}>
                      My Projects
                    </button>
                    <button className={`sort-btn${projectFilter === 'all' ? ' active' : ''}`} onClick={() => setProjectFilter('all')}>
                      All Projects
                    </button>
                  </div>
                  <div className="sort-toggle">
                    <button className={`sort-btn${sortOrder === 'high' ? ' active' : ''}`} onClick={() => setSortOrder('high')}>
                      High priority ↓
                    </button>
                    <button className={`sort-btn${sortOrder === 'outstanding' ? ' active' : ''}`} onClick={() => setSortOrder('outstanding')}>
                      Outstanding ↓
                    </button>
                  </div>
                  {members.length > 1 && (
                    <button className="assign-mode-btn" onClick={() => setAssignMode(true)}>
                      ⚡ Quick Assign
                    </button>
                  )}
                  <button className="btn-primary" onClick={() => { setEditingProjectId(null); setShowProjectForm(true) }}>
                    + New Project
                  </button>
                </div>
              </div>

              {projects.length === 0 && <p className="empty-hint">No projects yet.</p>}

              <div className="project-grid">
                {[...projects]
                  .filter(p => projectFilter === 'all' || projectMembers.some(pm => pm.project_id === p.id && pm.user_id === user.id))
                  .sort((a, b) => {
                    const sa = taskStats[a.id] || {}
                    const sb = taskStats[b.id] || {}
                    return sortOrder === 'high'
                      ? (sb.high ?? 0) - (sa.high ?? 0)
                      : (sb.outstanding ?? 0) - (sa.outstanding ?? 0)
                  })
                  .map(p => (
                    <ProjectTile
                      key={p.id}
                      project={p}
                      stats={taskStats[p.id] || {}}
                      members={members.filter(m => projectMembers.some(pm => pm.project_id === p.id && pm.user_id === m.id))}
                      onClick={() => navigate(`/projects/${p.id}`)}
                      onEdit={e => { e.stopPropagation(); setEditingProjectId(p.id); setShowProjectForm(true) }}
                      onDelete={e => { e.stopPropagation(); deleteProject(p.id) }}
                    />
                  ))
                }
                {projectFilter === 'mine' && projects.length > 0 &&
                  !projects.some(p => projectMembers.some(pm => pm.project_id === p.id && pm.user_id === user.id)) && (
                  <p className="empty-hint">You're not assigned to any projects yet — switch to "All Projects" to see the team's.</p>
                )}
              </div>
            </section>

            {showProjectForm && (
              <ProjectModal
                project={editingProject}
                members={members}
                initialMemberIds={
                  editingProjectId
                    ? projectMembers.filter(pm => pm.project_id === editingProjectId).map(pm => pm.user_id)
                    : [user.id]
                }
                onCancel={() => { setShowProjectForm(false); setEditingProjectId(null) }}
                onSave={async (form) => {
                  if (editingProjectId) await updateProject(editingProjectId, form)
                  else await addProject(form)
                  setShowProjectForm(false)
                  setEditingProjectId(null)
                }}
              />
            )}

            {assignMode && (
              <AssignmentModeModal
                teamId={currentTeamId}
                currentUserId={user.id}
                members={members}
                projects={projects}
                onClose={() => setAssignMode(false)}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function ProjectTile({ project, stats, members = [], onClick, onEdit, onDelete }) {
  const completion = stats.total ? Math.round((stats.done / stats.total) * 100) : 0
  return (
    <div className={`project-tile pc-${projectColorIndex(project.id)}`} onClick={onClick} role="button" tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}>
      <div className="tile-top">
        <span className={`project-status ${project.status}`}>{PROJECT_STATUS_LABELS[project.status]}</span>
        <div className="tile-actions">
          <button className="tile-action-btn" onClick={onEdit} title="Edit">✎</button>
          <button className="tile-action-btn danger" onClick={onDelete} title="Delete">✕</button>
        </div>
      </div>
      <p className="tile-name">
        <span className="tile-dot" style={{ background: projectDotColor(project.id) }} />
        {project.name}
      </p>
      {project.description && <p className="tile-desc">{project.description}</p>}
      {members.length > 0 && (
        <div className="tile-members">
          {members.slice(0, 5).map(m => (
            <span key={m.id} className="tile-member-av" title={m.display_name}>{initials(m.display_name)}</span>
          ))}
          {members.length > 5 && <span className="tile-member-av tile-member-overflow">+{members.length - 5}</span>}
        </div>
      )}
      <div className="tile-stats">
        <div className="tile-stat">
          <span className="tile-stat-num high">{stats.high ?? 0}</span>
          <span className="tile-stat-label">High priority</span>
        </div>
        <div className="tile-stat">
          <span className="tile-stat-num">{stats.outstanding ?? 0}</span>
          <span className="tile-stat-label">Outstanding</span>
        </div>
        <div className="tile-stat">
          <span className="tile-stat-num">{completion}%</span>
          <span className="tile-stat-label">Complete</span>
        </div>
      </div>
      <div className="tile-progress">
        <div className="tile-progress-fill" style={{ width: `${completion}%` }} />
      </div>
      {project.target_date && (() => {
        const d = deadlineInfo(project.target_date, project.status)
        return (
          <span className={`tile-deadline ${d.tone}`}>
            <span className="tile-deadline-icon" aria-hidden="true">⚑</span>
            Due {new Date(project.target_date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            <span className="tile-deadline-count">· {d.count}</span>
          </span>
        )
      })()}
    </div>
  )
}

function ProjectCard({ project, onEdit, onDelete }) {
  return (
    <div className="project-card">
      <div className="project-card-top">
        <span className="project-name">{project.name}</span>
        <span className={`project-status ${project.status}`}>{PROJECT_STATUS_LABELS[project.status]}</span>
      </div>
      {project.description && <p className="project-desc">{project.description}</p>}
      {(project.start_date || project.target_date) && (
        <p className="project-dates">
          {project.start_date || '—'} → {project.target_date || '—'}
        </p>
      )}
      <div className="project-actions">
        <button onClick={onEdit}>Edit</button>
        <button className="danger" onClick={onDelete}>Delete</button>
      </div>
    </div>
  )
}

function ProjectModal({ project, members = [], initialMemberIds = [], onCancel, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    start_date: project?.start_date || '',
    target_date: project?.target_date || '',
  })
  const [memberIds, setMemberIds] = useState(new Set(initialMemberIds))

  function toggleMember(id) {
    setMemberIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      ...form,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
      memberIds: [...memberIds],
    })
  }

  return (
    <div className="modal-overlay" onClick={onCancel}>
      <form className="task-form" onSubmit={handleSubmit} onClick={e => e.stopPropagation()}>
        <h2>{project ? 'Edit Project' : 'New Project'}</h2>
        <label>Name
          <input
            autoFocus
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="Project name"
          />
        </label>
        <label>Description
          <textarea
            rows={3}
            value={form.description}
            onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
            placeholder="What is this project about?"
          />
        </label>
        <div className="form-row">
          <label>Status
            <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
              {PROJECT_STATUSES.map(s => <option key={s} value={s}>{PROJECT_STATUS_LABELS[s]}</option>)}
            </select>
          </label>
          <label>Start Date
            <input type="date" value={form.start_date} onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))} />
          </label>
          <label>Target Date
            <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))} />
          </label>
        </div>
        {members.length > 0 && (
          <div className="assignee-field">
            <span className="assignee-field-label">Team</span>
            <div className="assignee-picker">
              {members.map(m => (
                <button
                  key={m.id} type="button"
                  className={`assignee-chip${memberIds.has(m.id) ? ' selected' : ''}`}
                  onClick={() => toggleMember(m.id)}
                >{m.display_name}</button>
              ))}
            </div>
          </div>
        )}
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary">{project ? 'Save' : 'Create Project'}</button>
        </div>
      </form>
    </div>
  )
}

// Quick-assign mode: pulls the team's active tasks and lets you toggle people
// onto them one click at a time. Assigning anyone other than a task's creator
// creates a pending request they must accept (same flow as the board).
function AssignmentModeModal({ teamId, currentUserId, members, projects, onClose }) {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    const { data } = await supabase
      .from('tasks')
      .select('id, title, project_id, priority, status, user_id, task_assignees(user_id, response_status)')
      .eq('team_id', teamId)
      .in('status', ['todo', 'in_progress'])
      .order('created_at', { ascending: true })
    setTasks(data || [])
    setLoading(false)
  }, [teamId])

  useEffect(() => { fetchTasks() }, [fetchTasks])

  async function toggleAssign(task, memberId) {
    const assigned = (task.task_assignees || []).some(a => a.user_id === memberId)
    // Optimistic local update so the click feels instant.
    setTasks(prev => prev.map(t => t.id !== task.id ? t : {
      ...t,
      task_assignees: assigned
        ? t.task_assignees.filter(a => a.user_id !== memberId)
        : [...(t.task_assignees || []), { user_id: memberId, response_status: memberId === t.user_id ? 'accepted' : 'pending' }],
    }))
    if (assigned) {
      await supabase.from('task_assignees').delete().eq('task_id', task.id).eq('user_id', memberId)
    } else {
      await supabase.from('task_assignees').insert({
        task_id: task.id, user_id: memberId,
        response_status: memberId === task.user_id ? 'accepted' : 'pending',
      })
    }
  }

  return (
    <AssignmentModeView
      tasks={tasks}
      loading={loading}
      members={members}
      projects={projects}
      currentUserId={currentUserId}
      onToggle={toggleAssign}
      onClose={onClose}
    />
  )
}

export function AssignmentModeView({ tasks, loading, members, projects, currentUserId, onToggle, onClose }) {
  const groups = [
    ...projects
      .map(p => ({ id: p.id, name: p.name, tasks: tasks.filter(t => t.project_id === p.id) }))
      .filter(g => g.tasks.length),
  ]
  const noProject = tasks.filter(t => !t.project_id)
  if (noProject.length) groups.push({ id: 'none', name: 'No project', tasks: noProject })

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="assign-modal" onClick={e => e.stopPropagation()}>
        <div className="assign-head">
          <div className="assign-head-top">
            <h2>⚡ Quick Assign</h2>
            <button className="assign-close" aria-label="Close" onClick={onClose}>✕</button>
          </div>
          <p className="assign-hint">Click a teammate to assign or unassign them. Assigning someone else sends a request they must accept.</p>
        </div>
        <div className="assign-body">
          {loading ? (
            <p className="empty-hint">Loading tasks…</p>
          ) : tasks.length === 0 ? (
            <p className="empty-hint">No active tasks to assign right now.</p>
          ) : (
            groups.map(g => (
              <div key={g.id} className="assign-group">
                <div className="assign-group-label">{g.name}</div>
                {g.tasks.map(task => (
                  <div key={task.id} className="assign-row">
                    <span className={`status-dot ${task.priority}`} style={{ width: 8, height: 8, flexShrink: 0 }} />
                    <span className="assign-task-title">{task.title}</span>
                    <div className="assign-avatars">
                      {members.map(m => {
                        const row = (task.task_assignees || []).find(a => a.user_id === m.id)
                        const assigned = !!row
                        const pending = assigned && m.id !== task.user_id && row.response_status !== 'accepted'
                        return (
                          <button
                            key={m.id}
                            type="button"
                            className={`assign-av${assigned ? ' assigned' : ''}${pending ? ' pending' : ''}`}
                            title={`${m.display_name}${pending ? ' · pending acceptance' : assigned ? ' · assigned' : ''}`}
                            aria-pressed={assigned}
                            onClick={() => onToggle(task, m.id)}
                          >{initials(m.display_name)}</button>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
        <div className="assign-foot">
          <span className="assign-legend"><span className="assign-av assigned assign-legend-av" />assigned <span className="assign-av pending assign-legend-av" />pending</span>
          <button className="btn-primary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  )
}

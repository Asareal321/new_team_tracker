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
  const [taskStats, setTaskStats] = useState({})
  const [sortOrder, setSortOrder] = useState('high')
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [editingProjectId, setEditingProjectId] = useState(null)
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
    if (!currentTeamId) { setProjects([]); setTaskStats({}); return }
    const { data: pData } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', currentTeamId)
      .order('created_at', { ascending: true })
    setProjects(pData || [])

    const { data: tData } = await supabase
      .from('tasks')
      .select('project_id, priority, status')
      .eq('team_id', currentTeamId)
      .not('project_id', 'is', null)
    const stats = {}
    ;(tData || []).forEach(t => {
      if (!stats[t.project_id]) stats[t.project_id] = { high: 0, outstanding: 0, done: 0, total: 0 }
      stats[t.project_id].total++
      if (t.status === 'done')                                           stats[t.project_id].done++
      if (t.status !== 'done' && t.status !== 'archived')               stats[t.project_id].outstanding++
      if (t.priority === 'high' && t.status !== 'done' && t.status !== 'archived') stats[t.project_id].high++
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

  async function addProject(project) {
    await supabase.from('projects').insert([{ ...project, team_id: currentTeamId, created_by: user.id }])
  }

  async function updateProject(id, updates) {
    await supabase.from('projects').update(updates).eq('id', id)
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
                    <button className={`sort-btn${sortOrder === 'high' ? ' active' : ''}`} onClick={() => setSortOrder('high')}>
                      High priority ↓
                    </button>
                    <button className={`sort-btn${sortOrder === 'outstanding' ? ' active' : ''}`} onClick={() => setSortOrder('outstanding')}>
                      Outstanding ↓
                    </button>
                  </div>
                  <button className="btn-primary" onClick={() => { setEditingProjectId(null); setShowProjectForm(true) }}>
                    + New Project
                  </button>
                </div>
              </div>

              {projects.length === 0 && <p className="empty-hint">No projects yet.</p>}

              <div className="project-grid">
                {[...projects]
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
                      onClick={() => navigate(`/projects/${p.id}`)}
                      onEdit={e => { e.stopPropagation(); setEditingProjectId(p.id); setShowProjectForm(true) }}
                      onDelete={e => { e.stopPropagation(); deleteProject(p.id) }}
                    />
                  ))
                }
              </div>
            </section>

            {showProjectForm && (
              <ProjectModal
                project={editingProject}
                onCancel={() => { setShowProjectForm(false); setEditingProjectId(null) }}
                onSave={async (form) => {
                  if (editingProjectId) await updateProject(editingProjectId, form)
                  else await addProject(form)
                  setShowProjectForm(false)
                  setEditingProjectId(null)
                }}
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function ProjectTile({ project, stats, onClick, onEdit, onDelete }) {
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

function ProjectModal({ project, onCancel, onSave }) {
  const [form, setForm] = useState({
    name: project?.name || '',
    description: project?.description || '',
    status: project?.status || 'active',
    start_date: project?.start_date || '',
    target_date: project?.target_date || '',
  })

  function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    onSave({
      ...form,
      start_date: form.start_date || null,
      target_date: form.target_date || null,
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
        <div className="form-actions">
          <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn-primary">{project ? 'Save' : 'Create Project'}</button>
        </div>
      </form>
    </div>
  )
}

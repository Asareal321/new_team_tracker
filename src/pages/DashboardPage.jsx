import { useState, useEffect, useCallback, useMemo } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import { projectDotColor } from '../lib/projectColors'
import './DashboardPage.css'

const DAY = 86400000

function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase()
}

function daysAgo(ts) {
  return Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / DAY))
}

export default function DashboardPage() {
  const { user } = useAuth()
  const { currentTeam, currentTeamId } = useTeam()

  const [members, setMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [sortKey, setSortKey] = useState('age')
  const [sortDir, setSortDir] = useState('desc')

  const isAdmin = currentTeam?.role === 'owner' || currentTeam?.role === 'admin'

  const fetchAll = useCallback(async () => {
    if (!currentTeamId) { setMembers([]); setProjects([]); setTasks([]); setLoading(false); return }

    const [{ data: mData }, { data: pData }, { data: tData, error: tErr }] = await Promise.all([
      supabase
        .from('team_members')
        .select('user_id, role, profiles(display_name, email)')
        .eq('team_id', currentTeamId),
      supabase
        .from('projects')
        .select('id, name')
        .eq('team_id', currentTeamId),
      supabase
        .from('tasks')
        .select('id, title, status, priority, project_id, user_id, updated_at, created_at, task_assignees(user_id, response_status)')
        .eq('team_id', currentTeamId),
    ])
    if (tErr) console.error('[trakkit] Failed to load dashboard tasks', tErr.message)

    setMembers((mData || []).map(r => ({
      id: r.user_id,
      role: r.role,
      display_name: r.profiles?.display_name || r.profiles?.email || 'Unknown',
    })))
    setProjects(pData || [])
    setTasks(tData || [])
    setLoading(false)
  }, [currentTeamId])

  useEffect(() => {
    setLoading(true)
    fetchAll()
    if (!currentTeamId) return
    const channel = supabase
      .channel(`dashboard-${currentTeamId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `team_id=eq.${currentTeamId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_assignees' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: `team_id=eq.${currentTeamId}` }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `team_id=eq.${currentTeamId}` }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [currentTeamId, fetchAll])

  const projectName = useMemo(() => {
    const m = new Map(projects.map(p => [p.id, p.name]))
    return id => (id ? m.get(id) || 'Unknown project' : 'No project')
  }, [projects])

  const memberName = useMemo(() => {
    const m = new Map(members.map(mm => [mm.id, mm.display_name]))
    return id => m.get(id) || 'Unknown'
  }, [members])

  // Non-archived tasks, split into "active" (still needs work) vs done.
  const liveTasks = useMemo(() => tasks.filter(t => t.status !== 'archived'), [tasks])
  const activeTasks = useMemo(() => liveTasks.filter(t => t.status === 'todo' || t.status === 'in_progress'), [liveTasks])

  const counts = useMemo(() => ({
    total: liveTasks.length,
    todo: liveTasks.filter(t => t.status === 'todo').length,
    inProgress: liveTasks.filter(t => t.status === 'in_progress').length,
    done: liveTasks.filter(t => t.status === 'done').length,
    high: activeTasks.filter(t => t.priority === 'high').length,
  }), [liveTasks, activeTasks])

  // "How long has the average task sat with no progression" — days since the
  // task row was last touched (status change, edit, or note bumps updated_at).
  const stall = useMemo(() => {
    if (!activeTasks.length) return { avg: 0, stalest: [] }
    const withAge = activeTasks.map(t => ({ ...t, age: daysAgo(t.updated_at) }))
    const avg = withAge.reduce((s, t) => s + t.age, 0) / withAge.length
    const stalest = [...withAge].sort((a, b) => b.age - a.age).slice(0, 6)
    return { avg: Math.round(avg * 10) / 10, stalest }
  }, [activeTasks])

  // Full sortable list — every active task with its days-outstanding, sprint,
  // and assignee(s), for the "Days outstanding" table below the summary cards.
  const outstandingRows = useMemo(() => {
    const rows = activeTasks.map(t => {
      const accepted = (t.task_assignees || []).filter(a => a.response_status === 'accepted').map(a => a.user_id)
      const assigneeIds = accepted.length ? accepted : [t.user_id]
      const assigneeLabel = assigneeIds.length > 1
        ? `${memberName(assigneeIds[0])} +${assigneeIds.length - 1}`
        : memberName(assigneeIds[0])
      return {
        ...t,
        age: daysAgo(t.updated_at),
        sprintName: projectName(t.project_id),
        assigneeLabel,
      }
    })
    const dir = sortDir === 'asc' ? 1 : -1
    return rows.sort((a, b) => {
      let av, bv
      switch (sortKey) {
        case 'title':    av = a.title.toLowerCase();     bv = b.title.toLowerCase(); break
        case 'sprint':   av = a.sprintName.toLowerCase(); bv = b.sprintName.toLowerCase(); break
        case 'assignee': av = a.assigneeLabel.toLowerCase(); bv = b.assigneeLabel.toLowerCase(); break
        default:         av = a.age; bv = b.age
      }
      if (av < bv) return -1 * dir
      if (av > bv) return 1 * dir
      return b.age - a.age
    })
  }, [activeTasks, memberName, projectName, sortKey, sortDir])

  function toggleSort(key) {
    if (sortKey === key) {
      setSortDir(d => (d === 'desc' ? 'asc' : 'desc'))
    } else {
      setSortKey(key)
      setSortDir(key === 'title' || key === 'sprint' || key === 'assignee' ? 'asc' : 'desc')
    }
  }

  // Workload split: attribute each active task to its accepted assignees, or to
  // its creator if nobody has accepted yet. Build a per-member breakdown by
  // project so each member's bar shows how their load splits across projects.
  const workload = useMemo(() => {
    const byMember = new Map(members.map(m => [m.id, { member: m, total: 0, byProject: new Map() }]))
    const bump = (memberId, projectId) => {
      const row = byMember.get(memberId)
      if (!row) return
      row.total++
      const key = projectId || 'none'
      row.byProject.set(key, (row.byProject.get(key) || 0) + 1)
    }
    activeTasks.forEach(t => {
      const accepted = (t.task_assignees || []).filter(a => a.response_status === 'accepted').map(a => a.user_id)
      const owners = accepted.length ? accepted : [t.user_id]
      owners.forEach(uid => bump(uid, t.project_id))
    })
    const rows = [...byMember.values()].sort((a, b) => b.total - a.total)
    const max = Math.max(1, ...rows.map(r => r.total))
    return { rows, max }
  }, [members, activeTasks])

  // Projects that actually carry active work, for the legend.
  const activeProjectIds = useMemo(() => {
    const s = new Set()
    activeTasks.forEach(t => s.add(t.project_id || 'none'))
    return [...s]
  }, [activeTasks])

  if (!currentTeamId) {
    return (
      <div className="dashboard-page">
        <h1 className="dash-title">Dashboard</h1>
        <p className="empty-hint">Select a team from the switcher to see its dashboard.</p>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="dashboard-page">
        <h1 className="dash-title">Dashboard</h1>
        <p className="empty-hint">The dashboard is only available to team admins and owners.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="dashboard-page">
        <h1 className="dash-title">Dashboard</h1>
        <p className="empty-hint">Loading team stats…</p>
      </div>
    )
  }

  const colorFor = key => (key === 'none' ? 'var(--prio-low)' : projectDotColor(key))

  return (
    <div className="dashboard-page">
      <div className="dash-head">
        <h1 className="dash-title">Dashboard</h1>
        <span className="dash-team">{currentTeam?.name}</span>
      </div>

      {/* Task totals */}
      <div className="dash-stat-row">
        <StatCard label="Active tasks" value={counts.todo + counts.inProgress} tone="accent" />
        <StatCard label="To do" value={counts.todo} />
        <StatCard label="In progress" value={counts.inProgress} />
        <StatCard label="Done" value={counts.done} tone="green" />
        <StatCard label="High priority" value={counts.high} tone="red" />
      </div>

      <div className="dash-grid">
        {/* Stalled tasks */}
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Task stagnation</h2>
            <div className="dash-big-stat">
              <span className="dash-big-num">{stall.avg}</span>
              <span className="dash-big-label">avg. days since progress</span>
            </div>
          </div>
          <p className="dash-card-sub">Active tasks, ranked by how long since anyone last touched them.</p>
          {stall.stalest.length === 0 ? (
            <p className="empty-hint">No active tasks right now.</p>
          ) : (
            <ul className="stale-list">
              {stall.stalest.map(t => (
                <li key={t.id} className="stale-row">
                  <span className="stale-dot" style={{ background: colorFor(t.project_id || 'none') }} />
                  <span className="stale-title">{t.title}</span>
                  <span className="stale-project">{projectName(t.project_id)}</span>
                  <span className={`stale-age${t.age >= 7 ? ' hot' : ''}`}>
                    {t.age === 0 ? 'today' : `${t.age}d`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Workload split by member */}
        <section className="dash-card">
          <div className="dash-card-head">
            <h2>Workload by member</h2>
          </div>
          <p className="dash-card-sub">Active tasks per person, split by project.</p>
          {workload.rows.every(r => r.total === 0) ? (
            <p className="empty-hint">No active tasks assigned yet.</p>
          ) : (
            <div className="workload-list">
              {workload.rows.map(({ member, total, byProject }) => (
                <div key={member.id} className="workload-row">
                  <div className="workload-who">
                    <span className="workload-av">{initials(member.display_name)}</span>
                    <span className="workload-name">
                      {member.display_name}{member.id === user.id ? ' (you)' : ''}
                      {member.role !== 'member' && <span className="role-pill">{member.role}</span>}
                    </span>
                    <span className="workload-count">{total}</span>
                  </div>
                  <div className="workload-bar" title={`${total} active task${total === 1 ? '' : 's'}`}>
                    {total === 0 ? (
                      <div className="workload-empty" />
                    ) : (
                      [...byProject.entries()].map(([key, n]) => (
                        <div
                          key={key}
                          className="workload-seg"
                          style={{ width: `${(n / workload.max) * 100}%`, background: colorFor(key) }}
                          title={`${key === 'none' ? 'No project' : projectName(key)}: ${n}`}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeProjectIds.length > 0 && (
            <div className="dash-legend">
              {activeProjectIds.map(key => (
                <span key={key} className="legend-item">
                  <span className="legend-dot" style={{ background: colorFor(key) }} />
                  {key === 'none' ? 'No project' : projectName(key)}
                </span>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Days outstanding — every active task, sortable */}
      <section className="dash-card dash-table-card">
        <div className="dash-card-head">
          <h2>Days outstanding</h2>
        </div>
        <p className="dash-card-sub">Every active task, ranked by days since it was last touched.</p>
        {outstandingRows.length === 0 ? (
          <p className="empty-hint">No active tasks right now.</p>
        ) : (
          <table className="dash-table">
            <thead>
              <tr>
                <SortableHeader label="Task" col="title" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} />
                <SortableHeader label="Sprint" col="sprint" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="dash-th-muted" />
                <SortableHeader label="Assignee" col="assignee" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} className="dash-th-muted" />
                <SortableHeader label="Days" col="age" sortKey={sortKey} sortDir={sortDir} onSort={toggleSort} align="right" />
              </tr>
            </thead>
            <tbody>
              {outstandingRows.map(t => (
                <tr key={t.id}>
                  <td className="dash-td-title">
                    <span className="stale-dot" style={{ background: colorFor(t.project_id || 'none') }} />
                    {t.title}
                  </td>
                  <td className="dash-td-muted">{t.sprintName}</td>
                  <td className="dash-td-muted">{t.assigneeLabel}</td>
                  <td className="dash-td-age">
                    <span className={`stale-age${t.age >= 7 ? ' hot' : t.age >= 3 ? ' warm' : ''}`}>
                      {t.age === 0 ? 'today' : `${t.age}d`}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  )
}

function SortableHeader({ label, col, sortKey, sortDir, onSort, align, className = '' }) {
  const active = sortKey === col
  return (
    <th
      className={`dash-th${align === 'right' ? ' align-right' : ''}${active ? ' active' : ''}${className ? ` ${className}` : ''}`}
      onClick={() => onSort(col)}
    >
      {label}
      <span className="dash-th-arrow">{active ? (sortDir === 'asc' ? '▲' : '▼') : ''}</span>
    </th>
  )
}

function StatCard({ label, value, tone }) {
  return (
    <div className={`stat-card${tone ? ` tone-${tone}` : ''}`}>
      <span className="stat-num">{value}</span>
      <span className="stat-label">{label}</span>
    </div>
  )
}

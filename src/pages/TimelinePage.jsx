import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import './TimelinePage.css'

const RANGES = { week: { label: 'This Week', days: 7 }, twoweeks: { label: 'Next 2 Weeks', days: 14 }, month: { label: 'This Month', days: 30 } }

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

function formatDayLabel(date) {
  return date.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
}

function formatDate(dateStr) {
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function TimelinePage() {
  const { user, profile } = useAuth()
  const { currentTeamId } = useTeam()
  const [tasks, setTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('week')
  const [groupBy, setGroupBy] = useState('assignee')

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('tasks').select('*').order('due_date', { ascending: true })
    query = currentTeamId
      ? query.eq('team_id', currentTeamId)
      : query.is('team_id', null).eq('user_id', user.id)
    const { data } = await query
    setTasks(data || [])
  }, [currentTeamId, user])

  const fetchTeamMembers = useCallback(async () => {
    if (!currentTeamId) {
      setTeamMembers([{ id: user.id, display_name: profile?.display_name || 'You' }])
      return
    }
    const { data } = await supabase
      .from('team_members')
      .select('user_id, profiles(id, display_name)')
      .eq('team_id', currentTeamId)
    setTeamMembers((data || []).map(r => ({ id: r.profiles.id, display_name: r.profiles.display_name })))
  }, [currentTeamId, user, profile])

  const fetchProjects = useCallback(async () => {
    if (!currentTeamId) { setProjects([]); return }
    const { data } = await supabase
      .from('projects')
      .select('*')
      .eq('team_id', currentTeamId)
      .order('created_at', { ascending: true })
    setProjects(data || [])
  }, [currentTeamId])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTasks(), fetchTeamMembers(), fetchProjects()]).then(() => setLoading(false))

    const channel = supabase
      .channel(`timeline-${currentTeamId ?? 'personal'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTasks, fetchTeamMembers, fetchProjects, currentTeamId])

  if (loading) return <div className="loading">Loading timeline…</div>

  const today = todayStr()
  const tasksWithDue = tasks.filter(t => t.due_date)
  const overdue = tasksWithDue
    .filter(t => t.due_date < today && t.status !== 'done' && t.status !== 'archived')
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const numDays = RANGES[range].days
  const columns = Array.from({ length: numDays }, (_, i) => addDays(new Date(), i))
  const rangeEnd = toDateStr(columns[columns.length - 1])
  const visibleTasks = tasksWithDue.filter(t => t.due_date >= today && t.due_date <= rangeEnd)

  const canGroupByProject = currentTeamId && projects.length > 0

  let rows = []
  if (groupBy === 'project' && canGroupByProject) {
    rows = projects.map(p => ({ id: p.id, label: p.name, tasks: visibleTasks.filter(t => t.project_id === p.id) }))
    const noProjectTasks = visibleTasks.filter(t => !t.project_id)
    if (noProjectTasks.length) rows.push({ id: 'none', label: 'No Project', tasks: noProjectTasks })
  } else {
    rows = teamMembers.map(m => ({ id: m.id, label: m.display_name, tasks: visibleTasks.filter(t => t.assignee_id === m.id) }))
    const unassignedTasks = visibleTasks.filter(t => !t.assignee_id)
    if (unassignedTasks.length) rows.push({ id: 'unassigned', label: 'Unassigned', tasks: unassignedTasks })
  }

  return (
    <div className="timeline-page">
      <div className="timeline-toolbar-panel">
      <div className="timeline-toolbar">
        <div className="toggle-group">
          {Object.entries(RANGES).map(([key, r]) => (
            <button key={key} className={range === key ? 'nav-btn active' : 'nav-btn'} onClick={() => setRange(key)}>
              {r.label}
            </button>
          ))}
        </div>
        {canGroupByProject && (
          <div className="toggle-group">
            <button className={groupBy === 'assignee' ? 'nav-btn active' : 'nav-btn'} onClick={() => setGroupBy('assignee')}>By Person</button>
            <button className={groupBy === 'project' ? 'nav-btn active' : 'nav-btn'} onClick={() => setGroupBy('project')}>By Project</button>
          </div>
        )}
      </div>
      </div>

      {overdue.length > 0 && (
        <div className="overdue-banner">
          <h3>Overdue</h3>
          <ul>
            {overdue.map(t => (
              <li key={t.id}>
                <span className="overdue-date">{formatDate(t.due_date)}</span>
                <span className="overdue-title">{t.title}</span>
                {teamMembers.find(m => m.id === t.assignee_id) && (
                  <span className="overdue-assignee">{teamMembers.find(m => m.id === t.assignee_id).display_name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="timeline-scroll">
        <div className="timeline-grid" style={{ gridTemplateColumns: `160px repeat(${columns.length}, minmax(60px, 1fr))` }}>
          <div className="timeline-corner" />
          {columns.map(d => {
            const dStr = toDateStr(d)
            return (
              <div key={dStr} className={dStr === today ? 'timeline-day-header today' : 'timeline-day-header'}>
                {formatDayLabel(d)}
              </div>
            )
          })}

          {rows.map(row => (
            <RowCells key={row.id} row={row} columns={columns} today={today} />
          ))}
        </div>
      </div>

      {rows.every(r => r.tasks.length === 0) && overdue.length === 0 && (
        <p className="empty-hint">No tasks with due dates in this range.</p>
      )}
    </div>
  )
}

function RowCells({ row, columns, today }) {
  return (
    <>
      <div className="timeline-row-label">{row.label}</div>
      {columns.map(d => {
        const dStr = toDateStr(d)
        const cellTasks = row.tasks.filter(t => t.due_date === dStr)
        return (
          <div key={dStr} className={dStr === today ? 'timeline-cell today' : 'timeline-cell'}>
            {cellTasks.map(t => (
              <span key={t.id} className={`timeline-chip priority-${t.priority}`} title={t.title}>
                {t.title}
              </span>
            ))}
          </div>
        )
      })}
    </>
  )
}

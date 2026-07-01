import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import { projectDotColor, projectTint } from '../lib/projectColors'
import './DeadlinesPage.css'

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']

// Local YYYY-MM-DD (avoids UTC off-by-one that toISOString would cause).
function ymd(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}
function addDays(date, days) {
  const d = new Date(date)
  d.setDate(d.getDate() + days)
  return d
}
function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}
function daysBetween(fromStr, toStr) {
  const a = new Date(fromStr + 'T00:00:00')
  const b = new Date(toStr + 'T00:00:00')
  return Math.round((b - a) / 86400000)
}
function initials(name) {
  if (!name) return '?'
  const p = name.trim().split(/\s+/)
  return (p.length === 1 ? p[0][0] : p[0][0] + p[p.length - 1][0]).toUpperCase()
}

export default function DeadlinesPage() {
  const { user, profile } = useAuth()
  const { currentTeamId } = useTeam()
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('tasks').select('*')
    query = currentTeamId
      ? query.eq('team_id', currentTeamId)
      : query.is('team_id', null).eq('user_id', user.id)
    const { data } = await query
    setTasks(data || [])
  }, [currentTeamId, user])

  const fetchProjects = useCallback(async () => {
    if (!currentTeamId) { setProjects([]); return }
    const { data } = await supabase.from('projects').select('*').eq('team_id', currentTeamId)
    setProjects(data || [])
  }, [currentTeamId])

  const fetchMembers = useCallback(async () => {
    if (!currentTeamId) { setMembers([{ id: user.id, display_name: profile?.display_name || 'You' }]); return }
    const { data } = await supabase
      .from('team_members')
      .select('user_id, profiles(id, display_name)')
      .eq('team_id', currentTeamId)
    setMembers((data || []).map(r => ({ id: r.profiles.id, display_name: r.profiles.display_name })))
  }, [currentTeamId, user, profile])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTasks(), fetchProjects(), fetchMembers()]).then(() => setLoading(false))
    const channel = supabase
      .channel(`deadlines-${currentTeamId ?? 'personal'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, fetchProjects)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [fetchTasks, fetchProjects, fetchMembers, currentTeamId])

  if (loading) return <div className="loading">Loading deadlines…</div>

  return <DeadlinesCalendar tasks={tasks} projects={projects} members={members} />
}

export function DeadlinesCalendar({ tasks, projects, members }) {
  const [cursor, setCursor] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) })
  const [overdueOpen, setOverdueOpen] = useState(false)

  const today = ymd(new Date())
  const memberName = (id) => members.find(m => m.id === id)?.display_name

  // Outstanding task deadlines only (skip done/archived).
  const dueTasks = tasks.filter(t => t.due_date && t.status !== 'done' && t.status !== 'archived')
  const dueProjects = projects.filter(p => p.target_date && p.status !== 'completed')

  const overdue = dueTasks
    .filter(t => t.due_date < today)
    .sort((a, b) => a.due_date.localeCompare(b.due_date))

  const year = cursor.getFullYear()
  const month = cursor.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const gridStart = addDays(new Date(year, month, 1), -firstWeekday)
  const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7
  const cells = Array.from({ length: cellCount }, (_, i) => addDays(gridStart, i))

  const tasksOn = (dStr) => dueTasks.filter(t => t.due_date === dStr)
  const projectsOn = (dStr) => dueProjects.filter(p => p.target_date === dStr)

  function goToday() { const n = new Date(); setCursor(new Date(n.getFullYear(), n.getMonth(), 1)) }

  return (
    <div className="deadlines-page">
      <div className="dl-toolbar">
        <div className="dl-monthnav">
          <button className="dl-navbtn" aria-label="Previous month" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
          <span className="dl-month">{MONTHS[month]} {year}</span>
          <button className="dl-navbtn" aria-label="Next month" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
          <button className="dl-today-btn" onClick={goToday}>Today</button>
        </div>
        {overdue.length > 0 && (
          <button className={`dl-overdue-pill${overdueOpen ? ' open' : ''}`} onClick={() => setOverdueOpen(o => !o)}>
            ⚠ {overdue.length} overdue
            <span className="dl-caret">{overdueOpen ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {overdueOpen && overdue.length > 0 && (
        <div className="dl-overdue-panel">
          {overdue.map(t => (
            <div key={t.id} className="dl-overdue-item">
              <span className="dl-late">{daysBetween(t.due_date, today)}d late</span>
              <span className="dl-od-dot" style={{ background: priorityColor(t.priority) }} />
              <span className="dl-od-title">{t.title}</span>
              <span className="dl-od-date">{formatDate(t.due_date)}</span>
              {memberName(t.assignee_id) && <span className="dl-od-av">{initials(memberName(t.assignee_id))}</span>}
            </div>
          ))}
        </div>
      )}

      <div className="dl-cal">
        <div className="dl-dow">
          {WEEKDAYS.map((d, i) => (
            <div key={d} className={i === 0 || i === 6 ? 'wknd' : ''}>{d}</div>
          ))}
        </div>
        <div className="dl-weeks">
          {cells.map((d, i) => {
            const dStr = ymd(d)
            const inMonth = d.getMonth() === month
            const isWknd = d.getDay() === 0 || d.getDay() === 6
            const isToday = dStr === today
            const dayTasks = tasksOn(dStr)
            const dayProjects = projectsOn(dStr)
            return (
              <div key={i} className={`dl-day${inMonth ? '' : ' out'}${isWknd ? ' wknd' : ''}${isToday ? ' today' : ''}`}>
                <span className="dl-daynum">{d.getDate()}</span>
                {dayProjects.map(p => (
                  <span key={p.id} className="dl-milestone" style={{ borderLeftColor: projectDotColor(p.id) }} title={`Project deadline: ${p.name}`}>
                    <span className="dl-flag" style={{ color: projectDotColor(p.id) }}>⚑</span>
                    <span className="dl-ms-name">{p.name}</span>
                  </span>
                ))}
                {dayTasks.slice(0, 3).map(t => {
                  const tint = t.project_id ? projectTint(t.project_id) : { bg: 'var(--bg-muted)', text: 'var(--text-2)' }
                  return (
                    <span key={t.id} className="dl-chip" style={{ background: tint.bg, color: tint.text }} title={t.title}>
                      <span className="dl-pdot" style={{ background: priorityColor(t.priority) }} />
                      <span className="dl-chip-title">{t.title}</span>
                    </span>
                  )
                })}
                {dayTasks.length > 3 && <span className="dl-more">+{dayTasks.length - 3} more</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="dl-legend">
        <span><span className="dl-lg-dot" style={{ background: '#ef4444' }} />High</span>
        <span><span className="dl-lg-dot" style={{ background: '#f59e0b' }} />Medium</span>
        <span><span className="dl-lg-dot" style={{ background: '#94a3b8' }} />Low</span>
        <span className="dl-lg-sep"><span className="dl-lg-flag">⚑</span> Project deadline</span>
        <span className="dl-lg-note">Chip color = project</span>
      </div>
    </div>
  )
}

function priorityColor(p) {
  return p === 'high' ? '#ef4444' : p === 'low' ? '#94a3b8' : '#f59e0b'
}

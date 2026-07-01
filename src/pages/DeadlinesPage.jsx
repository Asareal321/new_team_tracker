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
    let query = supabase.from('tasks').select('*, task_assignees(user_id)')
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

  return (
    <DeadlinesCalendar
      tasks={tasks}
      projects={projects}
      members={members}
      currentUserId={user.id}
      showPeopleFilter={!!currentTeamId && members.length > 1}
    />
  )
}

export function DeadlinesCalendar({ tasks, projects, members, currentUserId, showPeopleFilter }) {
  const [cursor, setCursor] = useState(() => { const n = new Date(); return new Date(n.getFullYear(), n.getMonth(), 1) })
  const [overdueOpen, setOverdueOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState(null)
  const [everyone, setEveryone] = useState(false)
  const [selectedMembers, setSelectedMembers] = useState(() => new Set(currentUserId ? [currentUserId] : []))

  const today = ymd(new Date())
  const meMember = members.find(m => m.id === currentUserId)
  const otherMembers = members.filter(m => m.id !== currentUserId)
  const memberName = (id) => members.find(m => m.id === id)?.display_name

  function assigneeIdsOf(t) {
    const ids = new Set((t.task_assignees || []).map(a => a.user_id))
    if (t.assignee_id) ids.add(t.assignee_id)
    return ids
  }
  function taskVisible(t) {
    if (!showPeopleFilter || everyone) return true
    if (selectedMembers.size === 0) return true
    const ids = assigneeIdsOf(t)
    for (const id of selectedMembers) if (ids.has(id)) return true
    return false
  }
  function toggleMember(id) {
    setEveryone(false)
    setSelectedMembers(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      if (next.size === 0) return new Set(currentUserId ? [currentUserId] : [])
      return next
    })
  }
  function resolveAssignees(t) {
    return [...assigneeIdsOf(t)].map(id => members.find(m => m.id === id)).filter(Boolean)
  }

  // Outstanding task deadlines (skip done/archived), filtered by people; project
  // deadlines are team milestones shown regardless of the people filter.
  const dueTasks = tasks.filter(t => t.due_date && t.status !== 'done' && t.status !== 'archived' && taskVisible(t))
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

  // Upcoming = everything due today or later, merged and sorted by date.
  const upcoming = [
    ...dueProjects.filter(p => p.target_date >= today).map(p => ({ date: p.target_date, type: 'project', item: p })),
    ...dueTasks.filter(t => t.due_date >= today).map(t => ({ date: t.due_date, type: 'task', item: t })),
  ].sort((a, b) => a.date.localeCompare(b.date))
  const upcomingByDate = upcoming.reduce((acc, e) => { (acc[e.date] ||= []).push(e); return acc }, {})
  const upcomingDates = Object.keys(upcomingByDate).sort()

  const selTasks = selectedDay ? tasksOn(selectedDay) : []
  const selProjects = selectedDay ? projectsOn(selectedDay) : []

  const chipMember = (id) => id === currentUserId ? 'My tasks' : (memberName(id)?.split(/\s+/)[0] || '')

  return (
    <div className="deadlines-page">
      {showPeopleFilter && (
        <div className="dlf-bar">
          <span className="dlf-label">Viewing</span>
          {meMember && (
            <button type="button"
              className={`dlf-chip${!everyone && selectedMembers.has(currentUserId) ? ' selected' : ''}`}
              onClick={() => toggleMember(currentUserId)}>
              <span className="dlf-ini">{initials(meMember.display_name)}</span>My tasks
            </button>
          )}
          {otherMembers.length > 0 && <span className="dlf-vr" />}
          {otherMembers.map(m => (
            <button key={m.id} type="button"
              className={`dlf-chip${!everyone && selectedMembers.has(m.id) ? ' selected' : ''}`}
              title={m.display_name}
              onClick={() => toggleMember(m.id)}>
              <span className="dlf-ini">{initials(m.display_name)}</span>{chipMember(m.id)}
            </button>
          ))}
          <span className="dlf-vr" />
          <button type="button"
            className={`dlf-chip dlf-everyone${everyone ? ' selected' : ''}`}
            onClick={() => setEveryone(true)}>Everyone</button>
        </div>
      )}

      <div className="dl-toolbar">
        <div className="dl-monthnav">
          <button className="dl-navbtn" aria-label="Previous month" onClick={() => { setCursor(new Date(year, month - 1, 1)); setSelectedDay(null) }}>‹</button>
          <span className="dl-month">{MONTHS[month]} {year}</span>
          <button className="dl-navbtn" aria-label="Next month" onClick={() => { setCursor(new Date(year, month + 1, 1)); setSelectedDay(null) }}>›</button>
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
              {resolveAssignees(t).slice(0, 1).map(m => <span key={m.id} className="dl-od-av">{initials(m.display_name)}</span>)}
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
            const nTasks = tasksOn(dStr).length
            const nProjects = projectsOn(dStr).length
            const hasItems = nTasks > 0 || nProjects > 0
            const isSelected = dStr === selectedDay
            return (
              <div
                key={i}
                className={`dl-day${inMonth ? '' : ' out'}${isWknd ? ' wknd' : ''}${isToday ? ' today' : ''}${hasItems ? ' clickable' : ''}${isSelected ? ' selected' : ''}`}
                onClick={hasItems ? () => setSelectedDay(isSelected ? null : dStr) : undefined}
                role={hasItems ? 'button' : undefined}
                tabIndex={hasItems ? 0 : undefined}
                onKeyDown={hasItems ? (e => e.key === 'Enter' && setSelectedDay(isSelected ? null : dStr)) : undefined}
              >
                <span className="dl-daynum">{d.getDate()}</span>
                {nProjects > 0 && (
                  <span className="dl-count dl-count-proj"><span className="dl-flag">⚑</span>{nProjects} project{nProjects > 1 ? 's' : ''}</span>
                )}
                {nTasks > 0 && (
                  <span className="dl-count dl-count-task">{nTasks} task{nTasks > 1 ? 's' : ''}</span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {selectedDay && (selTasks.length > 0 || selProjects.length > 0) && (
        <div className="dl-day-detail">
          <div className="dl-detail-head">
            <h4>{new Date(selectedDay + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
            <button className="dl-detail-close" aria-label="Close" onClick={() => setSelectedDay(null)}>✕</button>
          </div>
          {selProjects.map(p => <ProjectRow key={p.id} project={p} />)}
          {selTasks.map(t => <TaskRow key={t.id} task={t} assignees={resolveAssignees(t)} />)}
        </div>
      )}

      <div className="dl-upcoming">
        <h3>Upcoming deadlines</h3>
        {upcomingDates.length === 0 ? (
          <p className="empty-hint">Nothing due from today onward.</p>
        ) : (
          upcomingDates.map(date => (
            <div key={date} className="dl-up-group">
              <div className="dl-up-date">
                {relativeDateLabel(date, today)}
                <span className="dl-up-full">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
              </div>
              {upcomingByDate[date].map(e => e.type === 'project'
                ? <ProjectRow key={'p' + e.item.id} project={e.item} />
                : <TaskRow key={'t' + e.item.id} task={e.item} assignees={resolveAssignees(e.item)} />
              )}
            </div>
          ))
        )}
      </div>

      <div className="dl-legend">
        <span><span className="dl-lg-dot" style={{ background: '#ef4444' }} />High</span>
        <span><span className="dl-lg-dot" style={{ background: '#f59e0b' }} />Medium</span>
        <span><span className="dl-lg-dot" style={{ background: '#94a3b8' }} />Low</span>
        <span className="dl-lg-sep"><span className="dl-lg-flag">⚑</span> Project deadline</span>
      </div>
    </div>
  )
}

function TaskRow({ task, assignees }) {
  const tint = task.project_id ? projectTint(task.project_id) : { bg: 'var(--bg-muted)', text: 'var(--text-2)' }
  return (
    <div className="dl-row">
      <span className="dl-row-pdot" style={{ background: priorityColor(task.priority) }} title={`${task.priority} priority`} />
      <span className="dl-row-title">{task.title}</span>
      {task.project_id && (
        <span className="dl-row-project" style={{ background: tint.bg, color: tint.text }}>
          <span className="dl-row-pjdot" style={{ background: projectDotColor(task.project_id) }} />
          Project
        </span>
      )}
      {assignees.slice(0, 3).map(m => <span key={m.id} className="dl-row-av" title={m.display_name}>{initials(m.display_name)}</span>)}
    </div>
  )
}

function ProjectRow({ project }) {
  return (
    <div className="dl-row dl-row-milestone" style={{ borderLeftColor: projectDotColor(project.id) }}>
      <span className="dl-row-flag" style={{ color: projectDotColor(project.id) }}>⚑</span>
      <span className="dl-row-title">{project.name}</span>
      <span className="dl-row-tag">Project deadline</span>
    </div>
  )
}

function relativeDateLabel(dateStr, today) {
  const diff = daysBetween(today, dateStr)
  if (diff === 0) return 'Today'
  if (diff === 1) return 'Tomorrow'
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long' })
}

function priorityColor(p) {
  return p === 'high' ? '#ef4444' : p === 'low' ? '#94a3b8' : '#f59e0b'
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import DailySummary from '../components/DailySummary'

function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export default function SummaryPage() {
  const { user, profile } = useAuth()
  const { currentTeamId } = useTeam()
  const [tasks, setTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
  const [projects, setProjects] = useState([])
  const [taskUpdates, setTaskUpdates] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchTaskUpdates = useCallback(async (taskIds) => {
    if (!taskIds.length) { setTaskUpdates([]); return }
    const { data } = await supabase
      .from('task_updates')
      .select('id, task_id, body, created_at, profiles(display_name)')
      .in('task_id', taskIds)
      .order('created_at', { ascending: false })
    setTaskUpdates(data || [])
  }, [])

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: true })
    query = currentTeamId
      ? query.eq('team_id', currentTeamId)
      : query.is('team_id', null).eq('user_id', user.id)
    const { data } = await query
    setTasks(data || [])
    await fetchTaskUpdates((data || []).map(t => t.id))
  }, [currentTeamId, user, fetchTaskUpdates])

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
      .channel(`summary-${currentTeamId ?? 'personal'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_updates' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTasks, fetchTeamMembers, fetchProjects, currentTeamId])

  if (loading) return <div className="loading">Loading…</div>

  const memberName = (id) => teamMembers.find(m => m.id === id)?.display_name
  const todaysUpdate = (taskId) => {
    const today = todayStr()
    const update = taskUpdates.find(u => u.task_id === taskId && u.created_at.slice(0, 10) === today)
    return update ? update.body : null
  }

  function buildSections() {
    const taskPayload = (task) => ({
      title: task.title,
      notes: task.notes || null,
      status: task.status,
      priority: task.priority,
      due_date: task.due_date,
      assignee: memberName(task.assignee_id) || null,
      update_today: todaysUpdate(task.id),
    })

    const sections = projects.map(project => ({
      title: project.name,
      tasks: tasks.filter(t => t.project_id === project.id).map(taskPayload),
    }))

    const otherTasks = tasks.filter(t => !t.project_id).map(taskPayload)
    if (otherTasks.length) {
      sections.push({ title: 'General Tasks', tasks: otherTasks })
    }

    return sections.filter(s => s.tasks.length > 0)
  }

  async function generateSummary() {
    const sections = buildSections()
    if (!sections.length) {
      throw new Error('No tasks to summarize yet.')
    }

    const date = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

    const res = await fetch('/api/daily-summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        date,
        recipientName: 'Rohan',
        senderName: profile?.display_name || 'Asa',
        sections,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      throw new Error(data.error || 'Failed to generate summary')
    }
    return data.summary
  }

  return <DailySummary tasks={tasks} teamMembers={teamMembers} onGenerate={generateSummary} />
}

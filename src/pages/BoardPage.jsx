import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import TaskBoard from '../components/TaskBoard'

export default function BoardPage() {
  const { user } = useAuth()
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
      setTeamMembers([{ id: user.id, display_name: 'You' }])
      return
    }
    const { data } = await supabase
      .from('team_members')
      .select('user_id, profiles(id, display_name)')
      .eq('team_id', currentTeamId)
    setTeamMembers((data || []).map(r => ({ id: r.profiles.id, display_name: r.profiles.display_name })))
  }, [currentTeamId, user])

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
      .channel(`board-${currentTeamId ?? 'personal'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects', filter: currentTeamId ? `team_id=eq.${currentTeamId}` : undefined }, fetchProjects)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'task_updates' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTasks, fetchTeamMembers, fetchProjects, currentTeamId])

  async function addTask(task) {
    await supabase.from('tasks').insert([{ ...task, user_id: user.id, team_id: currentTeamId }])
  }

  async function updateTask(id, updates) {
    await supabase.from('tasks').update(updates).eq('id', id)
  }

  async function deleteTask(id) {
    await supabase.from('tasks').delete().eq('id', id)
  }

  async function addUpdate(taskId, body) {
    await supabase.from('task_updates').insert([{ task_id: taskId, user_id: user.id, body }])
  }

  if (loading) return <div className="loading">Loading tasks…</div>

  return (
    <TaskBoard
      tasks={tasks}
      teamMembers={teamMembers}
      projects={projects}
      taskUpdates={taskUpdates}
      currentUserId={user.id}
      currentTeamId={currentTeamId}
      onAdd={addTask}
      onUpdate={updateTask}
      onDelete={deleteTask}
      onAddUpdate={addUpdate}
    />
  )
}

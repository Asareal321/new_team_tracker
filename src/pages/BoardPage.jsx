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
  const [loading, setLoading] = useState(true)

  const fetchTasks = useCallback(async () => {
    let query = supabase.from('tasks').select('*').order('created_at', { ascending: true })
    query = currentTeamId
      ? query.eq('team_id', currentTeamId)
      : query.is('team_id', null).eq('user_id', user.id)
    const { data } = await query
    setTasks(data || [])
  }, [currentTeamId, user])

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

  if (loading) return <div className="loading">Loading tasks…</div>

  return (
    <TaskBoard
      tasks={tasks}
      teamMembers={teamMembers}
      projects={projects}
      currentUserId={user.id}
      currentTeamId={currentTeamId}
      onAdd={addTask}
      onUpdate={updateTask}
      onDelete={deleteTask}
    />
  )
}

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'
import { useTeam } from '../context/TeamContext'
import DailySummary from '../components/DailySummary'

export default function SummaryPage() {
  const { user, profile } = useAuth()
  const { currentTeamId } = useTeam()
  const [tasks, setTasks] = useState([])
  const [teamMembers, setTeamMembers] = useState([])
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
      setTeamMembers([{ id: user.id, display_name: profile?.display_name || 'You' }])
      return
    }
    const { data } = await supabase
      .from('team_members')
      .select('user_id, profiles(id, display_name)')
      .eq('team_id', currentTeamId)
    setTeamMembers((data || []).map(r => ({ id: r.profiles.id, display_name: r.profiles.display_name })))
  }, [currentTeamId, user, profile])

  useEffect(() => {
    setLoading(true)
    Promise.all([fetchTasks(), fetchTeamMembers()]).then(() => setLoading(false))

    const channel = supabase
      .channel(`summary-${currentTeamId ?? 'personal'}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, fetchTasks)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [fetchTasks, fetchTeamMembers, currentTeamId])

  if (loading) return <div className="loading">Loading…</div>

  return <DailySummary tasks={tasks} teamMembers={teamMembers} />
}

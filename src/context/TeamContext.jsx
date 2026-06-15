import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../supabase'
import { useAuth } from '../auth/AuthContext'

const TeamContext = createContext(null)
const STORAGE_KEY = 'team-tracker-current-team'

export function TeamProvider({ children }) {
  const { user } = useAuth()
  const [teams, setTeams] = useState([])
  const [currentTeamId, setCurrentTeamId] = useState(() => localStorage.getItem(STORAGE_KEY) || null)
  const [loading, setLoading] = useState(true)

  const refreshTeams = useCallback(async () => {
    if (!user) {
      setTeams([])
      setLoading(false)
      return
    }
    const { data } = await supabase
      .from('team_members')
      .select('role, teams(id, name)')
      .eq('user_id', user.id)

    const list = (data || [])
      .filter(r => r.teams)
      .map(r => ({ id: r.teams.id, name: r.teams.name, role: r.role }))
    setTeams(list)
    setLoading(false)

    setCurrentTeamId(curr => (curr && list.some(t => t.id === curr) ? curr : null))
  }, [user])

  useEffect(() => { refreshTeams() }, [refreshTeams])

  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel('team-membership')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'team_members', filter: `user_id=eq.${user.id}` }, refreshTeams)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [user, refreshTeams])

  function setCurrentTeam(teamId) {
    setCurrentTeamId(teamId)
    if (teamId) localStorage.setItem(STORAGE_KEY, teamId)
    else localStorage.removeItem(STORAGE_KEY)
  }

  const currentTeam = teams.find(t => t.id === currentTeamId) || null

  const value = { teams, currentTeamId, currentTeam, setCurrentTeam, refreshTeams, loading }

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam() {
  return useContext(TeamContext)
}

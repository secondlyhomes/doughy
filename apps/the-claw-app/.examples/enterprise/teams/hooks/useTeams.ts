/**
 * useTeams hook - Core team state management
 */

import { useState, useCallback, useEffect } from 'react'
import { supabase } from '../../services/supabase'
import { useOrganization } from '../../contexts/OrganizationContext'
import { useAuth } from '../../contexts/AuthContext'
import type { Team, TeamMember, TeamsState } from '../types'

export function useTeamsState() {
  const { user } = useAuth()
  const { currentOrg } = useOrganization()

  const [state, setState] = useState<TeamsState>({
    teams: [],
    currentTeam: null,
    teamMembers: [],
    loading: true,
    error: null,
  })

  const setTeams = useCallback((teams: Team[]) => {
    setState(prev => ({ ...prev, teams }))
  }, [])

  const setCurrentTeam = useCallback((currentTeam: Team | null) => {
    setState(prev => ({ ...prev, currentTeam }))
  }, [])

  const setTeamMembers = useCallback((teamMembers: TeamMember[]) => {
    setState(prev => ({ ...prev, teamMembers }))
  }, [])

  const setLoading = useCallback((loading: boolean) => {
    setState(prev => ({ ...prev, loading }))
  }, [])

  const setError = useCallback((error: Error | null) => {
    setState(prev => ({ ...prev, error }))
  }, [])

  const fetchTeams = useCallback(async () => {
    if (!currentOrg || !user) {
      setTeams([])
      setLoading(false)
      return
    }

    try {
      const { data, error: fetchError } = await supabase
        .from('teams')
        .select(`
          id, organization_id, name, description, color, icon,
          settings, created_at, updated_at,
          team_members!inner(user_id)
        `)
        .eq('organization_id', currentOrg.id)
        .eq('team_members.user_id', user.id)

      if (fetchError) throw fetchError

      const teamsWithCounts: Team[] = await Promise.all(
        data.map(async (team: any) => {
          const { count } = await supabase
            .from('team_members')
            .select('*', { count: 'exact', head: true })
            .eq('team_id', team.id)

          return { ...team, member_count: count || 0, team_members: undefined }
        })
      )

      setTeams(teamsWithCounts)
    } catch (err) {
      setError(err as Error)
      console.error('Error fetching teams:', err)
    } finally {
      setLoading(false)
    }
  }, [user, currentOrg, setTeams, setLoading, setError])

  const fetchTeamMembers = useCallback(async () => {
    if (!state.currentTeam) return

    try {
      const { data, error: fetchError } = await supabase
        .from('team_members')
        .select(`
          id, team_id, user_id, role, joined_at, invited_by,
          user:user_id(id, email, user_metadata)
        `)
        .eq('team_id', state.currentTeam.id)
        .order('joined_at', { ascending: false })

      if (fetchError) throw fetchError
      setTeamMembers(data as any)
    } catch (err) {
      console.error('Error fetching team members:', err)
    }
  }, [state.currentTeam, setTeamMembers])

  const switchTeam = useCallback((id: string) => {
    const team = state.teams.find(t => t.id === id)
    if (!team) throw new Error('Team not found')
    setCurrentTeam(team)
  }, [state.teams, setCurrentTeam])

  // Utility functions
  const isTeamMember = useCallback((teamId: string): boolean => {
    return state.teams.some(t => t.id === teamId)
  }, [state.teams])

  const isTeamLead = useCallback((teamId: string): boolean => {
    if (!user) return false
    const member = state.teamMembers.find(
      m => m.team_id === teamId && m.user_id === user.id
    )
    return member?.role === 'lead'
  }, [state.teamMembers, user])

  const getUserTeams = useCallback((): Team[] => state.teams, [state.teams])

  // Effects
  useEffect(() => { fetchTeams() }, [fetchTeams])
  useEffect(() => {
    if (state.currentTeam) fetchTeamMembers()
  }, [state.currentTeam, fetchTeamMembers])

  return {
    ...state,
    setCurrentTeam,
    fetchTeams,
    fetchTeamMembers,
    switchTeam,
    isTeamMember,
    isTeamLead,
    getUserTeams,
    user,
    currentOrg,
  }
}

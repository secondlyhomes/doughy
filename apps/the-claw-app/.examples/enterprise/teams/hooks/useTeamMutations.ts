/**
 * useTeamMutations hook - Team and member mutation operations
 */

import { useCallback } from 'react'
import { supabase } from '../../services/supabase'
import type { Team, TeamRole, CreateTeamParams } from '../types'

interface UseTeamMutationsParams {
  user: { id: string } | null
  currentOrg: { id: string } | null
  currentTeam: Team | null
  setCurrentTeam: (team: Team | null) => void
  fetchTeams: () => Promise<void>
  fetchTeamMembers: () => Promise<void>
}

export function useTeamMutations({
  user,
  currentOrg,
  currentTeam,
  setCurrentTeam,
  fetchTeams,
  fetchTeamMembers,
}: UseTeamMutationsParams) {
  const addMember = useCallback(
    async (teamId: string, userId: string, role: TeamRole = 'member') => {
      if (!user) throw new Error('Must be authenticated')

      const { error: memberError } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          user_id: userId,
          role,
          invited_by: user.id,
        })

      if (memberError) throw memberError
      await fetchTeamMembers()
    },
    [user, fetchTeamMembers]
  )

  const createTeam = useCallback(
    async (params: CreateTeamParams): Promise<Team> => {
      if (!currentOrg || !user) throw new Error('Must be authenticated')

      const { data: team, error: teamError } = await supabase
        .from('teams')
        .insert({
          organization_id: currentOrg.id,
          name: params.name,
          description: params.description,
          color: params.color || '#3B82F6',
          icon: params.icon,
          settings: {
            visibility: 'public',
            allow_member_invite: true,
            auto_archive_days: null,
            ...params.settings,
          },
        })
        .select()
        .single()

      if (teamError) throw teamError

      // Add creator as team lead
      await addMember(team.id, user.id, 'lead')
      await fetchTeams()

      return { ...team, member_count: 1 }
    },
    [currentOrg, user, addMember, fetchTeams]
  )

  const updateTeam = useCallback(
    async (id: string, updates: Partial<CreateTeamParams>) => {
      const { error: updateError } = await supabase
        .from('teams')
        .update({
          name: updates.name,
          description: updates.description,
          color: updates.color,
          icon: updates.icon,
          settings: updates.settings,
        })
        .eq('id', id)

      if (updateError) throw updateError
      await fetchTeams()
    },
    [fetchTeams]
  )

  const deleteTeam = useCallback(
    async (id: string) => {
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('id', id)

      if (deleteError) throw deleteError
      await fetchTeams()

      if (currentTeam?.id === id) {
        setCurrentTeam(null)
      }
    },
    [fetchTeams, currentTeam, setCurrentTeam]
  )

  const removeMember = useCallback(
    async (memberId: string) => {
      const { error: removeError } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)

      if (removeError) throw removeError
      await fetchTeamMembers()
    },
    [fetchTeamMembers]
  )

  const updateMemberRole = useCallback(
    async (memberId: string, role: TeamRole) => {
      const { error: updateError } = await supabase
        .from('team_members')
        .update({ role })
        .eq('id', memberId)

      if (updateError) throw updateError
      await fetchTeamMembers()
    },
    [fetchTeamMembers]
  )

  return {
    createTeam,
    updateTeam,
    deleteTeam,
    addMember,
    removeMember,
    updateMemberRole,
  }
}

/**
 * TeamsProvider - Thin context provider for team management
 *
 * Features:
 * - Team creation and management
 * - Team member management
 * - Team-scoped permissions
 *
 * Usage:
 * ```tsx
 * const { teams, createTeam, addMember } = useTeams()
 * ```
 */

import React, { createContext, useContext } from 'react'
import { useTeamsState } from './hooks/useTeams'
import { useTeamMutations } from './hooks/useTeamMutations'
import type { TeamsContextValue } from './types'

const TeamsContext = createContext<TeamsContextValue | undefined>(undefined)

export function TeamsProvider({ children }: { children: React.ReactNode }) {
  const teamsState = useTeamsState()
  const mutations = useTeamMutations({
    user: teamsState.user,
    currentOrg: teamsState.currentOrg,
    currentTeam: teamsState.currentTeam,
    setCurrentTeam: teamsState.setCurrentTeam,
    fetchTeams: teamsState.fetchTeams,
    fetchTeamMembers: teamsState.fetchTeamMembers,
  })

  const value: TeamsContextValue = {
    teams: teamsState.teams,
    currentTeam: teamsState.currentTeam,
    teamMembers: teamsState.teamMembers,
    loading: teamsState.loading,
    error: teamsState.error,
    switchTeam: teamsState.switchTeam,
    isTeamMember: teamsState.isTeamMember,
    isTeamLead: teamsState.isTeamLead,
    getUserTeams: teamsState.getUserTeams,
    refreshTeams: teamsState.fetchTeams,
    ...mutations,
  }

  return <TeamsContext.Provider value={value}>{children}</TeamsContext.Provider>
}

export function useTeams() {
  const context = useContext(TeamsContext)
  if (context === undefined) {
    throw new Error('useTeams must be used within TeamsProvider')
  }
  return context
}

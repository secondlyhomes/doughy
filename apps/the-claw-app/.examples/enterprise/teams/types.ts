/**
 * Types for Team management context
 */

export type TeamRole = 'lead' | 'member'

export interface TeamSettings {
  visibility: 'public' | 'private'
  allow_member_invite: boolean
  auto_archive_days: number | null
}

export interface Team {
  id: string
  organization_id: string
  name: string
  description: string
  color: string
  icon: string | null
  settings: TeamSettings
  created_at: string
  updated_at: string
  member_count: number
}

export interface TeamMember {
  id: string
  team_id: string
  user_id: string
  role: TeamRole
  joined_at: string
  invited_by: string | null
  user: {
    id: string
    email: string
    user_metadata: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export interface CreateTeamParams {
  name: string
  description: string
  color?: string
  icon?: string
  settings?: Partial<TeamSettings>
}

export interface TeamsState {
  teams: Team[]
  currentTeam: Team | null
  teamMembers: TeamMember[]
  loading: boolean
  error: Error | null
}

export interface TeamsContextValue extends TeamsState {
  // Team operations
  createTeam: (params: CreateTeamParams) => Promise<Team>
  updateTeam: (id: string, updates: Partial<CreateTeamParams>) => Promise<void>
  deleteTeam: (id: string) => Promise<void>
  switchTeam: (id: string) => void

  // Member operations
  addMember: (teamId: string, userId: string, role?: TeamRole) => Promise<void>
  removeMember: (memberId: string) => Promise<void>
  updateMemberRole: (memberId: string, role: TeamRole) => Promise<void>

  // Utilities
  isTeamMember: (teamId: string) => boolean
  isTeamLead: (teamId: string) => boolean
  getUserTeams: () => Team[]
  refreshTeams: () => Promise<void>
}

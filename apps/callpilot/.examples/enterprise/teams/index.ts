/**
 * Teams module - Clean re-exports
 */

// Types
export type {
  Team,
  TeamMember,
  TeamRole,
  TeamSettings,
  CreateTeamParams,
  TeamsState,
  TeamsContextValue,
} from './types'

// Provider and hook
export { TeamsProvider, useTeams } from './TeamsProvider'

// Internal hooks (for advanced usage)
export { useTeamsState } from './hooks/useTeams'
export { useTeamMutations } from './hooks/useTeamMutations'

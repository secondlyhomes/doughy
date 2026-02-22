// src/features/teams/screens/team-settings-types.ts
// Types for team settings screen

export interface TeamMember {
  id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'member';
  joinedAt: string;
  avatarInitials: string;
}

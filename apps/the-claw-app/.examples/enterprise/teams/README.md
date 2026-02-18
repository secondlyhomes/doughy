# Team Management Implementation Guide

Guide to implementing team-based collaboration in your React Native + Expo + Supabase application.

## Overview

Teams are subgroups within organizations that enable better collaboration and resource organization.

### Key Features

- Team creation and management
- Member roles (Lead, Member)
- Team-scoped resources (tasks, projects)
- Public/private teams
- Team permissions

## Quick Start

### 1. Database Setup

```sql
-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#3B82F6',
  icon TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Team members
CREATE TABLE team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('lead', 'member')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  invited_by UUID REFERENCES auth.users(id),
  UNIQUE(team_id, user_id)
);
```

### 2. Create a Team

```tsx
import { useTeams } from './contexts/TeamsContext'

const { createTeam } = useTeams()

await createTeam({
  name: 'Engineering',
  description: 'Engineering team',
  color: '#3B82F6',
  settings: {
    visibility: 'public',
    allow_member_invite: true,
  },
})
```

### 3. Add Members

```tsx
const { addMember } = useTeams()

await addMember(teamId, userId, 'member')
```

## Team Settings

```typescript
interface TeamSettings {
  visibility: 'public' | 'private'
  allow_member_invite: boolean
  auto_archive_days: number | null
}
```

### Public vs Private Teams

**Public Teams**:
- Visible to all organization members
- Members can request to join
- Resources visible to organization

**Private Teams**:
- Only visible to members
- Invitation-only
- Resources hidden from non-members

## Team Roles

### Lead
- Manage team settings
- Add/remove members
- Change member roles
- Delete team

### Member
- View team resources
- Create team resources
- Invite others (if enabled)

## Team-Scoped Resources

### Tasks

```tsx
// Create team task
await supabase.from('tasks').insert({
  title: 'Team task',
  organization_id: currentOrg.id,
  team_id: currentTeam.id,
  visibility: 'team', // Only team members can see
})

// Query team tasks
const { data: teamTasks } = await supabase
  .from('tasks')
  .select('*')
  .eq('team_id', teamId)
```

### Projects

```tsx
// Team project
await supabase.from('projects').insert({
  name: 'Q1 Initiative',
  team_id: teamId,
  organization_id: currentOrg.id,
})
```

## UI Components

### Team Selector

```tsx
import { useTeams } from './contexts/TeamsContext'

function TeamSelector() {
  const { teams, currentTeam, switchTeam } = useTeams()

  return (
    <Picker
      selectedValue={currentTeam?.id}
      onValueChange={(teamId) => switchTeam(teamId)}
    >
      {teams.map(team => (
        <Picker.Item
          key={team.id}
          label={team.name}
          value={team.id}
        />
      ))}
    </Picker>
  )
}
```

### Team Members List

```tsx
function TeamMembersList() {
  const { teamMembers, removeMember, isTeamLead } = useTeams()

  return (
    <FlatList
      data={teamMembers}
      renderItem={({ item: member }) => (
        <View>
          <Text>{member.user.email}</Text>
          <Badge>{member.role}</Badge>

          {isTeamLead(member.team_id) && (
            <Button
              title="Remove"
              onPress={() => removeMember(member.id)}
            />
          )}
        </View>
      )}
    />
  )
}
```

## Permissions

### Team-Based Permission Checks

```tsx
import { useTeams } from './contexts/TeamsContext'
import { useRBAC } from './contexts/RBACContext'

function useTeamPermissions(teamId: string) {
  const { isTeamMember, isTeamLead } = useTeams()
  const { hasPermission } = useRBAC()

  return {
    canView: isTeamMember(teamId),
    canEdit: isTeamLead(teamId) || hasPermission('teams:manage'),
    canDelete: isTeamLead(teamId) || hasPermission('teams:manage'),
    canInvite: isTeamLead(teamId) || hasPermission('teams:invite'),
  }
}
```

## Best Practices

### 1. Team Size

Keep teams focused and manageable:
- Small teams (5-10): Agile squads
- Medium teams (10-20): Departments
- Large teams (20+): Divisions (consider sub-teams)

### 2. Team Hierarchy

For complex organizations, implement team hierarchy:

```sql
ALTER TABLE teams ADD COLUMN parent_team_id UUID REFERENCES teams(id);
```

### 3. Team Templates

Create team templates for consistency:

```tsx
const TEAM_TEMPLATES = {
  engineering: {
    name: 'Engineering',
    color: '#3B82F6',
    icon: 'code',
    defaultRoles: ['Software Engineer', 'Tech Lead'],
  },
  design: {
    name: 'Design',
    color: '#EC4899',
    icon: 'palette',
    defaultRoles: ['Designer', 'Design Lead'],
  },
}
```

## Advanced Features

### Team Analytics

```tsx
// Get team statistics
const { data: stats } = await supabase
  .rpc('get_team_stats', { p_team_id: teamId })

// Returns:
// {
//   member_count: 12,
//   task_count: 45,
//   completed_tasks: 38,
//   active_projects: 3
// }
```

### Team Activity Feed

```tsx
const { data: activity } = await supabase
  .from('team_activity')
  .select('*')
  .eq('team_id', teamId)
  .order('created_at', { ascending: false })
  .limit(20)
```

### Team Notifications

```tsx
// Notify team members
async function notifyTeam(teamId: string, message: string) {
  const { data: members } = await supabase
    .from('team_members')
    .select('user_id')
    .eq('team_id', teamId)

  for (const member of members) {
    await sendNotification(member.user_id, message)
  }
}
```

## Testing

```typescript
describe('Teams', () => {
  it('creates team and adds creator as lead', async () => {
    const team = await createTeam({
      name: 'Test Team',
      description: 'Testing',
    })

    const { data: members } = await supabase
      .from('team_members')
      .select('*')
      .eq('team_id', team.id)

    expect(members).toHaveLength(1)
    expect(members[0].role).toBe('lead')
  })

  it('enforces team visibility', async () => {
    const privateTeam = await createTeam({
      name: 'Private',
      settings: { visibility: 'private' },
    })

    // Different user
    const { data: teams } = await supabase
      .from('teams')
      .select('*')
      .eq('id', privateTeam.id)

    // Should not see private team
    expect(teams).toHaveLength(0)
  })
})
```

## Migration Guide

### From Flat Structure to Teams

```tsx
// 1. Create default team for organization
const defaultTeam = await createTeam({
  name: 'General',
  description: 'Default team',
})

// 2. Add all org members to default team
const { data: members } = await supabase
  .from('organization_members')
  .select('user_id')
  .eq('organization_id', orgId)

for (const member of members) {
  await addMember(defaultTeam.id, member.user_id)
}

// 3. Update existing resources
await supabase
  .from('tasks')
  .update({ team_id: defaultTeam.id })
  .eq('organization_id', orgId)
  .is('team_id', null)
```

## Resources

- [Slack's Team Model](https://slack.com/help/articles/115004071768-What-is-a-workspace-)
- [Microsoft Teams Architecture](https://docs.microsoft.com/en-us/microsoftteams/teams-channels-overview)
- [Atlassian Team Playbook](https://www.atlassian.com/team-playbook)

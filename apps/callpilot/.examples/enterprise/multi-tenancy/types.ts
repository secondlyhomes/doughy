/**
 * Multi-tenancy Type Definitions
 */

export type OrganizationRole = 'owner' | 'admin' | 'member' | 'guest';

export type SubscriptionTier = 'free' | 'starter' | 'professional' | 'enterprise';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing';

export interface OrganizationSettings {
  timezone: string;
  date_format: string;
  features: {
    ai_enabled: boolean;
    analytics_enabled: boolean;
    api_access: boolean;
  };
  limits: {
    max_users: number;
    max_tasks: number;
    max_storage_mb: number;
  };
}

export interface Organization {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  website: string | null;
  settings: OrganizationSettings;
  subscription_tier: SubscriptionTier;
  subscription_status: SubscriptionStatus;
  subscription_ends_at: string | null;
  status: 'active' | 'suspended' | 'deleted';
  created_at: string;
  updated_at: string;
  role: OrganizationRole;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  custom_permissions: string[];
  invited_by: string | null;
  invited_at: string;
  joined_at: string;
  last_active_at: string | null;
  status: 'active' | 'suspended' | 'removed';
  user: {
    id: string;
    email: string;
    user_metadata: {
      full_name?: string;
      avatar_url?: string;
    };
  };
}

export interface OrganizationInvitation {
  id: string;
  organization_id: string;
  email: string;
  role: OrganizationRole;
  message: string | null;
  invited_by: string;
  token: string;
  expires_at: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  created_at: string;
}

export interface OrganizationUsage {
  member_count: number;
  task_count: number;
  storage_mb: number;
  api_calls_today: number;
}

export interface CreateOrganizationParams {
  name: string;
  slug: string;
  description?: string;
  settings?: Partial<OrganizationSettings>;
}

export interface OrganizationContextValue {
  // State
  organizations: Organization[];
  currentOrg: Organization | null;
  members: OrganizationMember[];
  invitations: OrganizationInvitation[];
  usage: OrganizationUsage | null;
  loading: boolean;
  error: Error | null;

  // Organization operations
  createOrganization: (params: CreateOrganizationParams) => Promise<Organization>;
  updateOrganization: (id: string, updates: Partial<Organization>) => Promise<void>;
  deleteOrganization: (id: string) => Promise<void>;
  switchOrganization: (id: string) => Promise<void>;
  refreshOrganizations: () => Promise<void>;

  // Member operations
  inviteMember: (
    email: string,
    role: OrganizationRole,
    message?: string
  ) => Promise<OrganizationInvitation>;
  updateMemberRole: (memberId: string, role: OrganizationRole) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  acceptInvitation: (token: string) => Promise<void>;
  declineInvitation: (token: string) => Promise<void>;
  refreshMembers: () => Promise<void>;

  // Settings & usage
  updateSettings: (settings: Partial<OrganizationSettings>) => Promise<void>;
  refreshUsage: () => Promise<void>;

  // Utilities
  hasRole: (minRole: OrganizationRole) => boolean;
  canManageMembers: () => boolean;
  canManageSettings: () => boolean;
}

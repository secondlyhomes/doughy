-- ============================================================================
-- MULTI-TENANCY DATABASE SCHEMA
-- ============================================================================
-- This schema implements a comprehensive multi-tenancy system with:
-- - Organization-based data isolation
-- - Role-based access control within organizations
-- - Secure RLS policies
-- - Audit logging
-- - Data retention policies
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ORGANIZATIONS TABLE
-- ============================================================================
-- Central table for multi-tenancy. Each organization is a separate tenant.

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
  slug TEXT UNIQUE NOT NULL CHECK (slug ~ '^[a-z0-9-]+$' AND char_length(slug) >= 2),

  -- Organization metadata
  description TEXT,
  logo_url TEXT,
  website TEXT,

  -- Settings and configuration
  settings JSONB DEFAULT '{
    "timezone": "UTC",
    "date_format": "YYYY-MM-DD",
    "features": {
      "ai_enabled": true,
      "analytics_enabled": true,
      "api_access": false
    },
    "limits": {
      "max_users": 50,
      "max_tasks": 10000,
      "max_storage_mb": 5000
    }
  }'::JSONB,

  -- Billing and subscription
  subscription_tier TEXT DEFAULT 'free' CHECK (
    subscription_tier IN ('free', 'starter', 'professional', 'enterprise')
  ),
  subscription_status TEXT DEFAULT 'active' CHECK (
    subscription_status IN ('active', 'past_due', 'canceled', 'trialing')
  ),
  subscription_ends_at TIMESTAMPTZ,

  -- Lifecycle
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deleted')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  deleted_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_status ON organizations(status) WHERE status = 'active';
CREATE INDEX idx_organizations_subscription ON organizations(subscription_tier, subscription_status);

-- Auto-update timestamp
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- ============================================================================
-- ORGANIZATION MEMBERS TABLE
-- ============================================================================
-- Junction table connecting users to organizations with roles

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Role within organization
  role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member', 'guest')),

  -- Permissions can override role defaults
  custom_permissions JSONB DEFAULT '[]'::JSONB,

  -- Invitation tracking
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT now(),
  invitation_accepted_at TIMESTAMPTZ,

  -- Lifecycle
  joined_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  last_active_at TIMESTAMPTZ,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'removed')),
  removed_at TIMESTAMPTZ,
  removed_by UUID REFERENCES auth.users(id),

  UNIQUE(organization_id, user_id)
);

-- Indexes
CREATE INDEX idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX idx_org_members_role ON organization_members(organization_id, role);
CREATE INDEX idx_org_members_active ON organization_members(organization_id, user_id)
  WHERE status = 'active';

COMMENT ON TABLE organization_members IS 'Links users to organizations with specific roles';
COMMENT ON COLUMN organization_members.role IS 'owner: full control, admin: manage members, member: standard access, guest: read-only';

-- ============================================================================
-- ORGANIZATION INVITATIONS TABLE
-- ============================================================================
-- Pending invitations to join organizations

CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  role TEXT NOT NULL CHECK (role IN ('admin', 'member', 'guest')),

  -- Invitation details
  invited_by UUID NOT NULL REFERENCES auth.users(id),
  message TEXT,

  -- Token for acceptance
  token UUID UNIQUE NOT NULL DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  accepted_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, email, status) DEFERRABLE INITIALLY DEFERRED
);

CREATE INDEX idx_org_invitations_org_id ON organization_invitations(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);
CREATE INDEX idx_org_invitations_pending ON organization_invitations(organization_id, status)
  WHERE status = 'pending';

-- Auto-expire invitations
CREATE OR REPLACE FUNCTION expire_invitations()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE organization_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_expire_invitations
  AFTER INSERT OR UPDATE ON organization_invitations
  FOR EACH STATEMENT
  EXECUTE FUNCTION expire_invitations();

-- ============================================================================
-- ORGANIZATION AUDIT LOG
-- ============================================================================
-- Track all important actions within organizations

CREATE TABLE organization_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Action details
  action TEXT NOT NULL, -- e.g., 'member.added', 'settings.updated', 'task.deleted'
  resource_type TEXT, -- e.g., 'member', 'task', 'settings'
  resource_id UUID,

  -- Context
  metadata JSONB DEFAULT '{}'::JSONB,
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Indexes
CREATE INDEX idx_audit_log_org_id ON organization_audit_log(organization_id);
CREATE INDEX idx_audit_log_user_id ON organization_audit_log(user_id);
CREATE INDEX idx_audit_log_action ON organization_audit_log(action);
CREATE INDEX idx_audit_log_created_at ON organization_audit_log(created_at DESC);
CREATE INDEX idx_audit_log_resource ON organization_audit_log(resource_type, resource_id);

-- Partition by month for better performance
-- (Implement partitioning in production for large-scale deployments)

COMMENT ON TABLE organization_audit_log IS 'Immutable audit trail of all organization actions';

-- ============================================================================
-- TASKS TABLE (with organization context)
-- ============================================================================
-- Modified tasks table to support multi-tenancy

-- Add organization_id to existing tasks table
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Add team assignment (optional)
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS team_id UUID; -- Will reference teams table

-- Add visibility control
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS visibility TEXT DEFAULT 'private'
  CHECK (visibility IN ('private', 'team', 'organization'));

-- Indexes for multi-tenancy queries
CREATE INDEX IF NOT EXISTS idx_tasks_organization ON tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_tasks_org_user ON tasks(organization_id, user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team ON tasks(team_id) WHERE team_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_visibility ON tasks(organization_id, visibility);

COMMENT ON COLUMN tasks.organization_id IS 'Organization that owns this task';
COMMENT ON COLUMN tasks.visibility IS 'private: only creator, team: team members, organization: all org members';

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_audit_log ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- ORGANIZATIONS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view organizations they belong to
CREATE POLICY "Users can view their organizations"
  ON organizations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Users can create organizations (they become owner)
CREATE POLICY "Authenticated users can create organizations"
  ON organizations FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Only owners can update organization details
CREATE POLICY "Owners can update organization"
  ON organizations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'owner'
        AND status = 'active'
    )
  );

-- Only owners can delete organizations
CREATE POLICY "Owners can delete organization"
  ON organizations FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organizations.id
        AND user_id = auth.uid()
        AND role = 'owner'
        AND status = 'active'
    )
  );

-- ----------------------------------------------------------------------------
-- ORGANIZATION MEMBERS POLICIES
-- ----------------------------------------------------------------------------

-- Users can view members of their organizations
CREATE POLICY "Users can view org members"
  ON organization_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.status = 'active'
    )
  );

-- Admins and owners can add members
CREATE POLICY "Admins can add members"
  ON organization_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_members.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Admins and owners can update members (except owners can't be demoted by admins)
CREATE POLICY "Admins can update members"
  ON organization_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND (
          om.role = 'owner'
          OR (om.role = 'admin' AND organization_members.role != 'owner')
        )
        AND om.status = 'active'
    )
  );

-- Admins and owners can remove members (except owners)
CREATE POLICY "Admins can remove members"
  ON organization_members FOR DELETE
  USING (
    organization_members.role != 'owner'
    AND EXISTS (
      SELECT 1 FROM organization_members AS om
      WHERE om.organization_id = organization_members.organization_id
        AND om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
    )
  );

-- ----------------------------------------------------------------------------
-- ORGANIZATION INVITATIONS POLICIES
-- ----------------------------------------------------------------------------

-- Members can view pending invitations for their org
CREATE POLICY "Members can view org invitations"
  ON organization_invitations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_invitations.organization_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Admins can create invitations
CREATE POLICY "Admins can create invitations"
  ON organization_invitations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_invitations.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Admins can update/revoke invitations
CREATE POLICY "Admins can update invitations"
  ON organization_invitations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_invitations.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- ----------------------------------------------------------------------------
-- AUDIT LOG POLICIES
-- ----------------------------------------------------------------------------

-- Members can view audit logs for their organization
CREATE POLICY "Members can view audit logs"
  ON organization_audit_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = organization_audit_log.organization_id
        AND user_id = auth.uid()
        AND status = 'active'
    )
  );

-- Service role can insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON organization_audit_log FOR INSERT
  TO service_role
  WITH CHECK (true);

-- No updates or deletes (immutable audit trail)

-- ----------------------------------------------------------------------------
-- TASKS POLICIES (Multi-Tenant)
-- ----------------------------------------------------------------------------

-- Drop old single-tenant policies if they exist
DROP POLICY IF EXISTS "Users can view their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can create tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON tasks;

-- Users can view tasks based on visibility and membership
CREATE POLICY "Users can view organization tasks"
  ON tasks FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
    )
    AND (
      visibility = 'organization'
      OR (visibility = 'team' AND team_id IN (
        SELECT team_id FROM team_members WHERE user_id = auth.uid()
      ))
      OR (visibility = 'private' AND user_id = auth.uid())
      OR user_id = auth.uid() -- Owner can always see their tasks
    )
  );

-- Users can create tasks in their organizations
CREATE POLICY "Users can create tasks in their orgs"
  ON tasks FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin', 'member')
    )
  );

-- Users can update their own tasks or if they're admin
CREATE POLICY "Users can update organization tasks"
  ON tasks FOR UPDATE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = tasks.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Users can delete their own tasks or if they're admin
CREATE POLICY "Users can delete organization tasks"
  ON tasks FOR DELETE
  USING (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = tasks.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Get user's role in organization
CREATE OR REPLACE FUNCTION get_user_org_role(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS TEXT AS $$
  SELECT role
  FROM organization_members
  WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND status = 'active'
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION is_org_member(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = p_user_id
      AND organization_id = p_organization_id
      AND status = 'active'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if user has minimum role in organization
CREATE OR REPLACE FUNCTION has_org_role(
  p_user_id UUID,
  p_organization_id UUID,
  p_min_role TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_role TEXT;
  v_role_hierarchy JSONB := '{
    "guest": 1,
    "member": 2,
    "admin": 3,
    "owner": 4
  }';
BEGIN
  SELECT role INTO v_role
  FROM organization_members
  WHERE user_id = p_user_id
    AND organization_id = p_organization_id
    AND status = 'active';

  IF v_role IS NULL THEN
    RETURN false;
  END IF;

  RETURN (v_role_hierarchy->v_role)::int >= (v_role_hierarchy->p_min_role)::int;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
  p_organization_id UUID,
  p_action TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_audit_id UUID;
BEGIN
  INSERT INTO organization_audit_log (
    organization_id,
    user_id,
    action,
    resource_type,
    resource_id,
    metadata
  ) VALUES (
    p_organization_id,
    auth.uid(),
    p_action,
    p_resource_type,
    p_resource_id,
    p_metadata
  )
  RETURNING id INTO v_audit_id;

  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get organization usage stats
CREATE OR REPLACE FUNCTION get_organization_usage(p_organization_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_stats JSONB;
BEGIN
  SELECT jsonb_build_object(
    'member_count', (
      SELECT COUNT(*) FROM organization_members
      WHERE organization_id = p_organization_id AND status = 'active'
    ),
    'task_count', (
      SELECT COUNT(*) FROM tasks
      WHERE organization_id = p_organization_id
    ),
    'storage_mb', 0, -- Implement based on your storage tracking
    'api_calls_today', 0 -- Implement based on your API tracking
  ) INTO v_stats;

  RETURN v_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- TRIGGERS FOR AUDIT LOGGING
-- ============================================================================

-- Log member additions
CREATE OR REPLACE FUNCTION log_member_added()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_audit_event(
    NEW.organization_id,
    'member.added',
    'member',
    NEW.id,
    jsonb_build_object(
      'user_id', NEW.user_id,
      'role', NEW.role,
      'invited_by', NEW.invited_by
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_member_added
  AFTER INSERT ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION log_member_added();

-- Log member role changes
CREATE OR REPLACE FUNCTION log_member_updated()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.role != NEW.role OR OLD.status != NEW.status THEN
    PERFORM log_audit_event(
      NEW.organization_id,
      'member.updated',
      'member',
      NEW.id,
      jsonb_build_object(
        'user_id', NEW.user_id,
        'old_role', OLD.role,
        'new_role', NEW.role,
        'old_status', OLD.status,
        'new_status', NEW.status
      )
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_member_updated
  AFTER UPDATE ON organization_members
  FOR EACH ROW
  EXECUTE FUNCTION log_member_updated();

-- Log organization updates
CREATE OR REPLACE FUNCTION log_organization_updated()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM log_audit_event(
    NEW.id,
    'organization.updated',
    'organization',
    NEW.id,
    jsonb_build_object(
      'changes', jsonb_build_object(
        'name', jsonb_build_object('old', OLD.name, 'new', NEW.name),
        'settings', jsonb_build_object('old', OLD.settings, 'new', NEW.settings)
      )
    )
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_log_organization_updated
  AFTER UPDATE ON organizations
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION log_organization_updated();

-- ============================================================================
-- SEED DATA (for development/testing)
-- ============================================================================

-- Create a demo organization
-- INSERT INTO organizations (name, slug, description, subscription_tier)
-- VALUES (
--   'Acme Corporation',
--   'acme-corp',
--   'Demo organization for testing multi-tenancy',
--   'professional'
-- );

-- ============================================================================
-- MIGRATIONS & DATA BACKFILL
-- ============================================================================

-- For existing deployments, backfill organization_id on tasks:
-- 1. Create a default organization for each user
-- 2. Assign their tasks to their personal organization
-- 3. Or migrate to a team-based approach

-- Example backfill function (customize based on your needs):
CREATE OR REPLACE FUNCTION backfill_task_organizations()
RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_org_id UUID;
BEGIN
  FOR v_user IN SELECT DISTINCT user_id FROM tasks WHERE organization_id IS NULL
  LOOP
    -- Create personal organization
    INSERT INTO organizations (name, slug)
    VALUES (
      'Personal - ' || v_user.user_id::TEXT,
      'personal-' || substring(v_user.user_id::TEXT, 1, 8)
    )
    ON CONFLICT (slug) DO NOTHING
    RETURNING id INTO v_org_id;

    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role)
    VALUES (v_org_id, v_user.user_id, 'owner')
    ON CONFLICT DO NOTHING;

    -- Update tasks
    UPDATE tasks
    SET organization_id = v_org_id
    WHERE user_id = v_user.user_id
      AND organization_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run backfill (comment out after first run):
-- SELECT backfill_task_organizations();

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- Additional indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_org_members_lookup
  ON organization_members(user_id, organization_id, status, role);

CREATE INDEX IF NOT EXISTS idx_tasks_org_status
  ON tasks(organization_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_log_org_time
  ON organization_audit_log(organization_id, created_at DESC);

-- ============================================================================
-- CLEANUP & MAINTENANCE
-- ============================================================================

-- Function to clean up old audit logs (run periodically)
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(days_to_keep INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM organization_audit_log
  WHERE created_at < now() - (days_to_keep || ' days')::INTERVAL;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired invitations
CREATE OR REPLACE FUNCTION cleanup_expired_invitations()
RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER;
BEGIN
  UPDATE organization_invitations
  SET status = 'expired'
  WHERE status = 'pending'
    AND expires_at < now();

  GET DIAGNOSTICS v_updated = ROW_COUNT;
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- GRANTS (customize based on your auth setup)
-- ============================================================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_members TO authenticated;
GRANT SELECT, INSERT, UPDATE ON organization_invitations TO authenticated;
GRANT SELECT ON organization_audit_log TO authenticated;

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

COMMENT ON SCHEMA public IS 'Multi-tenant organization schema with RLS and audit logging';

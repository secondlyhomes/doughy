-- ============================================================================
-- ROLE-BASED ACCESS CONTROL (RBAC) SCHEMA
-- ============================================================================
-- Comprehensive RBAC system with:
-- - Dynamic role definitions
-- - Fine-grained permissions
-- - Permission inheritance
-- - Resource-level access control
-- - Audit logging
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- PERMISSIONS TABLE
-- ============================================================================
-- Define all available permissions in the system

CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Permission identifier (e.g., "tasks:create", "users:manage")
  resource TEXT NOT NULL, -- e.g., tasks, users, settings, reports
  action TEXT NOT NULL,   -- e.g., create, read, update, delete, manage, export

  -- Description for UI
  name TEXT NOT NULL,
  description TEXT,

  -- Grouping for UI
  category TEXT, -- e.g., "Content Management", "User Management"

  -- System permissions cannot be deleted
  is_system BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(resource, action)
);

CREATE INDEX idx_permissions_resource ON permissions(resource);
CREATE INDEX idx_permissions_category ON permissions(category);

COMMENT ON TABLE permissions IS 'Registry of all permissions available in the system';
COMMENT ON COLUMN permissions.resource IS 'Resource type (e.g., tasks, users, settings)';
COMMENT ON COLUMN permissions.action IS 'Action on resource (e.g., create, read, update, delete)';

-- ============================================================================
-- ROLES TABLE
-- ============================================================================
-- Define roles within organizations

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Role details
  name TEXT NOT NULL,
  description TEXT,

  -- Display in UI
  color TEXT DEFAULT '#6B7280', -- hex color for badges
  icon TEXT, -- icon identifier

  -- System roles (owner, admin) cannot be deleted
  is_system BOOLEAN DEFAULT false,

  -- Role hierarchy (higher = more permissions)
  priority INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,

  UNIQUE(organization_id, name)
);

CREATE INDEX idx_roles_organization ON roles(organization_id);
CREATE INDEX idx_roles_priority ON roles(organization_id, priority DESC);

COMMENT ON TABLE roles IS 'Roles defined per organization';
COMMENT ON COLUMN roles.priority IS 'Higher priority roles override lower ones in conflicts';

-- ============================================================================
-- ROLE PERMISSIONS TABLE
-- ============================================================================
-- Junction table: which permissions belong to which roles

CREATE TABLE role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  -- Permission can be granted or explicitly denied
  granted BOOLEAN DEFAULT true,

  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  granted_by UUID REFERENCES auth.users(id),

  UNIQUE(role_id, permission_id)
);

CREATE INDEX idx_role_permissions_role ON role_permissions(role_id);
CREATE INDEX idx_role_permissions_permission ON role_permissions(permission_id);

COMMENT ON TABLE role_permissions IS 'Maps permissions to roles';

-- ============================================================================
-- USER ROLES TABLE
-- ============================================================================
-- Assign roles to users within organizations

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Assignment metadata
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ, -- NULL = never expires

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'revoked')),
  revoked_at TIMESTAMPTZ,
  revoked_by UUID REFERENCES auth.users(id),

  UNIQUE(user_id, role_id, organization_id)
);

CREATE INDEX idx_user_roles_user ON user_roles(user_id, organization_id);
CREATE INDEX idx_user_roles_role ON user_roles(role_id);
CREATE INDEX idx_user_roles_active ON user_roles(user_id, organization_id, status)
  WHERE status = 'active';

COMMENT ON TABLE user_roles IS 'Assigns roles to users in organizations';

-- ============================================================================
-- USER PERMISSIONS TABLE (Direct Assignments)
-- ============================================================================
-- Override role permissions for specific users

CREATE TABLE user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,

  -- Grant or deny (overrides role permissions)
  granted BOOLEAN NOT NULL,

  -- Assignment metadata
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,

  reason TEXT, -- Why was this override granted?

  UNIQUE(user_id, organization_id, permission_id)
);

CREATE INDEX idx_user_permissions_user ON user_permissions(user_id, organization_id);

COMMENT ON TABLE user_permissions IS 'Direct permission assignments that override role permissions';

-- ============================================================================
-- RESOURCE PERMISSIONS TABLE
-- ============================================================================
-- Permissions for specific resources (row-level permissions)

CREATE TABLE resource_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Resource identification
  resource_type TEXT NOT NULL, -- e.g., 'task', 'project', 'document'
  resource_id UUID NOT NULL,

  -- Who has access
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- What they can do
  permissions TEXT[] NOT NULL, -- Array of actions: ['read', 'update', 'delete']

  -- Metadata
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  expires_at TIMESTAMPTZ,

  CHECK (user_id IS NOT NULL OR role_id IS NOT NULL)
);

CREATE INDEX idx_resource_permissions_resource ON resource_permissions(resource_type, resource_id);
CREATE INDEX idx_resource_permissions_user ON resource_permissions(user_id, organization_id);
CREATE INDEX idx_resource_permissions_role ON resource_permissions(role_id);

COMMENT ON TABLE resource_permissions IS 'Fine-grained permissions for specific resources';

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE resource_permissions ENABLE ROW LEVEL SECURITY;

-- Permissions: everyone can view (used for UI)
CREATE POLICY "Anyone can view permissions"
  ON permissions FOR SELECT
  TO authenticated
  USING (true);

-- Roles: users can view roles in their organizations
CREATE POLICY "Users can view org roles"
  ON roles FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- Only admins can manage roles
CREATE POLICY "Admins can manage roles"
  ON roles FOR ALL
  USING (
    is_system = false
    AND EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = roles.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Role Permissions: users can view role permissions in their org
CREATE POLICY "Users can view role permissions"
  ON role_permissions FOR SELECT
  USING (
    role_id IN (
      SELECT r.id FROM roles r
      JOIN organization_members om ON r.organization_id = om.organization_id
      WHERE om.user_id = auth.uid() AND om.status = 'active'
    )
  );

-- Only admins can modify role permissions
CREATE POLICY "Admins can modify role permissions"
  ON role_permissions FOR ALL
  USING (
    role_id IN (
      SELECT r.id FROM roles r
      JOIN organization_members om ON r.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
        AND om.role IN ('owner', 'admin')
        AND om.status = 'active'
        AND r.is_system = false
    )
  );

-- User Roles: users can view their own roles
CREATE POLICY "Users can view their roles"
  ON user_roles FOR SELECT
  USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- Only admins can assign roles
CREATE POLICY "Admins can assign roles"
  ON user_roles FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'admin')
        AND status = 'active'
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get all permissions for a user in an organization
CREATE OR REPLACE FUNCTION get_user_permissions(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS TABLE(resource TEXT, action TEXT, granted BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  WITH role_perms AS (
    -- Permissions from roles
    SELECT DISTINCT
      p.resource,
      p.action,
      rp.granted
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND ur.organization_id = p_organization_id
      AND ur.status = 'active'
      AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ),
  direct_perms AS (
    -- Direct permission assignments (override role permissions)
    SELECT
      p.resource,
      p.action,
      up.granted
    FROM user_permissions up
    JOIN permissions p ON up.permission_id = p.id
    WHERE up.user_id = p_user_id
      AND up.organization_id = p_organization_id
      AND (up.expires_at IS NULL OR up.expires_at > now())
  )
  -- Direct permissions override role permissions
  SELECT DISTINCT ON (dp.resource, dp.action)
    COALESCE(dp.resource, rp.resource) as resource,
    COALESCE(dp.action, rp.action) as action,
    COALESCE(dp.granted, rp.granted) as granted
  FROM direct_perms dp
  FULL OUTER JOIN role_perms rp
    ON dp.resource = rp.resource
    AND dp.action = rp.action
  WHERE COALESCE(dp.granted, rp.granted) = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has a specific permission
CREATE OR REPLACE FUNCTION has_permission(
  p_user_id UUID,
  p_organization_id UUID,
  p_permission TEXT -- Format: "resource:action"
)
RETURNS BOOLEAN AS $$
DECLARE
  v_parts TEXT[];
  v_resource TEXT;
  v_action TEXT;
BEGIN
  -- Parse permission string
  v_parts := string_to_array(p_permission, ':');
  IF array_length(v_parts, 1) != 2 THEN
    RAISE EXCEPTION 'Invalid permission format. Use "resource:action"';
  END IF;

  v_resource := v_parts[1];
  v_action := v_parts[2];

  -- Check if user has permission
  RETURN EXISTS (
    SELECT 1
    FROM get_user_permissions(p_user_id, p_organization_id)
    WHERE resource = v_resource
      AND action = v_action
      AND granted = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has any of the specified permissions
CREATE OR REPLACE FUNCTION has_any_permission(
  p_user_id UUID,
  p_organization_id UUID,
  p_permissions TEXT[] -- Array of "resource:action"
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permission TEXT;
BEGIN
  FOREACH v_permission IN ARRAY p_permissions
  LOOP
    IF has_permission(p_user_id, p_organization_id, v_permission) THEN
      RETURN true;
    END IF;
  END LOOP;

  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has all specified permissions
CREATE OR REPLACE FUNCTION has_all_permissions(
  p_user_id UUID,
  p_organization_id UUID,
  p_permissions TEXT[]
)
RETURNS BOOLEAN AS $$
DECLARE
  v_permission TEXT;
BEGIN
  FOREACH v_permission IN ARRAY p_permissions
  LOOP
    IF NOT has_permission(p_user_id, p_organization_id, v_permission) THEN
      RETURN false;
    END IF;
  END LOOP;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check resource-level permission
CREATE OR REPLACE FUNCTION has_resource_permission(
  p_user_id UUID,
  p_organization_id UUID,
  p_resource_type TEXT,
  p_resource_id UUID,
  p_action TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Check direct resource permission
  RETURN EXISTS (
    SELECT 1
    FROM resource_permissions rp
    WHERE rp.resource_type = p_resource_type
      AND rp.resource_id = p_resource_id
      AND rp.organization_id = p_organization_id
      AND (
        (rp.user_id = p_user_id)
        OR (rp.role_id IN (
          SELECT role_id FROM user_roles
          WHERE user_id = p_user_id
            AND organization_id = p_organization_id
            AND status = 'active'
        ))
      )
      AND p_action = ANY(rp.permissions)
      AND (rp.expires_at IS NULL OR rp.expires_at > now())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's highest priority role in organization
CREATE OR REPLACE FUNCTION get_user_primary_role(
  p_user_id UUID,
  p_organization_id UUID
)
RETURNS TABLE(role_id UUID, role_name TEXT, priority INTEGER) AS $$
BEGIN
  RETURN QUERY
  SELECT
    r.id,
    r.name,
    r.priority
  FROM user_roles ur
  JOIN roles r ON ur.role_id = r.id
  WHERE ur.user_id = p_user_id
    AND ur.organization_id = p_organization_id
    AND ur.status = 'active'
    AND (ur.expires_at IS NULL OR ur.expires_at > now())
  ORDER BY r.priority DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- RBAC-ENHANCED RLS POLICIES FOR TASKS
-- ============================================================================

-- Drop old policies
DROP POLICY IF EXISTS "Users can delete organization tasks" ON tasks;

-- Users can delete tasks if they have permission
CREATE POLICY "Users with permission can delete tasks"
  ON tasks FOR DELETE
  USING (
    has_permission(
      auth.uid(),
      organization_id,
      'tasks:delete'
    )
    OR user_id = auth.uid() -- Owner can always delete
  );

-- Users can update tasks if they have permission
DROP POLICY IF EXISTS "Users can update organization tasks" ON tasks;

CREATE POLICY "Users with permission can update tasks"
  ON tasks FOR UPDATE
  USING (
    has_permission(
      auth.uid(),
      organization_id,
      'tasks:update'
    )
    OR user_id = auth.uid()
  );

-- Users can create tasks if they have permission
DROP POLICY IF EXISTS "Users can create tasks in their orgs" ON tasks;

CREATE POLICY "Users with permission can create tasks"
  ON tasks FOR INSERT
  WITH CHECK (
    has_permission(
      auth.uid(),
      organization_id,
      'tasks:create'
    )
  );

-- ============================================================================
-- SEED SYSTEM PERMISSIONS
-- ============================================================================

INSERT INTO permissions (resource, action, name, description, category, is_system) VALUES
  -- Task permissions
  ('tasks', 'create', 'Create Tasks', 'Create new tasks', 'Task Management', true),
  ('tasks', 'read', 'View Tasks', 'View tasks', 'Task Management', true),
  ('tasks', 'update', 'Update Tasks', 'Edit existing tasks', 'Task Management', true),
  ('tasks', 'delete', 'Delete Tasks', 'Delete tasks', 'Task Management', true),
  ('tasks', 'assign', 'Assign Tasks', 'Assign tasks to team members', 'Task Management', true),
  ('tasks', 'export', 'Export Tasks', 'Export tasks to CSV/PDF', 'Task Management', true),

  -- User management
  ('users', 'read', 'View Users', 'View organization members', 'User Management', true),
  ('users', 'invite', 'Invite Users', 'Invite new members', 'User Management', true),
  ('users', 'update', 'Update Users', 'Edit user profiles and settings', 'User Management', true),
  ('users', 'remove', 'Remove Users', 'Remove members from organization', 'User Management', true),
  ('users', 'manage', 'Manage Users', 'Full user management access', 'User Management', true),

  -- Role management
  ('roles', 'read', 'View Roles', 'View roles and permissions', 'Role Management', true),
  ('roles', 'create', 'Create Roles', 'Create new roles', 'Role Management', true),
  ('roles', 'update', 'Update Roles', 'Modify role permissions', 'Role Management', true),
  ('roles', 'delete', 'Delete Roles', 'Delete custom roles', 'Role Management', true),
  ('roles', 'assign', 'Assign Roles', 'Assign roles to users', 'Role Management', true),

  -- Organization settings
  ('settings', 'read', 'View Settings', 'View organization settings', 'Settings', true),
  ('settings', 'update', 'Update Settings', 'Modify organization settings', 'Settings', true),
  ('settings', 'billing', 'Manage Billing', 'Manage subscriptions and billing', 'Settings', true),

  -- Analytics
  ('analytics', 'read', 'View Analytics', 'View analytics and reports', 'Analytics', true),
  ('analytics', 'export', 'Export Analytics', 'Export analytics data', 'Analytics', true),

  -- API access
  ('api', 'access', 'API Access', 'Access organization API', 'API', true)
ON CONFLICT (resource, action) DO NOTHING;

-- ============================================================================
-- FUNCTION TO CREATE SYSTEM ROLES FOR AN ORGANIZATION
-- ============================================================================

CREATE OR REPLACE FUNCTION create_system_roles(p_organization_id UUID)
RETURNS void AS $$
DECLARE
  v_owner_role_id UUID;
  v_admin_role_id UUID;
  v_member_role_id UUID;
  v_guest_role_id UUID;
  v_perm_id UUID;
BEGIN
  -- Create Owner role (all permissions)
  INSERT INTO roles (organization_id, name, description, is_system, priority, color)
  VALUES (p_organization_id, 'Owner', 'Full access to organization', true, 100, '#EF4444')
  RETURNING id INTO v_owner_role_id;

  -- Grant all permissions to owner
  FOR v_perm_id IN SELECT id FROM permissions
  LOOP
    INSERT INTO role_permissions (role_id, permission_id, granted)
    VALUES (v_owner_role_id, v_perm_id, true);
  END LOOP;

  -- Create Admin role (most permissions except billing)
  INSERT INTO roles (organization_id, name, description, is_system, priority, color)
  VALUES (p_organization_id, 'Admin', 'Manage organization and members', true, 75, '#F59E0B')
  RETURNING id INTO v_admin_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_admin_role_id, id, true
  FROM permissions
  WHERE (resource, action) IN (
    ('tasks', 'create'), ('tasks', 'read'), ('tasks', 'update'), ('tasks', 'delete'),
    ('tasks', 'assign'), ('tasks', 'export'),
    ('users', 'read'), ('users', 'invite'), ('users', 'update'), ('users', 'remove'),
    ('roles', 'read'), ('roles', 'assign'),
    ('settings', 'read'), ('settings', 'update'),
    ('analytics', 'read'), ('analytics', 'export')
  );

  -- Create Member role (standard permissions)
  INSERT INTO roles (organization_id, name, description, is_system, priority, color)
  VALUES (p_organization_id, 'Member', 'Standard member access', true, 50, '#3B82F6')
  RETURNING id INTO v_member_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_member_role_id, id, true
  FROM permissions
  WHERE (resource, action) IN (
    ('tasks', 'create'), ('tasks', 'read'), ('tasks', 'update'),
    ('users', 'read'),
    ('analytics', 'read')
  );

  -- Create Guest role (read-only)
  INSERT INTO roles (organization_id, name, description, is_system, priority, color)
  VALUES (p_organization_id, 'Guest', 'Read-only access', true, 25, '#6B7280')
  RETURNING id INTO v_guest_role_id;

  INSERT INTO role_permissions (role_id, permission_id, granted)
  SELECT v_guest_role_id, id, true
  FROM permissions
  WHERE (resource, action) IN (
    ('tasks', 'read'),
    ('users', 'read')
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- TRIGGER TO CREATE SYSTEM ROLES FOR NEW ORGANIZATIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION trigger_create_system_roles()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM create_system_roles(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_new_organization_roles
  AFTER INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_system_roles();

-- ============================================================================
-- GRANTS
-- ============================================================================

GRANT SELECT ON permissions TO authenticated;
GRANT SELECT ON roles TO authenticated;
GRANT SELECT ON role_permissions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_roles TO authenticated;

-- ============================================================================
-- END OF RBAC SCHEMA
-- ============================================================================

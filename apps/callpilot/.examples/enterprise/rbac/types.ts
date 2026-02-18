/**
 * RBAC Type Definitions
 *
 * Types for Role-Based Access Control system.
 */

// ============================================================================
// PERMISSION TYPES
// ============================================================================

export type PermissionAction =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'manage'
  | 'assign'
  | 'export'
  | 'access'

export type PermissionResource =
  | 'tasks'
  | 'users'
  | 'roles'
  | 'settings'
  | 'analytics'
  | 'api'

export type Permission = `${PermissionResource}:${PermissionAction}`

export interface PermissionDefinition {
  id: string
  resource: PermissionResource
  action: PermissionAction
  name: string
  description: string
  category: string
  is_system: boolean
}

// ============================================================================
// ROLE TYPES
// ============================================================================

export interface Role {
  id: string
  organization_id: string
  name: string
  description: string
  color: string
  icon: string | null
  is_system: boolean
  priority: number
  permissions: Permission[]
  created_at: string
  updated_at: string
}

export interface UserRole {
  id: string
  user_id: string
  role_id: string
  organization_id: string
  granted_by: string | null
  granted_at: string
  expires_at: string | null
  status: 'active' | 'suspended' | 'revoked'
  role: Role
}

export interface ResourcePermission {
  id: string
  resource_type: string
  resource_id: string
  user_id: string | null
  role_id: string | null
  organization_id: string
  permissions: string[]
  granted_by: string | null
  granted_at: string
  expires_at: string | null
}

// ============================================================================
// OPERATION PARAMS
// ============================================================================

export interface CreateRoleParams {
  name: string
  description: string
  color?: string
  icon?: string
  permissions: Permission[]
}

export interface GrantResourcePermissionParams {
  resourceType: string
  resourceId: string
  userId?: string
  roleId?: string
  permissions: string[]
  expiresAt?: string
}

// ============================================================================
// STATE TYPES
// ============================================================================

export interface RBACState {
  permissions: Permission[]
  availablePermissions: PermissionDefinition[]
  userRoles: UserRole[]
  roles: Role[]
  loading: boolean
  error: Error | null
}

// ============================================================================
// CONTEXT VALUE TYPE
// ============================================================================

export interface RBACContextValue extends RBACState {
  // Permission checking
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (...permissions: Permission[]) => boolean
  hasAllPermissions: (...permissions: Permission[]) => boolean
  hasResourcePermission: (
    resourceType: string,
    resourceId: string,
    action: string
  ) => Promise<boolean>

  // Role management
  createRole: (params: CreateRoleParams) => Promise<Role>
  updateRole: (roleId: string, updates: Partial<CreateRoleParams>) => Promise<void>
  deleteRole: (roleId: string) => Promise<void>
  assignRole: (userId: string, roleId: string, expiresAt?: string) => Promise<void>
  revokeRole: (userRoleId: string) => Promise<void>

  // Resource permissions
  grantResourcePermission: (params: GrantResourcePermissionParams) => Promise<void>
  revokeResourcePermission: (permissionId: string) => Promise<void>

  // Utilities
  getUserRoles: (userId: string) => UserRole[]
  getPrimaryRole: () => UserRole | null
  refreshPermissions: () => Promise<void>
}

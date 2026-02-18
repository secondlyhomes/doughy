/**
 * RBAC Module
 *
 * Role-Based Access Control for fine-grained permissions.
 *
 * Usage:
 * ```tsx
 * import { RBACProvider, useRBAC, Permission, Role } from './rbac'
 *
 * // In app root
 * <RBACProvider>
 *   <App />
 * </RBACProvider>
 *
 * // In component
 * const { hasPermission } = useRBAC()
 * if (hasPermission('tasks:delete')) {
 *   // Show delete button
 * }
 * ```
 */

// Provider
export { RBACProvider } from './RBACProvider'
export { RBACContext } from './RBACProvider'

// Hook
export { useRBAC } from './useRBAC'

// Types
export type {
  Permission,
  PermissionAction,
  PermissionResource,
  PermissionDefinition,
  Role,
  UserRole,
  ResourcePermission,
  CreateRoleParams,
  GrantResourcePermissionParams,
  RBACState,
  RBACContextValue,
} from './types'

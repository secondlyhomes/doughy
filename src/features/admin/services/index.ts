// src/features/admin/services/index.ts
// Export all admin services

export {
  getAdminStats,
  getSystemHealth,
  type AdminStats,
  type SystemHealth,
  type AdminStatsResult,
  type SystemHealthResult,
} from './adminService';

export {
  getUsers,
  getUserById,
  updateUserRole,
  restoreUser,
  deleteUser,
  getRoleLabel,
  isAdminRole,
  type AdminUser,
  type UserRole,
  type UserListResult,
  type UserResult,
  type UserFilters,
} from './userService';

export {
  getLogs,
  getLogSources,
  type LogEntry,
  type LogLevel,
  type LogFilters,
  type LogsResult,
} from './logsService';

export {
  getIntegrations,
  toggleIntegration,
  syncIntegration,
  type Integration,
  type IntegrationStatus,
  type IntegrationsResult,
  type IntegrationResult,
} from './integrationsService';

// src/features/admin/index.ts
// Main admin feature exports

// Screens
export {
  AdminDashboardScreen,
  UserManagementScreen,
  UserDetailScreen,
  SystemLogsScreen,
  IntegrationsScreen,
} from './screens';

// Services
export {
  getAdminStats,
  getSystemHealth,
  getUsers,
  getUserById,
  updateUserRole,
  restoreUser,
  deleteUser,
  getLogs,
  getLogSources,
  getIntegrations,
  toggleIntegration,
  syncIntegration,
  type AdminStats,
  type SystemHealth,
  type AdminUser,
  type UserFilters,
  type LogEntry,
  type LogLevel,
  type LogFilters,
  type Integration,
  type IntegrationStatus,
} from './services';

export {
  investorSeeder,
  seedService, // Backward compatibility alias
  type SeedResult,
  type ClearResult,
  type SafetyCheckResult,
} from './services/investor-seeder';

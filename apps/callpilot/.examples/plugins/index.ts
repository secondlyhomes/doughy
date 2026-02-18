/**
 * Plugin System - Main Entry Point
 *
 * Export all core components, types, and example plugins.
 */

// Core Components
export { PluginManager } from './core/PluginManager';
export { HooksRegistry, HookBuilder, StandardHooks } from './hooks/HooksRegistry';

// Core Types
export * from './core/types';

// Hook Utilities
export {
  createFeatureFlagCondition,
  createAuthCondition,
  createEnvironmentCondition,
  combineConditions,
  anyCondition,
} from './hooks/HooksRegistry';

// Example Plugins
export { AnalyticsPlugin, createAnalyticsPlugin } from './examples/analytics-plugin';
export type {
  AnalyticsConfig,
  AnalyticsProvider,
  AnalyticsEvent,
  AnalyticsUser,
} from './examples/analytics-plugin';

export { StoragePlugin, createStoragePlugin } from './examples/storage-plugin';
export type {
  StorageConfig,
  StorageBackend,
  StorageOptions,
  StorageMigration,
} from './examples/storage-plugin';

export { AuthPlugin, createAuthPlugin } from './examples/auth-plugin';
export type {
  AuthConfig,
  AuthProvider,
  AuthUser,
  AuthSession,
} from './examples/auth-plugin';

export { NavigationPlugin, createNavigationPlugin } from './examples/navigation-plugin';
export type {
  NavigationConfig,
  RouteGuard,
  NavigationRoute,
} from './examples/navigation-plugin';

export { ThemePlugin, createThemePlugin } from './examples/theme-plugin';
export type {
  ThemeConfig,
  Theme,
  ThemeColors,
  ThemeSpacing,
  ThemeTypography,
  ThemeShadows,
  ThemeBorderRadius,
} from './examples/theme-plugin';

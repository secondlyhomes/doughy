/**
 * Core Plugin System Types
 *
 * Comprehensive type definitions for the plugin architecture.
 * Supports dependency injection, lifecycle management, and extensibility.
 */

// ============================================================================
// Core Plugin Types
// ============================================================================

/**
 * Plugin metadata and configuration
 */
export interface PluginMetadata {
  /** Unique plugin identifier (e.g., 'com.example.analytics') */
  id: string;
  /** Human-readable plugin name */
  name: string;
  /** Plugin version (semantic versioning recommended) */
  version: string;
  /** Plugin author/organization */
  author: string;
  /** Brief description of plugin functionality */
  description: string;
  /** Plugin category for organization */
  category: PluginCategory;
  /** License type (e.g., 'MIT', 'Apache-2.0') */
  license?: string;
  /** Homepage or documentation URL */
  homepage?: string;
  /** Repository URL */
  repository?: string;
  /** Plugin icon (emoji or asset path) */
  icon?: string;
  /** Keywords for searchability */
  keywords?: string[];
  /** Minimum required app version */
  minAppVersion?: string;
  /** Maximum compatible app version */
  maxAppVersion?: string;
}

/**
 * Plugin categories for organization
 */
export enum PluginCategory {
  ANALYTICS = 'analytics',
  AUTHENTICATION = 'authentication',
  STORAGE = 'storage',
  NAVIGATION = 'navigation',
  UI = 'ui',
  NETWORKING = 'networking',
  PAYMENTS = 'payments',
  NOTIFICATIONS = 'notifications',
  MEDIA = 'media',
  UTILITIES = 'utilities',
  DEVELOPMENT = 'development',
  CUSTOM = 'custom',
}

/**
 * Plugin lifecycle states
 */
export enum PluginState {
  UNINITIALIZED = 'uninitialized',
  INITIALIZING = 'initializing',
  INITIALIZED = 'initialized',
  ACTIVATING = 'activating',
  ACTIVE = 'active',
  DEACTIVATING = 'deactivating',
  DEACTIVATED = 'deactivated',
  ERROR = 'error',
  DISPOSED = 'disposed',
}

/**
 * Plugin dependency declaration
 */
export interface PluginDependency {
  /** Plugin ID this depends on */
  pluginId: string;
  /** Minimum required version (semver) */
  minVersion?: string;
  /** Maximum compatible version (semver) */
  maxVersion?: string;
  /** Whether dependency is optional */
  optional?: boolean;
  /** Fallback behavior if optional dependency unavailable */
  fallback?: () => void;
}

/**
 * Plugin capability declaration
 */
export interface PluginCapability {
  /** Capability identifier */
  id: string;
  /** Capability name */
  name: string;
  /** Capability description */
  description: string;
  /** Whether capability is enabled by default */
  enabled?: boolean;
  /** Required permissions */
  permissions?: string[];
}

// ============================================================================
// Plugin Context
// ============================================================================

/**
 * Context provided to plugins at runtime
 */
export interface PluginContext {
  /** Plugin metadata */
  metadata: PluginMetadata;
  /** App configuration */
  config: AppConfig;
  /** Logger instance */
  logger: PluginLogger;
  /** Event emitter */
  events: PluginEventEmitter;
  /** Storage interface */
  storage: PluginStorage;
  /** API client */
  api: PluginApiClient;
  /** State management */
  state: PluginStateManager;
  /** Hook into app lifecycle */
  lifecycle: PluginLifecycleHooks;
  /** Access to other plugins */
  plugins: PluginRegistry;
  /** Theme/styling access */
  theme: PluginThemeProvider;
  /** Navigation utilities */
  navigation?: PluginNavigationProvider;
  /** Custom data storage */
  data: Map<string, unknown>;
}

/**
 * App configuration available to plugins
 */
export interface AppConfig {
  /** App environment */
  environment: 'development' | 'staging' | 'production';
  /** App version */
  version: string;
  /** Build number */
  buildNumber: string;
  /** Platform */
  platform: 'ios' | 'android' | 'web';
  /** Debug mode */
  debug: boolean;
  /** Feature flags */
  features: Record<string, boolean>;
  /** Custom config values */
  custom: Record<string, unknown>;
}

// ============================================================================
// Plugin Interfaces
// ============================================================================

/**
 * Main plugin interface - all plugins must implement this
 */
export interface Plugin {
  /** Plugin metadata */
  readonly metadata: PluginMetadata;
  /** Plugin dependencies */
  readonly dependencies?: PluginDependency[];
  /** Plugin capabilities */
  readonly capabilities?: PluginCapability[];
  /** Current plugin state */
  state: PluginState;

  /**
   * Initialize plugin (setup, load config, etc.)
   * Called once when plugin is registered
   */
  initialize(context: PluginContext): Promise<void> | void;

  /**
   * Activate plugin (start services, register hooks, etc.)
   * Called when plugin becomes active
   */
  activate(context: PluginContext): Promise<void> | void;

  /**
   * Deactivate plugin (stop services, cleanup, etc.)
   * Called when plugin is being deactivated
   */
  deactivate(context: PluginContext): Promise<void> | void;

  /**
   * Dispose plugin (final cleanup, release resources)
   * Called before plugin removal
   */
  dispose(context: PluginContext): Promise<void> | void;

  /**
   * Get plugin configuration schema
   */
  getConfigSchema?(): PluginConfigSchema;

  /**
   * Validate plugin configuration
   */
  validateConfig?(config: unknown): boolean;

  /**
   * Handle configuration changes
   */
  onConfigChange?(config: unknown, context: PluginContext): void;

  /**
   * Health check for plugin
   */
  healthCheck?(context: PluginContext): Promise<PluginHealthStatus>;
}

/**
 * Plugin configuration schema
 */
export interface PluginConfigSchema {
  /** Schema type */
  type: 'object';
  /** Schema properties */
  properties: Record<string, SchemaProperty>;
  /** Required properties */
  required?: string[];
  /** Additional properties allowed */
  additionalProperties?: boolean;
}

/**
 * Schema property definition
 */
export interface SchemaProperty {
  type: 'string' | 'number' | 'boolean' | 'object' | 'array';
  description?: string;
  default?: unknown;
  enum?: unknown[];
  minimum?: number;
  maximum?: number;
  items?: SchemaProperty;
  properties?: Record<string, SchemaProperty>;
}

/**
 * Plugin health status
 */
export interface PluginHealthStatus {
  healthy: boolean;
  message?: string;
  details?: Record<string, unknown>;
  lastCheck: Date;
}

// ============================================================================
// Lifecycle Hooks
// ============================================================================

/**
 * Plugin lifecycle hooks
 */
export interface PluginLifecycleHooks {
  /** Called before app starts */
  onAppStart?: (context: PluginContext) => Promise<void> | void;

  /** Called after app is ready */
  onAppReady?: (context: PluginContext) => Promise<void> | void;

  /** Called when app goes to background */
  onAppBackground?: (context: PluginContext) => Promise<void> | void;

  /** Called when app comes to foreground */
  onAppForeground?: (context: PluginContext) => Promise<void> | void;

  /** Called before app terminates */
  onAppTerminate?: (context: PluginContext) => Promise<void> | void;

  /** Called when user logs in */
  onUserLogin?: (userId: string, context: PluginContext) => Promise<void> | void;

  /** Called when user logs out */
  onUserLogout?: (context: PluginContext) => Promise<void> | void;

  /** Called on navigation changes */
  onNavigationChange?: (route: string, context: PluginContext) => Promise<void> | void;

  /** Called on network status changes */
  onNetworkChange?: (isOnline: boolean, context: PluginContext) => Promise<void> | void;
}

// ============================================================================
// Plugin Services
// ============================================================================

/**
 * Plugin logger interface
 */
export interface PluginLogger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error, ...args: unknown[]): void;
  setLevel(level: LogLevel): void;
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

/**
 * Plugin event emitter
 */
export interface PluginEventEmitter {
  on<T = unknown>(event: string, handler: EventHandler<T>): EventSubscription;
  once<T = unknown>(event: string, handler: EventHandler<T>): EventSubscription;
  off(event: string, handler: EventHandler): void;
  emit<T = unknown>(event: string, data?: T): void;
  removeAllListeners(event?: string): void;
}

export type EventHandler<T = unknown> = (data: T) => void | Promise<void>;

export interface EventSubscription {
  remove(): void;
}

/**
 * Plugin storage interface
 */
export interface PluginStorage {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<Array<[string, unknown]>>;
  multiSet(keyValuePairs: Array<[string, unknown]>): Promise<void>;
}

/**
 * Plugin API client
 */
export interface PluginApiClient {
  get<T = unknown>(url: string, options?: RequestOptions): Promise<T>;
  post<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  put<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  patch<T = unknown>(url: string, data?: unknown, options?: RequestOptions): Promise<T>;
  delete<T = unknown>(url: string, options?: RequestOptions): Promise<T>;
  setBaseUrl(url: string): void;
  setAuthToken(token: string): void;
  clearAuthToken(): void;
}

export interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
  retries?: number;
  cache?: boolean;
}

/**
 * Plugin state manager
 */
export interface PluginStateManager {
  get<T = unknown>(key: string): T | undefined;
  set<T = unknown>(key: string, value: T): void;
  update<T = unknown>(key: string, updater: (current: T | undefined) => T): void;
  subscribe<T = unknown>(key: string, callback: (value: T) => void): () => void;
  reset(key?: string): void;
}

/**
 * Plugin registry access
 */
export interface PluginRegistry {
  get(pluginId: string): Plugin | undefined;
  getAll(): Plugin[];
  has(pluginId: string): boolean;
  invoke<T = unknown>(pluginId: string, method: string, ...args: unknown[]): Promise<T>;
  broadcast(event: string, data?: unknown): void;
}

/**
 * Plugin theme provider
 */
export interface PluginThemeProvider {
  colors: Record<string, string>;
  spacing: Record<string, number>;
  typography: Record<string, TypographyStyle>;
  isDark: boolean;
  subscribe(callback: (theme: PluginThemeProvider) => void): () => void;
}

export interface TypographyStyle {
  fontSize: number;
  fontWeight?: string;
  lineHeight?: number;
  letterSpacing?: number;
}

/**
 * Plugin navigation provider
 */
export interface PluginNavigationProvider {
  navigate(route: string, params?: Record<string, unknown>): void;
  goBack(): void;
  reset(routes: NavigationRoute[]): void;
  getCurrentRoute(): string | undefined;
  subscribe(callback: (route: string) => void): () => void;
}

export interface NavigationRoute {
  name: string;
  params?: Record<string, unknown>;
}

// ============================================================================
// Hook System
// ============================================================================

/**
 * Hook point definition
 */
export interface HookPoint {
  /** Hook identifier */
  id: string;
  /** Hook name */
  name: string;
  /** Hook description */
  description: string;
  /** Hook type (before/after/replace) */
  type: HookType;
  /** Whether hook can be async */
  async: boolean;
  /** Expected parameters */
  params?: HookParam[];
  /** Expected return type */
  returns?: string;
}

export enum HookType {
  BEFORE = 'before',
  AFTER = 'after',
  REPLACE = 'replace',
  WRAP = 'wrap',
}

export interface HookParam {
  name: string;
  type: string;
  description?: string;
  optional?: boolean;
}

/**
 * Hook handler function
 */
export type HookHandler<TArgs extends unknown[] = unknown[], TReturn = unknown> =
  (...args: TArgs) => TReturn | Promise<TReturn>;

/**
 * Hook registration
 */
export interface HookRegistration {
  /** Hook point ID */
  hookId: string;
  /** Plugin that registered this hook */
  pluginId: string;
  /** Hook handler */
  handler: HookHandler;
  /** Hook priority (higher = earlier execution) */
  priority: number;
  /** Hook conditions */
  condition?: HookCondition;
}

export type HookCondition = (context: HookContext) => boolean;

export interface HookContext {
  pluginId: string;
  hookId: string;
  args: unknown[];
  metadata: Record<string, unknown>;
}

// ============================================================================
// Plugin Manager Types
// ============================================================================

/**
 * Plugin manager configuration
 */
export interface PluginManagerConfig {
  /** Auto-activate plugins on registration */
  autoActivate?: boolean;
  /** Enable hot reloading in development */
  hotReload?: boolean;
  /** Maximum concurrent initializations */
  maxConcurrentInit?: number;
  /** Plugin timeout (ms) */
  timeout?: number;
  /** Enable plugin isolation (sandboxing) */
  isolation?: boolean;
  /** Plugin directories to auto-load from */
  pluginDirs?: string[];
  /** Strict dependency checking */
  strictDependencies?: boolean;
}

/**
 * Plugin load result
 */
export interface PluginLoadResult {
  success: boolean;
  pluginId: string;
  error?: Error;
  warnings?: string[];
  metadata?: PluginMetadata;
}

/**
 * Plugin error types
 */
export enum PluginErrorType {
  INITIALIZATION_FAILED = 'initialization_failed',
  ACTIVATION_FAILED = 'activation_failed',
  DEACTIVATION_FAILED = 'deactivation_failed',
  DEPENDENCY_MISSING = 'dependency_missing',
  DEPENDENCY_VERSION_MISMATCH = 'dependency_version_mismatch',
  INVALID_CONFIG = 'invalid_config',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown',
}

/**
 * Plugin error
 */
export class PluginError extends Error {
  constructor(
    public type: PluginErrorType,
    public pluginId: string,
    message: string,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'PluginError';
  }
}

// ============================================================================
// Events
// ============================================================================

/**
 * Plugin system events
 */
export enum PluginSystemEvent {
  PLUGIN_REGISTERED = 'plugin:registered',
  PLUGIN_INITIALIZED = 'plugin:initialized',
  PLUGIN_ACTIVATED = 'plugin:activated',
  PLUGIN_DEACTIVATED = 'plugin:deactivated',
  PLUGIN_DISPOSED = 'plugin:disposed',
  PLUGIN_ERROR = 'plugin:error',
  HOOK_REGISTERED = 'hook:registered',
  HOOK_EXECUTED = 'hook:executed',
  HOOK_ERROR = 'hook:error',
}

export interface PluginEventData {
  pluginId: string;
  state: PluginState;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  error?: Error;
}

export interface HookEventData {
  hookId: string;
  pluginId: string;
  timestamp: Date;
  duration?: number;
  error?: Error;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Deep partial type
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Async or sync return type
 */
export type MaybePromise<T> = T | Promise<T>;

/**
 * Plugin factory function
 */
export type PluginFactory = (context?: Partial<PluginContext>) => Plugin | Promise<Plugin>;

/**
 * Plugin module definition
 */
export interface PluginModule {
  default?: PluginFactory;
  plugin?: PluginFactory;
  createPlugin?: PluginFactory;
}

/**
 * Plugin Manager
 *
 * Central orchestrator for plugin lifecycle, dependencies, and communication.
 * Handles plugin registration, activation, deactivation, and disposal with
 * support for dependency resolution, hot reloading, and error recovery.
 */

import {
  Plugin,
  PluginContext,
  PluginMetadata,
  PluginState,
  PluginDependency,
  PluginError,
  PluginErrorType,
  PluginManagerConfig,
  PluginLoadResult,
  PluginSystemEvent,
  PluginEventData,
  PluginLogger,
  LogLevel,
  AppConfig,
  PluginEventEmitter,
  EventHandler,
  EventSubscription,
  PluginStorage,
  PluginApiClient,
  PluginStateManager,
  PluginLifecycleHooks,
  PluginRegistry,
  PluginThemeProvider,
  PluginNavigationProvider,
  PluginHealthStatus,
} from './types';

// ============================================================================
// Plugin Manager Implementation
// ============================================================================

export class PluginManager {
  private plugins = new Map<string, PluginInstance>();
  private contexts = new Map<string, PluginContext>();
  private dependencyGraph = new Map<string, Set<string>>();
  private reverseDependencyGraph = new Map<string, Set<string>>();
  private eventEmitter: SimpleEventEmitter;
  private config: Required<PluginManagerConfig>;
  private appConfig: AppConfig;
  private logger: PluginLogger;
  private storage: PluginStorage;
  private apiClient: PluginApiClient;
  private stateManager: PluginStateManager;
  private themeProvider: PluginThemeProvider;
  private navigationProvider?: PluginNavigationProvider;
  private isInitialized = false;

  constructor(
    config: PluginManagerConfig = {},
    appConfig: AppConfig,
    services: {
      logger?: PluginLogger;
      storage?: PluginStorage;
      apiClient?: PluginApiClient;
      stateManager?: PluginStateManager;
      themeProvider?: PluginThemeProvider;
      navigationProvider?: PluginNavigationProvider;
    } = {}
  ) {
    this.config = {
      autoActivate: true,
      hotReload: false,
      maxConcurrentInit: 5,
      timeout: 30000,
      isolation: false,
      pluginDirs: [],
      strictDependencies: true,
      ...config,
    };

    this.appConfig = appConfig;
    this.eventEmitter = new SimpleEventEmitter();
    this.logger = services.logger || new ConsoleLogger('PluginManager');
    this.storage = services.storage || new MemoryStorage();
    this.apiClient = services.apiClient || new SimpleApiClient();
    this.stateManager = services.stateManager || new SimpleStateManager();
    this.themeProvider = services.themeProvider || new DefaultThemeProvider();
    this.navigationProvider = services.navigationProvider;
  }

  // ==========================================================================
  // Initialization
  // ==========================================================================

  /**
   * Initialize the plugin manager
   */
  public async initialize(): Promise<void> {
    if (this.isInitialized) {
      this.logger.warn('PluginManager already initialized');
      return;
    }

    this.logger.info('Initializing PluginManager');

    // Load persisted plugin states
    await this.loadPersistedStates();

    this.isInitialized = true;
    this.logger.info('PluginManager initialized');
  }

  /**
   * Shutdown the plugin manager
   */
  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down PluginManager');

    // Deactivate all active plugins
    const activePlugins = Array.from(this.plugins.values())
      .filter((instance) => instance.state === PluginState.ACTIVE);

    for (const instance of activePlugins) {
      await this.deactivatePlugin(instance.plugin.metadata.id);
    }

    // Dispose all plugins
    for (const [pluginId] of this.plugins) {
      await this.unregisterPlugin(pluginId);
    }

    // Save states
    await this.savePersistedStates();

    this.isInitialized = false;
    this.logger.info('PluginManager shutdown complete');
  }

  // ==========================================================================
  // Plugin Registration
  // ==========================================================================

  /**
   * Register a plugin
   */
  public async registerPlugin(plugin: Plugin): Promise<PluginLoadResult> {
    const pluginId = plugin.metadata.id;

    this.logger.info(`Registering plugin: ${pluginId}`);

    // Validate plugin
    const validation = this.validatePlugin(plugin);
    if (!validation.valid) {
      const error = new PluginError(
        PluginErrorType.INVALID_CONFIG,
        pluginId,
        `Plugin validation failed: ${validation.errors.join(', ')}`
      );
      this.logger.error(`Plugin validation failed: ${pluginId}`, error);
      return { success: false, pluginId, error };
    }

    // Check if already registered
    if (this.plugins.has(pluginId)) {
      const error = new Error(`Plugin already registered: ${pluginId}`);
      this.logger.error(`Plugin already registered: ${pluginId}`, error);
      return { success: false, pluginId, error };
    }

    // Check dependencies
    const dependencyCheck = await this.checkDependencies(plugin);
    if (!dependencyCheck.satisfied) {
      const error = new PluginError(
        PluginErrorType.DEPENDENCY_MISSING,
        pluginId,
        `Unsatisfied dependencies: ${dependencyCheck.missing.join(', ')}`
      );
      this.logger.error(`Dependency check failed: ${pluginId}`, error);
      return { success: false, pluginId, error, warnings: dependencyCheck.warnings };
    }

    // Create plugin instance
    const instance: PluginInstance = {
      plugin,
      state: PluginState.UNINITIALIZED,
      registeredAt: new Date(),
      lastError: undefined,
    };

    this.plugins.set(pluginId, instance);

    // Build dependency graphs
    this.buildDependencyGraphs(plugin);

    // Create context
    const context = this.createPluginContext(plugin);
    this.contexts.set(pluginId, context);

    // Emit event
    this.emitPluginEvent(PluginSystemEvent.PLUGIN_REGISTERED, {
      pluginId,
      state: PluginState.UNINITIALIZED,
      timestamp: new Date(),
    });

    this.logger.info(`Plugin registered: ${pluginId}`);

    // Auto-initialize and activate if configured
    if (this.config.autoActivate) {
      try {
        await this.initializePlugin(pluginId);
        await this.activatePlugin(pluginId);
      } catch (error) {
        this.logger.error(`Auto-activation failed: ${pluginId}`, error as Error);
        return {
          success: true,
          pluginId,
          metadata: plugin.metadata,
          warnings: [`Auto-activation failed: ${(error as Error).message}`],
        };
      }
    }

    return {
      success: true,
      pluginId,
      metadata: plugin.metadata,
      warnings: dependencyCheck.warnings,
    };
  }

  /**
   * Unregister a plugin
   */
  public async unregisterPlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    this.logger.info(`Unregistering plugin: ${pluginId}`);

    // Check for dependent plugins
    const dependents = this.reverseDependencyGraph.get(pluginId);
    if (dependents && dependents.size > 0) {
      throw new Error(
        `Cannot unregister plugin with active dependents: ${Array.from(dependents).join(', ')}`
      );
    }

    // Deactivate if active
    if (instance.state === PluginState.ACTIVE) {
      await this.deactivatePlugin(pluginId);
    }

    // Dispose plugin
    await this.disposePlugin(pluginId);

    // Cleanup
    this.plugins.delete(pluginId);
    this.contexts.delete(pluginId);
    this.dependencyGraph.delete(pluginId);

    this.logger.info(`Plugin unregistered: ${pluginId}`);
  }

  // ==========================================================================
  // Plugin Lifecycle
  // ==========================================================================

  /**
   * Initialize a plugin
   */
  public async initializePlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (instance.state !== PluginState.UNINITIALIZED) {
      this.logger.warn(`Plugin already initialized: ${pluginId}`);
      return;
    }

    this.logger.info(`Initializing plugin: ${pluginId}`);
    instance.state = PluginState.INITIALIZING;

    const context = this.contexts.get(pluginId)!;

    try {
      await this.executeWithTimeout(
        () => instance.plugin.initialize(context),
        this.config.timeout,
        `Plugin initialization timeout: ${pluginId}`
      );

      instance.state = PluginState.INITIALIZED;
      instance.initializedAt = new Date();

      this.emitPluginEvent(PluginSystemEvent.PLUGIN_INITIALIZED, {
        pluginId,
        state: PluginState.INITIALIZED,
        timestamp: new Date(),
      });

      this.logger.info(`Plugin initialized: ${pluginId}`);
    } catch (error) {
      instance.state = PluginState.ERROR;
      instance.lastError = error as Error;

      this.emitPluginEvent(PluginSystemEvent.PLUGIN_ERROR, {
        pluginId,
        state: PluginState.ERROR,
        timestamp: new Date(),
        error: error as Error,
      });

      throw new PluginError(
        PluginErrorType.INITIALIZATION_FAILED,
        pluginId,
        `Plugin initialization failed: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Activate a plugin
   */
  public async activatePlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (instance.state === PluginState.ACTIVE) {
      this.logger.warn(`Plugin already active: ${pluginId}`);
      return;
    }

    if (instance.state !== PluginState.INITIALIZED && instance.state !== PluginState.DEACTIVATED) {
      throw new Error(`Plugin must be initialized before activation: ${pluginId}`);
    }

    // Activate dependencies first
    const dependencies = this.dependencyGraph.get(pluginId);
    if (dependencies) {
      for (const depId of dependencies) {
        const depInstance = this.plugins.get(depId);
        if (depInstance && depInstance.state !== PluginState.ACTIVE) {
          await this.activatePlugin(depId);
        }
      }
    }

    this.logger.info(`Activating plugin: ${pluginId}`);
    instance.state = PluginState.ACTIVATING;

    const context = this.contexts.get(pluginId)!;

    try {
      await this.executeWithTimeout(
        () => instance.plugin.activate(context),
        this.config.timeout,
        `Plugin activation timeout: ${pluginId}`
      );

      instance.state = PluginState.ACTIVE;
      instance.activatedAt = new Date();

      this.emitPluginEvent(PluginSystemEvent.PLUGIN_ACTIVATED, {
        pluginId,
        state: PluginState.ACTIVE,
        timestamp: new Date(),
      });

      this.logger.info(`Plugin activated: ${pluginId}`);
    } catch (error) {
      instance.state = PluginState.ERROR;
      instance.lastError = error as Error;

      this.emitPluginEvent(PluginSystemEvent.PLUGIN_ERROR, {
        pluginId,
        state: PluginState.ERROR,
        timestamp: new Date(),
        error: error as Error,
      });

      throw new PluginError(
        PluginErrorType.ACTIVATION_FAILED,
        pluginId,
        `Plugin activation failed: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Deactivate a plugin
   */
  public async deactivatePlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (instance.state !== PluginState.ACTIVE) {
      this.logger.warn(`Plugin not active: ${pluginId}`);
      return;
    }

    // Deactivate dependent plugins first
    const dependents = this.reverseDependencyGraph.get(pluginId);
    if (dependents) {
      for (const depId of dependents) {
        const depInstance = this.plugins.get(depId);
        if (depInstance && depInstance.state === PluginState.ACTIVE) {
          await this.deactivatePlugin(depId);
        }
      }
    }

    this.logger.info(`Deactivating plugin: ${pluginId}`);
    instance.state = PluginState.DEACTIVATING;

    const context = this.contexts.get(pluginId)!;

    try {
      await this.executeWithTimeout(
        () => instance.plugin.deactivate(context),
        this.config.timeout,
        `Plugin deactivation timeout: ${pluginId}`
      );

      instance.state = PluginState.DEACTIVATED;

      this.emitPluginEvent(PluginSystemEvent.PLUGIN_DEACTIVATED, {
        pluginId,
        state: PluginState.DEACTIVATED,
        timestamp: new Date(),
      });

      this.logger.info(`Plugin deactivated: ${pluginId}`);
    } catch (error) {
      instance.state = PluginState.ERROR;
      instance.lastError = error as Error;

      this.emitPluginEvent(PluginSystemEvent.PLUGIN_ERROR, {
        pluginId,
        state: PluginState.ERROR,
        timestamp: new Date(),
        error: error as Error,
      });

      throw new PluginError(
        PluginErrorType.DEACTIVATION_FAILED,
        pluginId,
        `Plugin deactivation failed: ${(error as Error).message}`,
        error as Error
      );
    }
  }

  /**
   * Dispose a plugin
   */
  private async disposePlugin(pluginId: string): Promise<void> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    this.logger.info(`Disposing plugin: ${pluginId}`);

    const context = this.contexts.get(pluginId)!;

    try {
      await this.executeWithTimeout(
        () => instance.plugin.dispose(context),
        this.config.timeout,
        `Plugin disposal timeout: ${pluginId}`
      );

      instance.state = PluginState.DISPOSED;

      this.emitPluginEvent(PluginSystemEvent.PLUGIN_DISPOSED, {
        pluginId,
        state: PluginState.DISPOSED,
        timestamp: new Date(),
      });

      this.logger.info(`Plugin disposed: ${pluginId}`);
    } catch (error) {
      this.logger.error(`Plugin disposal error: ${pluginId}`, error as Error);
      throw error;
    }
  }

  // ==========================================================================
  // Plugin Access
  // ==========================================================================

  /**
   * Get a plugin by ID
   */
  public getPlugin(pluginId: string): Plugin | undefined {
    return this.plugins.get(pluginId)?.plugin;
  }

  /**
   * Get all plugins
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.plugins.values()).map((instance) => instance.plugin);
  }

  /**
   * Get all active plugins
   */
  public getActivePlugins(): Plugin[] {
    return Array.from(this.plugins.values())
      .filter((instance) => instance.state === PluginState.ACTIVE)
      .map((instance) => instance.plugin);
  }

  /**
   * Check if plugin exists
   */
  public hasPlugin(pluginId: string): boolean {
    return this.plugins.has(pluginId);
  }

  /**
   * Get plugin state
   */
  public getPluginState(pluginId: string): PluginState | undefined {
    return this.plugins.get(pluginId)?.state;
  }

  /**
   * Get plugin context
   */
  public getPluginContext(pluginId: string): PluginContext | undefined {
    return this.contexts.get(pluginId);
  }

  /**
   * Invoke a plugin method
   */
  public async invokePlugin<T = unknown>(
    pluginId: string,
    method: string,
    ...args: unknown[]
  ): Promise<T> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (instance.state !== PluginState.ACTIVE) {
      throw new Error(`Plugin not active: ${pluginId}`);
    }

    const plugin = instance.plugin as any;
    if (typeof plugin[method] !== 'function') {
      throw new Error(`Method not found: ${method} on plugin ${pluginId}`);
    }

    return plugin[method](...args);
  }

  /**
   * Get plugin health status
   */
  public async getPluginHealth(pluginId: string): Promise<PluginHealthStatus> {
    const instance = this.plugins.get(pluginId);
    if (!instance) {
      throw new Error(`Plugin not found: ${pluginId}`);
    }

    if (instance.plugin.healthCheck) {
      const context = this.contexts.get(pluginId)!;
      return instance.plugin.healthCheck(context);
    }

    return {
      healthy: instance.state === PluginState.ACTIVE,
      message: instance.lastError?.message,
      lastCheck: new Date(),
    };
  }

  // ==========================================================================
  // Dependency Management
  // ==========================================================================

  /**
   * Check plugin dependencies
   */
  private async checkDependencies(plugin: Plugin): Promise<DependencyCheckResult> {
    const result: DependencyCheckResult = {
      satisfied: true,
      missing: [],
      warnings: [],
    };

    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return result;
    }

    for (const dep of plugin.dependencies) {
      const depPlugin = this.plugins.get(dep.pluginId);

      if (!depPlugin) {
        if (!dep.optional) {
          result.satisfied = false;
          result.missing.push(dep.pluginId);
        } else {
          result.warnings.push(`Optional dependency missing: ${dep.pluginId}`);
        }
        continue;
      }

      // Check version compatibility
      if (dep.minVersion || dep.maxVersion) {
        const compatible = this.checkVersionCompatibility(
          depPlugin.plugin.metadata.version,
          dep.minVersion,
          dep.maxVersion
        );

        if (!compatible) {
          if (!dep.optional) {
            result.satisfied = false;
            result.missing.push(
              `${dep.pluginId} (version mismatch: ${depPlugin.plugin.metadata.version})`
            );
          } else {
            result.warnings.push(
              `Optional dependency version mismatch: ${dep.pluginId} (${depPlugin.plugin.metadata.version})`
            );
          }
        }
      }
    }

    return result;
  }

  /**
   * Build dependency graphs
   */
  private buildDependencyGraphs(plugin: Plugin): void {
    const pluginId = plugin.metadata.id;

    if (!plugin.dependencies || plugin.dependencies.length === 0) {
      return;
    }

    // Forward graph (plugin -> dependencies)
    const deps = new Set<string>();
    for (const dep of plugin.dependencies) {
      deps.add(dep.pluginId);

      // Reverse graph (dependency -> dependents)
      if (!this.reverseDependencyGraph.has(dep.pluginId)) {
        this.reverseDependencyGraph.set(dep.pluginId, new Set());
      }
      this.reverseDependencyGraph.get(dep.pluginId)!.add(pluginId);
    }

    this.dependencyGraph.set(pluginId, deps);
  }

  /**
   * Check version compatibility
   */
  private checkVersionCompatibility(
    version: string,
    minVersion?: string,
    maxVersion?: string
  ): boolean {
    if (minVersion && this.compareVersions(version, minVersion) < 0) {
      return false;
    }

    if (maxVersion && this.compareVersions(version, maxVersion) > 0) {
      return false;
    }

    return true;
  }

  /**
   * Compare semantic versions
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const p1 = parts1[i] || 0;
      const p2 = parts2[i] || 0;

      if (p1 > p2) return 1;
      if (p1 < p2) return -1;
    }

    return 0;
  }

  // ==========================================================================
  // Context Management
  // ==========================================================================

  /**
   * Create plugin context
   */
  private createPluginContext(plugin: Plugin): PluginContext {
    const pluginLogger = new PrefixedLogger(
      this.logger,
      `[${plugin.metadata.id}]`
    );

    const registry: PluginRegistry = {
      get: (id) => this.getPlugin(id),
      getAll: () => this.getAllPlugins(),
      has: (id) => this.hasPlugin(id),
      invoke: (id, method, ...args) => this.invokePlugin(id, method, ...args),
      broadcast: (event, data) => this.eventEmitter.emit(event, data),
    };

    return {
      metadata: plugin.metadata,
      config: this.appConfig,
      logger: pluginLogger,
      events: this.eventEmitter,
      storage: this.storage,
      api: this.apiClient,
      state: this.stateManager,
      lifecycle: plugin as PluginLifecycleHooks,
      plugins: registry,
      theme: this.themeProvider,
      navigation: this.navigationProvider,
      data: new Map(),
    };
  }

  // ==========================================================================
  // Validation
  // ==========================================================================

  /**
   * Validate plugin
   */
  private validatePlugin(plugin: Plugin): ValidationResult {
    const errors: string[] = [];

    // Check metadata
    if (!plugin.metadata) {
      errors.push('Missing metadata');
    } else {
      if (!plugin.metadata.id) errors.push('Missing metadata.id');
      if (!plugin.metadata.name) errors.push('Missing metadata.name');
      if (!plugin.metadata.version) errors.push('Missing metadata.version');
    }

    // Check required methods
    if (typeof plugin.initialize !== 'function') {
      errors.push('Missing initialize method');
    }
    if (typeof plugin.activate !== 'function') {
      errors.push('Missing activate method');
    }
    if (typeof plugin.deactivate !== 'function') {
      errors.push('Missing deactivate method');
    }
    if (typeof plugin.dispose !== 'function') {
      errors.push('Missing dispose method');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  // ==========================================================================
  // Events
  // ==========================================================================

  /**
   * Subscribe to plugin system events
   */
  public on(event: PluginSystemEvent, handler: EventHandler<PluginEventData>): EventSubscription {
    return this.eventEmitter.on(event, handler);
  }

  /**
   * Emit plugin event
   */
  private emitPluginEvent(event: PluginSystemEvent, data: PluginEventData): void {
    this.eventEmitter.emit(event, data);
  }

  // ==========================================================================
  // Utilities
  // ==========================================================================

  /**
   * Execute function with timeout
   */
  private async executeWithTimeout<T>(
    fn: () => T | Promise<T>,
    timeout: number,
    errorMessage: string
  ): Promise<T> {
    return Promise.race([
      Promise.resolve(fn()),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(errorMessage)), timeout)
      ),
    ]);
  }

  /**
   * Load persisted plugin states
   */
  private async loadPersistedStates(): Promise<void> {
    // Implementation would load states from storage
    // For now, just a placeholder
  }

  /**
   * Save persisted plugin states
   */
  private async savePersistedStates(): Promise<void> {
    // Implementation would save states to storage
    // For now, just a placeholder
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface PluginInstance {
  plugin: Plugin;
  state: PluginState;
  registeredAt: Date;
  initializedAt?: Date;
  activatedAt?: Date;
  lastError?: Error;
}

interface DependencyCheckResult {
  satisfied: boolean;
  missing: string[];
  warnings: string[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ============================================================================
// Simple Event Emitter Implementation
// ============================================================================

class SimpleEventEmitter implements PluginEventEmitter {
  private handlers = new Map<string, Set<EventHandler>>();

  on<T = unknown>(event: string, handler: EventHandler<T>): EventSubscription {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    this.handlers.get(event)!.add(handler as EventHandler);

    return {
      remove: () => this.off(event, handler as EventHandler),
    };
  }

  once<T = unknown>(event: string, handler: EventHandler<T>): EventSubscription {
    const wrappedHandler = (data: T) => {
      handler(data);
      this.off(event, wrappedHandler as EventHandler);
    };

    return this.on(event, wrappedHandler);
  }

  off(event: string, handler: EventHandler): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  emit<T = unknown>(event: string, data?: T): void {
    const handlers = this.handlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => {
        try {
          handler(data);
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error);
        }
      });
    }
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.handlers.delete(event);
    } else {
      this.handlers.clear();
    }
  }
}

// ============================================================================
// Simple Logger Implementation
// ============================================================================

class ConsoleLogger implements PluginLogger {
  private level: LogLevel = LogLevel.INFO;

  constructor(private prefix: string = '') {}

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(`${this.prefix} ${message}`, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(`${this.prefix} ${message}`, ...args);
    }
  }

  warn(message: string, ...args: unknown[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(`${this.prefix} ${message}`, ...args);
    }
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(`${this.prefix} ${message}`, error, ...args);
    }
  }
}

class PrefixedLogger implements PluginLogger {
  constructor(
    private baseLogger: PluginLogger,
    private prefix: string
  ) {}

  setLevel(level: LogLevel): void {
    this.baseLogger.setLevel(level);
  }

  debug(message: string, ...args: unknown[]): void {
    this.baseLogger.debug(`${this.prefix} ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    this.baseLogger.info(`${this.prefix} ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.baseLogger.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    this.baseLogger.error(`${this.prefix} ${message}`, error, ...args);
  }
}

// ============================================================================
// Simple Storage Implementation
// ============================================================================

class MemoryStorage implements PluginStorage {
  private store = new Map<string, unknown>();

  async get<T = unknown>(key: string): Promise<T | null> {
    return (this.store.get(key) as T) || null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    this.store.set(key, value);
  }

  async remove(key: string): Promise<void> {
    this.store.delete(key);
  }

  async clear(): Promise<void> {
    this.store.clear();
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.store.keys());
  }

  async multiGet(keys: string[]): Promise<Array<[string, unknown]>> {
    return keys.map((key) => [key, this.store.get(key)]);
  }

  async multiSet(keyValuePairs: Array<[string, unknown]>): Promise<void> {
    keyValuePairs.forEach(([key, value]) => this.store.set(key, value));
  }
}

// ============================================================================
// Simple API Client Implementation
// ============================================================================

class SimpleApiClient implements PluginApiClient {
  private baseUrl = '';
  private authToken = '';

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  setAuthToken(token: string): void {
    this.authToken = token;
  }

  clearAuthToken(): void {
    this.authToken = '';
  }

  async get<T = unknown>(url: string, options?: any): Promise<T> {
    return this.request<T>('GET', url, undefined, options);
  }

  async post<T = unknown>(url: string, data?: unknown, options?: any): Promise<T> {
    return this.request<T>('POST', url, data, options);
  }

  async put<T = unknown>(url: string, data?: unknown, options?: any): Promise<T> {
    return this.request<T>('PUT', url, data, options);
  }

  async patch<T = unknown>(url: string, data?: unknown, options?: any): Promise<T> {
    return this.request<T>('PATCH', url, data, options);
  }

  async delete<T = unknown>(url: string, options?: any): Promise<T> {
    return this.request<T>('DELETE', url, undefined, options);
  }

  private async request<T>(
    method: string,
    url: string,
    data?: unknown,
    options?: any
  ): Promise<T> {
    const fullUrl = url.startsWith('http') ? url : `${this.baseUrl}${url}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...options?.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// ============================================================================
// Simple State Manager Implementation
// ============================================================================

class SimpleStateManager implements PluginStateManager {
  private state = new Map<string, unknown>();
  private subscribers = new Map<string, Set<(value: unknown) => void>>();

  get<T = unknown>(key: string): T | undefined {
    return this.state.get(key) as T | undefined;
  }

  set<T = unknown>(key: string, value: T): void {
    this.state.set(key, value);
    this.notify(key, value);
  }

  update<T = unknown>(key: string, updater: (current: T | undefined) => T): void {
    const current = this.get<T>(key);
    const newValue = updater(current);
    this.set(key, newValue);
  }

  subscribe<T = unknown>(key: string, callback: (value: T) => void): () => void {
    if (!this.subscribers.has(key)) {
      this.subscribers.set(key, new Set());
    }
    this.subscribers.get(key)!.add(callback as (value: unknown) => void);

    return () => {
      this.subscribers.get(key)?.delete(callback as (value: unknown) => void);
    };
  }

  reset(key?: string): void {
    if (key) {
      this.state.delete(key);
      this.notify(key, undefined);
    } else {
      this.state.clear();
      this.subscribers.clear();
    }
  }

  private notify(key: string, value: unknown): void {
    const callbacks = this.subscribers.get(key);
    if (callbacks) {
      callbacks.forEach((callback) => {
        try {
          callback(value);
        } catch (error) {
          console.error(`Error in state subscriber for ${key}:`, error);
        }
      });
    }
  }
}

// ============================================================================
// Default Theme Provider
// ============================================================================

class DefaultThemeProvider implements PluginThemeProvider {
  private callbacks = new Set<(theme: PluginThemeProvider) => void>();

  colors = {
    primary: '#007AFF',
    background: '#FFFFFF',
    text: '#000000',
    border: '#E5E5E5',
  };

  spacing = {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };

  typography = {
    body: { fontSize: 16, lineHeight: 24 },
    heading: { fontSize: 24, fontWeight: 'bold', lineHeight: 32 },
  };

  isDark = false;

  subscribe(callback: (theme: PluginThemeProvider) => void): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }
}

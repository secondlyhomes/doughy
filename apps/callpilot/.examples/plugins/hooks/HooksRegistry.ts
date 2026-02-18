/**
 * Hooks Registry
 *
 * Manages hook points and hook handlers across the plugin system.
 * Supports before/after/replace/wrap hooks with priority-based execution.
 */

import {
  HookPoint,
  HookType,
  HookHandler,
  HookRegistration,
  HookCondition,
  HookContext,
  PluginEventEmitter,
  PluginLogger,
  PluginSystemEvent,
  HookEventData,
} from '../core/types';

// ============================================================================
// Hooks Registry Implementation
// ============================================================================

export class HooksRegistry {
  private hookPoints = new Map<string, HookPoint>();
  private handlers = new Map<string, HookRegistration[]>();
  private eventEmitter: PluginEventEmitter;
  private logger: PluginLogger;

  constructor(eventEmitter: PluginEventEmitter, logger: PluginLogger) {
    this.eventEmitter = eventEmitter;
    this.logger = logger;
  }

  // ==========================================================================
  // Hook Point Registration
  // ==========================================================================

  /**
   * Register a hook point
   */
  public registerHookPoint(hookPoint: HookPoint): void {
    if (this.hookPoints.has(hookPoint.id)) {
      throw new Error(`Hook point already registered: ${hookPoint.id}`);
    }

    this.hookPoints.set(hookPoint.id, hookPoint);
    this.logger.debug(`Hook point registered: ${hookPoint.id}`);
  }

  /**
   * Unregister a hook point
   */
  public unregisterHookPoint(hookId: string): void {
    this.hookPoints.delete(hookId);
    this.handlers.delete(hookId);
    this.logger.debug(`Hook point unregistered: ${hookId}`);
  }

  /**
   * Get all hook points
   */
  public getHookPoints(): HookPoint[] {
    return Array.from(this.hookPoints.values());
  }

  /**
   * Get hook point by ID
   */
  public getHookPoint(hookId: string): HookPoint | undefined {
    return this.hookPoints.get(hookId);
  }

  // ==========================================================================
  // Hook Handler Registration
  // ==========================================================================

  /**
   * Register a hook handler
   */
  public registerHook(
    hookId: string,
    pluginId: string,
    handler: HookHandler,
    priority: number = 0,
    condition?: HookCondition
  ): void {
    const hookPoint = this.hookPoints.get(hookId);
    if (!hookPoint) {
      throw new Error(`Hook point not found: ${hookId}`);
    }

    const registration: HookRegistration = {
      hookId,
      pluginId,
      handler,
      priority,
      condition,
    };

    if (!this.handlers.has(hookId)) {
      this.handlers.set(hookId, []);
    }

    const handlers = this.handlers.get(hookId)!;
    handlers.push(registration);

    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority);

    this.eventEmitter.emit(PluginSystemEvent.HOOK_REGISTERED, {
      hookId,
      pluginId,
      timestamp: new Date(),
    } as HookEventData);

    this.logger.debug(`Hook registered: ${hookId} by ${pluginId} (priority: ${priority})`);
  }

  /**
   * Unregister a hook handler
   */
  public unregisterHook(hookId: string, pluginId: string): void {
    const handlers = this.handlers.get(hookId);
    if (!handlers) {
      return;
    }

    const index = handlers.findIndex((h) => h.pluginId === pluginId);
    if (index !== -1) {
      handlers.splice(index, 1);
      this.logger.debug(`Hook unregistered: ${hookId} by ${pluginId}`);
    }
  }

  /**
   * Unregister all hooks for a plugin
   */
  public unregisterAllHooks(pluginId: string): void {
    for (const [hookId, handlers] of this.handlers.entries()) {
      const filtered = handlers.filter((h) => h.pluginId !== pluginId);
      if (filtered.length !== handlers.length) {
        this.handlers.set(hookId, filtered);
        this.logger.debug(`Hooks unregistered for plugin: ${pluginId} (hook: ${hookId})`);
      }
    }
  }

  /**
   * Get all handlers for a hook
   */
  public getHookHandlers(hookId: string): HookRegistration[] {
    return this.handlers.get(hookId) || [];
  }

  // ==========================================================================
  // Hook Execution
  // ==========================================================================

  /**
   * Execute before hooks
   */
  public async executeBefore<TArgs extends unknown[]>(
    hookId: string,
    args: TArgs,
    metadata: Record<string, unknown> = {}
  ): Promise<TArgs> {
    const hookPoint = this.hookPoints.get(hookId);
    if (!hookPoint) {
      return args;
    }

    if (hookPoint.type !== HookType.BEFORE) {
      throw new Error(`Hook ${hookId} is not a BEFORE hook`);
    }

    const handlers = this.getActiveHandlers(hookId, args, metadata);
    let currentArgs = [...args] as TArgs;

    for (const registration of handlers) {
      const startTime = Date.now();

      try {
        const context: HookContext = {
          pluginId: registration.pluginId,
          hookId,
          args: currentArgs,
          metadata,
        };

        const result = await this.executeHandler(
          registration.handler,
          currentArgs,
          hookPoint.async
        );

        // Before hooks can modify arguments
        if (result !== undefined) {
          currentArgs = Array.isArray(result) ? result : [result] as TArgs;
        }

        this.emitHookExecuted(hookId, registration.pluginId, Date.now() - startTime);
      } catch (error) {
        this.handleHookError(hookId, registration.pluginId, error as Error);
        // Continue with next handler even if one fails
      }
    }

    return currentArgs;
  }

  /**
   * Execute after hooks
   */
  public async executeAfter<TArgs extends unknown[], TReturn>(
    hookId: string,
    args: TArgs,
    result: TReturn,
    metadata: Record<string, unknown> = {}
  ): Promise<TReturn> {
    const hookPoint = this.hookPoints.get(hookId);
    if (!hookPoint) {
      return result;
    }

    if (hookPoint.type !== HookType.AFTER) {
      throw new Error(`Hook ${hookId} is not an AFTER hook`);
    }

    const handlers = this.getActiveHandlers(hookId, args, metadata);
    let currentResult = result;

    for (const registration of handlers) {
      const startTime = Date.now();

      try {
        const context: HookContext = {
          pluginId: registration.pluginId,
          hookId,
          args: [...args, currentResult],
          metadata,
        };

        const newResult = await this.executeHandler(
          registration.handler,
          [...args, currentResult],
          hookPoint.async
        );

        // After hooks can modify the result
        if (newResult !== undefined) {
          currentResult = newResult;
        }

        this.emitHookExecuted(hookId, registration.pluginId, Date.now() - startTime);
      } catch (error) {
        this.handleHookError(hookId, registration.pluginId, error as Error);
        // Continue with next handler even if one fails
      }
    }

    return currentResult;
  }

  /**
   * Execute replace hooks
   */
  public async executeReplace<TArgs extends unknown[], TReturn>(
    hookId: string,
    originalFn: (...args: TArgs) => TReturn | Promise<TReturn>,
    args: TArgs,
    metadata: Record<string, unknown> = {}
  ): Promise<TReturn> {
    const hookPoint = this.hookPoints.get(hookId);
    if (!hookPoint) {
      return originalFn(...args);
    }

    if (hookPoint.type !== HookType.REPLACE) {
      throw new Error(`Hook ${hookId} is not a REPLACE hook`);
    }

    const handlers = this.getActiveHandlers(hookId, args, metadata);

    // Replace hooks: only the first matching handler is used
    if (handlers.length > 0) {
      const registration = handlers[0];
      const startTime = Date.now();

      try {
        const result = await this.executeHandler(
          registration.handler,
          args,
          hookPoint.async
        );

        this.emitHookExecuted(hookId, registration.pluginId, Date.now() - startTime);
        return result;
      } catch (error) {
        this.handleHookError(hookId, registration.pluginId, error as Error);
        // Fall back to original function if replace hook fails
        return originalFn(...args);
      }
    }

    // No replace handler, use original
    return originalFn(...args);
  }

  /**
   * Execute wrap hooks
   */
  public async executeWrap<TArgs extends unknown[], TReturn>(
    hookId: string,
    originalFn: (...args: TArgs) => TReturn | Promise<TReturn>,
    args: TArgs,
    metadata: Record<string, unknown> = {}
  ): Promise<TReturn> {
    const hookPoint = this.hookPoints.get(hookId);
    if (!hookPoint) {
      return originalFn(...args);
    }

    if (hookPoint.type !== HookType.WRAP) {
      throw new Error(`Hook ${hookId} is not a WRAP hook`);
    }

    const handlers = this.getActiveHandlers(hookId, args, metadata);

    // Build wrapped function chain
    let wrappedFn = originalFn;

    for (const registration of handlers.reverse()) {
      const currentFn = wrappedFn;
      const handler = registration.handler;

      wrappedFn = async (...innerArgs: TArgs) => {
        const startTime = Date.now();

        try {
          // Wrap handler receives the next function and args
          const result = await this.executeHandler(
            handler,
            [currentFn, ...innerArgs],
            hookPoint.async
          );

          this.emitHookExecuted(hookId, registration.pluginId, Date.now() - startTime);
          return result;
        } catch (error) {
          this.handleHookError(hookId, registration.pluginId, error as Error);
          // Fall back to next function in chain
          return currentFn(...innerArgs);
        }
      };
    }

    return wrappedFn(...args);
  }

  // ==========================================================================
  // Utility Methods
  // ==========================================================================

  /**
   * Get active handlers (filtered by conditions)
   */
  private getActiveHandlers(
    hookId: string,
    args: unknown[],
    metadata: Record<string, unknown>
  ): HookRegistration[] {
    const handlers = this.handlers.get(hookId) || [];

    return handlers.filter((registration) => {
      if (!registration.condition) {
        return true;
      }

      try {
        const context: HookContext = {
          pluginId: registration.pluginId,
          hookId,
          args,
          metadata,
        };
        return registration.condition(context);
      } catch (error) {
        this.logger.error(
          `Hook condition error: ${hookId} (${registration.pluginId})`,
          error as Error
        );
        return false;
      }
    });
  }

  /**
   * Execute a handler (sync or async)
   */
  private async executeHandler<TReturn>(
    handler: HookHandler,
    args: unknown[],
    async: boolean
  ): Promise<TReturn> {
    if (async) {
      return handler(...args) as Promise<TReturn>;
    } else {
      return Promise.resolve(handler(...args) as TReturn);
    }
  }

  /**
   * Handle hook execution error
   */
  private handleHookError(hookId: string, pluginId: string, error: Error): void {
    this.logger.error(`Hook execution error: ${hookId} (${pluginId})`, error);

    this.eventEmitter.emit(PluginSystemEvent.HOOK_ERROR, {
      hookId,
      pluginId,
      timestamp: new Date(),
      error,
    } as HookEventData);
  }

  /**
   * Emit hook executed event
   */
  private emitHookExecuted(hookId: string, pluginId: string, duration: number): void {
    this.eventEmitter.emit(PluginSystemEvent.HOOK_EXECUTED, {
      hookId,
      pluginId,
      timestamp: new Date(),
      duration,
    } as HookEventData);
  }

  // ==========================================================================
  // Debugging
  // ==========================================================================

  /**
   * Get hook statistics
   */
  public getHookStats(): HookStats {
    const stats: HookStats = {
      totalHookPoints: this.hookPoints.size,
      totalHandlers: 0,
      hooksByType: {
        [HookType.BEFORE]: 0,
        [HookType.AFTER]: 0,
        [HookType.REPLACE]: 0,
        [HookType.WRAP]: 0,
      },
      handlersByPlugin: new Map(),
    };

    for (const hookPoint of this.hookPoints.values()) {
      stats.hooksByType[hookPoint.type]++;
    }

    for (const handlers of this.handlers.values()) {
      stats.totalHandlers += handlers.length;

      for (const registration of handlers) {
        const count = stats.handlersByPlugin.get(registration.pluginId) || 0;
        stats.handlersByPlugin.set(registration.pluginId, count + 1);
      }
    }

    return stats;
  }

  /**
   * Get debug info for a hook
   */
  public getHookDebugInfo(hookId: string): HookDebugInfo | undefined {
    const hookPoint = this.hookPoints.get(hookId);
    if (!hookPoint) {
      return undefined;
    }

    const handlers = this.handlers.get(hookId) || [];

    return {
      hookPoint,
      handlerCount: handlers.length,
      handlers: handlers.map((h) => ({
        pluginId: h.pluginId,
        priority: h.priority,
        hasCondition: !!h.condition,
      })),
    };
  }
}

// ============================================================================
// Hook Builder (Fluent API)
// ============================================================================

/**
 * Fluent API for building hook points
 */
export class HookBuilder {
  private hookPoint: Partial<HookPoint> = {
    async: false,
  };

  static create(id: string): HookBuilder {
    const builder = new HookBuilder();
    builder.hookPoint.id = id;
    return builder;
  }

  name(name: string): this {
    this.hookPoint.name = name;
    return this;
  }

  description(description: string): this {
    this.hookPoint.description = description;
    return this;
  }

  type(type: HookType): this {
    this.hookPoint.type = type;
    return this;
  }

  async(async: boolean = true): this {
    this.hookPoint.async = async;
    return this;
  }

  params(params: Array<{ name: string; type: string; description?: string; optional?: boolean }>): this {
    this.hookPoint.params = params;
    return this;
  }

  returns(returns: string): this {
    this.hookPoint.returns = returns;
    return this;
  }

  build(): HookPoint {
    if (!this.hookPoint.id || !this.hookPoint.name || !this.hookPoint.type) {
      throw new Error('Hook point must have id, name, and type');
    }

    return this.hookPoint as HookPoint;
  }
}

// ============================================================================
// Standard Hook Points
// ============================================================================

/**
 * Standard hook points for common scenarios
 */
export const StandardHooks = {
  // Navigation hooks
  NAVIGATION_BEFORE: HookBuilder.create('navigation:before')
    .name('Navigation Before')
    .description('Called before navigation occurs')
    .type(HookType.BEFORE)
    .async(true)
    .params([
      { name: 'route', type: 'string', description: 'Target route' },
      { name: 'params', type: 'object', description: 'Navigation params', optional: true },
    ])
    .build(),

  NAVIGATION_AFTER: HookBuilder.create('navigation:after')
    .name('Navigation After')
    .description('Called after navigation completes')
    .type(HookType.AFTER)
    .async(true)
    .params([
      { name: 'route', type: 'string', description: 'Current route' },
    ])
    .build(),

  // Data hooks
  DATA_FETCH_BEFORE: HookBuilder.create('data:fetch:before')
    .name('Data Fetch Before')
    .description('Called before data fetch')
    .type(HookType.BEFORE)
    .async(true)
    .params([
      { name: 'url', type: 'string', description: 'Fetch URL' },
      { name: 'options', type: 'object', description: 'Fetch options', optional: true },
    ])
    .build(),

  DATA_FETCH_AFTER: HookBuilder.create('data:fetch:after')
    .name('Data Fetch After')
    .description('Called after data fetch')
    .type(HookType.AFTER)
    .async(true)
    .params([
      { name: 'url', type: 'string', description: 'Fetch URL' },
      { name: 'data', type: 'unknown', description: 'Fetched data' },
    ])
    .returns('unknown')
    .build(),

  DATA_SAVE_BEFORE: HookBuilder.create('data:save:before')
    .name('Data Save Before')
    .description('Called before data save')
    .type(HookType.BEFORE)
    .async(true)
    .params([
      { name: 'data', type: 'unknown', description: 'Data to save' },
    ])
    .build(),

  // Authentication hooks
  AUTH_LOGIN_BEFORE: HookBuilder.create('auth:login:before')
    .name('Login Before')
    .description('Called before login')
    .type(HookType.BEFORE)
    .async(true)
    .params([
      { name: 'credentials', type: 'object', description: 'Login credentials' },
    ])
    .build(),

  AUTH_LOGIN_AFTER: HookBuilder.create('auth:login:after')
    .name('Login After')
    .description('Called after successful login')
    .type(HookType.AFTER)
    .async(true)
    .params([
      { name: 'user', type: 'object', description: 'Authenticated user' },
    ])
    .build(),

  AUTH_LOGOUT_BEFORE: HookBuilder.create('auth:logout:before')
    .name('Logout Before')
    .description('Called before logout')
    .type(HookType.BEFORE)
    .async(true)
    .build(),

  // Render hooks
  RENDER_COMPONENT: HookBuilder.create('render:component')
    .name('Render Component')
    .description('Wrap component rendering')
    .type(HookType.WRAP)
    .async(false)
    .params([
      { name: 'Component', type: 'React.ComponentType', description: 'Component to render' },
      { name: 'props', type: 'object', description: 'Component props' },
    ])
    .returns('React.ReactElement')
    .build(),

  // Analytics hooks
  ANALYTICS_TRACK: HookBuilder.create('analytics:track')
    .name('Analytics Track')
    .description('Called when tracking analytics event')
    .type(HookType.BEFORE)
    .async(true)
    .params([
      { name: 'event', type: 'string', description: 'Event name' },
      { name: 'properties', type: 'object', description: 'Event properties', optional: true },
    ])
    .build(),
};

// ============================================================================
// Supporting Types
// ============================================================================

interface HookStats {
  totalHookPoints: number;
  totalHandlers: number;
  hooksByType: Record<HookType, number>;
  handlersByPlugin: Map<string, number>;
}

interface HookDebugInfo {
  hookPoint: HookPoint;
  handlerCount: number;
  handlers: Array<{
    pluginId: string;
    priority: number;
    hasCondition: boolean;
  }>;
}

// ============================================================================
// Hook Utilities
// ============================================================================

/**
 * Create a condition that checks if a feature flag is enabled
 */
export function createFeatureFlagCondition(flagName: string): HookCondition {
  return (context: HookContext) => {
    const features = context.metadata.features as Record<string, boolean> | undefined;
    return features?.[flagName] ?? false;
  };
}

/**
 * Create a condition that checks if user is authenticated
 */
export function createAuthCondition(): HookCondition {
  return (context: HookContext) => {
    const isAuthenticated = context.metadata.isAuthenticated as boolean | undefined;
    return isAuthenticated ?? false;
  };
}

/**
 * Create a condition that checks environment
 */
export function createEnvironmentCondition(env: string | string[]): HookCondition {
  const envs = Array.isArray(env) ? env : [env];

  return (context: HookContext) => {
    const currentEnv = context.metadata.environment as string | undefined;
    return currentEnv ? envs.includes(currentEnv) : false;
  };
}

/**
 * Combine multiple conditions with AND logic
 */
export function combineConditions(...conditions: HookCondition[]): HookCondition {
  return (context: HookContext) => {
    return conditions.every((condition) => condition(context));
  };
}

/**
 * Combine multiple conditions with OR logic
 */
export function anyCondition(...conditions: HookCondition[]): HookCondition {
  return (context: HookContext) => {
    return conditions.some((condition) => condition(context));
  };
}

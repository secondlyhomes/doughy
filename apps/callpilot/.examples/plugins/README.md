# Plugin System Architecture

Comprehensive plugin architecture for the Mobile App Blueprint, enabling extensible functionality through a robust plugin ecosystem.

## Table of Contents

1. [Overview](#overview)
2. [Core Concepts](#core-concepts)
3. [Quick Start](#quick-start)
4. [Architecture](#architecture)
5. [Plugin Development](#plugin-development)
6. [Hooks System](#hooks-system)
7. [Plugin Examples](#plugin-examples)
8. [Best Practices](#best-practices)
9. [API Reference](#api-reference)
10. [Advanced Topics](#advanced-topics)

## Overview

The plugin system provides a flexible, extensible architecture for adding functionality to your app without modifying core code. Features include:

- **Lifecycle Management**: Automatic plugin initialization, activation, and cleanup
- **Dependency Resolution**: Automatic ordering based on plugin dependencies
- **Hook System**: Before/after/replace/wrap hooks for extending functionality
- **Hot Reloading**: Development-mode plugin reloading
- **Type Safety**: Full TypeScript support
- **Isolation**: Plugins run in isolated contexts
- **Event System**: Plugin-to-plugin communication
- **Configuration**: Schema-based plugin configuration

## Core Concepts

### Plugin Lifecycle

```
UNINITIALIZED → INITIALIZING → INITIALIZED → ACTIVATING → ACTIVE
                                                ↓
                                          DEACTIVATING → DEACTIVATED → DISPOSED
```

1. **Initialize**: Load configuration, setup internal state
2. **Activate**: Start services, register hooks, begin operation
3. **Deactivate**: Stop services, cleanup, prepare for removal
4. **Dispose**: Final cleanup, release all resources

### Plugin Context

Each plugin receives a context object providing access to:

- **Logger**: Scoped logging
- **Storage**: Persistent key-value storage
- **Events**: Event emitter for pub/sub
- **API**: HTTP client
- **State**: Reactive state management
- **Plugins**: Access to other plugins
- **Theme**: App theming system
- **Navigation**: App navigation (if available)

### Dependencies

Plugins can declare dependencies on other plugins:

```typescript
dependencies: [
  { pluginId: 'com.blueprint.storage', minVersion: '1.0.0' },
  { pluginId: 'com.blueprint.analytics', optional: true },
]
```

Dependencies are automatically resolved and plugins are initialized in correct order.

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Plugin Manager

```typescript
import { PluginManager } from './.examples/plugins/core/PluginManager';
import { AppConfig } from './.examples/plugins/core/types';

const appConfig: AppConfig = {
  environment: 'development',
  version: '1.0.0',
  buildNumber: '1',
  platform: 'ios',
  debug: true,
  features: {},
  custom: {},
};

const pluginManager = new PluginManager(
  {
    autoActivate: true,
    hotReload: true,
    maxConcurrentInit: 5,
    timeout: 30000,
  },
  appConfig
);

await pluginManager.initialize();
```

### 3. Register Plugins

```typescript
import { createAnalyticsPlugin } from './.examples/plugins/examples/analytics-plugin';
import { createStoragePlugin } from './.examples/plugins/examples/storage-plugin';

// Register plugins
const analyticsPlugin = createAnalyticsPlugin();
await pluginManager.registerPlugin(analyticsPlugin);

const storagePlugin = createStoragePlugin();
await pluginManager.registerPlugin(storagePlugin);
```

### 4. Use Plugins

```typescript
// Get plugin instance
const analytics = pluginManager.getPlugin('com.blueprint.analytics');

// Use plugin API
await analytics.track('App Started');
```

## Architecture

### System Components

```
┌─────────────────────────────────────────────────┐
│           Plugin Manager                        │
│  ┌─────────────────────────────────────────┐   │
│  │  Lifecycle Management                   │   │
│  │  Dependency Resolution                  │   │
│  │  Context Management                     │   │
│  └─────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
┌───────▼──────┐ ┌───▼────┐ ┌──────▼──────┐
│  Hooks       │ │ Events │ │   Storage   │
│  Registry    │ │ System │ │   System    │
└──────────────┘ └────────┘ └─────────────┘
        │
┌───────▼──────────────────────────────────┐
│           Plugin Instances                │
│  ┌──────────┐  ┌──────────┐  ┌─────────┐│
│  │Analytics │  │ Storage  │  │  Auth   ││
│  └──────────┘  └──────────┘  └─────────┘│
│  ┌──────────┐  ┌──────────┐             │
│  │Navigation│  │  Theme   │             │
│  └──────────┘  └──────────┘             │
└──────────────────────────────────────────┘
```

### Plugin Isolation

Each plugin operates in its own isolated context:

- **Scoped Logger**: Plugin ID prefix on all logs
- **Namespaced Storage**: Automatic key namespacing
- **Event Sandboxing**: Optional event isolation
- **State Isolation**: Separate state management

### Communication Patterns

#### Direct Invocation

```typescript
// Get reference to another plugin
const storage = context.plugins.get('com.blueprint.storage');
await storage.set('key', 'value');
```

#### Event-Based

```typescript
// Emit event
context.events.emit('user:login', { userId: '123' });

// Listen for event
context.events.on('user:login', (data) => {
  console.log('User logged in:', data.userId);
});
```

#### Hooks

```typescript
// Register hook to modify behavior
hooksRegistry.registerHook(
  'data:fetch:before',
  'my-plugin',
  async (url, options) => {
    // Add authentication header
    return [url, { ...options, headers: { Authorization: token } }];
  }
);
```

## Plugin Development

### Creating a Plugin

#### 1. Define Plugin Metadata

```typescript
import {
  Plugin,
  PluginMetadata,
  PluginState,
  PluginContext,
  PluginCategory,
} from '../core/types';

export class MyPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.example.myplugin',
    name: 'My Plugin',
    version: '1.0.0',
    author: 'Your Name',
    description: 'Plugin description',
    category: PluginCategory.UTILITIES,
    license: 'MIT',
    keywords: ['keyword1', 'keyword2'],
  };

  public state: PluginState = PluginState.UNINITIALIZED;

  private context?: PluginContext;
  private config?: MyPluginConfig;

  // ... lifecycle methods
}
```

#### 2. Implement Lifecycle Methods

```typescript
export class MyPlugin implements Plugin {
  // Called once during registration
  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;

    // Load configuration
    this.config = await context.storage.get('myplugin:config');

    // Setup internal state
    // ...

    context.logger.info('Plugin initialized');
  }

  // Called when plugin becomes active
  public async activate(context: PluginContext): Promise<void> {
    // Start services
    // Register hooks
    // Subscribe to events

    context.logger.info('Plugin activated');
  }

  // Called when plugin is being stopped
  public async deactivate(context: PluginContext): Promise<void> {
    // Stop services
    // Unregister hooks
    // Unsubscribe from events

    context.logger.info('Plugin deactivated');
  }

  // Called before plugin removal
  public async dispose(context: PluginContext): Promise<void> {
    // Final cleanup
    // Release resources
    // Clear references

    context.logger.info('Plugin disposed');
  }
}
```

#### 3. Define Configuration Schema

```typescript
export class MyPlugin implements Plugin {
  public getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        apiKey: {
          type: 'string',
          description: 'API key for service',
        },
        timeout: {
          type: 'number',
          description: 'Request timeout in ms',
          default: 5000,
          minimum: 1000,
        },
        enabled: {
          type: 'boolean',
          description: 'Enable plugin',
          default: true,
        },
      },
      required: ['apiKey'],
    };
  }

  public validateConfig(config: unknown): boolean {
    // Custom validation logic
    return true;
  }

  public onConfigChange(config: unknown, context: PluginContext): void {
    // Handle config changes
    this.config = config as MyPluginConfig;
  }
}
```

#### 4. Add Public API

```typescript
export class MyPlugin implements Plugin {
  // Public methods your plugin exposes

  public async doSomething(param: string): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin not activated');
    }

    // Implementation
    this.context.logger.debug('Doing something:', param);
  }

  public getSomething(): string {
    return 'something';
  }
}
```

#### 5. Create Factory Function

```typescript
export function createMyPlugin(): Plugin {
  return new MyPlugin();
}
```

### Plugin Template

Complete plugin template:

```typescript
import {
  Plugin,
  PluginMetadata,
  PluginState,
  PluginContext,
  PluginCategory,
  PluginConfigSchema,
} from '../core/types';

// Configuration interface
export interface MyPluginConfig {
  apiKey: string;
  timeout?: number;
  enabled?: boolean;
}

// Main plugin class
export class MyPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.example.myplugin',
    name: 'My Plugin',
    version: '1.0.0',
    author: 'Your Name',
    description: 'Plugin description',
    category: PluginCategory.UTILITIES,
    license: 'MIT',
  };

  public state: PluginState = PluginState.UNINITIALIZED;

  private context?: PluginContext;
  private config?: MyPluginConfig;

  // Lifecycle methods
  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    this.config = await this.loadConfig(context);
    context.logger.info('Plugin initialized');
  }

  public async activate(context: PluginContext): Promise<void> {
    if (!this.config?.enabled) {
      context.logger.info('Plugin disabled by config');
      return;
    }

    context.logger.info('Plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    context.logger.info('Plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    this.context = undefined;
    this.config = undefined;
    context.logger.info('Plugin disposed');
  }

  // Configuration
  public getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'API key' },
        timeout: { type: 'number', default: 5000, minimum: 1000 },
        enabled: { type: 'boolean', default: true },
      },
      required: ['apiKey'],
    };
  }

  // Public API
  public async doSomething(param: string): Promise<void> {
    if (!this.context) throw new Error('Not activated');
    this.context.logger.debug('Doing:', param);
  }

  // Private methods
  private async loadConfig(context: PluginContext): Promise<MyPluginConfig> {
    const stored = await context.storage.get<MyPluginConfig>('myplugin:config');
    return stored || this.getDefaultConfig();
  }

  private getDefaultConfig(): MyPluginConfig {
    return {
      apiKey: '',
      timeout: 5000,
      enabled: true,
    };
  }
}

// Factory function
export function createMyPlugin(): Plugin {
  return new MyPlugin();
}
```

## Hooks System

The hooks system allows plugins to intercept and modify behavior at specific points.

### Hook Types

#### Before Hooks

Execute before an operation, can modify arguments:

```typescript
hooksRegistry.registerHook(
  'navigation:before',
  'my-plugin',
  async (route, params) => {
    // Modify route or params
    return ['/modified-route', params];
  },
  10 // Priority (higher = earlier)
);
```

#### After Hooks

Execute after an operation, can modify result:

```typescript
hooksRegistry.registerHook(
  'data:fetch:after',
  'my-plugin',
  async (url, data) => {
    // Transform data
    return { ...data, enhanced: true };
  }
);
```

#### Replace Hooks

Completely replace an operation:

```typescript
hooksRegistry.registerHook(
  'api:request',
  'my-plugin',
  async (url, options) => {
    // Custom implementation
    return customFetch(url, options);
  }
);
```

#### Wrap Hooks

Wrap an operation with before/after logic:

```typescript
hooksRegistry.registerHook(
  'database:query',
  'my-plugin',
  async (next, query) => {
    const start = Date.now();
    const result = await next(query);
    console.log(`Query took ${Date.now() - start}ms`);
    return result;
  }
);
```

### Standard Hook Points

The system provides standard hook points:

- `navigation:before` - Before navigation
- `navigation:after` - After navigation
- `data:fetch:before` - Before data fetch
- `data:fetch:after` - After data fetch
- `data:save:before` - Before data save
- `auth:login:before` - Before login
- `auth:login:after` - After login
- `auth:logout:before` - Before logout
- `analytics:track` - Analytics tracking
- `render:component` - Component rendering

### Creating Custom Hooks

```typescript
import { HookBuilder, HookType } from '../hooks/HooksRegistry';

// Define hook point
const customHook = HookBuilder.create('myapp:custom')
  .name('Custom Operation')
  .description('Custom hook for my operation')
  .type(HookType.BEFORE)
  .async(true)
  .params([
    { name: 'input', type: 'string', description: 'Input parameter' },
  ])
  .returns('string')
  .build();

// Register hook point
hooksRegistry.registerHookPoint(customHook);

// Use in your code
const result = await hooksRegistry.executeBefore(
  'myapp:custom',
  ['input-value']
);
```

### Hook Conditions

Hooks can have conditions that determine when they execute:

```typescript
import { createFeatureFlagCondition } from '../hooks/HooksRegistry';

hooksRegistry.registerHook(
  'feature:execute',
  'my-plugin',
  async () => { /* ... */ },
  10,
  createFeatureFlagCondition('experimental_feature')
);
```

Built-in conditions:

- `createFeatureFlagCondition(flag)` - Execute if feature flag enabled
- `createAuthCondition()` - Execute if user authenticated
- `createEnvironmentCondition(env)` - Execute in specific environment
- `combineConditions(...conditions)` - AND logic
- `anyCondition(...conditions)` - OR logic

## Plugin Examples

### Analytics Plugin

Multi-provider analytics with offline queue:

```typescript
import { createAnalyticsPlugin } from './.examples/plugins/examples/analytics-plugin';

const analytics = createAnalyticsPlugin();
await pluginManager.registerPlugin(analytics);

// Track events
await analytics.track('Button Clicked', { button: 'submit' });
await analytics.screen('Home Screen');

// Identify user
await analytics.identify('user-123', {
  email: 'user@example.com',
  plan: 'premium',
});
```

[Full Analytics Plugin Documentation](./examples/analytics-plugin/README.md)

### Storage Plugin

Advanced storage with encryption and compression:

```typescript
import { createStoragePlugin } from './.examples/plugins/examples/storage-plugin';

const storage = createStoragePlugin();
await pluginManager.registerPlugin(storage);

// Store data
await storage.set('user', { id: '123', name: 'John' });

// Retrieve data
const user = await storage.get('user');

// Use namespaces
const userStorage = storage.namespace('user-123');
await userStorage.set('preferences', { theme: 'dark' });
```

### Auth Plugin

Authentication with session management:

```typescript
import { createAuthPlugin } from './.examples/plugins/examples/auth-plugin';

const auth = createAuthPlugin();
await pluginManager.registerPlugin(auth);

// Sign in
const session = await auth.signIn('user@example.com', 'password');

// Get current user
const user = auth.getUser();

// Sign out
await auth.signOut();
```

### Navigation Plugin

Navigation with history and guards:

```typescript
import { createNavigationPlugin } from './.examples/plugins/examples/navigation-plugin';

const navigation = createNavigationPlugin();
await pluginManager.registerPlugin(navigation);

// Navigate
await navigation.navigate('Profile', { userId: '123' });

// Go back
navigation.goBack();

// Get history
const history = navigation.getHistory();
```

### Theme Plugin

Theming with dark mode:

```typescript
import { createThemePlugin } from './.examples/plugins/examples/theme-plugin';

const theme = createThemePlugin();
await pluginManager.registerPlugin(theme);

// Get current theme
const currentTheme = theme.getTheme();

// Change theme
await theme.setTheme('dark');

// Toggle dark mode
await theme.toggleDarkMode();

// Subscribe to changes
theme.subscribe((newTheme) => {
  console.log('Theme changed:', newTheme);
});
```

## Best Practices

### 1. Plugin Design

✅ **Do:**
- Keep plugins focused on single responsibility
- Use clear, descriptive plugin IDs (reverse domain notation)
- Provide comprehensive configuration schemas
- Handle errors gracefully
- Log important operations
- Document your public API

❌ **Don't:**
- Create god plugins that do everything
- Hardcode configuration
- Silently fail
- Block the main thread
- Leak memory

### 2. Dependencies

✅ **Do:**
- Declare all dependencies explicitly
- Use semantic versioning
- Mark optional dependencies as optional
- Provide fallbacks for optional dependencies

❌ **Don't:**
- Create circular dependencies
- Couple tightly to specific versions
- Access other plugins without declaring dependencies

### 3. Performance

✅ **Do:**
- Lazy load heavy resources
- Use batching for bulk operations
- Implement caching where appropriate
- Clean up resources in deactivate/dispose
- Use async operations for I/O

❌ **Don't:**
- Do heavy work in initialize/activate
- Block the event loop
- Retain references after disposal
- Poll unnecessarily

### 4. State Management

✅ **Do:**
- Use plugin context storage for persistence
- Clear state in dispose
- Use context.state for reactive state
- Validate state on load

❌ **Don't:**
- Use global variables
- Mutate shared state directly
- Store sensitive data unencrypted
- Assume state exists

### 5. Error Handling

✅ **Do:**
- Catch and log errors
- Provide meaningful error messages
- Implement health checks
- Gracefully degrade on errors

❌ **Don't:**
- Let errors crash the app
- Swallow errors silently
- Return undefined on error
- Throw generic errors

### 6. Testing

✅ **Do:**
- Write unit tests for plugin logic
- Test lifecycle methods
- Mock dependencies
- Test error cases
- Test configuration validation

❌ **Don't:**
- Skip testing
- Test in production
- Rely only on manual testing

## API Reference

### PluginManager

#### Methods

```typescript
// Initialization
initialize(): Promise<void>
shutdown(): Promise<void>

// Plugin Management
registerPlugin(plugin: Plugin): Promise<PluginLoadResult>
unregisterPlugin(pluginId: string): Promise<void>
initializePlugin(pluginId: string): Promise<void>
activatePlugin(pluginId: string): Promise<void>
deactivatePlugin(pluginId: string): Promise<void>

// Plugin Access
getPlugin(pluginId: string): Plugin | undefined
getAllPlugins(): Plugin[]
getActivePlugins(): Plugin[]
hasPlugin(pluginId: string): boolean
getPluginState(pluginId: string): PluginState | undefined
getPluginContext(pluginId: string): PluginContext | undefined

// Plugin Invocation
invokePlugin<T>(pluginId: string, method: string, ...args: unknown[]): Promise<T>
getPluginHealth(pluginId: string): Promise<PluginHealthStatus>

// Events
on(event: PluginSystemEvent, handler: EventHandler): EventSubscription
```

### HooksRegistry

#### Methods

```typescript
// Hook Points
registerHookPoint(hookPoint: HookPoint): void
unregisterHookPoint(hookId: string): void
getHookPoints(): HookPoint[]
getHookPoint(hookId: string): HookPoint | undefined

// Hook Handlers
registerHook(hookId: string, pluginId: string, handler: HookHandler, priority?: number, condition?: HookCondition): void
unregisterHook(hookId: string, pluginId: string): void
unregisterAllHooks(pluginId: string): void
getHookHandlers(hookId: string): HookRegistration[]

// Hook Execution
executeBefore<TArgs>(hookId: string, args: TArgs, metadata?: Record<string, unknown>): Promise<TArgs>
executeAfter<TArgs, TReturn>(hookId: string, args: TArgs, result: TReturn, metadata?: Record<string, unknown>): Promise<TReturn>
executeReplace<TArgs, TReturn>(hookId: string, originalFn: (...args: TArgs) => TReturn | Promise<TReturn>, args: TArgs, metadata?: Record<string, unknown>): Promise<TReturn>
executeWrap<TArgs, TReturn>(hookId: string, originalFn: (...args: TArgs) => TReturn | Promise<TReturn>, args: TArgs, metadata?: Record<string, unknown>): Promise<TReturn>

// Debugging
getHookStats(): HookStats
getHookDebugInfo(hookId: string): HookDebugInfo | undefined
```

### Plugin Context

Properties available to all plugins:

```typescript
interface PluginContext {
  metadata: PluginMetadata;           // Plugin metadata
  config: AppConfig;                  // App configuration
  logger: PluginLogger;               // Logger instance
  events: PluginEventEmitter;         // Event emitter
  storage: PluginStorage;             // Persistent storage
  api: PluginApiClient;               // HTTP client
  state: PluginStateManager;          // State management
  lifecycle: PluginLifecycleHooks;    // App lifecycle hooks
  plugins: PluginRegistry;            // Access to other plugins
  theme: PluginThemeProvider;         // Theme access
  navigation?: PluginNavigationProvider; // Navigation (optional)
  data: Map<string, unknown>;         // Custom plugin data
}
```

## Advanced Topics

### Hot Reloading

Enable hot reloading in development:

```typescript
const pluginManager = new PluginManager({
  hotReload: true,
  // ...
}, appConfig);
```

Hot reload a plugin:

```typescript
// Deactivate old version
await pluginManager.deactivatePlugin('com.example.plugin');
await pluginManager.unregisterPlugin('com.example.plugin');

// Register new version
const newPlugin = createPlugin();
await pluginManager.registerPlugin(newPlugin);
```

### Plugin Isolation

Enable strict isolation:

```typescript
const pluginManager = new PluginManager({
  isolation: true,
  // ...
}, appConfig);
```

With isolation:
- Plugins can't directly access other plugins
- Must use events or official APIs
- Failures are contained

### Custom Storage Backend

Provide custom storage implementation:

```typescript
class CustomStorage implements PluginStorage {
  async get<T>(key: string): Promise<T | null> {
    // Your implementation
  }

  async set<T>(key: string, value: T): Promise<void> {
    // Your implementation
  }

  // ... other methods
}

const pluginManager = new PluginManager(
  config,
  appConfig,
  {
    storage: new CustomStorage(),
  }
);
```

### Custom Logger

Provide custom logger:

```typescript
class CustomLogger implements PluginLogger {
  debug(message: string, ...args: unknown[]): void {
    // Your implementation
  }

  // ... other methods
}

const pluginManager = new PluginManager(
  config,
  appConfig,
  {
    logger: new CustomLogger(),
  }
);
```

### Plugin Versioning

Use semantic versioning for plugin compatibility:

```typescript
// Plugin declares version
metadata: {
  version: '2.1.0',
  // ...
}

// Dependent plugin specifies range
dependencies: [
  {
    pluginId: 'com.example.plugin',
    minVersion: '2.0.0',
    maxVersion: '3.0.0',
  },
]
```

### Migration System

Define migrations for storage schema changes:

```typescript
const storagePlugin = new StoragePlugin();

// Configure with migrations
const config: StorageConfig = {
  backend: 'sqlite',
  migrations: true,
  migrationSpecs: [
    {
      version: 1,
      description: 'Initial schema',
      migrate: async (storage) => {
        await storage.set('schema_version', 1);
      },
    },
    {
      version: 2,
      description: 'Add user preferences',
      migrate: async (storage) => {
        const users = await storage.get('users') || [];
        // Migrate existing data
        await storage.set('users', users);
        await storage.set('schema_version', 2);
      },
    },
  ],
};
```

### Plugin Discovery

Auto-load plugins from directories:

```typescript
const pluginManager = new PluginManager({
  pluginDirs: ['./plugins', './user-plugins'],
  // ...
}, appConfig);

// Plugins are automatically discovered and loaded
```

### Error Recovery

Handle plugin errors gracefully:

```typescript
pluginManager.on(PluginSystemEvent.PLUGIN_ERROR, (event) => {
  console.error('Plugin error:', event.pluginId, event.error);

  // Attempt recovery
  if (event.pluginId === 'com.critical.plugin') {
    // Try to restart
    setTimeout(() => {
      pluginManager.activatePlugin(event.pluginId);
    }, 5000);
  }
});
```

### Performance Monitoring

Monitor plugin performance:

```typescript
pluginManager.on(PluginSystemEvent.HOOK_EXECUTED, (event) => {
  if (event.duration && event.duration > 100) {
    console.warn(`Slow hook: ${event.hookId} (${event.duration}ms)`);
  }
});
```

## Conclusion

The plugin system provides a powerful, flexible foundation for extending your app. Key takeaways:

1. **Lifecycle Management**: Plugins follow a well-defined lifecycle
2. **Type Safety**: Full TypeScript support throughout
3. **Extensibility**: Hooks allow deep customization
4. **Isolation**: Plugins are isolated and safe
5. **Developer Experience**: Rich APIs and tooling

For questions or issues, please refer to the examples or create an issue in the repository.

---

**Version**: 1.0.0
**Last Updated**: 2026-02-07
**License**: MIT

# Plugin System Quick Reference

Fast reference for common plugin operations.

## Setup

```typescript
import { PluginManager, AppConfig } from './.examples/plugins';

const manager = new PluginManager(config, appConfig);
await manager.initialize();
```

## Register Plugin

```typescript
import { createAnalyticsPlugin } from './.examples/plugins';

const plugin = createAnalyticsPlugin();
await manager.registerPlugin(plugin);
```

## Get Plugin

```typescript
const analytics = manager.getPlugin('com.blueprint.analytics');
```

## Plugin Lifecycle

```typescript
// Initialize (once)
await manager.initializePlugin('plugin.id');

// Activate
await manager.activatePlugin('plugin.id');

// Deactivate
await manager.deactivatePlugin('plugin.id');

// Unregister
await manager.unregisterPlugin('plugin.id');
```

## Analytics Plugin

```typescript
import { AnalyticsPlugin } from './.examples/plugins';

const analytics = manager.getPlugin('com.blueprint.analytics') as AnalyticsPlugin;

// Track event
await analytics.track('Event Name', { prop: 'value' });

// Screen view
await analytics.screen('Screen Name');

// Identify user
await analytics.identify('user-123', { email: 'user@example.com' });

// Reset (logout)
await analytics.reset();
```

## Storage Plugin

```typescript
import { StoragePlugin } from './.examples/plugins';

const storage = manager.getPlugin('com.blueprint.storage') as StoragePlugin;

// Set
await storage.set('key', { data: 'value' });

// Get
const data = await storage.get('key');

// Remove
await storage.remove('key');

// Clear
await storage.clear();

// Namespace
const userStorage = storage.namespace('user-123');
await userStorage.set('preferences', { theme: 'dark' });
```

## Auth Plugin

```typescript
import { AuthPlugin } from './.examples/plugins';

const auth = manager.getPlugin('com.blueprint.auth') as AuthPlugin;

// Sign in
const session = await auth.signIn('email@example.com', 'password');

// Get session
const currentSession = auth.getSession();

// Get user
const user = auth.getUser();

// Check authentication
const isAuth = auth.isAuthenticated();

// Sign out
await auth.signOut();
```

## Navigation Plugin

```typescript
import { NavigationPlugin } from './.examples/plugins';

const nav = manager.getPlugin('com.blueprint.navigation') as NavigationPlugin;

// Navigate
await nav.navigate('Screen', { param: 'value' });

// Go back
nav.goBack();

// Get current route
const route = nav.getCurrentRoute();

// Get history
const history = nav.getHistory();

// Subscribe to changes
const unsubscribe = nav.subscribe((route) => {
  console.log('Navigated to:', route);
});
```

## Theme Plugin

```typescript
import { ThemePlugin } from './.examples/plugins';

const theme = manager.getPlugin('com.blueprint.theme') as ThemePlugin;

// Get theme
const currentTheme = theme.getTheme();

// Set theme
await theme.setTheme('dark');

// Toggle dark mode
await theme.toggleDarkMode();

// Subscribe to changes
theme.subscribe((newTheme) => {
  console.log('Theme changed:', newTheme);
});

// Get available themes
const themes = theme.getAvailableThemes();
```

## Hooks

```typescript
import { HooksRegistry, HookType, HookBuilder } from './.examples/plugins';

const hooks = new HooksRegistry(eventEmitter, logger);

// Register hook point
hooks.registerHookPoint(
  HookBuilder.create('my-hook')
    .name('My Hook')
    .type(HookType.BEFORE)
    .async(true)
    .build()
);

// Register handler
hooks.registerHook(
  'my-hook',
  'plugin-id',
  async (arg1, arg2) => {
    // Modify arguments
    return [modifiedArg1, modifiedArg2];
  },
  10 // Priority
);

// Execute hook
const result = await hooks.executeBefore('my-hook', [arg1, arg2]);
```

## Events

```typescript
// Subscribe
const subscription = manager.on('plugin:activated', (event) => {
  console.log('Plugin activated:', event.pluginId);
});

// Unsubscribe
subscription.remove();

// Emit (from plugin)
context.events.emit('custom:event', { data: 'value' });

// Listen (from plugin)
context.events.on('custom:event', (data) => {
  console.log('Event received:', data);
});
```

## React Hooks

```typescript
import { usePluginManager, useAnalytics, useAuth, useTheme } from './hooks';

function MyComponent() {
  const manager = usePluginManager();
  const analytics = useAnalytics();
  const { user, signIn, signOut } = useAuth();
  const { theme, setTheme } = useTheme();

  // Use plugins
}
```

## Create Custom Plugin

```typescript
import { Plugin, PluginMetadata, PluginContext, PluginState } from './.examples/plugins';

export class MyPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.example.myplugin',
    name: 'My Plugin',
    version: '1.0.0',
    author: 'Me',
    description: 'My custom plugin',
    category: 'utilities',
  };

  public state: PluginState = PluginState.UNINITIALIZED;
  private context?: PluginContext;

  async initialize(context: PluginContext) {
    this.context = context;
  }

  async activate(context: PluginContext) {
    // Start services
  }

  async deactivate(context: PluginContext) {
    // Stop services
  }

  async dispose(context: PluginContext) {
    // Cleanup
  }

  // Public API
  public async myMethod() {
    // Implementation
  }
}

export function createMyPlugin(): Plugin {
  return new MyPlugin();
}
```

## Common Patterns

### Singleton Plugin

```typescript
let instance: MyPlugin | null = null;

export function getMyPlugin(manager: PluginManager): MyPlugin {
  if (!instance) {
    instance = manager.getPlugin('com.example.myplugin') as MyPlugin;
  }
  return instance;
}
```

### Plugin with Config

```typescript
export class MyPlugin implements Plugin {
  getConfigSchema() {
    return {
      type: 'object',
      properties: {
        apiKey: { type: 'string', description: 'API Key' },
        enabled: { type: 'boolean', default: true },
      },
      required: ['apiKey'],
    };
  }
}
```

### Plugin with Dependencies

```typescript
export class MyPlugin implements Plugin {
  dependencies = [
    { pluginId: 'com.blueprint.storage', minVersion: '1.0.0' },
    { pluginId: 'com.blueprint.analytics', optional: true },
  ];
}
```

## Error Handling

```typescript
// Monitor errors
manager.on('plugin:error', (event) => {
  console.error('Plugin error:', event.pluginId, event.error);
});

// Try-catch in plugin methods
try {
  await plugin.someMethod();
} catch (error) {
  context.logger.error('Method failed', error);
  // Handle gracefully
}

// Health check
const health = await manager.getPluginHealth('plugin.id');
if (!health.healthy) {
  console.warn('Plugin unhealthy:', health.message);
}
```

## Debug

```typescript
// Enable debug mode
const manager = new PluginManager({ debug: true }, appConfig);

// Check plugin state
const state = manager.getPluginState('plugin.id');
console.log('State:', state);

// Get all plugins
const plugins = manager.getAllPlugins();
console.log('Plugins:', plugins.map(p => p.metadata.id));

// Get active plugins
const active = manager.getActivePlugins();
console.log('Active:', active.length);
```

## Environment-Based Loading

```typescript
if (process.env.NODE_ENV === 'production') {
  await manager.registerPlugin(createAnalyticsPlugin());
}

if (__DEV__) {
  await manager.registerPlugin(createDebugPlugin());
}
```

## Cleanup

```typescript
// Shutdown all plugins
await manager.shutdown();

// Unregister specific plugin
await manager.unregisterPlugin('plugin.id');
```

---

**For more details, see:**
- [README.md](./README.md) - Complete documentation
- [PLUGIN-DEVELOPMENT-GUIDE.md](./PLUGIN-DEVELOPMENT-GUIDE.md) - Development guide
- [USAGE-EXAMPLE.md](./USAGE-EXAMPLE.md) - Usage examples

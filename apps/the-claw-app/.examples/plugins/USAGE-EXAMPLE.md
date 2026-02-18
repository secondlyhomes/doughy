# Plugin System Usage Examples

Practical examples of using the plugin system in your app.

## Complete Setup Example

### 1. Initialize Plugin Manager

```typescript
import { PluginManager, AppConfig, PluginCategory } from './.examples/plugins';

// Define app configuration
const appConfig: AppConfig = {
  environment: 'development',
  version: '1.0.0',
  buildNumber: '123',
  platform: 'ios',
  debug: true,
  features: {
    analytics: true,
    darkMode: true,
    offline: true,
  },
  custom: {
    apiUrl: 'https://api.example.com',
  },
};

// Create plugin manager
const pluginManager = new PluginManager(
  {
    autoActivate: true,
    hotReload: __DEV__,
    maxConcurrentInit: 5,
    timeout: 30000,
    strictDependencies: true,
  },
  appConfig
);

// Initialize
await pluginManager.initialize();
```

### 2. Register Plugins

```typescript
import {
  createAnalyticsPlugin,
  createStoragePlugin,
  createAuthPlugin,
  createNavigationPlugin,
  createThemePlugin,
} from './.examples/plugins';

// Storage plugin (foundation)
const storagePlugin = createStoragePlugin();
await pluginManager.registerPlugin(storagePlugin);

// Auth plugin (depends on storage)
const authPlugin = createAuthPlugin();
await pluginManager.registerPlugin(authPlugin);

// Analytics plugin (depends on storage)
const analyticsPlugin = createAnalyticsPlugin();
await pluginManager.registerPlugin(analyticsPlugin);

// Navigation plugin
const navigationPlugin = createNavigationPlugin();
await pluginManager.registerPlugin(navigationPlugin);

// Theme plugin
const themePlugin = createThemePlugin();
await pluginManager.registerPlugin(themePlugin);

console.log('All plugins registered and activated!');
```

### 3. Use Plugins in Your App

```typescript
import { AnalyticsPlugin, AuthPlugin, ThemePlugin } from './.examples/plugins';

// Get plugin instances
const analytics = pluginManager.getPlugin('com.blueprint.analytics') as AnalyticsPlugin;
const auth = pluginManager.getPlugin('com.blueprint.auth') as AuthPlugin;
const theme = pluginManager.getPlugin('com.blueprint.theme') as ThemePlugin;

// Use analytics
await analytics.track('App Started');

// Check authentication
if (auth.isAuthenticated()) {
  const user = auth.getUser();
  await analytics.identify(user.id, user);
}

// Get current theme
const currentTheme = theme.getTheme();
```

## React Integration

### Setup Provider

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { PluginManager } from './.examples/plugins';

const PluginContext = createContext<PluginManager | null>(null);

export function PluginProvider({ children }: { children: React.ReactNode }) {
  const [manager, setManager] = useState<PluginManager | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setupPlugins() {
      const pluginManager = new PluginManager(config, appConfig);
      await pluginManager.initialize();

      // Register plugins
      await registerAllPlugins(pluginManager);

      setManager(pluginManager);
      setIsReady(true);
    }

    setupPlugins();

    return () => {
      manager?.shutdown();
    };
  }, []);

  if (!isReady) {
    return <LoadingScreen />;
  }

  return (
    <PluginContext.Provider value={manager}>
      {children}
    </PluginContext.Provider>
  );
}

export function usePluginManager() {
  const manager = useContext(PluginContext);
  if (!manager) {
    throw new Error('usePluginManager must be used within PluginProvider');
  }
  return manager;
}

async function registerAllPlugins(manager: PluginManager) {
  const plugins = [
    createStoragePlugin(),
    createAuthPlugin(),
    createAnalyticsPlugin(),
    createNavigationPlugin(),
    createThemePlugin(),
  ];

  for (const plugin of plugins) {
    await manager.registerPlugin(plugin);
  }
}
```

### Custom Hooks

```typescript
import { usePluginManager } from './PluginProvider';
import { AnalyticsPlugin, AuthPlugin, ThemePlugin } from './.examples/plugins';
import { useEffect, useState } from 'react';

// Analytics hook
export function useAnalytics() {
  const manager = usePluginManager();
  return manager.getPlugin('com.blueprint.analytics') as AnalyticsPlugin;
}

// Track screen views automatically
export function useScreenTracking(screenName: string) {
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.screen(screenName);
  }, [screenName]);
}

// Auth hook
export function useAuth() {
  const manager = usePluginManager();
  const auth = manager.getPlugin('com.blueprint.auth') as AuthPlugin;

  const [user, setUser] = useState(auth.getUser());
  const [isAuthenticated, setIsAuthenticated] = useState(auth.isAuthenticated());

  useEffect(() => {
    // Subscribe to auth changes
    const unsubscribe = manager.on('auth:signin', () => {
      setUser(auth.getUser());
      setIsAuthenticated(true);
    });

    manager.on('auth:signout', () => {
      setUser(undefined);
      setIsAuthenticated(false);
    });

    return () => unsubscribe.remove();
  }, []);

  return {
    user,
    isAuthenticated,
    signIn: auth.signIn.bind(auth),
    signOut: auth.signOut.bind(auth),
  };
}

// Theme hook
export function useTheme() {
  const manager = usePluginManager();
  const themePlugin = manager.getPlugin('com.blueprint.theme') as ThemePlugin;

  const [theme, setTheme] = useState(themePlugin.getTheme());

  useEffect(() => {
    const unsubscribe = themePlugin.subscribe((newTheme) => {
      setTheme(newTheme);
    });

    return () => unsubscribe();
  }, []);

  return {
    theme,
    setTheme: themePlugin.setTheme.bind(themePlugin),
    toggleDarkMode: themePlugin.toggleDarkMode.bind(themePlugin),
    isDark: themePlugin.getDarkMode(),
  };
}
```

### Using in Components

```typescript
import React from 'react';
import { View, Text, Button } from 'react-native';
import { useAuth, useAnalytics, useTheme, useScreenTracking } from './hooks';

export function ProfileScreen() {
  // Track screen view
  useScreenTracking('Profile');

  const { user, signOut } = useAuth();
  const analytics = useAnalytics();
  const { theme, toggleDarkMode } = useTheme();

  const handleSignOut = async () => {
    await analytics.track('Sign Out Clicked');
    await signOut();
  };

  const handleToggleDarkMode = async () => {
    await analytics.track('Dark Mode Toggled');
    await toggleDarkMode();
  };

  return (
    <View style={{ backgroundColor: theme?.colors.background }}>
      <Text style={{ color: theme?.colors.text }}>
        Hello, {user?.name}!
      </Text>

      <Button title="Sign Out" onPress={handleSignOut} />
      <Button title="Toggle Dark Mode" onPress={handleToggleDarkMode} />
    </View>
  );
}
```

## Advanced Usage

### Plugin Communication

```typescript
// Plugin A emits event
export class PluginA implements Plugin {
  public async doSomething() {
    // Do work
    const result = { data: 'important' };

    // Notify other plugins
    this.context?.events.emit('pluginA:work:complete', result);
  }
}

// Plugin B listens for event
export class PluginB implements Plugin {
  public async activate(context: PluginContext) {
    context.events.on('pluginA:work:complete', (result) => {
      console.log('Plugin A completed work:', result);
      this.handlePluginAResult(result);
    });
  }

  private handlePluginAResult(result: unknown) {
    // React to Plugin A's work
  }
}
```

### Cross-Plugin Invocation

```typescript
// In your component or service
const analytics = pluginManager.getPlugin('com.blueprint.analytics');
const auth = pluginManager.getPlugin('com.blueprint.auth');

// When user signs in, track it
auth.signIn(email, password).then((session) => {
  analytics.identify(session.user.id, {
    email: session.user.email,
    name: session.user.name,
  });
  analytics.track('User Signed In');
});
```

### Using Hooks System

```typescript
import { HooksRegistry, StandardHooks } from './.examples/plugins';

// Setup hooks registry
const hooksRegistry = new HooksRegistry(eventEmitter, logger);

// Register standard hooks
Object.values(StandardHooks).forEach((hook) => {
  hooksRegistry.registerHookPoint(hook);
});

// Register custom hook handler in plugin
export class MyPlugin implements Plugin {
  public async activate(context: PluginContext) {
    // Add authentication to all API requests
    hooksRegistry.registerHook(
      'data:fetch:before',
      this.metadata.id,
      async (url, options) => {
        const session = auth.getSession();
        if (session) {
          return [
            url,
            {
              ...options,
              headers: {
                ...options.headers,
                Authorization: `Bearer ${session.accessToken}`,
              },
            },
          ];
        }
        return [url, options];
      },
      10 // High priority
    );

    // Log all API responses
    hooksRegistry.registerHook(
      'data:fetch:after',
      this.metadata.id,
      async (url, data) => {
        context.logger.debug('API Response:', url, data);
        return data;
      }
    );
  }
}

// Use hooks in your API client
async function fetchData(url: string, options?: any) {
  // Execute before hooks
  const [modifiedUrl, modifiedOptions] = await hooksRegistry.executeBefore(
    'data:fetch:before',
    [url, options]
  );

  // Make request
  const response = await fetch(modifiedUrl, modifiedOptions);
  const data = await response.json();

  // Execute after hooks
  const transformedData = await hooksRegistry.executeAfter(
    'data:fetch:after',
    [modifiedUrl, data],
    data
  );

  return transformedData;
}
```

### Conditional Plugin Loading

```typescript
async function registerPlugins(manager: PluginManager) {
  // Always load core plugins
  await manager.registerPlugin(createStoragePlugin());
  await manager.registerPlugin(createAuthPlugin());

  // Load analytics only in production
  if (appConfig.environment === 'production') {
    await manager.registerPlugin(createAnalyticsPlugin());
  }

  // Load debug plugins in development
  if (appConfig.environment === 'development') {
    const { createDebugPlugin } = await import('./debug-plugin');
    await manager.registerPlugin(createDebugPlugin());
  }

  // Load feature-specific plugins based on flags
  if (appConfig.features.payments) {
    const { createPaymentPlugin } = await import('./payment-plugin');
    await manager.registerPlugin(createPaymentPlugin());
  }
}
```

### Plugin Configuration

```typescript
import { StorageConfig, AnalyticsConfig } from './.examples/plugins';

// Configure storage plugin
const storageConfig: StorageConfig = {
  backend: 'mmkv',
  encryption: true,
  encryptionKey: process.env.STORAGE_ENCRYPTION_KEY,
  compression: true,
  compressionThreshold: 1024,
  cache: true,
  cacheTTL: 300000,
  maxCacheSize: 100,
};

// Configure analytics plugin
const analyticsConfig: AnalyticsConfig = {
  providers: [
    {
      name: 'segment',
      type: 'segment',
      apiKey: process.env.SEGMENT_KEY,
      enabled: true,
    },
    {
      name: 'mixpanel',
      type: 'mixpanel',
      apiKey: process.env.MIXPANEL_TOKEN,
      enabled: true,
    },
  ],
  autoTrackScreens: true,
  autoTrackLifecycle: true,
  enableBatching: true,
  batchSize: 20,
  offlineQueue: true,
  defaultProperties: {
    app_version: appConfig.version,
    platform: appConfig.platform,
  },
};

// Apply configurations after registration
const storage = manager.getPlugin('com.blueprint.storage');
storage.onConfigChange?.(storageConfig, storage.context);

const analytics = manager.getPlugin('com.blueprint.analytics');
analytics.onConfigChange?.(analyticsConfig, analytics.context);
```

### Error Handling

```typescript
import { PluginSystemEvent, PluginErrorType } from './.examples/plugins';

// Monitor plugin errors
pluginManager.on(PluginSystemEvent.PLUGIN_ERROR, (event) => {
  const { pluginId, error } = event;

  // Log to error tracking service
  ErrorTracker.captureException(error, {
    tags: {
      plugin: pluginId,
      type: 'plugin_error',
    },
  });

  // Attempt recovery for critical plugins
  if (isCriticalPlugin(pluginId)) {
    recoverPlugin(pluginId);
  }
});

async function recoverPlugin(pluginId: string) {
  try {
    // Try to restart plugin
    await pluginManager.deactivatePlugin(pluginId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    await pluginManager.activatePlugin(pluginId);

    console.log(`Plugin recovered: ${pluginId}`);
  } catch (error) {
    console.error(`Plugin recovery failed: ${pluginId}`, error);
    // Notify user or fallback to degraded mode
  }
}

function isCriticalPlugin(pluginId: string): boolean {
  return ['com.blueprint.storage', 'com.blueprint.auth'].includes(pluginId);
}
```

### Performance Monitoring

```typescript
// Monitor hook execution time
pluginManager.on(PluginSystemEvent.HOOK_EXECUTED, (event) => {
  const { hookId, pluginId, duration } = event;

  if (duration && duration > 100) {
    console.warn(`Slow hook execution: ${hookId} by ${pluginId} (${duration}ms)`);

    // Track in analytics
    analytics.track('Slow Hook Execution', {
      hookId,
      pluginId,
      duration,
    });
  }
});

// Monitor plugin health
setInterval(async () => {
  const plugins = pluginManager.getAllPlugins();

  for (const plugin of plugins) {
    const health = await pluginManager.getPluginHealth(plugin.metadata.id);

    if (!health.healthy) {
      console.warn(`Plugin unhealthy: ${plugin.metadata.id}`, health);

      analytics.track('Plugin Unhealthy', {
        pluginId: plugin.metadata.id,
        message: health.message,
      });
    }
  }
}, 60000); // Check every minute
```

## Testing with Plugins

```typescript
import { render } from '@testing-library/react-native';
import { PluginProvider } from './PluginProvider';

describe('App with Plugins', () => {
  test('renders with plugin system', async () => {
    const { getByText } = render(
      <PluginProvider>
        <App />
      </PluginProvider>
    );

    // Wait for plugins to initialize
    await waitFor(() => {
      expect(getByText('Welcome')).toBeTruthy();
    });
  });

  test('analytics tracks events', async () => {
    const manager = await setupTestPluginManager();
    const analytics = manager.getPlugin('com.blueprint.analytics');

    const trackSpy = jest.spyOn(analytics, 'track');

    // Perform action
    await someAction();

    expect(trackSpy).toHaveBeenCalledWith('Action Performed');
  });
});

async function setupTestPluginManager() {
  const manager = new PluginManager(testConfig, testAppConfig);
  await manager.initialize();

  // Register test plugins
  await manager.registerPlugin(createStoragePlugin());
  await manager.registerPlugin(createAnalyticsPlugin());

  return manager;
}
```

## Best Practices Summary

1. **Initialize Early**: Set up plugin manager before app renders
2. **Use Providers**: Wrap app in PluginProvider for easy access
3. **Type Safety**: Use TypeScript types for plugin APIs
4. **Error Handling**: Monitor plugin errors and implement recovery
5. **Performance**: Monitor hook execution times
6. **Testing**: Write tests for plugin integration
7. **Configuration**: Use environment-based plugin configuration
8. **Cleanup**: Always shutdown plugin manager on app exit

---

For more examples, see the [Plugin Development Guide](./PLUGIN-DEVELOPMENT-GUIDE.md).

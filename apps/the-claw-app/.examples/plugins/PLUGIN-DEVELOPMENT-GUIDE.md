# Plugin Development Guide

Complete guide to developing plugins for the Mobile App Blueprint plugin system.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Workflow](#development-workflow)
3. [Plugin Structure](#plugin-structure)
4. [Testing Plugins](#testing-plugins)
5. [Publishing Plugins](#publishing-plugins)
6. [Troubleshooting](#troubleshooting)
7. [Examples](#examples)

## Getting Started

### Prerequisites

- Node.js 18+
- TypeScript 5+
- Basic understanding of React Native
- Familiarity with async/await and Promises

### Setup Development Environment

1. Clone the repository:

```bash
git clone https://github.com/your-org/your-repo.git
cd mobile-app-blueprint
```

2. Install dependencies:

```bash
npm install
```

3. Create your plugin directory:

```bash
mkdir -p .examples/plugins/examples/my-plugin
cd .examples/plugins/examples/my-plugin
```

## Development Workflow

### 1. Create Plugin Structure

```
my-plugin/
├── index.ts          # Main plugin file
├── types.ts          # TypeScript types
├── utils.ts          # Utility functions
├── README.md         # Documentation
└── __tests__/        # Tests
    └── index.test.ts
```

### 2. Scaffold Plugin

Create `index.ts`:

```typescript
import {
  Plugin,
  PluginMetadata,
  PluginState,
  PluginContext,
  PluginCategory,
  PluginConfigSchema,
} from '../../core/types';

// Configuration types
export interface MyPluginConfig {
  enabled: boolean;
  apiKey?: string;
  // ... other config
}

// Main plugin class
export class MyPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.yourcompany.myplugin',
    name: 'My Plugin',
    version: '1.0.0',
    author: 'Your Name',
    description: 'Brief description of what your plugin does',
    category: PluginCategory.UTILITIES,
    license: 'MIT',
    keywords: ['plugin', 'example'],
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
    if (!this.config?.enabled) return;
    // Activation logic
    context.logger.info('Plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    // Cleanup logic
    context.logger.info('Plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    this.context = undefined;
    this.config = undefined;
    context.logger.info('Plugin disposed');
  }

  public getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        enabled: {
          type: 'boolean',
          default: true,
        },
        apiKey: {
          type: 'string',
          description: 'API key for service',
        },
      },
    };
  }

  // Private helpers
  private async loadConfig(context: PluginContext): Promise<MyPluginConfig> {
    const stored = await context.storage.get<MyPluginConfig>('myplugin:config');
    return stored || { enabled: true };
  }
}

// Factory function
export function createMyPlugin(): Plugin {
  return new MyPlugin();
}
```

### 3. Add Types

Create `types.ts`:

```typescript
// Public types that consumers will use
export interface MyPluginOptions {
  timeout?: number;
  retries?: number;
}

export interface MyPluginResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

// Internal types
export interface InternalState {
  lastSync: Date;
  errorCount: number;
}
```

### 4. Implement Functionality

Add your plugin's core features:

```typescript
export class MyPlugin implements Plugin {
  // ... lifecycle methods ...

  /**
   * Public API method
   */
  public async performAction(
    input: string,
    options?: MyPluginOptions
  ): Promise<MyPluginResult> {
    if (!this.context) {
      throw new Error('Plugin not activated');
    }

    try {
      // Validate input
      this.validateInput(input);

      // Perform action
      const result = await this.doWork(input, options);

      // Log success
      this.context.logger.info('Action completed', { input });

      return {
        success: true,
        data: result,
      };
    } catch (error) {
      this.context.logger.error('Action failed', error as Error);

      return {
        success: false,
        error: (error as Error).message,
      };
    }
  }

  // Private implementation
  private validateInput(input: string): void {
    if (!input || input.length === 0) {
      throw new Error('Input is required');
    }
  }

  private async doWork(
    input: string,
    options?: MyPluginOptions
  ): Promise<unknown> {
    // Implementation
    return { processed: input };
  }
}
```

### 5. Add Documentation

Create `README.md`:

```markdown
# My Plugin

Brief description of what your plugin does.

## Installation

\`\`\`typescript
import { createMyPlugin } from './.examples/plugins/examples/my-plugin';

const plugin = createMyPlugin();
await pluginManager.registerPlugin(plugin);
\`\`\`

## Configuration

\`\`\`typescript
const config: MyPluginConfig = {
  enabled: true,
  apiKey: 'your-api-key',
};
\`\`\`

## Usage

\`\`\`typescript
const myPlugin = pluginManager.getPlugin('com.yourcompany.myplugin');
const result = await myPlugin.performAction('input');
\`\`\`

## API Reference

### Methods

- `performAction(input, options?)` - Perform the main action
  - Parameters:
    - `input: string` - Input data
    - `options?: MyPluginOptions` - Optional configuration
  - Returns: `Promise<MyPluginResult>`

## Examples

See examples directory for complete examples.
```

## Plugin Structure

### Recommended Organization

```typescript
export class MyPlugin implements Plugin {
  // ========================================
  // Plugin Metadata
  // ========================================
  public readonly metadata: PluginMetadata = { /* ... */ };
  public state: PluginState = PluginState.UNINITIALIZED;

  // ========================================
  // Private State
  // ========================================
  private context?: PluginContext;
  private config?: MyPluginConfig;
  private internalState?: InternalState;
  private timers: NodeJS.Timeout[] = [];
  private subscriptions: (() => void)[] = [];

  // ========================================
  // Lifecycle Methods
  // ========================================
  public async initialize(context: PluginContext): Promise<void> { }
  public async activate(context: PluginContext): Promise<void> { }
  public async deactivate(context: PluginContext): Promise<void> { }
  public async dispose(context: PluginContext): Promise<void> { }

  // ========================================
  // Configuration
  // ========================================
  public getConfigSchema(): PluginConfigSchema { }
  public validateConfig(config: unknown): boolean { }
  public onConfigChange(config: unknown, context: PluginContext): void { }

  // ========================================
  // Public API
  // ========================================
  public async publicMethod(): Promise<void> { }

  // ========================================
  // Event Handlers
  // ========================================
  private handleEvent(): void { }

  // ========================================
  // Private Helpers
  // ========================================
  private helperMethod(): void { }

  // ========================================
  // Cleanup
  // ========================================
  private cleanup(): void {
    // Clear timers
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers = [];

    // Unsubscribe
    this.subscriptions.forEach((unsubscribe) => unsubscribe());
    this.subscriptions = [];
  }
}
```

### State Management Patterns

#### Simple State

```typescript
export class MyPlugin implements Plugin {
  private isProcessing = false;
  private lastResult?: string;

  public async process(): Promise<void> {
    if (this.isProcessing) {
      throw new Error('Already processing');
    }

    this.isProcessing = true;
    try {
      // Work
      this.lastResult = 'success';
    } finally {
      this.isProcessing = false;
    }
  }
}
```

#### Persistent State

```typescript
export class MyPlugin implements Plugin {
  private async saveState(): Promise<void> {
    if (!this.context) return;

    await this.context.storage.set('myplugin:state', {
      lastSync: this.lastSync,
      errorCount: this.errorCount,
    });
  }

  private async loadState(): Promise<void> {
    if (!this.context) return;

    const state = await this.context.storage.get('myplugin:state');
    if (state) {
      this.lastSync = state.lastSync;
      this.errorCount = state.errorCount;
    }
  }
}
```

#### Reactive State

```typescript
export class MyPlugin implements Plugin {
  public subscribe(callback: (state: MyState) => void): () => void {
    if (!this.context) throw new Error('Not activated');

    return this.context.state.subscribe('myplugin:state', callback);
  }

  private updateState(newState: MyState): void {
    if (!this.context) return;

    this.context.state.set('myplugin:state', newState);
  }
}
```

### Event Patterns

#### Emitting Events

```typescript
export class MyPlugin implements Plugin {
  private notifyChange(data: unknown): void {
    if (!this.context) return;

    // Emit scoped event
    this.context.events.emit('myplugin:change', data);

    // Emit global event
    this.context.events.emit('app:data:change', {
      source: this.metadata.id,
      data,
    });
  }
}
```

#### Listening to Events

```typescript
export class MyPlugin implements Plugin {
  public async activate(context: PluginContext): Promise<void> {
    // Listen to specific event
    const sub1 = context.events.on('user:login', (user) => {
      this.handleUserLogin(user);
    });

    // Listen to lifecycle events
    const sub2 = context.events.on('app:foreground', () => {
      this.syncData();
    });

    // Store for cleanup
    this.subscriptions.push(() => sub1.remove());
    this.subscriptions.push(() => sub2.remove());
  }

  private handleUserLogin(user: unknown): void {
    // Handle event
  }
}
```

### Hook Integration

#### Registering Hooks

```typescript
import { HooksRegistry } from '../../hooks/HooksRegistry';

export class MyPlugin implements Plugin {
  private hooksRegistry?: HooksRegistry;

  public async activate(context: PluginContext): Promise<void> {
    // Get hooks registry from plugin manager
    // (Assuming it's available via context or injection)

    // Register before hook
    this.hooksRegistry?.registerHook(
      'data:fetch:before',
      this.metadata.id,
      this.beforeDataFetch.bind(this),
      10 // Priority
    );

    // Register after hook
    this.hooksRegistry?.registerHook(
      'data:fetch:after',
      this.metadata.id,
      this.afterDataFetch.bind(this)
    );
  }

  private async beforeDataFetch(
    url: string,
    options: unknown
  ): Promise<[string, unknown]> {
    // Modify request
    return [url, { ...options, headers: { 'X-Custom': 'value' } }];
  }

  private async afterDataFetch(
    url: string,
    data: unknown
  ): Promise<unknown> {
    // Transform response
    return { ...data, enhanced: true };
  }

  public async deactivate(context: PluginContext): Promise<void> {
    // Unregister all hooks
    this.hooksRegistry?.unregisterAllHooks(this.metadata.id);
  }
}
```

## Testing Plugins

### Unit Tests

Create `__tests__/index.test.ts`:

```typescript
import { MyPlugin } from '../index';
import { PluginContext, PluginState } from '../../../core/types';

// Mock context
const createMockContext = (): PluginContext => ({
  metadata: {} as any,
  config: {} as any,
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  } as any,
  events: {
    on: jest.fn(),
    emit: jest.fn(),
  } as any,
  storage: {
    get: jest.fn(),
    set: jest.fn(),
  } as any,
  api: {} as any,
  state: {} as any,
  lifecycle: {} as any,
  plugins: {} as any,
  theme: {} as any,
  data: new Map(),
});

describe('MyPlugin', () => {
  let plugin: MyPlugin;
  let context: PluginContext;

  beforeEach(() => {
    plugin = new MyPlugin();
    context = createMockContext();
  });

  describe('Lifecycle', () => {
    test('should initialize', async () => {
      await plugin.initialize(context);
      expect(plugin.state).toBe(PluginState.UNINITIALIZED);
      expect(context.logger.info).toHaveBeenCalledWith('Plugin initialized');
    });

    test('should activate', async () => {
      await plugin.initialize(context);
      await plugin.activate(context);
      expect(context.logger.info).toHaveBeenCalledWith('Plugin activated');
    });

    test('should deactivate', async () => {
      await plugin.initialize(context);
      await plugin.activate(context);
      await plugin.deactivate(context);
      expect(context.logger.info).toHaveBeenCalledWith('Plugin deactivated');
    });
  });

  describe('Functionality', () => {
    beforeEach(async () => {
      await plugin.initialize(context);
      await plugin.activate(context);
    });

    test('should perform action', async () => {
      const result = await plugin.performAction('test');
      expect(result.success).toBe(true);
    });

    test('should handle errors', async () => {
      const result = await plugin.performAction('');
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
```

### Integration Tests

```typescript
import { PluginManager } from '../../../core/PluginManager';
import { MyPlugin } from '../index';

describe('MyPlugin Integration', () => {
  let pluginManager: PluginManager;
  let plugin: MyPlugin;

  beforeEach(async () => {
    pluginManager = new PluginManager(/* config */);
    await pluginManager.initialize();

    plugin = new MyPlugin();
    await pluginManager.registerPlugin(plugin);
  });

  afterEach(async () => {
    await pluginManager.shutdown();
  });

  test('should work with plugin manager', async () => {
    const retrieved = pluginManager.getPlugin(plugin.metadata.id);
    expect(retrieved).toBe(plugin);
  });

  test('should invoke methods', async () => {
    const result = await pluginManager.invokePlugin(
      plugin.metadata.id,
      'performAction',
      'test'
    );
    expect(result.success).toBe(true);
  });
});
```

## Publishing Plugins

### 1. Prepare Package

Create `package.json`:

```json
{
  "name": "@yourcompany/mobile-blueprint-plugin-myplugin",
  "version": "1.0.0",
  "description": "My plugin for Mobile App Blueprint",
  "main": "dist/index.js",
  "types": "dist/index.d.ts",
  "files": [
    "dist",
    "README.md"
  ],
  "scripts": {
    "build": "tsc",
    "test": "jest",
    "prepublishOnly": "npm run build && npm test"
  },
  "keywords": [
    "mobile-app-blueprint",
    "plugin",
    "myplugin"
  ],
  "author": "Your Name",
  "license": "MIT",
  "peerDependencies": {
    "@yourcompany/mobile-blueprint": "^1.0.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "jest": "^29.0.0"
  }
}
```

### 2. Build

```bash
npm run build
```

### 3. Test

```bash
npm test
```

### 4. Publish

```bash
npm publish --access public
```

## Troubleshooting

### Common Issues

#### Plugin Not Activating

**Problem**: Plugin registers but doesn't activate.

**Solutions**:
- Check dependencies are satisfied
- Verify configuration is valid
- Check logs for errors
- Ensure `activate()` doesn't throw

#### Memory Leaks

**Problem**: App memory usage grows over time.

**Solutions**:
- Clear timers in `deactivate()`
- Unsubscribe from events
- Release references in `dispose()`
- Check for circular references

#### Type Errors

**Problem**: TypeScript compilation errors.

**Solutions**:
- Ensure types are imported correctly
- Check plugin implements all required methods
- Verify context types match
- Update type definitions

#### Plugin Not Found

**Problem**: `getPlugin()` returns undefined.

**Solutions**:
- Check plugin ID matches exactly
- Verify plugin was registered successfully
- Check plugin state is ACTIVE
- Look for registration errors in logs

### Debugging Tips

#### Enable Debug Logging

```typescript
const pluginManager = new PluginManager({
  debug: true,
  // ...
}, appConfig);
```

#### Monitor Plugin Events

```typescript
pluginManager.on(PluginSystemEvent.PLUGIN_ERROR, (event) => {
  console.error('Plugin error:', event);
});

pluginManager.on(PluginSystemEvent.HOOK_ERROR, (event) => {
  console.error('Hook error:', event);
});
```

#### Check Plugin Health

```typescript
const health = await pluginManager.getPluginHealth('com.example.plugin');
console.log('Plugin health:', health);
```

#### Inspect Plugin State

```typescript
const state = pluginManager.getPluginState('com.example.plugin');
console.log('Plugin state:', state);

const context = pluginManager.getPluginContext('com.example.plugin');
console.log('Plugin context:', context);
```

## Examples

### Example 1: Cache Plugin

Simple cache plugin with TTL:

```typescript
export class CachePlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.example.cache',
    name: 'Cache Plugin',
    version: '1.0.0',
    author: 'Example',
    description: 'Simple in-memory cache with TTL',
    category: PluginCategory.UTILITIES,
  };

  public state: PluginState = PluginState.UNINITIALIZED;

  private context?: PluginContext;
  private cache = new Map<string, CacheEntry>();
  private cleanupTimer?: NodeJS.Timeout;

  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;
  }

  public async activate(context: PluginContext): Promise<void> {
    // Start cleanup timer
    this.cleanupTimer = setInterval(() => {
      this.cleanup();
    }, 60000); // Clean every minute

    context.logger.info('Cache plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = undefined;
    }

    context.logger.info('Cache plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    this.cache.clear();
    this.context = undefined;
  }

  // Public API
  public set(key: string, value: unknown, ttl = 300000): void {
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
    });
  }

  public get<T = unknown>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    if (entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  public has(key: string): boolean {
    return this.get(key) !== undefined;
  }

  public delete(key: string): void {
    this.cache.delete(key);
  }

  public clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < now) {
        this.cache.delete(key);
      }
    }
  }
}

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

export function createCachePlugin(): Plugin {
  return new CachePlugin();
}
```

### Example 2: Logger Plugin

Structured logging plugin:

```typescript
export class LoggerPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.example.logger',
    name: 'Logger Plugin',
    version: '1.0.0',
    author: 'Example',
    description: 'Structured logging with multiple transports',
    category: PluginCategory.DEVELOPMENT,
  };

  public state: PluginState = PluginState.UNINITIALIZED;

  private context?: PluginContext;
  private transports: LogTransport[] = [];

  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;
  }

  public async activate(context: PluginContext): Promise<void> {
    // Add console transport
    this.addTransport(new ConsoleTransport());

    // Add file transport if available
    // this.addTransport(new FileTransport());

    context.logger.info('Logger plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    this.transports = [];
    context.logger.info('Logger plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    this.context = undefined;
  }

  // Public API
  public log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      meta,
    };

    this.transports.forEach((transport) => {
      transport.log(entry);
    });
  }

  public debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }

  public info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  public warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  public error(message: string, error?: Error, meta?: Record<string, unknown>): void {
    this.log('error', message, { ...meta, error: error?.message, stack: error?.stack });
  }

  public addTransport(transport: LogTransport): void {
    this.transports.push(transport);
  }
}

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  meta?: Record<string, unknown>;
}

interface LogTransport {
  log(entry: LogEntry): void;
}

class ConsoleTransport implements LogTransport {
  log(entry: LogEntry): void {
    const message = `[${entry.timestamp.toISOString()}] ${entry.level.toUpperCase()}: ${entry.message}`;
    const meta = entry.meta ? JSON.stringify(entry.meta) : '';

    switch (entry.level) {
      case 'debug':
        console.debug(message, meta);
        break;
      case 'info':
        console.info(message, meta);
        break;
      case 'warn':
        console.warn(message, meta);
        break;
      case 'error':
        console.error(message, meta);
        break;
    }
  }
}

export function createLoggerPlugin(): Plugin {
  return new LoggerPlugin();
}
```

---

**Need Help?**

- Check the [main README](./README.md) for architecture overview
- Review [example plugins](./examples/) for inspiration
- Create an issue on GitHub for questions

**Happy Plugin Development!**

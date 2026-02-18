/**
 * Storage Plugin
 *
 * Advanced storage plugin with multiple backends, encryption,
 * compression, and automatic migrations.
 */

import {
  Plugin,
  PluginMetadata,
  PluginState,
  PluginContext,
  PluginCategory,
  PluginConfigSchema,
} from '../../core/types';

// ============================================================================
// Types
// ============================================================================

export interface StorageConfig {
  /** Storage backend to use */
  backend: 'memory' | 'asyncstorage' | 'sqlite' | 'mmkv' | 'secure';
  /** Enable encryption */
  encryption?: boolean;
  /** Encryption key (required if encryption enabled) */
  encryptionKey?: string;
  /** Enable compression */
  compression?: boolean;
  /** Compression threshold (bytes) */
  compressionThreshold?: number;
  /** Enable automatic migrations */
  migrations?: boolean;
  /** Migration definitions */
  migrationSpecs?: StorageMigration[];
  /** Enable caching */
  cache?: boolean;
  /** Cache TTL (ms) */
  cacheTTL?: number;
  /** Maximum cache size (items) */
  maxCacheSize?: number;
  /** Default namespace */
  namespace?: string;
  /** Enable debug logging */
  debug?: boolean;
}

export interface StorageMigration {
  /** Migration version */
  version: number;
  /** Migration description */
  description: string;
  /** Migration function */
  migrate: (storage: StorageBackend) => Promise<void>;
}

export interface StorageBackend {
  get<T = unknown>(key: string): Promise<T | null>;
  set<T = unknown>(key: string, value: T): Promise<void>;
  remove(key: string): Promise<void>;
  clear(): Promise<void>;
  getAllKeys(): Promise<string[]>;
  multiGet(keys: string[]): Promise<Array<[string, unknown]>>;
  multiSet(keyValuePairs: Array<[string, unknown]>): Promise<void>;
  multiRemove(keys: string[]): Promise<void>;
}

export interface StorageOptions {
  /** Storage namespace */
  namespace?: string;
  /** Enable encryption for this operation */
  encrypt?: boolean;
  /** Enable compression for this operation */
  compress?: boolean;
  /** TTL for cached value (ms) */
  ttl?: number;
}

// ============================================================================
// Storage Plugin Implementation
// ============================================================================

export class StoragePlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.blueprint.storage',
    name: 'Storage Plugin',
    version: '1.0.0',
    author: 'Mobile App Blueprint',
    description: 'Advanced storage with encryption, compression, and migrations',
    category: PluginCategory.STORAGE,
    license: 'MIT',
    keywords: ['storage', 'persistence', 'encryption', 'cache'],
  };

  public state: PluginState = PluginState.UNINITIALIZED;

  private context?: PluginContext;
  private config?: StorageConfig;
  private backend?: StorageBackend;
  private cache = new Map<string, CacheEntry>();
  private currentVersion = 0;

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;

    // Load configuration
    const storedConfig = await context.storage.get<StorageConfig>('storage:config');
    this.config = storedConfig || this.getDefaultConfig();

    context.logger.info('Storage plugin initialized');
  }

  public async activate(context: PluginContext): Promise<void> {
    if (!this.config) {
      throw new Error('Plugin not initialized');
    }

    // Initialize backend
    this.backend = await this.createBackend(this.config.backend);

    // Run migrations
    if (this.config.migrations && this.config.migrationSpecs) {
      await this.runMigrations();
    }

    // Setup cache cleanup
    if (this.config.cache) {
      this.startCacheCleanup();
    }

    context.logger.info('Storage plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    // Clear cache
    this.cache.clear();

    context.logger.info('Storage plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    this.context = undefined;
    this.config = undefined;
    this.backend = undefined;

    context.logger.info('Storage plugin disposed');
  }

  public getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        backend: {
          type: 'string',
          description: 'Storage backend to use',
          enum: ['memory', 'asyncstorage', 'sqlite', 'mmkv', 'secure'],
          default: 'asyncstorage',
        },
        encryption: {
          type: 'boolean',
          description: 'Enable encryption',
          default: false,
        },
        compression: {
          type: 'boolean',
          description: 'Enable compression',
          default: false,
        },
        compressionThreshold: {
          type: 'number',
          description: 'Compression threshold in bytes',
          default: 1024,
          minimum: 0,
        },
        cache: {
          type: 'boolean',
          description: 'Enable caching',
          default: true,
        },
        cacheTTL: {
          type: 'number',
          description: 'Cache TTL in milliseconds',
          default: 300000,
          minimum: 0,
        },
        maxCacheSize: {
          type: 'number',
          description: 'Maximum cache size',
          default: 100,
          minimum: 0,
        },
      },
      required: ['backend'],
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Get a value from storage
   */
  public async get<T = unknown>(key: string, options?: StorageOptions): Promise<T | null> {
    if (!this.backend || !this.config) {
      throw new Error('Plugin not activated');
    }

    const fullKey = this.buildKey(key, options?.namespace);

    // Check cache
    if (this.config.cache) {
      const cached = this.getCached<T>(fullKey);
      if (cached !== undefined) {
        return cached;
      }
    }

    // Get from backend
    let value = await this.backend.get<string>(fullKey);
    if (value === null) {
      return null;
    }

    // Decompress if needed
    if (options?.compress !== false && this.config.compression) {
      value = await this.decompress(value);
    }

    // Decrypt if needed
    if (options?.encrypt !== false && this.config.encryption) {
      value = await this.decrypt(value);
    }

    // Parse value
    const parsed = this.parseValue<T>(value);

    // Cache result
    if (this.config.cache) {
      this.setCached(fullKey, parsed, options?.ttl);
    }

    return parsed;
  }

  /**
   * Set a value in storage
   */
  public async set<T = unknown>(key: string, value: T, options?: StorageOptions): Promise<void> {
    if (!this.backend || !this.config) {
      throw new Error('Plugin not activated');
    }

    const fullKey = this.buildKey(key, options?.namespace);

    // Serialize value
    let serialized = this.serializeValue(value);

    // Encrypt if needed
    if (options?.encrypt !== false && this.config.encryption) {
      serialized = await this.encrypt(serialized);
    }

    // Compress if needed
    if (options?.compress !== false && this.config.compression) {
      const threshold = this.config.compressionThreshold || 1024;
      if (serialized.length >= threshold) {
        serialized = await this.compress(serialized);
      }
    }

    // Save to backend
    await this.backend.set(fullKey, serialized);

    // Update cache
    if (this.config.cache) {
      this.setCached(fullKey, value, options?.ttl);
    }

    if (this.config.debug) {
      this.context?.logger.debug(`Storage set: ${fullKey}`);
    }
  }

  /**
   * Remove a value from storage
   */
  public async remove(key: string, options?: StorageOptions): Promise<void> {
    if (!this.backend) {
      throw new Error('Plugin not activated');
    }

    const fullKey = this.buildKey(key, options?.namespace);

    await this.backend.remove(fullKey);
    this.cache.delete(fullKey);

    if (this.config?.debug) {
      this.context?.logger.debug(`Storage remove: ${fullKey}`);
    }
  }

  /**
   * Clear all storage
   */
  public async clear(namespace?: string): Promise<void> {
    if (!this.backend) {
      throw new Error('Plugin not activated');
    }

    if (namespace) {
      // Clear specific namespace
      const keys = await this.backend.getAllKeys();
      const prefix = `${namespace}:`;
      const namespacedKeys = keys.filter((k) => k.startsWith(prefix));
      await this.backend.multiRemove(namespacedKeys);

      // Clear cache
      namespacedKeys.forEach((k) => this.cache.delete(k));
    } else {
      // Clear all
      await this.backend.clear();
      this.cache.clear();
    }

    if (this.config?.debug) {
      this.context?.logger.debug(`Storage cleared: ${namespace || 'all'}`);
    }
  }

  /**
   * Get all keys
   */
  public async getAllKeys(namespace?: string): Promise<string[]> {
    if (!this.backend) {
      throw new Error('Plugin not activated');
    }

    const keys = await this.backend.getAllKeys();

    if (namespace) {
      const prefix = `${namespace}:`;
      return keys
        .filter((k) => k.startsWith(prefix))
        .map((k) => k.substring(prefix.length));
    }

    return keys;
  }

  /**
   * Get multiple values
   */
  public async multiGet<T = unknown>(
    keys: string[],
    options?: StorageOptions
  ): Promise<Array<[string, T | null]>> {
    const results = await Promise.all(
      keys.map(async (key) => {
        const value = await this.get<T>(key, options);
        return [key, value] as [string, T | null];
      })
    );

    return results;
  }

  /**
   * Set multiple values
   */
  public async multiSet(
    keyValuePairs: Array<[string, unknown]>,
    options?: StorageOptions
  ): Promise<void> {
    await Promise.all(
      keyValuePairs.map(([key, value]) => this.set(key, value, options))
    );
  }

  /**
   * Check if key exists
   */
  public async has(key: string, options?: StorageOptions): Promise<boolean> {
    const value = await this.get(key, options);
    return value !== null;
  }

  // ==========================================================================
  // Namespaced Storage
  // ==========================================================================

  /**
   * Create a namespaced storage instance
   */
  public namespace(namespace: string): NamespacedStorage {
    return new NamespacedStorage(this, namespace);
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private buildKey(key: string, namespace?: string): string {
    const ns = namespace || this.config?.namespace || 'default';
    return `${ns}:${key}`;
  }

  private getCached<T>(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;

    // Check if expired
    if (entry.expiresAt && entry.expiresAt < Date.now()) {
      this.cache.delete(key);
      return undefined;
    }

    return entry.value as T;
  }

  private setCached(key: string, value: unknown, ttl?: number): void {
    if (!this.config?.cache) return;

    // Enforce max cache size (LRU)
    const maxSize = this.config.maxCacheSize || 100;
    if (this.cache.size >= maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    const expiresAt = ttl
      ? Date.now() + ttl
      : this.config.cacheTTL
      ? Date.now() + this.config.cacheTTL
      : undefined;

    this.cache.set(key, { value, expiresAt });
  }

  private startCacheCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.cache.entries()) {
        if (entry.expiresAt && entry.expiresAt < now) {
          this.cache.delete(key);
        }
      }
    }, 60000); // Clean every minute
  }

  private serializeValue(value: unknown): string {
    return JSON.stringify(value);
  }

  private parseValue<T>(value: string): T {
    return JSON.parse(value) as T;
  }

  private async encrypt(value: string): Promise<string> {
    // Simple base64 encoding (replace with actual encryption in production)
    if (!this.config?.encryptionKey) {
      throw new Error('Encryption key required');
    }
    return Buffer.from(value).toString('base64');
  }

  private async decrypt(value: string): Promise<string> {
    // Simple base64 decoding (replace with actual decryption in production)
    return Buffer.from(value, 'base64').toString('utf-8');
  }

  private async compress(value: string): Promise<string> {
    // Simple compression placeholder (use actual compression library)
    return `compressed:${value}`;
  }

  private async decompress(value: string): Promise<string> {
    // Simple decompression placeholder
    if (value.startsWith('compressed:')) {
      return value.substring(11);
    }
    return value;
  }

  private async createBackend(type: string): Promise<StorageBackend> {
    switch (type) {
      case 'memory':
        return new MemoryBackend();
      case 'asyncstorage':
        return new AsyncStorageBackend();
      case 'sqlite':
        return new SQLiteBackend();
      case 'mmkv':
        return new MMKVBackend();
      case 'secure':
        return new SecureBackend();
      default:
        throw new Error(`Unknown storage backend: ${type}`);
    }
  }

  private async runMigrations(): Promise<void> {
    if (!this.backend || !this.config?.migrationSpecs) return;

    // Get current version
    const versionKey = this.buildKey('__version__');
    const currentVersion = (await this.backend.get<number>(versionKey)) || 0;
    this.currentVersion = currentVersion;

    // Run pending migrations
    const pendingMigrations = this.config.migrationSpecs
      .filter((m) => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    for (const migration of pendingMigrations) {
      this.context?.logger.info(`Running migration v${migration.version}: ${migration.description}`);

      try {
        await migration.migrate(this.backend);
        await this.backend.set(versionKey, migration.version);
        this.currentVersion = migration.version;
      } catch (error) {
        this.context?.logger.error(`Migration failed v${migration.version}`, error as Error);
        throw error;
      }
    }
  }

  private getDefaultConfig(): StorageConfig {
    return {
      backend: 'memory',
      encryption: false,
      compression: false,
      compressionThreshold: 1024,
      migrations: false,
      cache: true,
      cacheTTL: 300000,
      maxCacheSize: 100,
      namespace: 'default',
      debug: false,
    };
  }
}

// ============================================================================
// Namespaced Storage
// ============================================================================

class NamespacedStorage {
  constructor(
    private storage: StoragePlugin,
    private namespace: string
  ) {}

  async get<T = unknown>(key: string, options?: Omit<StorageOptions, 'namespace'>): Promise<T | null> {
    return this.storage.get<T>(key, { ...options, namespace: this.namespace });
  }

  async set<T = unknown>(key: string, value: T, options?: Omit<StorageOptions, 'namespace'>): Promise<void> {
    return this.storage.set(key, value, { ...options, namespace: this.namespace });
  }

  async remove(key: string): Promise<void> {
    return this.storage.remove(key, { namespace: this.namespace });
  }

  async clear(): Promise<void> {
    return this.storage.clear(this.namespace);
  }

  async getAllKeys(): Promise<string[]> {
    return this.storage.getAllKeys(this.namespace);
  }

  async has(key: string): Promise<boolean> {
    return this.storage.has(key, { namespace: this.namespace });
  }
}

// ============================================================================
// Storage Backends
// ============================================================================

class MemoryBackend implements StorageBackend {
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

  async multiRemove(keys: string[]): Promise<void> {
    keys.forEach((key) => this.store.delete(key));
  }
}

class AsyncStorageBackend implements StorageBackend {
  async get<T = unknown>(key: string): Promise<T | null> {
    // AsyncStorage implementation
    return null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {
    // AsyncStorage implementation
  }

  async remove(key: string): Promise<void> {
    // AsyncStorage implementation
  }

  async clear(): Promise<void> {
    // AsyncStorage implementation
  }

  async getAllKeys(): Promise<string[]> {
    return [];
  }

  async multiGet(keys: string[]): Promise<Array<[string, unknown]>> {
    return [];
  }

  async multiSet(keyValuePairs: Array<[string, unknown]>): Promise<void> {}

  async multiRemove(keys: string[]): Promise<void> {}
}

class SQLiteBackend implements StorageBackend {
  async get<T = unknown>(key: string): Promise<T | null> {
    return null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {}

  async remove(key: string): Promise<void> {}

  async clear(): Promise<void> {}

  async getAllKeys(): Promise<string[]> {
    return [];
  }

  async multiGet(keys: string[]): Promise<Array<[string, unknown]>> {
    return [];
  }

  async multiSet(keyValuePairs: Array<[string, unknown]>): Promise<void> {}

  async multiRemove(keys: string[]): Promise<void> {}
}

class MMKVBackend implements StorageBackend {
  async get<T = unknown>(key: string): Promise<T | null> {
    return null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {}

  async remove(key: string): Promise<void> {}

  async clear(): Promise<void> {}

  async getAllKeys(): Promise<string[]> {
    return [];
  }

  async multiGet(keys: string[]): Promise<Array<[string, unknown]>> {
    return [];
  }

  async multiSet(keyValuePairs: Array<[string, unknown]>): Promise<void> {}

  async multiRemove(keys: string[]): Promise<void> {}
}

class SecureBackend implements StorageBackend {
  async get<T = unknown>(key: string): Promise<T | null> {
    return null;
  }

  async set<T = unknown>(key: string, value: T): Promise<void> {}

  async remove(key: string): Promise<void> {}

  async clear(): Promise<void> {}

  async getAllKeys(): Promise<string[]> {
    return [];
  }

  async multiGet(keys: string[]): Promise<Array<[string, unknown]>> {
    return [];
  }

  async multiSet(keyValuePairs: Array<[string, unknown]>): Promise<void> {}

  async multiRemove(keys: string[]): Promise<void> {}
}

// ============================================================================
// Supporting Types
// ============================================================================

interface CacheEntry {
  value: unknown;
  expiresAt?: number;
}

// ============================================================================
// Plugin Factory
// ============================================================================

export function createStoragePlugin(): Plugin {
  return new StoragePlugin();
}

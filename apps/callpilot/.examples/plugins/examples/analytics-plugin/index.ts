/**
 * Analytics Plugin
 *
 * Comprehensive analytics plugin that supports multiple providers,
 * event tracking, user identification, and custom properties.
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

export interface AnalyticsConfig {
  /** Analytics providers to enable */
  providers: AnalyticsProvider[];
  /** Enable debug logging */
  debug?: boolean;
  /** Track screen views automatically */
  autoTrackScreens?: boolean;
  /** Track app lifecycle events */
  autoTrackLifecycle?: boolean;
  /** Batch events before sending */
  enableBatching?: boolean;
  /** Batch size (events) */
  batchSize?: number;
  /** Batch interval (ms) */
  batchInterval?: number;
  /** Enable offline queue */
  offlineQueue?: boolean;
  /** Maximum offline queue size */
  maxOfflineEvents?: number;
  /** User properties to track */
  defaultProperties?: Record<string, unknown>;
  /** Events to exclude from tracking */
  excludeEvents?: string[];
}

export interface AnalyticsProvider {
  /** Provider name */
  name: string;
  /** Provider type */
  type: 'segment' | 'mixpanel' | 'amplitude' | 'firebase' | 'custom';
  /** API key or credentials */
  apiKey: string;
  /** Additional configuration */
  config?: Record<string, unknown>;
  /** Enable/disable provider */
  enabled?: boolean;
}

export interface AnalyticsEvent {
  /** Event name */
  name: string;
  /** Event properties */
  properties?: Record<string, unknown>;
  /** Event timestamp */
  timestamp?: Date;
  /** Event category */
  category?: string;
  /** User ID associated with event */
  userId?: string;
}

export interface AnalyticsUser {
  /** User ID */
  id: string;
  /** User properties */
  properties?: Record<string, unknown>;
  /** User traits */
  traits?: Record<string, unknown>;
}

// ============================================================================
// Analytics Plugin Implementation
// ============================================================================

export class AnalyticsPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.blueprint.analytics',
    name: 'Analytics Plugin',
    version: '1.0.0',
    author: 'Mobile App Blueprint',
    description: 'Multi-provider analytics tracking with offline support',
    category: PluginCategory.ANALYTICS,
    license: 'MIT',
    keywords: ['analytics', 'tracking', 'events', 'metrics'],
  };

  public state: PluginState = PluginState.UNINITIALIZED;

  private context?: PluginContext;
  private config?: AnalyticsConfig;
  private providers = new Map<string, ProviderAdapter>();
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimer?: NodeJS.Timeout;
  private currentUser?: AnalyticsUser;
  private isOnline = true;

  // ==========================================================================
  // Lifecycle Methods
  // ==========================================================================

  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;

    // Load configuration
    const storedConfig = await context.storage.get<AnalyticsConfig>('analytics:config');
    this.config = storedConfig || this.getDefaultConfig();

    context.logger.info('Analytics plugin initialized');

    // Load offline queue
    if (this.config.offlineQueue) {
      await this.loadOfflineQueue();
    }
  }

  public async activate(context: PluginContext): Promise<void> {
    if (!this.config) {
      throw new Error('Plugin not initialized');
    }

    // Initialize providers
    for (const provider of this.config.providers) {
      if (provider.enabled !== false) {
        await this.initializeProvider(provider);
      }
    }

    // Setup batching
    if (this.config.enableBatching) {
      this.startBatching();
    }

    // Setup lifecycle tracking
    if (this.config.autoTrackLifecycle) {
      this.setupLifecycleTracking();
    }

    // Setup navigation tracking
    if (this.config.autoTrackScreens && context.navigation) {
      this.setupNavigationTracking(context.navigation);
    }

    // Listen for network changes
    context.events.on('network:change', (isOnline: boolean) => {
      this.isOnline = isOnline;
      if (isOnline) {
        this.flushOfflineQueue();
      }
    });

    context.logger.info('Analytics plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    // Flush any pending events
    await this.flush();

    // Stop batching
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
      this.batchTimer = undefined;
    }

    // Shutdown providers
    for (const [name, provider] of this.providers) {
      try {
        await provider.shutdown?.();
        context.logger.debug(`Provider shutdown: ${name}`);
      } catch (error) {
        context.logger.error(`Provider shutdown error: ${name}`, error as Error);
      }
    }

    this.providers.clear();
    context.logger.info('Analytics plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    // Save offline queue
    if (this.config?.offlineQueue) {
      await this.saveOfflineQueue();
    }

    // Clear state
    this.context = undefined;
    this.config = undefined;
    this.eventQueue = [];
    this.currentUser = undefined;

    context.logger.info('Analytics plugin disposed');
  }

  public getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        providers: {
          type: 'array',
          description: 'Analytics providers to enable',
        },
        debug: {
          type: 'boolean',
          description: 'Enable debug logging',
          default: false,
        },
        autoTrackScreens: {
          type: 'boolean',
          description: 'Automatically track screen views',
          default: true,
        },
        autoTrackLifecycle: {
          type: 'boolean',
          description: 'Track app lifecycle events',
          default: true,
        },
        enableBatching: {
          type: 'boolean',
          description: 'Batch events before sending',
          default: true,
        },
        batchSize: {
          type: 'number',
          description: 'Number of events per batch',
          default: 20,
          minimum: 1,
          maximum: 100,
        },
        batchInterval: {
          type: 'number',
          description: 'Batch interval in milliseconds',
          default: 5000,
          minimum: 1000,
        },
        offlineQueue: {
          type: 'boolean',
          description: 'Enable offline event queue',
          default: true,
        },
        maxOfflineEvents: {
          type: 'number',
          description: 'Maximum number of offline events to queue',
          default: 1000,
          minimum: 0,
        },
      },
      required: ['providers'],
    };
  }

  // ==========================================================================
  // Public API
  // ==========================================================================

  /**
   * Track an event
   */
  public async track(name: string, properties?: Record<string, unknown>): Promise<void> {
    if (!this.context || !this.config) {
      throw new Error('Plugin not initialized');
    }

    // Check if event is excluded
    if (this.config.excludeEvents?.includes(name)) {
      return;
    }

    const event: AnalyticsEvent = {
      name,
      properties: {
        ...this.config.defaultProperties,
        ...properties,
      },
      timestamp: new Date(),
      userId: this.currentUser?.id,
    };

    if (this.config.debug) {
      this.context.logger.debug(`Track event: ${name}`, event.properties);
    }

    if (this.config.enableBatching) {
      this.eventQueue.push(event);

      if (this.eventQueue.length >= (this.config.batchSize || 20)) {
        await this.flush();
      }
    } else {
      await this.sendEvent(event);
    }
  }

  /**
   * Track a screen view
   */
  public async screen(name: string, properties?: Record<string, unknown>): Promise<void> {
    await this.track('Screen Viewed', {
      screen_name: name,
      ...properties,
    });
  }

  /**
   * Identify a user
   */
  public async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }

    this.currentUser = {
      id: userId,
      traits,
    };

    for (const [name, provider] of this.providers) {
      try {
        await provider.identify?.(userId, traits);
        this.context.logger.debug(`User identified: ${userId} (${name})`);
      } catch (error) {
        this.context.logger.error(`Identify error (${name})`, error as Error);
      }
    }
  }

  /**
   * Set user properties
   */
  public async setUserProperties(properties: Record<string, unknown>): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }

    if (this.currentUser) {
      this.currentUser.properties = {
        ...this.currentUser.properties,
        ...properties,
      };
    }

    for (const [name, provider] of this.providers) {
      try {
        await provider.setUserProperties?.(properties);
        this.context.logger.debug(`User properties set (${name})`);
      } catch (error) {
        this.context.logger.error(`Set user properties error (${name})`, error as Error);
      }
    }
  }

  /**
   * Reset analytics (on logout)
   */
  public async reset(): Promise<void> {
    if (!this.context) {
      throw new Error('Plugin not initialized');
    }

    this.currentUser = undefined;

    for (const [name, provider] of this.providers) {
      try {
        await provider.reset?.();
        this.context.logger.debug(`Analytics reset (${name})`);
      } catch (error) {
        this.context.logger.error(`Reset error (${name})`, error as Error);
      }
    }
  }

  /**
   * Flush pending events
   */
  public async flush(): Promise<void> {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = [...this.eventQueue];
    this.eventQueue = [];

    for (const event of events) {
      await this.sendEvent(event);
    }
  }

  // ==========================================================================
  // Private Methods
  // ==========================================================================

  private async initializeProvider(config: AnalyticsProvider): Promise<void> {
    if (!this.context) return;

    let adapter: ProviderAdapter;

    switch (config.type) {
      case 'segment':
        adapter = new SegmentAdapter(config);
        break;
      case 'mixpanel':
        adapter = new MixpanelAdapter(config);
        break;
      case 'amplitude':
        adapter = new AmplitudeAdapter(config);
        break;
      case 'firebase':
        adapter = new FirebaseAdapter(config);
        break;
      default:
        this.context.logger.warn(`Unknown provider type: ${config.type}`);
        return;
    }

    await adapter.initialize?.();
    this.providers.set(config.name, adapter);
    this.context.logger.info(`Provider initialized: ${config.name}`);
  }

  private async sendEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.context) return;

    // Queue offline events
    if (!this.isOnline && this.config?.offlineQueue) {
      await this.queueOfflineEvent(event);
      return;
    }

    for (const [name, provider] of this.providers) {
      try {
        await provider.track(event);
      } catch (error) {
        this.context.logger.error(`Track error (${name})`, error as Error);

        // Queue for retry if offline
        if (this.config?.offlineQueue) {
          await this.queueOfflineEvent(event);
        }
      }
    }
  }

  private startBatching(): void {
    if (!this.config) return;

    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush();
      }
    }, this.config.batchInterval || 5000);
  }

  private setupLifecycleTracking(): void {
    if (!this.context) return;

    this.context.events.on('app:start', () => {
      this.track('App Opened');
    });

    this.context.events.on('app:background', () => {
      this.track('App Backgrounded');
    });

    this.context.events.on('app:foreground', () => {
      this.track('App Foregrounded');
    });
  }

  private setupNavigationTracking(navigation: any): void {
    navigation.subscribe((route: string) => {
      this.screen(route);
    });
  }

  private async queueOfflineEvent(event: AnalyticsEvent): Promise<void> {
    if (!this.context || !this.config) return;

    const queue = await this.context.storage.get<AnalyticsEvent[]>('analytics:offline') || [];

    queue.push(event);

    // Limit queue size
    const maxEvents = this.config.maxOfflineEvents || 1000;
    if (queue.length > maxEvents) {
      queue.splice(0, queue.length - maxEvents);
    }

    await this.context.storage.set('analytics:offline', queue);
  }

  private async loadOfflineQueue(): Promise<void> {
    if (!this.context) return;

    const queue = await this.context.storage.get<AnalyticsEvent[]>('analytics:offline');
    if (queue && queue.length > 0) {
      this.context.logger.info(`Loaded ${queue.length} offline events`);
    }
  }

  private async saveOfflineQueue(): Promise<void> {
    if (!this.context) return;

    await this.context.storage.set('analytics:offline', this.eventQueue);
  }

  private async flushOfflineQueue(): Promise<void> {
    if (!this.context) return;

    const queue = await this.context.storage.get<AnalyticsEvent[]>('analytics:offline');
    if (!queue || queue.length === 0) return;

    this.context.logger.info(`Flushing ${queue.length} offline events`);

    for (const event of queue) {
      await this.sendEvent(event);
    }

    await this.context.storage.remove('analytics:offline');
  }

  private getDefaultConfig(): AnalyticsConfig {
    return {
      providers: [],
      debug: false,
      autoTrackScreens: true,
      autoTrackLifecycle: true,
      enableBatching: true,
      batchSize: 20,
      batchInterval: 5000,
      offlineQueue: true,
      maxOfflineEvents: 1000,
    };
  }
}

// ============================================================================
// Provider Adapters
// ============================================================================

interface ProviderAdapter {
  initialize?(): Promise<void>;
  track(event: AnalyticsEvent): Promise<void>;
  identify?(userId: string, traits?: Record<string, unknown>): Promise<void>;
  setUserProperties?(properties: Record<string, unknown>): Promise<void>;
  reset?(): Promise<void>;
  shutdown?(): Promise<void>;
}

class SegmentAdapter implements ProviderAdapter {
  constructor(private config: AnalyticsProvider) {}

  async track(event: AnalyticsEvent): Promise<void> {
    // Segment implementation
    console.log('[Segment] Track:', event.name, event.properties);
  }

  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    console.log('[Segment] Identify:', userId, traits);
  }

  async reset(): Promise<void> {
    console.log('[Segment] Reset');
  }
}

class MixpanelAdapter implements ProviderAdapter {
  async track(event: AnalyticsEvent): Promise<void> {
    console.log('[Mixpanel] Track:', event.name, event.properties);
  }

  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    console.log('[Mixpanel] Identify:', userId, traits);
  }
}

class AmplitudeAdapter implements ProviderAdapter {
  async track(event: AnalyticsEvent): Promise<void> {
    console.log('[Amplitude] Track:', event.name, event.properties);
  }

  async identify(userId: string, traits?: Record<string, unknown>): Promise<void> {
    console.log('[Amplitude] Identify:', userId, traits);
  }
}

class FirebaseAdapter implements ProviderAdapter {
  async track(event: AnalyticsEvent): Promise<void> {
    console.log('[Firebase] Track:', event.name, event.properties);
  }

  async setUserProperties(properties: Record<string, unknown>): Promise<void> {
    console.log('[Firebase] Set User Properties:', properties);
  }
}

// ============================================================================
// Plugin Factory
// ============================================================================

export function createAnalyticsPlugin(): Plugin {
  return new AnalyticsPlugin();
}

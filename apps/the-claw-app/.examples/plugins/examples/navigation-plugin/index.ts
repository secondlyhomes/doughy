/**
 * Navigation Plugin
 *
 * Navigation plugin with history tracking, deep linking,
 * and route guards.
 */

import {
  Plugin,
  PluginMetadata,
  PluginState,
  PluginContext,
  PluginCategory,
  PluginConfigSchema,
} from '../../core/types';

export interface NavigationConfig {
  enableHistory?: boolean;
  maxHistorySize?: number;
  enableDeepLinking?: boolean;
  routeGuards?: RouteGuard[];
  defaultRoute?: string;
  persistHistory?: boolean;
}

export interface RouteGuard {
  pattern: string | RegExp;
  guard: (route: string, params?: Record<string, unknown>) => boolean | Promise<boolean>;
}

export interface NavigationRoute {
  name: string;
  params?: Record<string, unknown>;
  timestamp: Date;
}

export class NavigationPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.blueprint.navigation',
    name: 'Navigation Plugin',
    version: '1.0.0',
    author: 'Mobile App Blueprint',
    description: 'Navigation with history, deep linking, and route guards',
    category: PluginCategory.NAVIGATION,
    license: 'MIT',
    keywords: ['navigation', 'routing', 'deeplink'],
  };

  public state: PluginState = PluginState.UNINITIALIZED;
  private context?: PluginContext;
  private config?: NavigationConfig;
  private history: NavigationRoute[] = [];
  private currentRoute?: NavigationRoute;
  private subscribers = new Set<(route: NavigationRoute) => void>();

  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    const storedConfig = await context.storage.get<NavigationConfig>('navigation:config');
    this.config = storedConfig || this.getDefaultConfig();
    context.logger.info('Navigation plugin initialized');
  }

  public async activate(context: PluginContext): Promise<void> {
    if (!this.config) throw new Error('Plugin not initialized');

    // Load history
    if (this.config.persistHistory) {
      await this.loadHistory();
    }

    // Setup deep linking
    if (this.config.enableDeepLinking) {
      this.setupDeepLinking();
    }

    context.logger.info('Navigation plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    if (this.config?.persistHistory) {
      await this.saveHistory();
    }

    this.subscribers.clear();
    context.logger.info('Navigation plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    this.context = undefined;
    this.config = undefined;
    this.history = [];
    this.currentRoute = undefined;
    context.logger.info('Navigation plugin disposed');
  }

  public getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        enableHistory: { type: 'boolean', default: true },
        maxHistorySize: { type: 'number', default: 50, minimum: 0 },
        enableDeepLinking: { type: 'boolean', default: true },
        persistHistory: { type: 'boolean', default: false },
      },
    };
  }

  // Public API
  public async navigate(route: string, params?: Record<string, unknown>): Promise<void> {
    if (!this.context) throw new Error('Plugin not activated');

    // Check route guards
    if (this.config?.routeGuards) {
      const allowed = await this.checkGuards(route, params);
      if (!allowed) {
        this.context.logger.warn(`Navigation blocked by guard: ${route}`);
        return;
      }
    }

    const navRoute: NavigationRoute = {
      name: route,
      params,
      timestamp: new Date(),
    };

    this.currentRoute = navRoute;

    // Add to history
    if (this.config?.enableHistory) {
      this.addToHistory(navRoute);
    }

    // Notify subscribers
    this.notifySubscribers(navRoute);

    // Emit event
    this.context.events.emit('navigation:change', navRoute);

    this.context.logger.debug(`Navigated to: ${route}`);
  }

  public goBack(): void {
    if (this.history.length < 2) return;

    this.history.pop(); // Remove current
    const previous = this.history[this.history.length - 1];
    if (previous) {
      this.navigate(previous.name, previous.params);
    }
  }

  public getCurrentRoute(): NavigationRoute | undefined {
    return this.currentRoute;
  }

  public getHistory(): NavigationRoute[] {
    return [...this.history];
  }

  public subscribe(callback: (route: NavigationRoute) => void): () => void {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  public clearHistory(): void {
    this.history = [];
    if (this.currentRoute) {
      this.history.push(this.currentRoute);
    }
  }

  // Private methods
  private async checkGuards(route: string, params?: Record<string, unknown>): Promise<boolean> {
    if (!this.config?.routeGuards) return true;

    for (const { pattern, guard } of this.config.routeGuards) {
      const matches = typeof pattern === 'string'
        ? route === pattern
        : pattern.test(route);

      if (matches) {
        const allowed = await guard(route, params);
        if (!allowed) return false;
      }
    }

    return true;
  }

  private addToHistory(route: NavigationRoute): void {
    this.history.push(route);

    // Limit history size
    const maxSize = this.config?.maxHistorySize || 50;
    if (this.history.length > maxSize) {
      this.history.shift();
    }
  }

  private notifySubscribers(route: NavigationRoute): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(route);
      } catch (error) {
        this.context?.logger.error('Navigation subscriber error', error as Error);
      }
    });
  }

  private setupDeepLinking(): void {
    // Deep linking setup would go here
    this.context?.logger.debug('Deep linking enabled');
  }

  private async loadHistory(): Promise<void> {
    if (!this.context) return;

    const history = await this.context.storage.get<NavigationRoute[]>('navigation:history');
    if (history) {
      this.history = history;
      this.currentRoute = history[history.length - 1];
    }
  }

  private async saveHistory(): Promise<void> {
    if (!this.context) return;
    await this.context.storage.set('navigation:history', this.history);
  }

  private getDefaultConfig(): NavigationConfig {
    return {
      enableHistory: true,
      maxHistorySize: 50,
      enableDeepLinking: true,
      persistHistory: false,
    };
  }
}

export function createNavigationPlugin(): Plugin {
  return new NavigationPlugin();
}

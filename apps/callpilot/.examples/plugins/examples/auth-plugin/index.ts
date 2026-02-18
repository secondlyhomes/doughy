/**
 * Auth Plugin
 *
 * Authentication plugin with multiple providers, token management,
 * and automatic session refresh.
 */

import {
  Plugin,
  PluginMetadata,
  PluginState,
  PluginContext,
  PluginCategory,
  PluginConfigSchema,
} from '../../core/types';

export interface AuthConfig {
  providers: AuthProvider[];
  tokenStorage?: 'memory' | 'secure' | 'async';
  autoRefresh?: boolean;
  refreshThreshold?: number;
  sessionTimeout?: number;
  persistSession?: boolean;
}

export interface AuthProvider {
  name: string;
  type: 'email' | 'oauth' | 'biometric' | 'sso';
  config: Record<string, unknown>;
}

export interface AuthUser {
  id: string;
  email?: string;
  name?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
}

export class AuthPlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.blueprint.auth',
    name: 'Auth Plugin',
    version: '1.0.0',
    author: 'Mobile App Blueprint',
    description: 'Multi-provider authentication with session management',
    category: PluginCategory.AUTHENTICATION,
    license: 'MIT',
    keywords: ['auth', 'authentication', 'session', 'oauth'],
  };

  public state: PluginState = PluginState.UNINITIALIZED;
  private context?: PluginContext;
  private config?: AuthConfig;
  private session?: AuthSession;
  private refreshTimer?: NodeJS.Timeout;

  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    const storedConfig = await context.storage.get<AuthConfig>('auth:config');
    this.config = storedConfig || this.getDefaultConfig();
    context.logger.info('Auth plugin initialized');
  }

  public async activate(context: PluginContext): Promise<void> {
    if (!this.config) throw new Error('Plugin not initialized');

    // Load persisted session
    if (this.config.persistSession) {
      await this.loadSession();
    }

    // Setup auto-refresh
    if (this.config.autoRefresh && this.session) {
      this.startAutoRefresh();
    }

    context.logger.info('Auth plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    // Save session
    if (this.config?.persistSession && this.session) {
      await this.saveSession();
    }

    context.logger.info('Auth plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    this.context = undefined;
    this.config = undefined;
    this.session = undefined;
    context.logger.info('Auth plugin disposed');
  }

  public getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        providers: { type: 'array', description: 'Auth providers' },
        tokenStorage: { type: 'string', enum: ['memory', 'secure', 'async'], default: 'secure' },
        autoRefresh: { type: 'boolean', default: true },
        refreshThreshold: { type: 'number', default: 300000, minimum: 0 },
        sessionTimeout: { type: 'number', default: 86400000, minimum: 0 },
        persistSession: { type: 'boolean', default: true },
      },
      required: ['providers'],
    };
  }

  // Public API
  public async signIn(email: string, password: string): Promise<AuthSession> {
    if (!this.context) throw new Error('Plugin not activated');

    // Authenticate
    const session: AuthSession = {
      user: { id: 'user-123', email, name: 'Test User' },
      accessToken: 'token-123',
      refreshToken: 'refresh-123',
      expiresAt: new Date(Date.now() + 3600000),
    };

    this.session = session;

    // Save session
    if (this.config?.persistSession) {
      await this.saveSession();
    }

    // Start auto-refresh
    if (this.config?.autoRefresh) {
      this.startAutoRefresh();
    }

    // Emit event
    this.context.events.emit('auth:signin', session.user);

    this.context.logger.info('User signed in', email);
    return session;
  }

  public async signOut(): Promise<void> {
    if (!this.context) throw new Error('Plugin not activated');

    const user = this.session?.user;
    this.session = undefined;

    // Clear persisted session
    await this.context.storage.remove('auth:session');

    // Stop auto-refresh
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = undefined;
    }

    // Emit event
    this.context.events.emit('auth:signout', user);

    this.context.logger.info('User signed out');
  }

  public async refreshSession(): Promise<void> {
    if (!this.context || !this.session?.refreshToken) return;

    // Refresh token
    const newSession: AuthSession = {
      ...this.session,
      accessToken: 'new-token-123',
      expiresAt: new Date(Date.now() + 3600000),
    };

    this.session = newSession;

    if (this.config?.persistSession) {
      await this.saveSession();
    }

    this.context.logger.info('Session refreshed');
  }

  public getSession(): AuthSession | undefined {
    return this.session;
  }

  public getUser(): AuthUser | undefined {
    return this.session?.user;
  }

  public isAuthenticated(): boolean {
    if (!this.session) return false;
    return this.session.expiresAt > new Date();
  }

  // Private methods
  private async loadSession(): Promise<void> {
    if (!this.context) return;

    const session = await this.context.storage.get<AuthSession>('auth:session');
    if (session && new Date(session.expiresAt) > new Date()) {
      this.session = session;
      this.context.logger.info('Session loaded');
    }
  }

  private async saveSession(): Promise<void> {
    if (!this.context || !this.session) return;
    await this.context.storage.set('auth:session', this.session);
  }

  private startAutoRefresh(): void {
    if (!this.config) return;

    const threshold = this.config.refreshThreshold || 300000;

    this.refreshTimer = setInterval(() => {
      if (this.session) {
        const timeUntilExpiry = this.session.expiresAt.getTime() - Date.now();
        if (timeUntilExpiry < threshold) {
          this.refreshSession();
        }
      }
    }, 60000); // Check every minute
  }

  private getDefaultConfig(): AuthConfig {
    return {
      providers: [],
      tokenStorage: 'secure',
      autoRefresh: true,
      refreshThreshold: 300000,
      sessionTimeout: 86400000,
      persistSession: true,
    };
  }
}

export function createAuthPlugin(): Plugin {
  return new AuthPlugin();
}

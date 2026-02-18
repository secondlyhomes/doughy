/**
 * Theme Plugin
 *
 * Advanced theming plugin with dark mode, custom themes,
 * and dynamic theme switching.
 */

import {
  Plugin,
  PluginMetadata,
  PluginState,
  PluginContext,
  PluginCategory,
  PluginConfigSchema,
} from '../../core/types';

export interface ThemeConfig {
  defaultTheme?: string;
  themes: Record<string, Theme>;
  enableDarkMode?: boolean;
  autoDarkMode?: boolean;
  persistTheme?: boolean;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  shadows?: ThemeShadows;
  borderRadius?: ThemeBorderRadius;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  border: string;
  error: string;
  warning: string;
  success: string;
  info: string;
  [key: string]: string;
}

export interface ThemeSpacing {
  xs: number;
  sm: number;
  md: number;
  lg: number;
  xl: number;
  [key: string]: number;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    [key: string]: number;
  };
  fontWeight: {
    light: string;
    regular: string;
    medium: string;
    bold: string;
    [key: string]: string;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
    [key: string]: number;
  };
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  [key: string]: string;
}

export interface ThemeBorderRadius {
  sm: number;
  md: number;
  lg: number;
  full: number;
  [key: string]: number;
}

export class ThemePlugin implements Plugin {
  public readonly metadata: PluginMetadata = {
    id: 'com.blueprint.theme',
    name: 'Theme Plugin',
    version: '1.0.0',
    author: 'Mobile App Blueprint',
    description: 'Advanced theming with dark mode and custom themes',
    category: PluginCategory.UI,
    license: 'MIT',
    keywords: ['theme', 'styling', 'dark-mode', 'ui'],
  };

  public state: PluginState = PluginState.UNINITIALIZED;
  private context?: PluginContext;
  private config?: ThemeConfig;
  private currentTheme?: Theme;
  private isDarkMode = false;
  private subscribers = new Set<(theme: Theme) => void>();

  public async initialize(context: PluginContext): Promise<void> {
    this.context = context;
    const storedConfig = await context.storage.get<ThemeConfig>('theme:config');
    this.config = storedConfig || this.getDefaultConfig();
    context.logger.info('Theme plugin initialized');
  }

  public async activate(context: PluginContext): Promise<void> {
    if (!this.config) throw new Error('Plugin not initialized');

    // Load persisted theme
    if (this.config.persistTheme) {
      await this.loadPersistedTheme();
    }

    // Set default theme if none loaded
    if (!this.currentTheme) {
      const defaultThemeId = this.config.defaultTheme || Object.keys(this.config.themes)[0];
      this.currentTheme = this.config.themes[defaultThemeId];
    }

    // Setup auto dark mode
    if (this.config.autoDarkMode) {
      this.setupAutoDarkMode();
    }

    context.logger.info('Theme plugin activated');
  }

  public async deactivate(context: PluginContext): Promise<void> {
    if (this.config?.persistTheme && this.currentTheme) {
      await this.savePersistedTheme();
    }

    this.subscribers.clear();
    context.logger.info('Theme plugin deactivated');
  }

  public async dispose(context: PluginContext): Promise<void> {
    this.context = undefined;
    this.config = undefined;
    this.currentTheme = undefined;
    context.logger.info('Theme plugin disposed');
  }

  public getConfigSchema(): PluginConfigSchema {
    return {
      type: 'object',
      properties: {
        defaultTheme: { type: 'string', description: 'Default theme ID' },
        themes: { type: 'object', description: 'Available themes' },
        enableDarkMode: { type: 'boolean', default: true },
        autoDarkMode: { type: 'boolean', default: false },
        persistTheme: { type: 'boolean', default: true },
      },
      required: ['themes'],
    };
  }

  // Public API
  public getTheme(): Theme | undefined {
    return this.currentTheme;
  }

  public async setTheme(themeId: string): Promise<void> {
    if (!this.context || !this.config) throw new Error('Plugin not activated');

    const theme = this.config.themes[themeId];
    if (!theme) {
      throw new Error(`Theme not found: ${themeId}`);
    }

    this.currentTheme = theme;

    // Persist
    if (this.config.persistTheme) {
      await this.savePersistedTheme();
    }

    // Notify subscribers
    this.notifySubscribers(theme);

    // Emit event
    this.context.events.emit('theme:change', theme);

    this.context.logger.info(`Theme changed: ${themeId}`);
  }

  public async toggleDarkMode(): Promise<void> {
    if (!this.config?.enableDarkMode) return;

    this.isDarkMode = !this.isDarkMode;

    // Apply dark mode variant if available
    if (this.currentTheme) {
      const darkThemeId = this.isDarkMode
        ? `${this.currentTheme.id}-dark`
        : this.currentTheme.id.replace('-dark', '');

      if (this.config.themes[darkThemeId]) {
        await this.setTheme(darkThemeId);
      }
    }
  }

  public getDarkMode(): boolean {
    return this.isDarkMode;
  }

  public subscribe(callback: (theme: Theme) => void): () => void {
    this.subscribers.add(callback);
    // Call immediately with current theme
    if (this.currentTheme) {
      callback(this.currentTheme);
    }
    return () => this.subscribers.delete(callback);
  }

  public getAvailableThemes(): Theme[] {
    return this.config ? Object.values(this.config.themes) : [];
  }

  public registerTheme(theme: Theme): void {
    if (!this.config) throw new Error('Plugin not activated');
    this.config.themes[theme.id] = theme;
    this.context?.logger.info(`Theme registered: ${theme.id}`);
  }

  // Private methods
  private notifySubscribers(theme: Theme): void {
    this.subscribers.forEach((callback) => {
      try {
        callback(theme);
      } catch (error) {
        this.context?.logger.error('Theme subscriber error', error as Error);
      }
    });
  }

  private setupAutoDarkMode(): void {
    // Listen to system dark mode changes
    this.context?.events.on('system:darkmode', (isDark: boolean) => {
      if (this.isDarkMode !== isDark) {
        this.toggleDarkMode();
      }
    });
  }

  private async loadPersistedTheme(): Promise<void> {
    if (!this.context) return;

    const themeId = await this.context.storage.get<string>('theme:current');
    if (themeId && this.config?.themes[themeId]) {
      this.currentTheme = this.config.themes[themeId];
    }

    const isDarkMode = await this.context.storage.get<boolean>('theme:darkmode');
    if (isDarkMode !== null) {
      this.isDarkMode = isDarkMode;
    }
  }

  private async savePersistedTheme(): Promise<void> {
    if (!this.context || !this.currentTheme) return;

    await this.context.storage.set('theme:current', this.currentTheme.id);
    await this.context.storage.set('theme:darkmode', this.isDarkMode);
  }

  private getDefaultConfig(): ThemeConfig {
    return {
      themes: {
        light: this.createDefaultLightTheme(),
        dark: this.createDefaultDarkTheme(),
      },
      defaultTheme: 'light',
      enableDarkMode: true,
      autoDarkMode: false,
      persistTheme: true,
    };
  }

  private createDefaultLightTheme(): Theme {
    return {
      id: 'light',
      name: 'Light',
      colors: {
        primary: '#007AFF',
        secondary: '#5856D6',
        background: '#FFFFFF',
        surface: '#F2F2F7',
        text: '#000000',
        textSecondary: '#8E8E93',
        border: '#E5E5EA',
        error: '#FF3B30',
        warning: '#FF9500',
        success: '#34C759',
        info: '#007AFF',
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      typography: {
        fontFamily: 'System',
        fontSize: {
          xs: 12,
          sm: 14,
          md: 16,
          lg: 18,
          xl: 24,
        },
        fontWeight: {
          light: '300',
          regular: '400',
          medium: '500',
          bold: '700',
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.8,
        },
      },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.1)',
        md: '0 4px 6px rgba(0,0,0,0.1)',
        lg: '0 10px 15px rgba(0,0,0,0.1)',
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        full: 9999,
      },
    };
  }

  private createDefaultDarkTheme(): Theme {
    return {
      id: 'dark',
      name: 'Dark',
      colors: {
        primary: '#0A84FF',
        secondary: '#5E5CE6',
        background: '#000000',
        surface: '#1C1C1E',
        text: '#FFFFFF',
        textSecondary: '#98989D',
        border: '#38383A',
        error: '#FF453A',
        warning: '#FF9F0A',
        success: '#32D74B',
        info: '#0A84FF',
      },
      spacing: {
        xs: 4,
        sm: 8,
        md: 16,
        lg: 24,
        xl: 32,
      },
      typography: {
        fontFamily: 'System',
        fontSize: {
          xs: 12,
          sm: 14,
          md: 16,
          lg: 18,
          xl: 24,
        },
        fontWeight: {
          light: '300',
          regular: '400',
          medium: '500',
          bold: '700',
        },
        lineHeight: {
          tight: 1.2,
          normal: 1.5,
          relaxed: 1.8,
        },
      },
      shadows: {
        sm: '0 1px 2px rgba(0,0,0,0.3)',
        md: '0 4px 6px rgba(0,0,0,0.3)',
        lg: '0 10px 15px rgba(0,0,0,0.3)',
      },
      borderRadius: {
        sm: 4,
        md: 8,
        lg: 12,
        full: 9999,
      },
    };
  }
}

export function createThemePlugin(): Plugin {
  return new ThemePlugin();
}

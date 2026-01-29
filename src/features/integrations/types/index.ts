// src/features/integrations/types/index.ts
// Type definitions for third-party integrations

/** Supported integration providers */
export type IntegrationProvider = 'seam' | 'tracerfy';

/** Integration status */
export type IntegrationStatus = 'connected' | 'disconnected' | 'error';

/** Base integration configuration */
export interface IntegrationConfig {
  provider: IntegrationProvider;
  enabled: boolean;
  apiKey?: string;
  status: IntegrationStatus;
  lastChecked?: string;
  error?: string;
}

/** Seam-specific configuration */
export interface SeamConfig extends IntegrationConfig {
  provider: 'seam';
  /** Supported lock brands (starting with Schlage) */
  supportedBrands: string[];
  /** Connected workspace ID */
  workspaceId?: string;
}

/** Tracerfy-specific configuration */
export interface TracerfyConfig extends IntegrationConfig {
  provider: 'tracerfy';
  /** Auto-skip trace new leads without contact info */
  autoSkipTrace: boolean;
  /** Auto-match leads to properties */
  autoMatchToProperty: boolean;
  /** Remaining credits */
  creditsRemaining?: number;
}

/** All user integrations */
export interface UserIntegrations {
  seam?: SeamConfig;
  tracerfy?: TracerfyConfig;
}

/** Integration provider metadata for display */
export interface IntegrationProviderInfo {
  id: IntegrationProvider;
  name: string;
  description: string;
  icon: string;
  category: 'smart-home' | 'skip-tracing' | 'communication';
  docsUrl?: string;
}

export const INTEGRATION_PROVIDERS: Record<IntegrationProvider, IntegrationProviderInfo> = {
  seam: {
    id: 'seam',
    name: 'Seam',
    description: 'Smart lock control and access code management for Schlage and other brands',
    icon: '🔐',
    category: 'smart-home',
    docsUrl: 'https://docs.seam.co',
  },
  tracerfy: {
    id: 'tracerfy',
    name: 'Tracerfy',
    description: 'Skip tracing to find contact info and match leads to properties',
    icon: '🔍',
    category: 'skip-tracing',
    docsUrl: 'https://tracerfy.com',
  },
};

/** Default configurations */
export const DEFAULT_SEAM_CONFIG: SeamConfig = {
  provider: 'seam',
  enabled: false,
  status: 'disconnected',
  supportedBrands: ['schlage'],
};

export const DEFAULT_TRACERFY_CONFIG: TracerfyConfig = {
  provider: 'tracerfy',
  enabled: false,
  status: 'disconnected',
  autoSkipTrace: true,
  autoMatchToProperty: true,
};

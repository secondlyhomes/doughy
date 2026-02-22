// src/features/admin/utils/environmentUtils.ts
// Environment detection from Supabase URL

import type { ThemeColors } from '@/contexts/ThemeContext';

export type Environment = 'production' | 'staging' | 'development' | 'unknown';

/**
 * Detect environment from Supabase URL
 * Looks for keywords: stage, staging, dev, test, local
 */
export function detectEnvironment(): Environment {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
  const urlLower = supabaseUrl.toLowerCase();

  if (urlLower.includes('stage') || urlLower.includes('staging')) {
    return 'staging';
  }
  if (urlLower.includes('dev') || urlLower.includes('local') || urlLower.includes('test')) {
    return 'development';
  }
  // Default to production for standard Supabase URLs
  return 'production';
}

/**
 * Get short label for environment badge
 */
export function getEnvironmentLabel(env: Environment): string {
  switch (env) {
    case 'production':
      return 'PROD';
    case 'staging':
      return 'STAGE';
    case 'development':
      return 'DEV';
    default:
      return 'UNKNOWN';
  }
}

/**
 * Get color for environment badge based on theme
 */
export function getEnvironmentColor(env: Environment, colors: ThemeColors): string {
  switch (env) {
    case 'production':
      return colors.success;
    case 'staging':
      return colors.warning;
    case 'development':
      return colors.info;
    default:
      return colors.mutedForeground;
  }
}

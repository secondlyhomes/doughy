// src/features/settings/components/platform-settings-types.ts
// Types and configuration for the PlatformSettingsSection

import React from 'react';
import { TrendingUp, Home } from 'lucide-react-native';
import { Platform } from '@/contexts/PlatformContext';
import { ICON_SIZES } from '@/constants/design-tokens';

export interface PlatformSettingsSectionProps {
  /** Optional className for container */
  className?: string;
}

export interface PlatformConfig {
  id: Platform;
  label: string;
  description: string;
  icon: (color: string) => React.ReactNode;
  color: string;
}

export const platformConfigs: PlatformConfig[] = [
  {
    id: 'investor',
    label: 'Real Estate Investor',
    description: 'Track deals, analyze properties, and manage your investment portfolio',
    icon: (color: string) => React.createElement(TrendingUp, { size: ICON_SIZES.xl, color }),
    color: '#3b82f6', // blue-500
  },
  {
    id: 'landlord',
    label: 'Landlord',
    description: 'Manage rental properties, tenants, and maintenance requests',
    icon: (color: string) => React.createElement(Home, { size: ICON_SIZES.xl, color }),
    color: '#22c55e', // green-500
  },
];

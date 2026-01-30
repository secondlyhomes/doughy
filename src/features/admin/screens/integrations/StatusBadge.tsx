// src/features/admin/screens/integrations/StatusBadge.tsx
// Status badge component for integration items

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { CheckCircle, XCircle, Clock } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { IntegrationStatus } from '../../types/integrations';

export interface StatusBadgeProps {
  status: IntegrationStatus;
  colors: ReturnType<typeof useThemeColors>;
}

interface StatusConfig {
  icon: typeof CheckCircle | null;
  color: string;
  label: string;
  showSpinner?: boolean;
}

export const StatusBadge = React.memo(function StatusBadge({ status, colors }: StatusBadgeProps) {
  const config: Record<IntegrationStatus, StatusConfig> = {
    operational: {
      icon: CheckCircle,
      color: colors.success,
      label: 'Operational',
    },
    configured: {
      icon: Clock,
      color: colors.info,
      label: 'Configured',
    },
    error: {
      icon: XCircle,
      color: colors.destructive,
      label: 'Error',
    },
    'not-configured': {
      icon: XCircle,
      color: colors.mutedForeground,
      label: 'Not Set',
    },
    checking: {
      icon: null,
      color: colors.info,
      label: 'Checking',
      showSpinner: true,
    },
    active: {
      icon: CheckCircle,
      color: colors.success,
      label: 'Active',
    },
    inactive: {
      icon: XCircle,
      color: colors.mutedForeground,
      label: 'Inactive',
    },
  };

  const { icon: Icon, color, label, showSpinner } = config[status] || config['not-configured'];

  return (
    <View
      className="flex-row items-center px-2 py-0.5 rounded-full"
      style={{ backgroundColor: withOpacity(color, 'muted') }}
    >
      {showSpinner ? (
        <ActivityIndicator size={12} color={color} />
      ) : Icon ? (
        <Icon size={12} color={color} />
      ) : null}
      <Text className="text-xs ml-1 font-medium" style={{ color }}>
        {label}
      </Text>
    </View>
  );
});

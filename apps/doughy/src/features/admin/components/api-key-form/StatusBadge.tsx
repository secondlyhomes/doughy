// src/features/admin/components/api-key-form/StatusBadge.tsx
// Status badge component for API key form

import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react-native';
import { type ThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type { IntegrationStatus } from '../../types/integrations';
import { styles } from './styles';

interface StatusBadgeProps {
  hasKey: boolean;
  hasWarning?: boolean;
  healthStatus?: IntegrationStatus;
  loading?: boolean;
  colors: ThemeColors;
}

export const StatusBadge = React.memo(function StatusBadge({
  hasKey,
  hasWarning,
  healthStatus,
  loading,
  colors,
}: StatusBadgeProps) {
  // Show loading state while fetching key data
  if (loading) {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.muted, 'muted'), borderColor: withOpacity(colors.border, 'strong') }]}>
        <ActivityIndicator size="small" color={colors.mutedForeground} />
      </View>
    );
  }

  if (healthStatus === 'checking') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.info, 'muted'), borderColor: withOpacity(colors.info, 'strong') }]}>
        <ActivityIndicator size="small" color={colors.info} />
        <Text style={[styles.badgeText, { color: colors.info }]}>Checking</Text>
      </View>
    );
  }

  // Show Error badge for health check failures
  if (healthStatus === 'error') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.destructive, 'muted'), borderColor: withOpacity(colors.destructive, 'strong') }]}>
        <XCircle size={12} color={colors.destructive} />
        <Text style={[styles.badgeText, { color: colors.destructive }]}>Error</Text>
      </View>
    );
  }

  // Show Warning badge for validation warnings (key saved but has issues)
  if (hasWarning) {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.warning, 'muted'), borderColor: withOpacity(colors.warning, 'strong') }]}>
        <AlertTriangle size={12} color={colors.warning} />
        <Text style={[styles.badgeText, { color: colors.warning }]}>Warning</Text>
      </View>
    );
  }

  if (healthStatus === 'operational') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.success, 'muted'), borderColor: withOpacity(colors.success, 'strong') }]}>
        <CheckCircle size={12} color={colors.success} />
        <Text style={[styles.badgeText, { color: colors.success }]}>Operational</Text>
      </View>
    );
  }

  if (hasKey || healthStatus === 'configured') {
    return (
      <View style={[styles.badge, { backgroundColor: withOpacity(colors.success, 'muted'), borderColor: withOpacity(colors.success, 'strong') }]}>
        <CheckCircle size={12} color={colors.success} />
        <Text style={[styles.badgeText, { color: colors.success }]}>Configured</Text>
      </View>
    );
  }

  return (
    <View style={[styles.badge, { backgroundColor: withOpacity(colors.mutedForeground, 'muted'), borderColor: withOpacity(colors.mutedForeground, 'strong') }]}>
      <Text style={[styles.badgeText, { color: colors.mutedForeground }]}>Not Configured</Text>
    </View>
  );
});

// src/features/assistant/components/ActionCard.tsx
// Individual action card for the recommended actions grid

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Zap } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { LoadingSpinner } from '@/components/ui';

import { ActionDefinition, ActionId } from '../actions/catalog';
import { ACTION_ICONS } from './actions-tab-constants';
import { styles } from './actions-tab-styles';

interface ActionCardProps {
  action: ActionDefinition;
  isLoading: boolean;
  onPress: (action: ActionDefinition) => void;
}

export function ActionCard({ action, isLoading, onPress }: ActionCardProps) {
  const colors = useThemeColors();
  const Icon = ACTION_ICONS[action.id] || Zap;

  return (
    <TouchableOpacity
      style={[
        styles.actionCard,
        {
          backgroundColor: colors.muted,
          borderColor: colors.border,
        },
      ]}
      activeOpacity={0.7}
      onPress={() => onPress(action)}
      disabled={isLoading}
      accessibilityRole="button"
      accessibilityLabel={`${action.label}. ${action.description}${action.isLongRunning ? '. Runs in background' : ''}`}
      accessibilityState={{ disabled: isLoading }}
    >
      <View style={styles.actionIconContainer}>
        {isLoading ? (
          <LoadingSpinner size="small" />
        ) : (
          <Icon size={ICON_SIZES.lg} color={colors.primary} />
        )}
      </View>
      <Text
        style={[styles.actionLabel, { color: colors.foreground }]}
        numberOfLines={2}
      >
        {action.label}
      </Text>
      {action.isLongRunning && (
        <View style={[styles.asyncBadge, { backgroundColor: withOpacity(colors.info, 'light') }]}>
          <Text style={[styles.asyncBadgeText, { color: colors.info }]}>
            Async
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

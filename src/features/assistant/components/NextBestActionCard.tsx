// src/features/assistant/components/NextBestActionCard.tsx
// Next Best Action card for ActionsTab

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Target, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';

import { NextAction } from '@/features/deals/hooks/useNextAction';
import { ActionDefinition } from '../actions/catalog';
import { styles } from './actions-tab-styles';

interface NextBestActionCardProps {
  nextAction: NextAction;
  recommendedActions: ActionDefinition[];
  onActionPress: (action: ActionDefinition) => void;
}

export function NextBestActionCard({
  nextAction,
  recommendedActions,
  onActionPress,
}: NextBestActionCardProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
        NEXT BEST ACTION
      </Text>
      <TouchableOpacity
        style={[
          styles.nbaCard,
          {
            backgroundColor: withOpacity(colors.primary, 'muted'),
            borderColor: colors.primary,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          // Find matching action in catalog
          const matchingAction = recommendedActions.find(
            a => a.addressesCategories?.includes(nextAction.category)
          );
          if (matchingAction) {
            onActionPress(matchingAction);
          }
        }}
        accessibilityRole="button"
        accessibilityLabel={`Next action: ${nextAction.action}. ${nextAction.priority} priority${nextAction.isOverdue ? ', overdue' : ''}`}
      >
        <View style={styles.nbaContent}>
          <Target size={ICON_SIZES.xl} color={colors.primary} />
          <View style={styles.nbaText}>
            <Text style={[styles.nbaAction, { color: colors.foreground }]}>
              {nextAction.action}
            </Text>
            <Text style={[styles.nbaMeta, { color: colors.mutedForeground }]}>
              {nextAction.priority} priority
              {nextAction.isOverdue && ' \u2022 Overdue'}
            </Text>
          </View>
        </View>
        <ChevronRight size={ICON_SIZES.lg} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

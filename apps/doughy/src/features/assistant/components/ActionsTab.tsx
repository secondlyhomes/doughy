// src/features/assistant/components/ActionsTab.tsx
// Actions tab for AI assistant - shows recommended actions

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Zap,
  Target,
  Calculator,
  MessageCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';

import { useNextAction } from '@/features/deals/hooks/useNextAction';
import { useDeal } from '@/features/deals/hooks/useDeals';
import {
  ActionDefinition,
  ActionId,
  ACTION_CATALOG,
  getRecommendedActions,
} from '../actions/catalog';
import { executeAction, HandlerContext } from '../actions/handlers';
import { useAssistantContext } from '../hooks/useAssistantContext';
import { useAIJobs } from '../hooks/useAIJobs';

import { ActionsTabProps } from './actions-tab-types';
import { MAX_VISIBLE_ACTIONS } from './actions-tab-constants';
import { styles } from './actions-tab-styles';
import { NextBestActionCard } from './NextBestActionCard';
import { ActionCard } from './ActionCard';
import { QuickActionButton } from './QuickActionButton';

export function ActionsTab({ dealId, onActionSelect, onJobCreated }: ActionsTabProps) {
  const colors = useThemeColors();
  const context = useAssistantContext();
  const { deal } = useDeal(dealId || '');
  const nextAction = useNextAction(deal);
  const { createJob } = useAIJobs(dealId);

  const [loading, setLoading] = useState<ActionId | null>(null);
  const [showAllActions, setShowAllActions] = useState(false);

  // Get recommended actions based on current context
  const recommendedActions = useMemo(() => {
    if (!deal) return [];

    return getRecommendedActions({
      stage: deal.stage,
      nbaCategory: nextAction?.category,
      userPlan: context.user.plan,
      missingInfo: context.payload?.type === 'deal_cockpit'
        ? context.payload.missingInfo.map((i: any) => i.key)
        : undefined,
    });
  }, [deal, nextAction, context]);

  const handleActionPress = async (action: ActionDefinition, params?: Record<string, unknown>) => {
    if (!deal) return;

    setLoading(action.id);

    try {
      // Build handler context
      const handlerContext: HandlerContext = {
        deal,
        property: deal.property,
        userId: context.user.id,
      };

      // Execute the action handler
      const result = await executeAction(
        { actionId: action.id, dealId: deal.id, params },
        handlerContext
      );

      if (!result.success) {
        console.error('Action failed:', result.error);
        // Could show toast here
        return;
      }

      // Handle result based on action type
      if (result.patchSet) {
        // Immediate action - show PatchSet preview
        onActionSelect?.(action, result.patchSet);
      } else if (result.jobInput) {
        // Long-running action - create job with typed input
        try {
          const job = await createJob(result.jobInput);
          onJobCreated?.(job.id);
        } catch (jobError) {
          console.error('Failed to create job:', jobError);
          Alert.alert(
            'Failed to Start Job',
            'Unable to start the background job. Please try again.',
            [{ text: 'OK' }]
          );
        }
      } else if (result.content) {
        // Content result (e.g., draft text, analysis) - notify parent
        onActionSelect?.(action);
        console.log('Action result:', result.content);
      }
    } catch (error) {
      console.error('Action execution failed:', error);
      Alert.alert(
        'Action Failed',
        'Unable to execute this action. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(null);
    }
  };

  if (!deal) {
    return (
      <View style={styles.emptyContainer}>
        <Zap size={40} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No Deal Selected
        </Text>
        <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
          Open a deal to see recommended actions
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Next Best Action */}
      {nextAction && (
        <NextBestActionCard
          nextAction={nextAction}
          recommendedActions={recommendedActions}
          onActionPress={handleActionPress}
        />
      )}

      {/* Recommended Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          RECOMMENDED ACTIONS
        </Text>
        <View style={styles.actionGrid}>
          {/* Apply progressive disclosure - show limited actions by default */}
          {(showAllActions
            ? recommendedActions
            : recommendedActions.slice(0, MAX_VISIBLE_ACTIONS)
          ).map((action) => (
            <ActionCard
              key={action.id}
              action={action}
              isLoading={loading === action.id}
              onPress={handleActionPress}
            />
          ))}
        </View>

        {/* Show more/less button when there are more than MAX_VISIBLE_ACTIONS */}
        {recommendedActions.length > MAX_VISIBLE_ACTIONS && (
          <TouchableOpacity
            style={[styles.showMoreButton, { backgroundColor: colors.muted }]}
            onPress={() => setShowAllActions(!showAllActions)}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={showAllActions ? 'Show fewer actions' : `Show ${recommendedActions.length - MAX_VISIBLE_ACTIONS} more actions`}
          >
            {showAllActions ? (
              <ChevronUp size={ICON_SIZES.md} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={ICON_SIZES.md} color={colors.mutedForeground} />
            )}
            <Text style={[styles.showMoreText, { color: colors.mutedForeground }]}>
              {showAllActions
                ? 'Show less'
                : `Show ${recommendedActions.length - MAX_VISIBLE_ACTIONS} more`}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          QUICK ACTIONS
        </Text>
        <View style={styles.quickActions}>
          <QuickActionButton
            icon={MessageCircle}
            label="Add Note"
            onPress={() => handleActionPress(ACTION_CATALOG.add_note)}
          />
          <QuickActionButton
            icon={Target}
            label="Set Action"
            onPress={() => handleActionPress(ACTION_CATALOG.set_next_action)}
          />
          <QuickActionButton
            icon={Calculator}
            label="Underwrite"
            onPress={() => handleActionPress(ACTION_CATALOG.run_underwrite_check)}
          />
        </View>
      </View>
    </ScrollView>
  );
}

export default ActionsTab;

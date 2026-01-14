// src/features/assistant/components/ActionsTab.tsx
// Actions tab for AI assistant - shows recommended actions

import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  Zap,
  Target,
  Calculator,
  FileText,
  MessageCircle,
  PenTool,
  CheckSquare,
  Search,
  Share2,
  FilePlus,
  GitBranch,
  Sliders,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { BORDER_RADIUS, SPACING } from '@/constants/design-tokens';
import { TAB_BAR_SAFE_PADDING } from '@/components/ui';

import { useNextAction, NextAction, ActionCategory } from '@/features/deals/hooks/useNextAction';
import { useDeal } from '@/features/deals/hooks/useDeals';
import {
  ActionDefinition,
  ActionId,
  ACTION_CATALOG,
  getRecommendedActions,
  canUserExecuteAction,
} from '../actions/catalog';
import { executeAction, HandlerContext } from '../actions/handlers';
import { useAssistantContext } from '../hooks/useAssistantContext';
import { useAIJobs } from '../hooks/useAIJobs';
import { PatchSet } from '../types/patchset';

interface ActionsTabProps {
  dealId?: string;
  onActionSelect?: (action: ActionDefinition, patchSet?: PatchSet) => void;
  onJobCreated?: (jobId: string) => void;
}

// Icon mapping for actions
const ACTION_ICONS: Record<ActionId, React.ComponentType<any>> = {
  update_stage: GitBranch,
  set_next_action: Target,
  create_task: CheckSquare,
  add_note: MessageCircle,
  summarize_event: FileText,
  extract_facts: Search,
  run_underwrite_check: Calculator,
  update_assumption: Sliders,
  generate_seller_report: Share2,
  generate_offer_packet: FilePlus,
  draft_counter_text: MessageCircle,
  prepare_esign_envelope: PenTool,
};

export function ActionsTab({ dealId, onActionSelect, onJobCreated }: ActionsTabProps) {
  const colors = useThemeColors();
  const context = useAssistantContext();
  const { deal } = useDeal(dealId || '');
  const nextAction = useNextAction(deal);
  const { createJob } = useAIJobs(dealId);

  const [loading, setLoading] = useState<ActionId | null>(null);

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
        }
      } else if (result.content) {
        // Content result (e.g., draft text, analysis) - notify parent
        onActionSelect?.(action);
        console.log('Action result:', result.content);
      }
    } catch (error) {
      console.error('Action execution failed:', error);
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
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
            NEXT BEST ACTION
          </Text>
          <TouchableOpacity
            style={[
              styles.nbaCard,
              {
                backgroundColor: colors.primary + '10',
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
                handleActionPress(matchingAction);
              }
            }}
            accessibilityRole="button"
            accessibilityLabel={`Next action: ${nextAction.action}. ${nextAction.priority} priority${nextAction.isOverdue ? ', overdue' : ''}`}
          >
            <View style={styles.nbaContent}>
              <Target size={24} color={colors.primary} />
              <View style={styles.nbaText}>
                <Text style={[styles.nbaAction, { color: colors.foreground }]}>
                  {nextAction.action}
                </Text>
                <Text style={[styles.nbaMeta, { color: colors.mutedForeground }]}>
                  {nextAction.priority} priority
                  {nextAction.isOverdue && ' • Overdue'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Recommended Actions */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>
          RECOMMENDED ACTIONS
        </Text>
        <View style={styles.actionGrid}>
          {recommendedActions.map((action) => {
            const Icon = ACTION_ICONS[action.id] || Zap;
            const isLoading = loading === action.id;

            return (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.actionCard,
                  {
                    backgroundColor: colors.muted,
                    borderColor: colors.border,
                  },
                ]}
                activeOpacity={0.7}
                onPress={() => handleActionPress(action)}
                disabled={isLoading}
                accessibilityRole="button"
                accessibilityLabel={`${action.label}. ${action.description}${action.isLongRunning ? '. Runs in background' : ''}`}
                accessibilityState={{ disabled: isLoading }}
              >
                <View style={styles.actionIconContainer}>
                  {isLoading ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <Icon size={20} color={colors.primary} />
                  )}
                </View>
                <Text
                  style={[styles.actionLabel, { color: colors.foreground }]}
                  numberOfLines={2}
                >
                  {action.label}
                </Text>
                {action.isLongRunning && (
                  <View style={[styles.asyncBadge, { backgroundColor: colors.info + '20' }]}>
                    <Text style={[styles.asyncBadgeText, { color: colors.info }]}>
                      Async
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
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
            colors={colors}
          />
          <QuickActionButton
            icon={Target}
            label="Set Action"
            onPress={() => handleActionPress(ACTION_CATALOG.set_next_action)}
            colors={colors}
          />
          <QuickActionButton
            icon={Calculator}
            label="Underwrite"
            onPress={() => handleActionPress(ACTION_CATALOG.run_underwrite_check)}
            colors={colors}
          />
        </View>
      </View>
    </ScrollView>
  );
}

// Quick Action Button Component
function QuickActionButton({
  icon: Icon,
  label,
  onPress,
  colors,
}: {
  icon: React.ComponentType<any>;
  label: string;
  onPress: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: colors.muted }]}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`Quick action: ${label}`}
    >
      <Icon size={18} color={colors.foreground} />
      <Text style={[styles.quickActionLabel, { color: colors.foreground }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.lg,
    paddingBottom: TAB_BAR_SAFE_PADDING,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING['3xl'],
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
  },
  section: {
    marginBottom: SPACING['2xl'],
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: SPACING.md,
  },
  nbaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
  },
  nbaContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  nbaText: {
    flex: 1,
  },
  nbaAction: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  nbaMeta: {
    fontSize: 12,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  actionCard: {
    width: '47%',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    alignItems: 'flex-start',
    minHeight: 90,
  },
  actionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS['10'],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  actionLabel: {
    fontSize: 13,
    fontWeight: '500',
    lineHeight: 18,
  },
  asyncBadge: {
    marginTop: SPACING.sm,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  asyncBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  quickActionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS['10'],
  },
  quickActionLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default ActionsTab;

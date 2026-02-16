// CallPilot — Post-Call Review Screen
// Shows call summary, sentiment, action items, and suggested updates

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  ThumbsUp,
  ThumbsDown,
  Minus,
  Check,
  X,
  Target,
  Flame,
  Snowflake,
  Sun,
  Skull,
  ListChecks,
  MessageSquare,
  HelpCircle,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, ICON_SIZES } from '@/constants/design-tokens';
import { usePostCallSummary, type ActionItem } from '../hooks/useCallPilot';

export function PostCallScreen() {
  const { id: callId } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const { summary, actionItems, fetchSummary, approveActionItem, dismissActionItem, isLoading } = usePostCallSummary();

  useEffect(() => {
    if (callId) fetchSummary(callId);
  }, [callId, fetchSummary]);

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="Call Review" showBack />
        <View className="flex-1 items-center justify-center">
          <LoadingSpinner size="large" />
          <Text className="mt-4 text-sm" style={{ color: colors.mutedForeground }}>
            Generating summary...
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader title="Call Review" showBack />

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: TAB_BAR_SAFE_PADDING }}>
        {summary && (
          <>
            {/* Sentiment + Temperature Row */}
            <View className="flex-row gap-3 mb-4">
              {summary.sentiment && (
                <SentimentCard sentiment={summary.sentiment} colors={colors} />
              )}
              {summary.lead_temperature && (
                <TemperatureCard temperature={summary.lead_temperature} colors={colors} />
              )}
            </View>

            {/* Summary */}
            <View
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row items-center mb-3">
                <MessageSquare size={ICON_SIZES.lg} color={colors.primary} />
                <Text className="ml-2 text-sm font-semibold" style={{ color: colors.foreground }}>
                  Summary
                </Text>
              </View>
              <Text className="text-sm leading-5" style={{ color: colors.foreground }}>
                {summary.summary || 'No summary available'}
              </Text>
            </View>

            {/* Key Points */}
            {summary.key_points.length > 0 && (
              <View
                className="rounded-2xl p-4 mb-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="flex-row items-center mb-3">
                  <Target size={ICON_SIZES.lg} color={colors.info} />
                  <Text className="ml-2 text-sm font-semibold" style={{ color: colors.foreground }}>
                    Key Points
                  </Text>
                </View>
                {summary.key_points.map((point, i) => (
                  <View key={i} className="flex-row items-start mb-2">
                    <Text className="text-sm mr-2" style={{ color: colors.info }}>•</Text>
                    <Text className="text-sm flex-1 leading-5" style={{ color: colors.foreground }}>{String(point)}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Closing Recommendation */}
            {summary.closing_recommendation && (
              <View
                className="rounded-2xl p-4 mb-4"
                style={{ backgroundColor: withOpacity(colors.primary, 'muted'), borderWidth: 1, borderColor: colors.primary }}
              >
                <Text className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: colors.primary }}>
                  Recommendation
                </Text>
                <Text className="text-sm leading-5" style={{ color: colors.foreground }}>
                  {summary.closing_recommendation}
                </Text>
              </View>
            )}

            {/* Unanswered Questions */}
            {summary.unanswered_questions.length > 0 && (
              <View
                className="rounded-2xl p-4 mb-4"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="flex-row items-center mb-3">
                  <HelpCircle size={ICON_SIZES.lg} color={colors.warning} />
                  <Text className="ml-2 text-sm font-semibold" style={{ color: colors.foreground }}>
                    Unanswered Questions
                  </Text>
                </View>
                {summary.unanswered_questions.map((q, i) => (
                  <Text key={i} className="text-sm leading-5 mb-1" style={{ color: colors.foreground }}>
                    • {String(q)}
                  </Text>
                ))}
              </View>
            )}
          </>
        )}

        {/* Action Items */}
        {actionItems.length > 0 && (
          <View className="mb-4">
            <View className="flex-row items-center mb-3">
              <ListChecks size={ICON_SIZES.lg} color={colors.primary} />
              <Text className="ml-2 text-base font-semibold" style={{ color: colors.foreground }}>
                Action Items ({actionItems.length})
              </Text>
            </View>
            {actionItems.map((item) => (
              <ActionItemCard
                key={item.id}
                item={item}
                callId={callId!}
                colors={colors}
                onApprove={approveActionItem}
                onDismiss={dismissActionItem}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

function SentimentCard({ sentiment, colors }: { sentiment: string; colors: ReturnType<typeof useThemeColors> }) {
  const config: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    positive: { icon: <ThumbsUp size={ICON_SIZES.xl} color={colors.success} />, color: colors.success, label: 'Positive' },
    neutral: { icon: <Minus size={ICON_SIZES.xl} color={colors.info} />, color: colors.info, label: 'Neutral' },
    negative: { icon: <ThumbsDown size={ICON_SIZES.xl} color={colors.destructive} />, color: colors.destructive, label: 'Negative' },
    mixed: { icon: <Minus size={ICON_SIZES.xl} color={colors.warning} />, color: colors.warning, label: 'Mixed' },
  };
  const c = config[sentiment] || config.neutral;

  return (
    <View className="flex-1 rounded-xl p-3 items-center" style={{ backgroundColor: withOpacity(c.color, 'muted') }}>
      {c.icon}
      <Text className="text-xs font-medium mt-1" style={{ color: c.color }}>{c.label}</Text>
    </View>
  );
}

function TemperatureCard({ temperature, colors }: { temperature: string; colors: ReturnType<typeof useThemeColors> }) {
  const config: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    hot: { icon: <Flame size={ICON_SIZES.xl} color={colors.destructive} />, color: colors.destructive, label: 'Hot Lead' },
    warm: { icon: <Sun size={ICON_SIZES.xl} color={colors.warning} />, color: colors.warning, label: 'Warm' },
    cold: { icon: <Snowflake size={ICON_SIZES.xl} color={colors.info} />, color: colors.info, label: 'Cold' },
    dead: { icon: <Skull size={ICON_SIZES.xl} color={colors.mutedForeground} />, color: colors.mutedForeground, label: 'Dead' },
  };
  const c = config[temperature] || config.cold;

  return (
    <View className="flex-1 rounded-xl p-3 items-center" style={{ backgroundColor: withOpacity(c.color, 'muted') }}>
      {c.icon}
      <Text className="text-xs font-medium mt-1" style={{ color: c.color }}>{c.label}</Text>
    </View>
  );
}

function ActionItemCard({
  item,
  callId,
  colors,
  onApprove,
  onDismiss,
}: {
  item: ActionItem;
  callId: string;
  colors: ReturnType<typeof useThemeColors>;
  onApprove: (callId: string, id: string) => void;
  onDismiss: (callId: string, id: string) => void;
}) {
  const isPending = item.status === 'pending';

  return (
    <View
      className="rounded-xl p-4 mb-2"
      style={{
        backgroundColor: colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        opacity: isPending ? 1 : 0.6,
      }}
    >
      <View className="flex-row items-start">
        <View className="flex-1">
          <Text className="text-sm font-medium" style={{ color: colors.foreground }}>
            {item.description}
          </Text>
          {item.due_date && (
            <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
              Due: {new Date(item.due_date).toLocaleDateString()}
            </Text>
          )}
          {item.category && (
            <View className="mt-1 self-start rounded-full px-2 py-0.5" style={{ backgroundColor: colors.muted }}>
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>{item.category}</Text>
            </View>
          )}
        </View>

        {isPending && (
          <View className="flex-row gap-2 ml-2">
            <TouchableOpacity
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: withOpacity(colors.success, 'muted') }}
              onPress={() => onApprove(callId, item.id)}
            >
              <Check size={ICON_SIZES.md} color={colors.success} />
            </TouchableOpacity>
            <TouchableOpacity
              className="w-8 h-8 rounded-full items-center justify-center"
              style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
              onPress={() => onDismiss(callId, item.id)}
            >
              <X size={ICON_SIZES.md} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

export default PostCallScreen;

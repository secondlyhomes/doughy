// CallPilot — Pre-Call Briefing Screen
// Shows lead context, talking points, and opening script before a call

import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Phone,
  User,
  Target,
  MessageSquare,
  AlertTriangle,
  ChevronRight,
  Sparkles,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, ICON_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { usePreCallBriefing } from '../hooks/useCallPilot';

export function PreCallScreen() {
  const { id: callId } = useLocalSearchParams<{ id: string }>();
  const colors = useThemeColors();
  const router = useRouter();
  const { briefing, generateBriefing, isLoading, error } = usePreCallBriefing();

  useEffect(() => {
    if (callId) {
      // Fetch existing briefing for this call
      generateBriefing({ lead_id: callId });
    }
  }, [callId, generateBriefing]);

  const handleStartCall = useCallback(() => {
    if (callId) {
      router.push(`/(tabs)/calls/active/${callId}`);
    }
  }, [callId, router]);

  const bc = briefing?.briefing_content;

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="Pre-Call Briefing" showBack />
        <View className="flex-1 items-center justify-center">
          <LoadingSpinner size="large" />
          <Text className="mt-4 text-sm" style={{ color: colors.mutedForeground }}>
            Generating briefing...
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader title="Pre-Call Briefing" showBack />

      <ScrollView contentContainerStyle={{ padding: SPACING.lg, paddingBottom: TAB_BAR_SAFE_PADDING + 80 }}>
        {/* Lead Info Card */}
        {bc && (
          <>
            <View
              className="rounded-2xl p-4 mb-4"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="flex-row items-center mb-3">
                <View
                  className="w-12 h-12 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
                >
                  <User size={ICON_SIZES.xl} color={colors.primary} />
                </View>
                <View className="flex-1">
                  <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
                    {bc.lead_name || 'Unknown Contact'}
                  </Text>
                  {bc.property_address && (
                    <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                      {bc.property_address}
                    </Text>
                  )}
                </View>
                {bc.lead_score !== undefined && (
                  <View className="rounded-full px-3 py-1" style={{ backgroundColor: getScoreColor(bc.lead_score, colors) }}>
                    <Text className="text-xs font-bold text-white">{bc.lead_score}</Text>
                  </View>
                )}
              </View>

              {bc.last_interaction && (
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  Last contact: {bc.last_interaction}
                </Text>
              )}
            </View>

            {/* Deal Context */}
            {bc.deal_context && (
              <BriefingSection
                icon={<Target size={ICON_SIZES.lg} color={colors.info} />}
                title="Deal Context"
                colors={colors}
              >
                <Text className="text-sm leading-5" style={{ color: colors.foreground }}>
                  {bc.deal_context}
                </Text>
              </BriefingSection>
            )}

            {/* Opening Script */}
            {bc.opening_script && (
              <BriefingSection
                icon={<MessageSquare size={ICON_SIZES.lg} color={colors.primary} />}
                title="Opening Script"
                colors={colors}
              >
                <Text className="text-sm leading-5 italic" style={{ color: colors.foreground }}>
                  "{bc.opening_script}"
                </Text>
              </BriefingSection>
            )}

            {/* Talking Points */}
            {bc.talking_points && bc.talking_points.length > 0 && (
              <BriefingSection
                icon={<Sparkles size={ICON_SIZES.lg} color={colors.warning} />}
                title="Talking Points"
                colors={colors}
              >
                {bc.talking_points.map((point, i) => (
                  <View key={i} className="flex-row items-start mb-2">
                    <Text className="text-sm mr-2" style={{ color: colors.primary }}>
                      {i + 1}.
                    </Text>
                    <Text className="text-sm flex-1 leading-5" style={{ color: colors.foreground }}>
                      {point}
                    </Text>
                  </View>
                ))}
              </BriefingSection>
            )}

            {/* Questions to Ask */}
            {bc.questions_to_ask && bc.questions_to_ask.length > 0 && (
              <BriefingSection
                icon={<MessageSquare size={ICON_SIZES.lg} color={colors.success} />}
                title="Questions to Ask"
                colors={colors}
              >
                {bc.questions_to_ask.map((q, i) => (
                  <View key={i} className="flex-row items-start mb-2">
                    <Text className="text-sm mr-2" style={{ color: colors.success }}>?</Text>
                    <Text className="text-sm flex-1 leading-5" style={{ color: colors.foreground }}>{q}</Text>
                  </View>
                ))}
              </BriefingSection>
            )}

            {/* Warnings */}
            {bc.warnings && bc.warnings.length > 0 && (
              <BriefingSection
                icon={<AlertTriangle size={ICON_SIZES.lg} color={colors.destructive} />}
                title="Watch Out For"
                colors={colors}
              >
                {bc.warnings.map((w, i) => (
                  <Text key={i} className="text-sm leading-5 mb-1" style={{ color: colors.destructive }}>
                    {w}
                  </Text>
                ))}
              </BriefingSection>
            )}
          </>
        )}

        {!bc && !isLoading && (
          <View className="items-center py-12">
            <Text style={{ color: colors.mutedForeground }}>
              {error || 'No briefing available for this call'}
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Start Call Button - Fixed at bottom */}
      <View
        className="absolute bottom-0 left-0 right-0 px-4 pb-8 pt-4"
        style={{ backgroundColor: colors.background }}
      >
        <TouchableOpacity
          className="rounded-2xl py-4 flex-row items-center justify-center"
          style={{ backgroundColor: colors.primary }}
          onPress={handleStartCall}
          activeOpacity={0.7}
        >
          <Phone size={ICON_SIZES.lg} color={colors.primaryForeground} />
          <Text className="ml-2 text-base font-semibold" style={{ color: colors.primaryForeground }}>
            Start Call
          </Text>
        </TouchableOpacity>
      </View>
    </ThemedSafeAreaView>
  );
}

function BriefingSection({
  icon,
  title,
  children,
  colors,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useThemeColors>;
}) {
  return (
    <View
      className="rounded-2xl p-4 mb-4"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-center mb-3">
        {icon}
        <Text className="ml-2 text-sm font-semibold" style={{ color: colors.foreground }}>
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function getScoreColor(score: number, colors: ReturnType<typeof useThemeColors>): string {
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.destructive;
}

export default PreCallScreen;

// src/features/deals/screens/cockpit/tabs/OverviewTab.tsx
// Overview tab content for Deal Cockpit

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { DealTimeline, SuggestionList } from '../../../components';
import { NextActionButton } from '../NextActionButton';
import { DealMetrics } from '../DealMetrics';
import type { Deal } from '../../../types';
import {
  DEAL_STRATEGY_CONFIG,
  getDealAddress,
  getDealLeadName,
} from '../../../types';
import type { AISuggestion } from '../../../services/aiSuggestions';

interface OverviewTabProps {
  deal: Deal;
  suggestions: AISuggestion[];
  onNextAction: () => void;
  onEvidencePress: (field: 'mao' | 'profit' | 'risk') => void;
  onAddActivity: () => void;
  onSuggestionAction: (suggestion: AISuggestion) => void;
  onSuggestionDismiss: (suggestion: AISuggestion) => void;
  onLeadPress: () => void;
  onPropertyPress: () => void;
  onRefetch: () => void;
}

export function OverviewTab({
  deal,
  suggestions,
  onNextAction,
  onEvidencePress,
  onAddActivity,
  onSuggestionAction,
  onSuggestionDismiss,
  onLeadPress,
  onPropertyPress,
}: OverviewTabProps) {
  const colors = useThemeColors();
  const { focusMode } = useFocusMode();

  return (
    <>
      {/* Breadcrumb: Lead > Property + Strategy badge */}
      <View
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}
      >
        {/* Lead Name - clickable */}
        <TouchableOpacity
          onPress={onLeadPress}
          disabled={!deal.lead_id}
          style={{ flexShrink: 0 }}
          accessibilityLabel={`View ${getDealLeadName(deal)} profile`}
          accessibilityRole="link"
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: '600',
              color: deal.lead_id ? colors.primary : colors.foreground,
            }}
            numberOfLines={1}
          >
            {getDealLeadName(deal)}
          </Text>
        </TouchableOpacity>

        {/* Separator */}
        <ChevronRight
          size={12}
          color={colors.mutedForeground}
          style={{ marginHorizontal: 4, flexShrink: 0 }}
        />

        {/* Property Address - clickable, truncates */}
        <TouchableOpacity
          onPress={onPropertyPress}
          disabled={!deal.property_id}
          style={{ flex: 1, minWidth: 0 }}
          accessibilityLabel={`View property at ${getDealAddress(deal)}`}
          accessibilityRole="link"
        >
          <Text
            style={{
              fontSize: 14,
              color: deal.property_id ? colors.primary : colors.mutedForeground,
            }}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {getDealAddress(deal)}
          </Text>
        </TouchableOpacity>

        {/* Strategy badge */}
        {deal.strategy && (
          <View
            style={{
              marginLeft: 8,
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 10,
              backgroundColor: withOpacity(colors.secondary, 'medium'),
              flexShrink: 0,
            }}
          >
            <Text
              style={{
                fontSize: 11,
                fontWeight: '500',
                color: colors.secondaryForeground,
              }}
            >
              {DEAL_STRATEGY_CONFIG[deal.strategy].label}
            </Text>
          </View>
        )}
      </View>

      {/* Next Action Button */}
      <NextActionButton deal={deal} onPress={onNextAction} />

      {/* AI Suggestions - Zone G Week 9 */}
      {suggestions.length > 0 && !focusMode && (
        <View className="mb-4">
          <SuggestionList
            suggestions={suggestions}
            onAction={onSuggestionAction}
            onDismiss={onSuggestionDismiss}
            title="AI Suggestions"
            maxVisible={3}
          />
        </View>
      )}

      {/* Key Metrics - Zone G Progressive Disclosure */}
      <DealMetrics deal={deal} onEvidencePress={onEvidencePress} />

      {/* Deal Timeline */}
      <View className="mt-4">
        <DealTimeline
          dealId={deal.id}
          keyEventsOnly={focusMode}
          maxEvents={focusMode ? 3 : undefined}
          onAddActivity={onAddActivity}
        />
      </View>
    </>
  );
}

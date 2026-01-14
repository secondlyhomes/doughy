// src/features/field-mode/components/WalkthroughSummary.tsx
// Component displaying AI-organized walkthrough summary

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import {
  AlertTriangle,
  HelpCircle,
  ClipboardList,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { AISummary } from '../../deals/types';

interface WalkthroughSummaryProps {
  summary: AISummary;
}

export function WalkthroughSummary({ summary }: WalkthroughSummaryProps) {
  const colors = useThemeColors();
  const [expandedSections, setExpandedSections] = useState({
    issues: true,
    questions: true,
    scope: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <Card className="mb-4">
      <CardHeader className="pb-2">
        <View className="flex-row items-center gap-2">
          <Sparkles size={20} color={colors.primary} />
          <CardTitle className="text-lg">AI Summary</CardTitle>
        </View>
      </CardHeader>

      <CardContent>
        {/* Issues Section */}
        <View className="mb-4">
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            onPress={() => toggleSection('issues')}
            accessibilityLabel={`Issues section, ${summary.issues.length} items`}
            accessibilityRole="button"
          >
            <View className="flex-row items-center gap-2">
              <AlertTriangle size={18} color={colors.warning} />
              <Text className="text-base font-semibold text-foreground">
                Issues Found
              </Text>
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: colors.warning + '20' }}
              >
                <Text className="text-xs font-medium" style={{ color: colors.warning }}>
                  {summary.issues.length}
                </Text>
              </View>
            </View>
            {expandedSections.issues ? (
              <ChevronUp size={18} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={18} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>

          {expandedSections.issues && (
            <View className="ml-6 pl-2 border-l-2" style={{ borderLeftColor: colors.warning + '40' }}>
              {summary.issues.map((issue, index) => (
                <View key={index} className="py-1.5">
                  <Text className="text-sm text-foreground">{issue}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Questions Section */}
        <View className="mb-4">
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            onPress={() => toggleSection('questions')}
            accessibilityLabel={`Questions section, ${summary.questions.length} items`}
            accessibilityRole="button"
          >
            <View className="flex-row items-center gap-2">
              <HelpCircle size={18} color={colors.info} />
              <Text className="text-base font-semibold text-foreground">
                Questions to Verify
              </Text>
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: colors.info + '20' }}
              >
                <Text className="text-xs font-medium" style={{ color: colors.info }}>
                  {summary.questions.length}
                </Text>
              </View>
            </View>
            {expandedSections.questions ? (
              <ChevronUp size={18} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={18} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>

          {expandedSections.questions && (
            <View className="ml-6 pl-2 border-l-2" style={{ borderLeftColor: colors.info + '40' }}>
              {summary.questions.map((question, index) => (
                <View key={index} className="py-1.5">
                  <Text className="text-sm text-foreground">{question}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Scope of Work Section */}
        <View>
          <TouchableOpacity
            className="flex-row items-center justify-between py-2"
            onPress={() => toggleSection('scope')}
            accessibilityLabel={`Scope of work section, ${summary.scope_bullets.length} items`}
            accessibilityRole="button"
          >
            <View className="flex-row items-center gap-2">
              <ClipboardList size={18} color={colors.success} />
              <Text className="text-base font-semibold text-foreground">
                Scope of Work
              </Text>
              <View
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: colors.success + '20' }}
              >
                <Text className="text-xs font-medium" style={{ color: colors.success }}>
                  {summary.scope_bullets.length}
                </Text>
              </View>
            </View>
            {expandedSections.scope ? (
              <ChevronUp size={18} color={colors.mutedForeground} />
            ) : (
              <ChevronDown size={18} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>

          {expandedSections.scope && (
            <View className="ml-6 pl-2 border-l-2" style={{ borderLeftColor: colors.success + '40' }}>
              {summary.scope_bullets.map((bullet, index) => (
                <View key={index} className="py-1.5">
                  <Text className="text-sm text-foreground">{bullet}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </CardContent>
    </Card>
  );
}

// Empty state when no summary is available
export function WalkthroughSummaryPlaceholder() {
  const colors = useThemeColors();

  return (
    <Card className="mb-4">
      <CardContent className="py-8 items-center">
        <View
          className="w-16 h-16 rounded-full items-center justify-center mb-4"
          style={{ backgroundColor: colors.primary + '20' }}
        >
          <Sparkles size={32} color={colors.primary} />
        </View>
        <Text className="text-base font-semibold text-foreground text-center mb-2">
          Ready to Organize
        </Text>
        <Text className="text-sm text-muted-foreground text-center px-4">
          Add photos and voice memos, then tap "AI Organize" to generate an
          intelligent summary of issues, questions, and scope of work.
        </Text>
      </CardContent>
    </Card>
  );
}

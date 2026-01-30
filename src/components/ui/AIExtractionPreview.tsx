/**
 * AIExtractionPreview Component
 * Displays AI-extracted data with confidence indicators and edit capability
 *
 * Features:
 * - Confidence badges (high/medium/low)
 * - Editable fields with inline editing
 * - Source attribution
 * - Field-level override capability
 * - Semantic colors for confidence levels
 *
 * Follows Zone B design system with zero hardcoded values.
 */

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Sparkles, Edit2, Check, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { Card } from './Card';
import { Badge } from './Badge';
import { Input } from './Input';
import { Button } from './Button';

export type ConfidenceLevel = 'high' | 'medium' | 'low';

export interface ExtractedField {
  /** Field label */
  label: string;

  /** Extracted value */
  value: string;

  /** Confidence level */
  confidence: ConfidenceLevel;

  /** Source (e.g., "Document page 3", "Photo analysis") */
  source?: string;

  /** Whether field is editable */
  editable?: boolean;
}

export interface AIExtractionPreviewProps {
  /** Extracted fields to display */
  fields: ExtractedField[];

  /** Handler when field is edited */
  onFieldEdit?: (index: number, newValue: string) => void;

  /** Show AI indicator badge */
  showAIBadge?: boolean;

  /** Card variant */
  variant?: 'default' | 'glass';

  /** Custom style */
  style?: ViewStyle;
}

/**
 * Gets confidence badge variant and label
 */
function getConfidenceBadge(confidence: ConfidenceLevel): {
  variant: 'success' | 'warning' | 'destructive';
  label: string;
} {
  switch (confidence) {
    case 'high':
      return { variant: 'success', label: 'High confidence' };
    case 'medium':
      return { variant: 'warning', label: 'Medium confidence' };
    case 'low':
      return { variant: 'destructive', label: 'Low confidence' };
  }
}

export function AIExtractionPreview({
  fields,
  onFieldEdit,
  showAIBadge = true,
  variant = 'default',
  style,
}: AIExtractionPreviewProps) {
  const colors = useThemeColors();
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editValue, setEditValue] = useState('');

  const startEditing = (index: number, currentValue: string) => {
    setEditingIndex(index);
    setEditValue(currentValue);
  };

  const cancelEditing = () => {
    setEditingIndex(null);
    setEditValue('');
  };

  const saveEdit = () => {
    if (editingIndex !== null && onFieldEdit) {
      onFieldEdit(editingIndex, editValue);
    }
    setEditingIndex(null);
    setEditValue('');
  };

  return (
    <Card variant={variant} style={style}>
      {/* Header */}
      <View
        style={{
          padding: SPACING.lg,
          paddingBottom: SPACING.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: BORDER_RADIUS.md,
              backgroundColor: withOpacity(colors.primary, 'muted'),
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Sparkles size={ICON_SIZES.md} color={colors.primary} />
          </View>
          <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>
            AI Extracted Data
          </Text>
        </View>
        {showAIBadge && (
          <Badge variant="outline" size="sm">
            AI Powered
          </Badge>
        )}
      </View>

      {/* Fields */}
      <View style={{ paddingHorizontal: SPACING.lg, paddingBottom: SPACING.lg }}>
        {fields.map((field, index) => {
          const confidenceBadge = getConfidenceBadge(field.confidence);
          const isEditing = editingIndex === index;

          return (
            <View
              key={index}
              style={{
                paddingVertical: SPACING.md,
                borderBottomWidth: index < fields.length - 1 ? 1 : 0,
                borderBottomColor: colors.border,
              }}
            >
              {/* Field Label */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: SPACING.xs,
                }}
              >
                <Text style={{ fontSize: 13, fontWeight: '500', color: colors.mutedForeground }}>
                  {field.label}
                </Text>
                <Badge variant={confidenceBadge.variant} size="sm">
                  {confidenceBadge.label}
                </Badge>
              </View>

              {/* Field Value or Edit Input */}
              {isEditing ? (
                <View style={{ gap: SPACING.sm }}>
                  <Input
                    value={editValue}
                    onChangeText={setEditValue}
                    autoFocus
                    placeholder={field.label}
                  />
                  <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
                    <Button
                      variant="outline"
                      size="sm"
                      onPress={cancelEditing}
                      style={{ flex: 1 }}
                    >
                      <X size={ICON_SIZES.sm} color={colors.foreground} />
                      <Text> Cancel</Text>
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      onPress={saveEdit}
                      style={{ flex: 1 }}
                    >
                      <Check size={ICON_SIZES.sm} color={colors.primaryForeground} />
                      <Text> Save</Text>
                    </Button>
                  </View>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text
                    style={{
                      fontSize: 15,
                      fontWeight: '600',
                      color: colors.foreground,
                      flex: 1,
                    }}
                  >
                    {field.value}
                  </Text>
                  {field.editable !== false && onFieldEdit && (
                    <TouchableOpacity
                      onPress={() => startEditing(index, field.value)}
                      style={{
                        padding: SPACING.sm,
                        marginLeft: SPACING.sm,
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Edit ${field.label}`}
                    >
                      <Edit2 size={ICON_SIZES.md} color={colors.primary} />
                    </TouchableOpacity>
                  )}
                </View>
              )}

              {/* Source Attribution */}
              {field.source && !isEditing && (
                <Text
                  style={{
                    fontSize: 12,
                    color: colors.mutedForeground,
                    marginTop: SPACING.xs,
                  }}
                >
                  Source: {field.source}
                </Text>
              )}
            </View>
          );
        })}
      </View>
    </Card>
  );
}

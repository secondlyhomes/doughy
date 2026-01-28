// src/features/rental-inbox/components/AIReviewCard.tsx
// Card component for reviewing pending AI-generated responses

import React, { memo, useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { Bot, Check, X, Pencil, Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Button } from '@/components/ui/Button';
import {
  SPACING,
  BORDER_RADIUS,
  FONT_SIZES,
  LINE_HEIGHTS,
} from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import type { AIResponseQueueItem } from '@/stores/rental-conversations-store';

interface AIReviewCardProps {
  pendingResponse: AIResponseQueueItem;
  onApprove: (editedResponse?: string) => void;
  onReject: () => void;
  isProcessing?: boolean;
}

function getConfidenceLabel(confidence: number): {
  label: string;
  color: 'success' | 'warning' | 'destructive';
} {
  if (confidence >= 0.8) {
    return { label: 'High confidence', color: 'success' };
  } else if (confidence >= 0.5) {
    return { label: 'Medium confidence', color: 'warning' };
  }
  return { label: 'Low confidence', color: 'destructive' };
}

export const AIReviewCard = memo(function AIReviewCard({
  pendingResponse,
  onApprove,
  onReject,
  isProcessing = false,
}: AIReviewCardProps) {
  const colors = useThemeColors();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(pendingResponse.suggested_response);

  const confidenceInfo = getConfidenceLabel(pendingResponse.confidence);
  const confidencePercentage = Math.round(pendingResponse.confidence * 100);

  const handleApprove = () => {
    if (isEditing && editedText !== pendingResponse.suggested_response) {
      onApprove(editedText);
    } else {
      onApprove();
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(pendingResponse.suggested_response);
  };

  const getConfidenceColor = () => {
    switch (confidenceInfo.color) {
      case 'success':
        return colors.success;
      case 'warning':
        return colors.warning;
      case 'destructive':
        return colors.destructive;
    }
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.card,
          borderColor: colors.info,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: withOpacity(colors.info, 'medium') },
            ]}
          >
            <Bot size={16} color={colors.info} />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            AI Suggested Response
          </Text>
        </View>

        {/* Confidence indicator */}
        <View
          style={[
            styles.confidenceBadge,
            { backgroundColor: withOpacity(getConfidenceColor(), 'light') },
          ]}
        >
          <Sparkles size={12} color={getConfidenceColor()} />
          <Text
            style={[styles.confidenceText, { color: getConfidenceColor() }]}
          >
            {confidencePercentage}%
          </Text>
        </View>
      </View>

      {/* Confidence label */}
      <Text style={[styles.confidenceLabel, { color: colors.mutedForeground }]}>
        {confidenceInfo.label}
        {pendingResponse.reason && ` - ${pendingResponse.reason}`}
      </Text>

      {/* Suggested response text */}
      <View
        style={[
          styles.responseContainer,
          { backgroundColor: withOpacity(colors.info, 'subtle') },
        ]}
      >
        {isEditing ? (
          <TextInput
            style={[
              styles.responseInput,
              {
                color: colors.foreground,
                borderColor: colors.primary,
              },
            ]}
            value={editedText}
            onChangeText={setEditedText}
            multiline
            autoFocus
            textAlignVertical="top"
            placeholderTextColor={colors.mutedForeground}
          />
        ) : (
          <Text style={[styles.responseText, { color: colors.foreground }]}>
            {pendingResponse.suggested_response}
          </Text>
        )}
      </View>

      {/* Action buttons */}
      <View style={styles.actions}>
        {isEditing ? (
          <>
            <Button
              variant="ghost"
              size="sm"
              onPress={handleCancelEdit}
              disabled={isProcessing}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              size="sm"
              onPress={handleApprove}
              disabled={isProcessing}
              loading={isProcessing}
            >
              <Check size={14} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground, marginLeft: 4 }}>
                Send Edited
              </Text>
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="ghost"
              size="sm"
              onPress={onReject}
              disabled={isProcessing}
            >
              <X size={14} color={colors.destructive} />
              <Text style={{ color: colors.destructive, marginLeft: 4 }}>
                Reject
              </Text>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onPress={handleEdit}
              disabled={isProcessing}
            >
              <Pencil size={14} color={colors.foreground} />
              <Text style={{ color: colors.foreground, marginLeft: 4 }}>
                Edit
              </Text>
            </Button>
            <Button
              variant="default"
              size="sm"
              onPress={handleApprove}
              disabled={isProcessing}
              loading={isProcessing}
            >
              <Check size={14} color={colors.primaryForeground} />
              <Text style={{ color: colors.primaryForeground, marginLeft: 4 }}>
                Approve
              </Text>
            </Button>
          </>
        )}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    borderWidth: 2,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    marginHorizontal: SPACING.md,
    marginBottom: SPACING.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  confidenceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    gap: 4,
  },
  confidenceText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
  },
  confidenceLabel: {
    fontSize: FONT_SIZES.xs,
    marginBottom: SPACING.sm,
  },
  responseContainer: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  responseText: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
  },
  responseInput: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.normal,
    borderWidth: 1,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
    minHeight: 80,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
});

export default AIReviewCard;

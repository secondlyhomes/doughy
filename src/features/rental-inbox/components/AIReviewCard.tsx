// src/features/rental-inbox/components/AIReviewCard.tsx
// Card component for reviewing pending AI-generated responses
// Enhanced with review time tracking and edit severity detection for adaptive learning

import React, { memo, useState, useRef, useEffect } from 'react';
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
import type {
  AIResponseQueueItem,
  EditSeverity,
  ApprovalMetadata
} from '@/stores/rental-conversations-store';

// Re-export types for convenience
export type { EditSeverity, ApprovalMetadata };

/**
 * Calculate edit severity by comparing original and edited responses
 * Uses Levenshtein-inspired metric and semantic checks
 */
export function calculateEditSeverity(original: string, edited: string): EditSeverity {
  if (!edited || edited === original) return 'none';

  const originalNormalized = original.toLowerCase().trim();
  const editedNormalized = edited.toLowerCase().trim();

  // If they're the same after normalization, it's just formatting
  if (originalNormalized === editedNormalized) return 'none';

  // Calculate length difference percentage
  const lenDiff = Math.abs(edited.length - original.length);
  const lenDiffPercent = lenDiff / Math.max(original.length, 1);

  // Count word changes
  const originalWords = originalNormalized.split(/\s+/);
  const editedWords = editedNormalized.split(/\s+/);
  const originalWordSet = new Set(originalWords);
  const editedWordSet = new Set(editedWords);

  // Words added or removed
  let changedWords = 0;
  for (const word of editedWords) {
    if (!originalWordSet.has(word)) changedWords++;
  }
  for (const word of originalWords) {
    if (!editedWordSet.has(word)) changedWords++;
  }
  const wordChangePercent = changedWords / Math.max(originalWords.length + editedWords.length, 1);

  // Major if:
  // - More than 40% of content length changed
  // - More than 30% of words changed
  // - Response was completely rewritten (very different length)
  if (lenDiffPercent > 0.4 || wordChangePercent > 0.3 || lenDiffPercent > 0.6) {
    return 'major';
  }

  // Minor if any meaningful change occurred
  if (lenDiffPercent > 0.05 || wordChangePercent > 0.1 || changedWords > 0) {
    return 'minor';
  }

  return 'none';
}

interface AIReviewCardProps {
  pendingResponse: AIResponseQueueItem;
  onApprove: (metadata: ApprovalMetadata) => void;
  onReject: (responseTimeSeconds: number) => void;
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

  // Track when the card was first displayed for review time calculation
  const displayTimeRef = useRef<number>(Date.now());

  // Reset display time when pending response changes
  useEffect(() => {
    displayTimeRef.current = Date.now();
    setEditedText(pendingResponse.suggested_response);
    setIsEditing(false);
  }, [pendingResponse.id]);

  const confidenceInfo = getConfidenceLabel(pendingResponse.confidence);
  const confidencePercentage = Math.round(pendingResponse.confidence * 100);

  // Calculate response time in seconds
  const getResponseTimeSeconds = () => {
    return Math.round((Date.now() - displayTimeRef.current) / 1000);
  };

  const handleApprove = () => {
    const responseTimeSeconds = getResponseTimeSeconds();
    const wasEdited = isEditing && editedText !== pendingResponse.suggested_response;
    const editSeverity = wasEdited
      ? calculateEditSeverity(pendingResponse.suggested_response, editedText)
      : 'none';

    onApprove({
      editedResponse: wasEdited ? editedText : undefined,
      editSeverity,
      responseTimeSeconds,
    });
  };

  const handleReject = () => {
    const responseTimeSeconds = getResponseTimeSeconds();
    onReject(responseTimeSeconds);
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
              onPress={handleReject}
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

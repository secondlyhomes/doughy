// src/features/lead-inbox/components/LeadAIReviewCard.tsx
// Card component for reviewing pending AI-generated responses for leads
// Enhanced with adaptive learning features: confidence display, auto-send toggle, feedback

import React, { memo, useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Switch } from 'react-native';
import {
  Bot,
  Check,
  X,
  Pencil,
  Sparkles,
  Info,
  ThumbsUp,
  ThumbsDown,
  Zap,
} from 'lucide-react-native';
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
  InvestorAIQueueItem,
  EditSeverity,
  ApprovalMetadata,
  AIConfidenceRecord,
} from '@/stores/investor-conversations-store';

// Re-export types for convenience
export type { EditSeverity, ApprovalMetadata };

/**
 * Calculate edit severity by comparing original and edited responses
 */
export function calculateEditSeverity(original: string, edited: string): EditSeverity {
  if (!edited || edited === original) return 'none';

  const originalNormalized = original.toLowerCase().trim();
  const editedNormalized = edited.toLowerCase().trim();

  if (originalNormalized === editedNormalized) return 'none';

  const lenDiff = Math.abs(edited.length - original.length);
  const lenDiffPercent = lenDiff / Math.max(original.length, 1);

  const originalWords = originalNormalized.split(/\s+/);
  const editedWords = editedNormalized.split(/\s+/);
  const originalWordSet = new Set(originalWords);
  const editedWordSet = new Set(editedWords);

  let changedWords = 0;
  for (const word of editedWords) {
    if (!originalWordSet.has(word)) changedWords++;
  }
  for (const word of originalWords) {
    if (!editedWordSet.has(word)) changedWords++;
  }
  const wordChangePercent = changedWords / Math.max(originalWords.length + editedWords.length, 1);

  if (lenDiffPercent > 0.4 || wordChangePercent > 0.3 || lenDiffPercent > 0.6) {
    return 'major';
  }

  if (lenDiffPercent > 0.05 || wordChangePercent > 0.1 || changedWords > 0) {
    return 'minor';
  }

  return 'none';
}

interface LeadAIReviewCardProps {
  pendingResponse: InvestorAIQueueItem;
  confidenceRecord?: AIConfidenceRecord;
  leadSituation?: string;
  onApprove: (metadata: ApprovalMetadata) => void;
  onReject: (responseTimeSeconds: number) => void;
  onToggleAutoSend?: (enabled: boolean) => void;
  isProcessing?: boolean;
  showAutoSendToggle?: boolean;
}

function getConfidenceLabel(confidence: number): {
  label: string;
  color: 'success' | 'warning' | 'destructive';
} {
  if (confidence >= 0.85) {
    return { label: 'High confidence', color: 'success' };
  } else if (confidence >= 0.6) {
    return { label: 'Medium confidence', color: 'warning' };
  }
  return { label: 'Low confidence', color: 'destructive' };
}

export const LeadAIReviewCard = memo(function LeadAIReviewCard({
  pendingResponse,
  confidenceRecord,
  leadSituation,
  onApprove,
  onReject,
  onToggleAutoSend,
  isProcessing = false,
  showAutoSendToggle = false,
}: LeadAIReviewCardProps) {
  const colors = useThemeColors();
  const [isEditing, setIsEditing] = useState(false);
  const [editedText, setEditedText] = useState(pendingResponse.suggested_response);
  const [showReasoning, setShowReasoning] = useState(false);

  // Track when the card was first displayed for review time calculation
  const displayTimeRef = useRef<number>(Date.now());

  // Reset display time when pending response changes
  useEffect(() => {
    displayTimeRef.current = Date.now();
    setEditedText(pendingResponse.suggested_response);
    setIsEditing(false);
    setShowReasoning(false);
  }, [pendingResponse.id]);

  const confidenceInfo = getConfidenceLabel(pendingResponse.confidence);
  const confidencePercentage = Math.round(pendingResponse.confidence * 100);

  // Check if auto-send is available (confidence >= 85%)
  const canAutoSend = pendingResponse.confidence >= 0.85;
  const isAutoSendEnabled = confidenceRecord?.auto_send_enabled ?? false;

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
          <View>
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              AI Suggested Response
            </Text>
            {leadSituation && leadSituation !== 'general' && (
              <Text style={[styles.situationLabel, { color: colors.mutedForeground }]}>
                for {leadSituation} leads
              </Text>
            )}
          </View>
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

      {/* Confidence label and learning stats */}
      <View style={styles.confidenceRow}>
        <Text style={[styles.confidenceLabel, { color: colors.mutedForeground }]}>
          {confidenceInfo.label}
        </Text>
        {confidenceRecord && (
          <Text style={[styles.statsText, { color: colors.mutedForeground }]}>
            {confidenceRecord.total_approvals} approved, {confidenceRecord.total_edits} edited
          </Text>
        )}
      </View>

      {/* Auto-send toggle (only shown when confidence is high enough) */}
      {showAutoSendToggle && canAutoSend && onToggleAutoSend && (
        <View
          style={[
            styles.autoSendRow,
            { backgroundColor: withOpacity(colors.success, 'subtle') },
          ]}
        >
          <View style={styles.autoSendInfo}>
            <Zap size={16} color={colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.autoSendTitle, { color: colors.foreground }]}>
                Fire & Forget Mode
              </Text>
              <Text style={[styles.autoSendDescription, { color: colors.mutedForeground }]}>
                Auto-send high-confidence responses for this lead type
              </Text>
            </View>
          </View>
          <Switch
            value={isAutoSendEnabled}
            onValueChange={onToggleAutoSend}
            trackColor={{ false: colors.muted, true: colors.success }}
            thumbColor={colors.background}
          />
        </View>
      )}

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

      {/* Reasoning section (expandable) */}
      {pendingResponse.reasoning && (
        <View style={styles.reasoningSection}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => setShowReasoning(!showReasoning)}
            style={{ alignSelf: 'flex-start' }}
          >
            <Info size={14} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground, marginLeft: 4, fontSize: FONT_SIZES.xs }}>
              {showReasoning ? 'Hide reasoning' : 'Why this response?'}
            </Text>
          </Button>

          {showReasoning && (
            <View
              style={[
                styles.reasoningBox,
                { backgroundColor: colors.muted },
              ]}
            >
              <Text style={[styles.reasoningText, { color: colors.mutedForeground }]}>
                {pendingResponse.reasoning}
              </Text>
              {pendingResponse.detected_topics && pendingResponse.detected_topics.length > 0 && (
                <View style={styles.topicsRow}>
                  <Text style={[styles.topicsLabel, { color: colors.mutedForeground }]}>
                    Topics detected:
                  </Text>
                  {pendingResponse.detected_topics.map((topic) => (
                    <View
                      key={topic}
                      style={[
                        styles.topicBadge,
                        { backgroundColor: withOpacity(colors.info, 'light') },
                      ]}
                    >
                      <Text style={[styles.topicText, { color: colors.info }]}>
                        {topic}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}

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
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    flex: 1,
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
  situationLabel: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
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
  confidenceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  confidenceLabel: {
    fontSize: FONT_SIZES.xs,
  },
  statsText: {
    fontSize: FONT_SIZES['2xs'],
  },
  autoSendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  autoSendInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    flex: 1,
    marginRight: SPACING.sm,
  },
  autoSendTitle: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '600',
  },
  autoSendDescription: {
    fontSize: FONT_SIZES.xs,
    marginTop: 2,
  },
  responseContainer: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
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
  reasoningSection: {
    marginBottom: SPACING.sm,
  },
  reasoningBox: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.sm,
    marginTop: SPACING.xs,
  },
  reasoningText: {
    fontSize: FONT_SIZES.sm,
    lineHeight: FONT_SIZES.sm * LINE_HEIGHTS.normal,
  },
  topicsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  topicsLabel: {
    fontSize: FONT_SIZES.xs,
    marginRight: 4,
  },
  topicBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BORDER_RADIUS.sm,
  },
  topicText: {
    fontSize: FONT_SIZES['2xs'],
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: SPACING.sm,
  },
});

export default LeadAIReviewCard;

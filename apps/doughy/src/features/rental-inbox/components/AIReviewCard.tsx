// src/features/rental-inbox/components/AIReviewCard.tsx
// Card component for reviewing pending AI-generated responses
// Enhanced with review time tracking and edit severity detection for adaptive learning

import React, { memo, useState, useRef, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Bot, Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { calculateEditSeverity, getConfidenceLabel } from './ai-review-utils';
import { AIReviewActions } from './AIReviewActions';
import { styles } from './ai-review-styles';
import type { AIReviewCardProps } from './ai-review-types';

// Re-export for consumers
export { calculateEditSeverity } from './ai-review-utils';
export type { EditSeverity, ApprovalMetadata } from './ai-review-types';

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
        {pendingResponse.reasoning && ` - ${pendingResponse.reasoning}`}
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
      <AIReviewActions
        isEditing={isEditing}
        isProcessing={isProcessing}
        onApprove={handleApprove}
        onReject={handleReject}
        onEdit={handleEdit}
        onCancelEdit={handleCancelEdit}
      />
    </View>
  );
});

export default AIReviewCard;

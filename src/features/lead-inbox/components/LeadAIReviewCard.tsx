// src/features/lead-inbox/components/LeadAIReviewCard.tsx
// Card component for reviewing pending AI-generated responses for leads
// Enhanced with adaptive learning features: confidence display, auto-send toggle, feedback

import React, { memo, useState, useRef, useEffect } from 'react';
import { View, Text, TextInput } from 'react-native';
import { Bot, Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import type {
  InvestorAIQueueItem,
  EditSeverity,
  ApprovalMetadata,
  AIConfidenceRecord,
} from '@/stores/investor-conversations-store';

import {
  AutoSendToggle,
  ReasoningSection,
  ActionButtons,
  styles,
  calculateEditSeverity,
  getConfidenceLabel,
} from './lead-ai-review-card';

// Re-export types and utils for backward compatibility
export type { EditSeverity, ApprovalMetadata };
export { calculateEditSeverity };

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

  // Check if auto-send is available (confidence >= 85%)
  const canAutoSend = pendingResponse.confidence >= 0.85;
  const isAutoSendEnabled = confidenceRecord?.auto_send_enabled ?? false;

  const getResponseTimeSeconds = () => {
    return Math.round((Date.now() - displayTimeRef.current) / 1000);
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

  const handleEdit = () => setIsEditing(true);

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedText(pendingResponse.suggested_response);
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.card, borderColor: colors.info },
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
          <Text style={[styles.confidenceText, { color: getConfidenceColor() }]}>
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
            {confidenceRecord.total_approvals} approved, {confidenceRecord.total_edits}{' '}
            edited
          </Text>
        )}
      </View>

      {/* Auto-send toggle (only shown when confidence is high enough) */}
      {showAutoSendToggle && canAutoSend && onToggleAutoSend && (
        <AutoSendToggle isEnabled={isAutoSendEnabled} onToggle={onToggleAutoSend} />
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
              { color: colors.foreground, borderColor: colors.primary },
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
        <ReasoningSection
          reasoning={pendingResponse.reasoning}
          detectedTopics={pendingResponse.detected_topics}
        />
      )}

      {/* Action buttons */}
      <ActionButtons
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

export default LeadAIReviewCard;

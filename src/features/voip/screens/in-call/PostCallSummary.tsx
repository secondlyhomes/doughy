// src/features/voip/screens/in-call/PostCallSummary.tsx
// Post-call summary view component

import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, StatusBar } from 'react-native';
import { X, Check, Phone, FileText, Sparkles, ChevronRight } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { MOCK_EXTRACTED_DATA } from '../../config';
import { formatDuration } from './utils';
import type { TranscriptSegment } from '../../types';

interface PostCallSummaryProps {
  duration: number;
  contactName: string;
  transcript: TranscriptSegment[];
  topInset: number;
  bottomInset: number;
  onDismiss: () => void;
  onApply: () => void;
}

export function PostCallSummary({
  duration,
  contactName,
  transcript,
  topInset,
  bottomInset,
  onDismiss,
  onApply,
}: PostCallSummaryProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.container, { paddingTop: topInset, paddingBottom: bottomInset }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={['#1a1a2e', '#16213e', '#0f3460']}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Header */}
      <View style={styles.summaryHeader}>
        <TouchableOpacity onPress={onDismiss} style={styles.closeButton}>
          <X size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.summaryTitle}>Call Summary</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.summaryScroll} contentContainerStyle={styles.summaryContent}>
        {/* Call Info */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <Phone size={18} color={colors.primary} />
            <Text style={styles.summaryCardTitle}>Call Details</Text>
          </View>
          <Text style={styles.summaryText}>Duration: {formatDuration(duration)}</Text>
          <Text style={styles.summaryText}>Contact: {contactName}</Text>
        </View>

        {/* Transcript Preview */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <FileText size={18} color={colors.primary} />
            <Text style={styles.summaryCardTitle}>Transcript</Text>
          </View>
          {transcript.length > 0 ? (
            transcript.slice(0, 4).map((segment, index) => (
              <View key={segment.id || index} style={styles.transcriptLine}>
                <Text style={styles.transcriptSpeaker}>
                  {segment.speaker === 'user' ? 'You' : 'Contact'}:
                </Text>
                <Text style={styles.transcriptText}>{segment.text}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.summaryTextMuted}>No transcript available</Text>
          )}
          {transcript.length > 4 && (
            <Text style={styles.summaryTextMuted}>...and {transcript.length - 4} more lines</Text>
          )}
        </View>

        {/* Extracted Data */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <Sparkles size={18} color={colors.primary} />
            <Text style={styles.summaryCardTitle}>AI Extracted Data</Text>
          </View>

          <Text style={styles.extractedLabel}>Contact Info</Text>
          <Text style={styles.summaryText}>• Name: {MOCK_EXTRACTED_DATA.contact.name}</Text>
          <Text style={styles.summaryText}>• Relationship: {MOCK_EXTRACTED_DATA.contact.relationship}</Text>

          <Text style={[styles.extractedLabel, { marginTop: SPACING.sm }]}>Property Details</Text>
          <Text style={styles.summaryText}>• {MOCK_EXTRACTED_DATA.property.bedrooms} bed, {MOCK_EXTRACTED_DATA.property.bathrooms} bath</Text>
          <Text style={styles.summaryText}>• {MOCK_EXTRACTED_DATA.property.sqft} sqft, built {MOCK_EXTRACTED_DATA.property.yearBuilt}</Text>
          <Text style={styles.summaryText}>• Condition: {MOCK_EXTRACTED_DATA.property.condition}</Text>

          <Text style={[styles.extractedLabel, { marginTop: SPACING.sm }]}>Deal Info</Text>
          <Text style={styles.summaryText}>• Asking: ${MOCK_EXTRACTED_DATA.deal.askingPrice.toLocaleString()}</Text>
          <Text style={styles.summaryText}>• Motivation: {MOCK_EXTRACTED_DATA.deal.motivation}</Text>
          <Text style={styles.summaryText}>• Timeline: {MOCK_EXTRACTED_DATA.deal.timeline}</Text>
        </View>

        {/* Suggested Actions */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryCardHeader}>
            <ChevronRight size={18} color={colors.primary} />
            <Text style={styles.summaryCardTitle}>Suggested Next Steps</Text>
          </View>
          {MOCK_EXTRACTED_DATA.suggestedActions.map((action, index) => (
            <View key={index} style={styles.actionItem}>
              <View style={[
                styles.priorityBadge,
                { backgroundColor: action.priority === 'high' ? colors.destructive : colors.warning }
              ]}>
                <Text style={styles.priorityText}>{action.priority}</Text>
              </View>
              <Text style={styles.actionText}>{action.action}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.summaryActions}>
        <TouchableOpacity
          style={[styles.summaryButton, styles.dismissButton]}
          onPress={onDismiss}
        >
          <X size={20} color="#FFFFFF" />
          <Text style={styles.summaryButtonText}>Dismiss</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.summaryButton, styles.applyButton, { backgroundColor: colors.primary }]}
          onPress={onApply}
        >
          <Check size={20} color="#FFFFFF" />
          <Text style={styles.summaryButtonText}>Apply to Lead</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryScroll: {
    flex: 1,
  },
  summaryContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
  },
  summaryCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  summaryCardTitle: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  summaryText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  summaryTextMuted: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.5)',
    fontStyle: 'italic',
  },
  transcriptLine: {
    marginBottom: SPACING.xs,
  },
  transcriptSpeaker: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginBottom: 2,
  },
  transcriptText: {
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  extractedLabel: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  priorityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  actionText: {
    flex: 1,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  summaryActions: {
    flexDirection: 'row',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  summaryButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    gap: SPACING.xs,
  },
  dismissButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  applyButton: {},
  summaryButtonText: {
    fontSize: FONT_SIZES.md,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

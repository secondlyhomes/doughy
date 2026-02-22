// src/features/lead-inbox/components/MessageFeedbackRow.tsx
// Thumbs up/down feedback row for AI-sent messages

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ThumbsUp, ThumbsDown } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { styles } from './lead-message-bubble-styles';
import type { FeedbackType } from './lead-message-bubble-types';

interface MessageFeedbackRowProps {
  feedbackGiven: FeedbackType | null;
  onFeedback: (feedback: FeedbackType) => void;
}

export const MessageFeedbackRow = ({
  feedbackGiven,
  onFeedback,
}: MessageFeedbackRowProps) => {
  const colors = useThemeColors();

  return (
    <View style={styles.feedbackRow}>
      <Text style={[styles.feedbackLabel, { color: colors.mutedForeground }]}>
        Was this helpful?
      </Text>
      <View style={styles.feedbackButtons}>
        <TouchableOpacity
          onPress={() => onFeedback('thumbs_up')}
          disabled={!!feedbackGiven}
          style={[
            styles.feedbackButton,
            feedbackGiven === 'thumbs_up' && {
              backgroundColor: withOpacity(colors.success, 'light'),
            },
          ]}
        >
          <ThumbsUp
            size={14}
            color={feedbackGiven === 'thumbs_up' ? colors.success : colors.mutedForeground}
          />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onFeedback('thumbs_down')}
          disabled={!!feedbackGiven}
          style={[
            styles.feedbackButton,
            feedbackGiven === 'thumbs_down' && {
              backgroundColor: withOpacity(colors.destructive, 'light'),
            },
          ]}
        >
          <ThumbsDown
            size={14}
            color={feedbackGiven === 'thumbs_down' ? colors.destructive : colors.mutedForeground}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

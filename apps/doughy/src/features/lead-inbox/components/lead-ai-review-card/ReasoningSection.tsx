// src/features/lead-inbox/components/lead-ai-review-card/ReasoningSection.tsx
// Expandable reasoning display for AI response

import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { Info } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Button } from '@/components/ui/Button';
import { FONT_SIZES } from '@/constants/design-tokens';
import { styles } from './styles';

interface ReasoningSectionProps {
  reasoning: string;
  detectedTopics?: string[];
}

export function ReasoningSection({ reasoning, detectedTopics }: ReasoningSectionProps) {
  const colors = useThemeColors();
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <View style={styles.reasoningSection}>
      <Button
        variant="ghost"
        size="sm"
        onPress={() => setShowReasoning(!showReasoning)}
        style={{ alignSelf: 'flex-start' }}
      >
        <Info size={14} color={colors.mutedForeground} />
        <Text
          style={{
            color: colors.mutedForeground,
            marginLeft: 4,
            fontSize: FONT_SIZES.xs,
          }}
        >
          {showReasoning ? 'Hide reasoning' : 'Why this response?'}
        </Text>
      </Button>

      {showReasoning && (
        <View
          style={[styles.reasoningBox, { backgroundColor: colors.muted }]}
        >
          <Text style={[styles.reasoningText, { color: colors.mutedForeground }]}>
            {reasoning}
          </Text>
          {detectedTopics && detectedTopics.length > 0 && (
            <View style={styles.topicsRow}>
              <Text style={[styles.topicsLabel, { color: colors.mutedForeground }]}>
                Topics detected:
              </Text>
              {detectedTopics.map((topic) => (
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
  );
}

// src/features/vendors/components/MessageContentSection.tsx
// Message content form section for MessageVendorSheet

import React from 'react';
import { View, Text } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheetSection, Input, FormField } from '@/components/ui';
import { FONT_SIZES } from '@/constants/design-tokens';
import { MessageChannel } from './message-vendor-types';

export interface MessageContentSectionProps {
  channel: MessageChannel;
  subject: string;
  body: string;
  aiComposed: boolean;
  onSubjectChange: (text: string) => void;
  onBodyChange: (text: string) => void;
}

export function MessageContentSection({
  channel,
  subject,
  body,
  aiComposed,
  onSubjectChange,
  onBodyChange,
}: MessageContentSectionProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Message">
      {channel === 'email' && (
        <FormField label="Subject" required className="mb-3">
          <Input
            value={subject}
            onChangeText={onSubjectChange}
            placeholder="Enter subject..."
          />
        </FormField>
      )}

      <FormField label={channel === 'phone' ? 'Call Script' : 'Message'} required>
        <Input
          value={body}
          onChangeText={onBodyChange}
          placeholder={
            channel === 'phone'
              ? 'Script to read during call...'
              : 'Type your message...'
          }
          multiline
          numberOfLines={8}
          style={{ minHeight: 180 }}
        />
      </FormField>

      {aiComposed && (
        <View
          className="flex-row items-center mt-2 px-2"
          style={{ opacity: 0.7 }}
        >
          <Sparkles size={12} color={colors.primary} />
          <Text
            style={{
              color: colors.primary,
              fontSize: FONT_SIZES.xs,
              marginLeft: 4,
            }}
          >
            AI composed - feel free to edit
          </Text>
        </View>
      )}
    </BottomSheetSection>
  );
}

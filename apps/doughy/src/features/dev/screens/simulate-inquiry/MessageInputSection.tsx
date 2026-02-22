// src/features/dev/screens/simulate-inquiry/MessageInputSection.tsx
// Message textarea with reply method warning and submit button

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import { Play, Loader2 } from 'lucide-react-native';

import { Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';

import type { PlatformConfig } from './types';

interface MessageInputSectionProps {
  messageContent: string;
  platformConfig: PlatformConfig;
  isCreating: boolean;
  onMessageContentChange: (text: string) => void;
  onCreateInquiry: () => void;
}

export function MessageInputSection({
  messageContent,
  platformConfig,
  isCreating,
  onMessageContentChange,
  onCreateInquiry,
}: MessageInputSectionProps) {
  const colors = useThemeColors();

  return (
    <>
      {/* Message Content */}
      <View style={{ marginBottom: SPACING.lg }}>
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
          Message *
        </Text>
        <View
          style={{
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: colors.muted,
            borderWidth: 1,
            borderColor: colors.border,
            minHeight: 120,
          }}
        >
          <TextInput
            value={messageContent}
            onChangeText={onMessageContentChange}
            placeholder="The inquiry message from the prospective tenant..."
            placeholderTextColor={colors.mutedForeground}
            multiline
            textAlignVertical="top"
            style={{ flex: 1, color: colors.foreground }}
          />
        </View>
      </View>

      {/* Reply Method Info */}
      {platformConfig.replyMethod === 'platform_only' && (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            padding: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: withOpacity(colors.warning, 'light'),
            marginBottom: SPACING.md,
          }}
        >
          <Text style={{ color: colors.warning, fontSize: FONT_SIZES.sm }}>
            {platformConfig.name} requires in-platform messaging. The approved response will be shown for you to copy.
          </Text>
        </View>
      )}

      {/* Create Button */}
      <Button onPress={onCreateInquiry} disabled={isCreating} className="w-full">
        {isCreating ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Loader2 size={18} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Creating...</Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
            <Play size={18} color={colors.primaryForeground} />
            <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Create Test Inquiry</Text>
          </View>
        )}
      </Button>
    </>
  );
}

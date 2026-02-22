// src/features/vendors/components/MessageSheetFooter.tsx
// Footer actions for MessageVendorSheet

import React from 'react';
import { View, Text } from 'react-native';
import { Send } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button, LoadingSpinner } from '@/components/ui';

export interface MessageSheetFooterProps {
  onCancel: () => void;
  onSend: () => void;
  isSending: boolean;
  sendDisabled: boolean;
}

export function MessageSheetFooter({
  onCancel,
  onSend,
  isSending,
  sendDisabled,
}: MessageSheetFooterProps) {
  const colors = useThemeColors();

  return (
    <View
      className="flex-row gap-3 pt-4 pb-6 px-4"
      style={{ borderTopWidth: 1, borderTopColor: colors.border }}
    >
      <Button
        variant="outline"
        onPress={onCancel}
        className="flex-1"
        disabled={isSending}
      >
        Cancel
      </Button>
      <Button
        onPress={onSend}
        className="flex-1 flex-row items-center justify-center gap-2"
        disabled={sendDisabled}
      >
        {isSending ? (
          <LoadingSpinner size="small" color="white" />
        ) : (
          <Send size={18} color="white" />
        )}
        <Text style={{ color: 'white', fontWeight: '600' }}>
          {isSending ? 'Sending...' : 'Send'}
        </Text>
      </Button>
    </View>
  );
}

// Transient error banner for conversation detail screen

import React from 'react';
import { View } from 'react-native';
import { AlertCircle } from 'lucide-react-native';

import { Alert, AlertDescription, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';

interface ConversationErrorBannerProps {
  error: string;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ConversationErrorBanner({
  error,
  onRetry,
  onDismiss,
}: ConversationErrorBannerProps) {
  const colors = useThemeColors();

  return (
    <View style={{ paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm }}>
      <Alert variant="destructive" icon={<AlertCircle size={18} color={colors.destructive} />}>
        <AlertDescription variant="destructive">{error}</AlertDescription>
        <View style={{ flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm }}>
          <Button size="sm" variant="outline" onPress={onRetry}>
            Try Again
          </Button>
          <Button size="sm" variant="ghost" onPress={onDismiss}>
            Dismiss
          </Button>
        </View>
      </Alert>
    </View>
  );
}

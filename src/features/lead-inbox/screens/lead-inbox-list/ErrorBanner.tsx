// src/features/lead-inbox/screens/lead-inbox-list/ErrorBanner.tsx
// Error/subscription error banner for the lead inbox list screen

import React from 'react';
import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';

import { Alert, AlertDescription, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING } from '@/constants/design-tokens';

export interface ErrorBannerProps {
  error: string | null;
  subscriptionError: string | null;
  onRetry: () => void;
  onDismiss: () => void;
}

export function ErrorBanner({ error, subscriptionError, onRetry, onDismiss }: ErrorBannerProps) {
  const colors = useThemeColors();

  if (!error && !subscriptionError) {
    return null;
  }

  return (
    <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
      <Alert variant="destructive" icon={<WifiOff size={18} color={colors.destructive} />}>
        <AlertDescription variant="destructive">
          {error || subscriptionError}
        </AlertDescription>
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

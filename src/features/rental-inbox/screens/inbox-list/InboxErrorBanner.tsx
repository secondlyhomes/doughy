// src/features/rental-inbox/screens/inbox-list/InboxErrorBanner.tsx
// Error/subscription error banner for InboxListScreen

import React from 'react';
import { View } from 'react-native';
import { WifiOff } from 'lucide-react-native';

import {
  Alert as AlertUI,
  AlertDescription,
  Button,
} from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';

interface InboxErrorBannerProps {
  error: string | null;
  subscriptionError: string | null;
  onRetry: () => void;
  onDismiss: () => void;
  colors: Record<string, string>;
}

export function InboxErrorBanner({
  error,
  subscriptionError,
  onRetry,
  onDismiss,
  colors,
}: InboxErrorBannerProps) {
  if (!error && !subscriptionError) return null;

  return (
    <View style={{ paddingHorizontal: SPACING.md, paddingBottom: SPACING.sm }}>
      <AlertUI variant="destructive" icon={<WifiOff size={18} color={colors.destructive} />}>
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
      </AlertUI>
    </View>
  );
}

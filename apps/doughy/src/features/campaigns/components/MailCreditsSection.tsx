// src/features/campaigns/components/MailCreditsSection.tsx
// Mail credits balance display and purchase actions

import React from 'react';
import { View, Text } from 'react-native';
import { Button, LoadingSpinner } from '@/components/ui';
import { CreditCard, AlertTriangle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { useRouter } from 'expo-router';
import { useMailCredits, formatCredits } from '../hooks/useMailCredits';

export function MailCreditsSection() {
  const colors = useThemeColors();
  const router = useRouter();
  const { data: credits, isLoading } = useMailCredits();

  const isLowBalance = (credits?.balance || 0) <= (credits?.low_balance_threshold || 50);

  return (
    <View className="mb-6">
      <View className="flex-row items-center mb-3">
        <CreditCard size={20} color={colors.primary} />
        <Text className="ml-2 text-lg font-semibold" style={{ color: colors.foreground }}>
          Mail Credits
        </Text>
      </View>

      <View className="rounded-xl p-4" style={{ backgroundColor: colors.card }}>
        {isLoading ? (
          <LoadingSpinner />
        ) : (
          <>
            <View className="flex-row items-center justify-between mb-3">
              <Text style={{ color: colors.mutedForeground }}>Current Balance</Text>
              <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
                {formatCredits(credits?.balance || 0)}
              </Text>
            </View>

            {isLowBalance && (
              <View
                className="flex-row items-center p-2 rounded-lg mb-3"
                style={{ backgroundColor: withOpacity(colors.warning, 'light') }}
              >
                <AlertTriangle size={16} color={colors.warning} />
                <Text className="ml-2 text-sm" style={{ color: colors.warning }}>
                  Low balance - consider purchasing more credits
                </Text>
              </View>
            )}

            <View className="flex-row gap-2">
              <Button
                onPress={() => router.push('/(tabs)/settings/mail-credits')}
                className="flex-1"
              >
                Buy Credits
              </Button>
              <Button
                variant="outline"
                onPress={() => router.push('/(tabs)/settings/mail-history')}
                className="flex-1"
              >
                History
              </Button>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

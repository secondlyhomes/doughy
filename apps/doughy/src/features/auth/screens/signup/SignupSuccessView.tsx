// src/features/auth/screens/signup/SignupSuccessView.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';

interface SignupSuccessViewProps {
  email: string;
  onBackToSignIn: () => void;
}

export function SignupSuccessView({ email, onBackToSignIn }: SignupSuccessViewProps) {
  const colors = useThemeColors();

  return (
    <ThemedSafeAreaView className="flex-1 justify-center items-center px-6" edges={['top']}>
      <View className="rounded-full p-6 mb-6" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
        <Check size={48} color={colors.success} />
      </View>
      <Text className="text-2xl font-bold text-center mb-4" style={{ color: colors.foreground }}>
        Check Your Email
      </Text>
      <Text className="text-center mb-8" style={{ color: colors.mutedForeground }}>
        We{'\''}ve sent a confirmation link to {email}. Please check your email to verify your account.
      </Text>
      <TouchableOpacity
        className="rounded-lg py-4 px-8"
        style={{ backgroundColor: colors.primary }}
        onPress={onBackToSignIn}
      >
        <Text className="font-semibold" style={{ color: colors.primaryForeground }}>
          Back to Sign In
        </Text>
      </TouchableOpacity>
    </ThemedSafeAreaView>
  );
}

// src/features/auth/screens/signup/SignupTermsAndSubmit.tsx

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { Check } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface SignupTermsAndSubmitProps {
  agreeToTerms: boolean;
  setAgreeToTerms: (value: boolean) => void;
  loading: boolean;
  handleSignup: () => void;
  handleLogin: () => void;
}

export function SignupTermsAndSubmit({
  agreeToTerms,
  setAgreeToTerms,
  loading,
  handleSignup,
  handleLogin,
}: SignupTermsAndSubmitProps) {
  const colors = useThemeColors();

  return (
    <>
      {/* Terms Agreement */}
      <TouchableOpacity
        className="flex-row items-start mb-2"
        onPress={() => setAgreeToTerms(!agreeToTerms)}
        disabled={loading}
      >
        <View
          className="w-5 h-5 rounded mr-3 mt-0.5 items-center justify-center"
          style={{
            backgroundColor: agreeToTerms ? colors.primary : 'transparent',
            borderWidth: 1,
            borderColor: agreeToTerms ? colors.primary : colors.border,
          }}
        >
          {agreeToTerms && <Check size={14} color={colors.primaryForeground} />}
        </View>
        <Text className="text-sm flex-1" style={{ color: colors.mutedForeground }}>
          I agree to the{' '}
          <Text
            style={{ color: colors.primary }}
            onPress={() => Linking.openURL('https://secondlyhomes.com/terms-of-service')}
          >
            Terms of Service
          </Text>
          {' '}and{' '}
          <Text
            style={{ color: colors.primary }}
            onPress={() => Linking.openURL('https://secondlyhomes.com/privacy-policy')}
          >
            Privacy Policy
          </Text>
          . I also consent to receiving text messages from Secondly Homes. Msg &amp; data rates may apply. Reply STOP to opt out.
        </Text>
      </TouchableOpacity>

      <Text className="text-xs mb-6 ml-8" style={{ color: colors.mutedForeground }}>
        SMS consent is not a condition of account creation.
      </Text>

      {/* Sign Up Button */}
      <TouchableOpacity
        className="rounded-lg py-4 items-center"
        style={{ backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }}
        onPress={handleSignup}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.primaryForeground} />
        ) : (
          <Text className="font-semibold text-base" style={{ color: colors.primaryForeground }}>
            Create Account
          </Text>
        )}
      </TouchableOpacity>

      {/* Sign In Link */}
      <View className="flex-row justify-center mt-6">
        <Text style={{ color: colors.mutedForeground }}>Already have an account? </Text>
        <TouchableOpacity onPress={handleLogin} disabled={loading}>
          <Text className="font-medium" style={{ color: colors.primary }}>Sign in</Text>
        </TouchableOpacity>
      </View>
    </>
  );
}

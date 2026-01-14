// src/features/auth/screens/VerifyEmailScreen.tsx
// Email verification screen with resend functionality

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, RefreshCw, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import {
  resendVerificationEmail,
  pollEmailVerification,
} from '../services/emailVerificationService';

const RESEND_COOLDOWN = 60; // seconds

export function VerifyEmailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, signOut, refetchProfile } = useAuth();

  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isVerified, setIsVerified] = useState(false);

  // Poll for email verification
  useEffect(() => {
    const stopPolling = pollEmailVerification(async () => {
      setIsVerified(true);
      // Refresh profile to get updated verification status
      await refetchProfile();
      // Navigate to main app after short delay
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 2000);
    });

    return stopPolling;
  }, [router, refetchProfile]);

  // Cooldown timer
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => {
        setResendCooldown(prev => prev - 1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleResendEmail = useCallback(async () => {
    if (isResending || resendCooldown > 0) return;

    setIsResending(true);
    setMessage(null);

    const result = await resendVerificationEmail();

    if (result.success) {
      setMessage({
        type: 'success',
        text: 'Verification email sent! Check your inbox.',
      });
      setResendCooldown(RESEND_COOLDOWN);
    } else {
      setMessage({
        type: 'error',
        text: result.error || 'Failed to send email. Please try again.',
      });
    }

    setIsResending(false);
  }, [isResending, resendCooldown]);

  const handleSignOut = useCallback(async () => {
    await signOut();
    router.replace('/(auth)/sign-in');
  }, [signOut, router]);

  if (isVerified) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center px-6" edges={['top']}>
        <View className="items-center">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: withOpacity(colors.success, 'medium') }}>
            <CheckCircle size={48} color={colors.success} />
          </View>
          <Text className="text-2xl font-bold text-center" style={{ color: colors.foreground }}>
            Email Verified!
          </Text>
          <Text className="text-center mt-2" style={{ color: colors.mutedForeground }}>
            Redirecting you to the app...
          </Text>
          <ActivityIndicator size="small" color={colors.info} className="mt-4" />
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="items-center mb-8">
            <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
              <Mail size={40} color={colors.info} />
            </View>
            <Text className="text-2xl font-bold text-center" style={{ color: colors.foreground }}>
              Verify Your Email
            </Text>
            <Text className="text-center mt-2" style={{ color: colors.mutedForeground }}>
              We've sent a verification link to
            </Text>
            <Text className="font-medium text-center mt-1" style={{ color: colors.foreground }}>
              {user?.email || 'your email'}
            </Text>
          </View>

          {/* Instructions */}
          <View className="rounded-lg p-4 mb-6" style={{ backgroundColor: withOpacity(colors.muted, 'opaque') }}>
            <Text className="text-sm text-center" style={{ color: colors.mutedForeground }}>
              Click the link in your email to verify your account.
              {'\n'}Check your spam folder if you don't see it.
            </Text>
          </View>

          {/* Message */}
          {message && (
            <View
              className="rounded-lg p-4 mb-6"
              style={{ backgroundColor: message.type === 'success' ? withOpacity(colors.success, 'medium') : withOpacity(colors.destructive, 'muted') }}
            >
              <Text
                className="text-sm text-center"
                style={{ color: message.type === 'success' ? colors.success : colors.destructive }}
              >
                {message.text}
              </Text>
            </View>
          )}

          {/* Resend Button */}
          <TouchableOpacity
            className="flex-row items-center justify-center py-4 rounded-lg"
            style={{ backgroundColor: resendCooldown > 0 || isResending ? colors.muted : colors.primary }}
            onPress={handleResendEmail}
            disabled={resendCooldown > 0 || isResending}
          >
            {isResending ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <>
                <RefreshCw
                  size={20}
                  color={resendCooldown > 0 ? colors.mutedForeground : colors.primaryForeground}
                />
                <Text
                  className="ml-2 font-semibold"
                  style={{ color: resendCooldown > 0 ? colors.mutedForeground : colors.primaryForeground }}
                >
                  {resendCooldown > 0
                    ? `Resend in ${resendCooldown}s`
                    : 'Resend Email'}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Checking status indicator */}
          <View className="flex-row items-center justify-center mt-6">
            <ActivityIndicator size="small" color={colors.info} />
            <Text className="text-sm ml-2" style={{ color: colors.mutedForeground }}>
              Waiting for verification...
            </Text>
          </View>

          {/* Sign out option */}
          <TouchableOpacity
            className="flex-row items-center justify-center mt-8"
            onPress={handleSignOut}
          >
            <ArrowLeft size={16} color={colors.mutedForeground} />
            <Text className="ml-1" style={{ color: colors.mutedForeground }}>
              Sign in with a different account
            </Text>
          </TouchableOpacity>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

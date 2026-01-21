// src/features/auth/screens/ForgotPasswordScreen.tsx
// Password reset screen for mobile

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Mail, AlertCircle, Check, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '@/context/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';

export function ForgotPasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false });
  const { resetPassword, isLoading } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    // Validate email
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await resetPassword(email.trim());
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to send reset email';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackToLogin = () => {
    router.push('/(auth)/sign-in');
  };

  const loading = isLoading || isSubmitting;

  // Success screen
  if (success) {
    return (
      <ThemedSafeAreaView className="flex-1 justify-center items-center px-6" edges={['top']}>
        <View className="rounded-full p-6 mb-6" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
          <Check size={48} color={colors.success} />
        </View>
        <Text className="text-2xl font-bold text-center mb-4" style={{ color: colors.foreground }}>
          Check Your Email
        </Text>
        <Text className="text-center mb-8" style={{ color: colors.mutedForeground }}>
          We've sent password reset instructions to {email}. Please check your inbox.
        </Text>
        <TouchableOpacity
          className="rounded-lg py-4 px-8"
          style={{ backgroundColor: colors.primary }}
          onPress={handleBackToLogin}
        >
          <Text className="font-semibold" style={{ color: colors.primaryForeground }}>
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
        className="flex-1"
      >
        <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-6 py-12">
          {/* Back Button */}
          <TouchableOpacity
            className="flex-row items-center mb-8"
            onPress={handleBackToLogin}
          >
            <ArrowLeft size={20} color={colors.mutedForeground} />
            <Text className="ml-2" style={{ color: colors.mutedForeground }}>Back to Sign In</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold" style={{ color: colors.foreground }}>
              Forgot Password?
            </Text>
            <Text className="text-base mt-2" style={{ color: colors.mutedForeground }}>
              No worries, we'll send you reset instructions.
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="flex-row items-center rounded-lg p-4 mb-6" style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}>
              <AlertCircle size={20} color={colors.destructive} />
              <Text className="ml-2 flex-1" style={{ color: colors.destructive }}>{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Email</Text>
            <View className="flex-row items-center rounded-lg" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
              <View className="pl-4">
                <Mail size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3"
                placeholder="name@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!loading}
                style={{ color: colors.foreground }}
              />
            </View>
          </View>

          {/* Reset Password Button */}
          <TouchableOpacity
            className="rounded-lg py-4 items-center"
            style={{ backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className="font-semibold text-base" style={{ color: colors.primaryForeground }}>
                Reset Password
              </Text>
            )}
          </TouchableOpacity>

          {/* Remember Password Link */}
          <View className="flex-row justify-center mt-6">
            <Text style={{ color: colors.mutedForeground }}>Remember your password? </Text>
            <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
              <Text className="font-medium" style={{ color: colors.primary }}>Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

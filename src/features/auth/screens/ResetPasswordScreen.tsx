// src/features/auth/screens/ResetPasswordScreen.tsx
// Reset password screen for completing password reset flow

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { withOpacity } from '@/lib/design-utils';
import {
  updatePassword,
  calculatePasswordStrength,
  validatePassword,
} from '../services/passwordResetService';
import { PasswordStrengthIndicator } from '../components/PasswordStrengthIndicator';
import { ICON_SIZES } from '@/constants/design-tokens';

export function ResetPasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false });
  const params = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(password),
    [password]
  );

  const handleResetPassword = useCallback(async () => {
    setError(null);

    // Validate password
    const validation = validatePassword(password);
    if (!validation.valid) {
      setError(validation.error || 'Invalid password');
      return;
    }

    // Check passwords match
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsSubmitting(true);

    const result = await updatePassword(password);

    if (result.success) {
      setSuccess(true);
      // Redirect to login after delay
      setTimeout(() => {
        router.replace('/(auth)/sign-in');
      }, 2000);
    } else {
      setError(result.error || 'Failed to reset password');
      setIsSubmitting(false);
    }
  }, [password, confirmPassword, router]);

  if (success) {
    return (
      <ThemedSafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: withOpacity(colors.success, 'medium') }}>
            <CheckCircle size={48} color={colors.success} />
          </View>
          <Text className="text-2xl font-bold text-center" style={{ color: colors.foreground }}>
            Password Reset!
          </Text>
          <Text className="text-center mt-2 mb-4" style={{ color: colors.mutedForeground }}>
            Your password has been successfully updated.
            {'\n'}Redirecting to sign in...
          </Text>
          <LoadingSpinner size="small" />
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1">
      <KeyboardAvoidingView
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
        className="flex-1"
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        >
          <View className="flex-1 justify-center px-6 py-12">
            {/* Header */}
            <View className="items-center mb-8">
              <View className="w-16 h-16 rounded-full items-center justify-center mb-4" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                <Lock size={ICON_SIZES['2xl']} color={colors.info} />
              </View>
              <Text className="text-2xl font-bold text-center" style={{ color: colors.foreground }}>
                Set New Password
              </Text>
              <Text className="text-center mt-2" style={{ color: colors.mutedForeground }}>
                Create a strong password for your account
              </Text>
            </View>

            {/* Error Message */}
            {error && (
              <View className="flex-row items-center rounded-lg p-4 mb-6" style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}>
                <AlertCircle size={ICON_SIZES.lg} color={colors.destructive} />
                <Text className="ml-2 flex-1" style={{ color: colors.destructive }}>{error}</Text>
              </View>
            )}

            {/* New Password Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
                New Password
              </Text>
              <View className="flex-row items-center rounded-lg" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.input }}>
                <View className="pl-4">
                  <Lock size={ICON_SIZES.lg} color={colors.mutedForeground} />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3"
                  style={{ color: colors.foreground }}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.mutedForeground}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  className="pr-4"
                  onPress={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting}
                >
                  {showPassword ? (
                    <EyeOff size={ICON_SIZES.lg} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={ICON_SIZES.lg} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
              {password.length > 0 && (
                <PasswordStrengthIndicator strength={passwordStrength} />
              )}
            </View>

            {/* Confirm Password Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
                Confirm Password
              </Text>
              <View className="flex-row items-center rounded-lg" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.input }}>
                <View className="pl-4">
                  <Lock size={ICON_SIZES.lg} color={colors.mutedForeground} />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3"
                  style={{ color: colors.foreground }}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.mutedForeground}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoComplete="new-password"
                  editable={!isSubmitting}
                />
                <TouchableOpacity
                  className="pr-4"
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={isSubmitting}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={ICON_SIZES.lg} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={ICON_SIZES.lg} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
              {confirmPassword.length > 0 && password !== confirmPassword && (
                <Text className="text-xs mt-1" style={{ color: colors.destructive }}>
                  Passwords do not match
                </Text>
              )}
              {confirmPassword.length > 0 && password === confirmPassword && (
                <Text className="text-xs mt-1" style={{ color: colors.success }}>
                  Passwords match
                </Text>
              )}
            </View>

            {/* Submit Button */}
            <Button
              onPress={handleResetPassword}
              disabled={isSubmitting}
              loading={isSubmitting}
              size="lg"
              className="w-full"
            >
              Reset Password
            </Button>

            {/* Back to Sign In */}
            <TouchableOpacity
              className="mt-6"
              onPress={() => router.replace('/(auth)/sign-in')}
              disabled={isSubmitting}
            >
              <Text className="text-center" style={{ color: colors.mutedForeground }}>
                Back to Sign In
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

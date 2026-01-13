// src/features/settings/screens/ChangePasswordScreen.tsx
// Change password screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, Button } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { changePassword } from '../services/profileService';
import {
  calculatePasswordStrength,
  validatePassword,
} from '@/features/auth/services/passwordResetService';
import { PasswordStrengthIndicator } from '@/features/auth/components/PasswordStrengthIndicator';

export function ChangePasswordScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = useMemo(
    () => calculatePasswordStrength(newPassword),
    [newPassword]
  );

  const handleChangePassword = useCallback(async () => {
    // Validate current password
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password');
      return;
    }

    // Validate new password
    const validation = validatePassword(newPassword);
    if (!validation.valid) {
      Alert.alert('Error', validation.error || 'Invalid password');
      return;
    }

    // Check passwords match
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    // Check not same as current
    if (currentPassword === newPassword) {
      Alert.alert('Error', 'New password must be different from current password');
      return;
    }

    setIsSubmitting(true);

    const result = await changePassword(currentPassword, newPassword);

    if (result.success) {
      setSuccess(true);
    } else {
      Alert.alert('Error', result.error || 'Failed to change password');
    }

    setIsSubmitting(false);
  }, [currentPassword, newPassword, confirmPassword]);

  if (success) {
    return (
      <ThemedSafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-success/20 items-center justify-center mb-6">
            <CheckCircle size={48} color={colors.success} />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">
            Password Changed!
          </Text>
          <Text className="text-muted-foreground text-center mt-2 mb-8">
            Your password has been successfully updated.
          </Text>
          <Button onPress={() => router.back()} size="lg">
            Done
          </Button>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader title="Change Password" backButton bordered />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingVertical: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Current Password */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">
              Current Password
            </Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <Lock size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="Enter current password"
                placeholderTextColor={colors.mutedForeground}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrentPassword}
                autoCapitalize="none"
                editable={!isSubmitting}
              />
              <TouchableOpacity
                className="pr-4"
                onPress={() => setShowCurrentPassword(!showCurrentPassword)}
              >
                {showCurrentPassword ? (
                  <EyeOff size={20} color={colors.mutedForeground} />
                ) : (
                  <Eye size={20} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              New Password
            </Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <Lock size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="Enter new password"
                placeholderTextColor={colors.mutedForeground}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!isSubmitting}
              />
              <TouchableOpacity
                className="pr-4"
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff size={20} color={colors.mutedForeground} />
                ) : (
                  <Eye size={20} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            </View>
            {newPassword.length > 0 && (
              <PasswordStrengthIndicator strength={passwordStrength} />
            )}
          </View>

          {/* Confirm New Password */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">
              Confirm New Password
            </Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <Lock size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
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
              >
                {showConfirmPassword ? (
                  <EyeOff size={20} color={colors.mutedForeground} />
                ) : (
                  <Eye size={20} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text className="text-xs text-destructive mt-1">
                Passwords do not match
              </Text>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <Text className="text-xs text-success mt-1">
                Passwords match
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <Button
            onPress={handleChangePassword}
            disabled={isSubmitting}
            loading={isSubmitting}
            size="lg"
            className="w-full"
          >
            Change Password
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

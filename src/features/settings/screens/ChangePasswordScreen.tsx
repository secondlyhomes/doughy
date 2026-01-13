// src/features/settings/screens/ChangePasswordScreen.tsx
// Change password screen

import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { changePassword } from '../services/profileService';
import {
  calculatePasswordStrength,
  validatePassword,
} from '@/features/auth/services/passwordResetService';
import { PasswordStrengthIndicator } from '@/features/auth/components/PasswordStrengthIndicator';

export function ChangePasswordScreen() {
  const router = useRouter();

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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <CheckCircle size={48} color="#22c55e" />
          </View>
          <Text className="text-2xl font-bold text-foreground text-center">
            Password Changed!
          </Text>
          <Text className="text-muted-foreground text-center mt-2 mb-8">
            Your password has been successfully updated.
          </Text>
          <TouchableOpacity
            className="bg-primary py-4 px-8 rounded-lg"
            onPress={() => router.back()}
          >
            <Text className="text-primary-foreground font-semibold">Done</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
          Change Password
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1 px-6"
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
                <Lock size={20} color="#6b7280" />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="Enter current password"
                placeholderTextColor="#9ca3af"
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
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
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
                <Lock size={20} color="#6b7280" />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="Enter new password"
                placeholderTextColor="#9ca3af"
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
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
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
                <Lock size={20} color="#6b7280" />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="Confirm new password"
                placeholderTextColor="#9ca3af"
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
                  <EyeOff size={20} color="#6b7280" />
                ) : (
                  <Eye size={20} color="#6b7280" />
                )}
              </TouchableOpacity>
            </View>
            {confirmPassword.length > 0 && newPassword !== confirmPassword && (
              <Text className="text-xs text-destructive mt-1">
                Passwords do not match
              </Text>
            )}
            {confirmPassword.length > 0 && newPassword === confirmPassword && (
              <Text className="text-xs text-green-600 mt-1">
                Passwords match
              </Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            className={`py-4 rounded-lg items-center ${
              isSubmitting ? 'bg-primary/50' : 'bg-primary'
            }`}
            onPress={handleChangePassword}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Change Password
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

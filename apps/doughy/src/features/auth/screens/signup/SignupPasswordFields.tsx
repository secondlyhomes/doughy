// src/features/auth/screens/signup/SignupPasswordFields.tsx

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { Eye, EyeOff, Lock } from 'lucide-react-native';
import { useTheme, useThemeColors } from '@/contexts/ThemeContext';
import { PasswordRequirement } from './PasswordRequirement';
import type { PasswordRequirements } from './signup-types';

interface SignupPasswordFieldsProps {
  passwordInputRef: React.RefObject<TextInputType | null>;
  confirmPasswordInputRef: React.RefObject<TextInputType | null>;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  loading: boolean;
  passwordRequirements: PasswordRequirements;
  handleSignup: () => void;
}

export function SignupPasswordFields({
  passwordInputRef,
  confirmPasswordInputRef,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  passwordRequirements,
  handleSignup,
}: SignupPasswordFieldsProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  return (
    <>
      {/* Password Input */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Password</Text>
        <View className="flex-row items-center rounded-lg" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
          <View className="pl-4">
            <Lock size={20} color={colors.mutedForeground} />
          </View>
          <TextInput
            ref={passwordInputRef}
            className="flex-1 px-4 py-3"
            placeholder="Create a password"
            placeholderTextColor={colors.mutedForeground}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!loading}
            style={{ color: colors.foreground }}
            returnKeyType="next"
            onSubmitEditing={() => confirmPasswordInputRef.current?.focus()}
            blurOnSubmit={false}
          />
          <TouchableOpacity
            className="pr-4"
            onPress={() => setShowPassword(!showPassword)}
            disabled={loading}
          >
            {showPassword ? (
              <EyeOff size={20} color={colors.mutedForeground} />
            ) : (
              <Eye size={20} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>

        {/* Password Requirements */}
        {password.length > 0 && (
          <View className="mt-2">
            <PasswordRequirement
              met={passwordRequirements.minLength}
              text="At least 8 characters"
            />
            <PasswordRequirement
              met={passwordRequirements.hasUppercase}
              text="One uppercase letter"
            />
            <PasswordRequirement
              met={passwordRequirements.hasLowercase}
              text="One lowercase letter"
            />
            <PasswordRequirement
              met={passwordRequirements.hasNumber}
              text="One number"
            />
          </View>
        )}
      </View>

      {/* Confirm Password Input */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Confirm Password</Text>
        <View className="flex-row items-center rounded-lg" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
          <View className="pl-4">
            <Lock size={20} color={colors.mutedForeground} />
          </View>
          <TextInput
            ref={confirmPasswordInputRef}
            className="flex-1 px-4 py-3"
            placeholder="Confirm your password"
            placeholderTextColor={colors.mutedForeground}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showConfirmPassword}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            autoCapitalize="none"
            autoComplete="new-password"
            editable={!loading}
            style={{ color: colors.foreground }}
            returnKeyType="done"
            onSubmitEditing={handleSignup}
          />
          <TouchableOpacity
            className="pr-4"
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={loading}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color={colors.mutedForeground} />
            ) : (
              <Eye size={20} color={colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
}

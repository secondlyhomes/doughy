// src/features/auth/screens/signup/SignupFormFields.tsx

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { Mail, User, AlertCircle } from 'lucide-react-native';
import { useTheme, useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SignupPasswordFields } from './SignupPasswordFields';
import { SignupTermsAndSubmit } from './SignupTermsAndSubmit';
import type { PasswordRequirements } from './signup-types';

interface SignupFormFieldsProps {
  // Refs
  emailInputRef: React.RefObject<TextInputType | null>;
  passwordInputRef: React.RefObject<TextInputType | null>;
  confirmPasswordInputRef: React.RefObject<TextInputType | null>;
  // State
  fullName: string;
  setFullName: (value: string) => void;
  email: string;
  setEmail: (value: string) => void;
  password: string;
  setPassword: (value: string) => void;
  confirmPassword: string;
  setConfirmPassword: (value: string) => void;
  showPassword: boolean;
  setShowPassword: (value: boolean) => void;
  showConfirmPassword: boolean;
  setShowConfirmPassword: (value: boolean) => void;
  agreeToTerms: boolean;
  setAgreeToTerms: (value: boolean) => void;
  error: string | null;
  loading: boolean;
  // Derived
  passwordRequirements: PasswordRequirements;
  // Actions
  handleSignup: () => void;
  handleLogin: () => void;
}

export function SignupFormFields({
  emailInputRef,
  passwordInputRef,
  confirmPasswordInputRef,
  fullName,
  setFullName,
  email,
  setEmail,
  password,
  setPassword,
  confirmPassword,
  setConfirmPassword,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  agreeToTerms,
  setAgreeToTerms,
  error,
  loading,
  passwordRequirements,
  handleSignup,
  handleLogin,
}: SignupFormFieldsProps) {
  const { isDark } = useTheme();
  const colors = useThemeColors();

  return (
    <View className="flex-1 justify-center px-6 py-12">
      {/* Header */}
      <View className="mb-8">
        <Text className="text-3xl font-bold text-center" style={{ color: colors.foreground }}>
          Create Account
        </Text>
        <Text className="text-base text-center mt-2" style={{ color: colors.mutedForeground }}>
          Sign up to get started
        </Text>
      </View>

      {/* Error Message */}
      {error && (
        <View className="flex-row items-center rounded-lg p-4 mb-6" style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}>
          <AlertCircle size={20} color={colors.destructive} />
          <Text className="ml-2 flex-1" style={{ color: colors.destructive }}>{error}</Text>
        </View>
      )}

      {/* Full Name Input */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Full Name</Text>
        <View className="flex-row items-center rounded-lg" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
          <View className="pl-4">
            <User size={20} color={colors.mutedForeground} />
          </View>
          <TextInput
            className="flex-1 px-4 py-3"
            placeholder="John Doe"
            placeholderTextColor={colors.mutedForeground}
            value={fullName}
            onChangeText={setFullName}
            keyboardAppearance={isDark ? 'dark' : 'light'}
            autoCapitalize="words"
            autoComplete="name"
            editable={!loading}
            style={{ color: colors.foreground }}
            returnKeyType="next"
            onSubmitEditing={() => emailInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
      </View>

      {/* Email Input */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Email</Text>
        <View className="flex-row items-center rounded-lg" style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}>
          <View className="pl-4">
            <Mail size={20} color={colors.mutedForeground} />
          </View>
          <TextInput
            ref={emailInputRef}
            className="flex-1 px-4 py-3"
            placeholder="name@example.com"
            placeholderTextColor={colors.mutedForeground}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            keyboardAppearance={isDark ? 'dark' : 'light'}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            editable={!loading}
            style={{ color: colors.foreground }}
            returnKeyType="next"
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            blurOnSubmit={false}
          />
        </View>
      </View>

      <SignupPasswordFields
        passwordInputRef={passwordInputRef}
        confirmPasswordInputRef={confirmPasswordInputRef}
        password={password}
        setPassword={setPassword}
        confirmPassword={confirmPassword}
        setConfirmPassword={setConfirmPassword}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
        loading={loading}
        passwordRequirements={passwordRequirements}
        handleSignup={handleSignup}
      />

      <SignupTermsAndSubmit
        agreeToTerms={agreeToTerms}
        setAgreeToTerms={setAgreeToTerms}
        loading={loading}
        handleSignup={handleSignup}
        handleLogin={handleLogin}
      />
    </View>
  );
}

// src/features/auth/screens/LoginScreen.tsx
// Login screen converted from web SignInForm
// Uses useThemeColors() for reliable dark mode support

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import type { TextInput as TextInputType } from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useKeyboardAvoidance } from '@/hooks';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';

export function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false });
  const { signIn, isLoading, devBypassAuth } = useAuth();

  // Input refs for form navigation
  const passwordInputRef = useRef<TextInputType>(null);

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter your password');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signIn(email.trim(), password);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = () => {
    router.push('/(auth)/forgot-password');
  };

  const handleSignUp = () => {
    router.push('/(auth)/sign-up');
  };

  // Only use local isSubmitting — global isLoading blocks the form during
  // background auth init (devBypassAuth, getSession) which makes the UI feel stuck
  const loading = isSubmitting;

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
        <View className="flex-1 justify-center px-6 py-12">
          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-center" style={{ color: colors.foreground }}>
              Welcome Back
            </Text>
            <Text className="text-base text-center mt-2" style={{ color: colors.mutedForeground }}>
              Sign in to your account
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
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Email</Text>
            <View
              className="flex-row items-center rounded-lg"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
            >
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
                returnKeyType="next"
                onSubmitEditing={() => passwordInputRef.current?.focus()}
                blurOnSubmit={false}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Password</Text>
            <View
              className="flex-row items-center rounded-lg"
              style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
            >
              <View className="pl-4">
                <Lock size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                ref={passwordInputRef}
                className="flex-1 px-4 py-3"
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
                style={{ color: colors.foreground }}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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
          </View>

          {/* Forgot Password Link */}
          <TouchableOpacity
            className="self-end mb-6"
            onPress={handleForgotPassword}
            disabled={loading}
          >
            <Text className="text-sm" style={{ color: colors.primary }}>Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            className="rounded-lg py-4 items-center"
            style={{ backgroundColor: colors.primary, opacity: loading ? 0.5 : 1 }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className="font-semibold text-base" style={{ color: colors.primaryForeground }}>
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center mt-6">
            <Text style={{ color: colors.mutedForeground }}>Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <Text className="font-medium" style={{ color: colors.primary }}>Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Dev Login - Only visible in development */}
          {__DEV__ && (
            <View className="mt-8 pt-6" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              <Text className="text-xs text-center mb-3" style={{ color: colors.mutedForeground }}>
                Development Mode
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 rounded-lg py-3 items-center"
                  style={{ backgroundColor: colors.primary }}
                  onPress={async () => {
                    try {
                      await devBypassAuth();
                      router.replace('/(tabs)');
                    } catch (err) {
                      setError(`Dev auth failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    }
                  }}
                  disabled={loading}
                >
                  <Text className="font-semibold text-sm" style={{ color: colors.primaryForeground }}>
                    User Console
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 rounded-lg py-3 items-center"
                  style={{ backgroundColor: colors.warning }}
                  onPress={async () => {
                    try {
                      await devBypassAuth();
                      router.replace('/(admin)');
                    } catch (err) {
                      setError(`Dev auth failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
                    }
                  }}
                  disabled={loading}
                >
                  <Text className="font-semibold text-sm" style={{ color: colors.primaryForeground }}>
                    Admin Console
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-center mt-3" style={{ color: colors.mutedForeground }}>
                Bypasses auth with mock admin user
              </Text>
            </View>
          )}
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

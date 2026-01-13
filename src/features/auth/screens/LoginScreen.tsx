// src/features/auth/screens/LoginScreen.tsx
// Login screen converted from web SignInForm

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Eye, EyeOff, Mail, Lock, AlertCircle } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';

export function LoginScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { signIn, isLoading, devBypassAuth } = useAuth();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async () => {
    // Validate inputs
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
      // Navigation will happen automatically via auth state change
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

  const loading = isLoading || isSubmitting;

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
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground text-center">
              Welcome Back
            </Text>
            <Text className="text-base text-muted-foreground text-center mt-2">
              Sign in to your account
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="flex-row items-center bg-destructive/10 rounded-lg p-4 mb-6">
              <AlertCircle size={20} color={colors.destructive} />
              <Text className="text-destructive ml-2 flex-1">{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <Mail size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="name@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="email"
                editable={!loading}
              />
            </View>
          </View>

          {/* Password Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <Lock size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="Enter your password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="password"
                editable={!loading}
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
            <Text className="text-primary text-sm">Forgot password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center"
            style={{ opacity: loading ? 0.5 : 1 }}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Sign In
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-muted-foreground">Don't have an account? </Text>
            <TouchableOpacity onPress={handleSignUp} disabled={loading}>
              <Text className="text-primary font-medium">Sign up</Text>
            </TouchableOpacity>
          </View>

          {/* Dev Login - Only visible in development */}
          {__DEV__ && (
            <View className="mt-8 pt-6 border-t border-border">
              <Text className="text-xs text-muted-foreground text-center mb-3">
                Development Mode
              </Text>
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-primary rounded-lg py-3 items-center"
                  onPress={async () => {
                    await devBypassAuth();
                    router.replace('/(tabs)');
                  }}
                  disabled={loading}
                >
                  <Text className="text-primary-foreground font-semibold text-sm">
                    User Console
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-warning rounded-lg py-3 items-center"
                  onPress={async () => {
                    await devBypassAuth();
                    router.replace('/(admin)');
                  }}
                  disabled={loading}
                >
                  <Text className="text-white font-semibold text-sm">
                    Admin Console
                  </Text>
                </TouchableOpacity>
              </View>
              <Text className="text-xs text-muted-foreground text-center mt-3">
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

// src/features/auth/screens/SignupScreen.tsx
// Signup screen converted from web SignUpForm

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
import { Eye, EyeOff, Mail, Lock, User, AlertCircle, Check } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';

export function SignupScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { signUp, isLoading } = useAuth();

  // Form state
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password validation
  const passwordRequirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
  };

  const isPasswordValid = Object.values(passwordRequirements).every(Boolean);

  const handleSignup = async () => {
    // Validate inputs
    if (!email.trim()) {
      setError('Please enter your email');
      return;
    }
    if (!password) {
      setError('Please enter a password');
      return;
    }
    if (!isPasswordValid) {
      setError('Please meet all password requirements');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!agreeToTerms) {
      setError('Please agree to the terms and conditions');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      await signUp(email.trim(), password);
      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create account';
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogin = () => {
    router.push('/(auth)/sign-in');
  };

  const loading = isLoading || isSubmitting;

  // Success screen
  if (success) {
    return (
      <ThemedSafeAreaView className="flex-1 justify-center items-center px-6" edges={['top']}>
        <View className="bg-primary/10 rounded-full p-6 mb-6">
          <Check size={48} color={colors.success} />
        </View>
        <Text className="text-2xl font-bold text-foreground text-center mb-4">
          Check Your Email
        </Text>
        <Text className="text-muted-foreground text-center mb-8">
          We've sent a confirmation link to {email}. Please check your email to verify your account.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-lg py-4 px-8"
          onPress={handleLogin}
        >
          <Text className="text-primary-foreground font-semibold">
            Back to Sign In
          </Text>
        </TouchableOpacity>
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
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground text-center">
              Create Account
            </Text>
            <Text className="text-base text-muted-foreground text-center mt-2">
              Sign up to get started
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="flex-row items-center bg-destructive/10 rounded-lg p-4 mb-6">
              <AlertCircle size={20} color={colors.destructive} />
              <Text className="text-destructive ml-2 flex-1">{error}</Text>
            </View>
          )}

          {/* Full Name Input */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Full Name</Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <User size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="John Doe"
                placeholderTextColor={colors.mutedForeground}
                value={fullName}
                onChangeText={setFullName}
                autoCapitalize="words"
                autoComplete="name"
                editable={!loading}
              />
            </View>
          </View>

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
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <Lock size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="Create a password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                autoComplete="new-password"
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
            <Text className="text-sm font-medium text-foreground mb-2">Confirm Password</Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <Lock size={20} color={colors.mutedForeground} />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="Confirm your password"
                placeholderTextColor={colors.mutedForeground}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirmPassword}
                autoCapitalize="none"
                autoComplete="new-password"
                editable={!loading}
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

          {/* Terms Agreement */}
          <TouchableOpacity
            className="flex-row items-center mb-6"
            onPress={() => setAgreeToTerms(!agreeToTerms)}
            disabled={loading}
          >
            <View
              className={`w-5 h-5 rounded border mr-3 items-center justify-center ${
                agreeToTerms ? 'bg-primary border-primary' : 'border-input'
              }`}
            >
              {agreeToTerms && <Check size={14} color={colors.primaryForeground} />}
            </View>
            <Text className="text-sm text-muted-foreground flex-1">
              I agree to the Terms of Service and Privacy Policy
            </Text>
          </TouchableOpacity>

          {/* Sign Up Button */}
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center"
            style={{ opacity: loading ? 0.5 : 1 }}
            onPress={handleSignup}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Create Account
              </Text>
            )}
          </TouchableOpacity>

          {/* Sign In Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-muted-foreground">Already have an account? </Text>
            <TouchableOpacity onPress={handleLogin} disabled={loading}>
              <Text className="text-primary font-medium">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

// Helper component for password requirements
function PasswordRequirement({ met, text }: { met: boolean; text: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center mt-1">
      {met ? (
        <Check size={14} color={colors.success} />
      ) : (
        <View className="w-3.5 h-3.5 rounded-full border border-muted-foreground" />
      )}
      <Text
        className="ml-2 text-sm"
        style={{ color: met ? colors.success : colors.mutedForeground }}
      >
        {text}
      </Text>
    </View>
  );
}

// src/features/auth/screens/ForgotPasswordScreen.tsx
// Password reset screen for mobile

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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Mail, AlertCircle, Check, ArrowLeft } from 'lucide-react-native';
import { useAuth } from '../hooks/useAuth';
import { AuthStackParamList } from '@/routes/types';

type ForgotPasswordScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  'ForgotPassword'
>;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<ForgotPasswordScreenNavigationProp>();
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
    navigation.navigate('SignIn');
  };

  const loading = isLoading || isSubmitting;

  // Success screen
  if (success) {
    return (
      <View className="flex-1 bg-background justify-center items-center px-6">
        <View className="bg-primary/10 rounded-full p-6 mb-6">
          <Check size={48} color="#22c55e" />
        </View>
        <Text className="text-2xl font-bold text-foreground text-center mb-4">
          Check Your Email
        </Text>
        <Text className="text-muted-foreground text-center mb-8">
          We've sent password reset instructions to {email}. Please check your inbox.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-lg py-4 px-8"
          onPress={handleBackToLogin}
        >
          <Text className="text-primary-foreground font-semibold">
            Back to Sign In
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
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
            <ArrowLeft size={20} color="#6b7280" />
            <Text className="text-muted-foreground ml-2">Back to Sign In</Text>
          </TouchableOpacity>

          {/* Header */}
          <View className="mb-8">
            <Text className="text-3xl font-bold text-foreground">
              Forgot Password?
            </Text>
            <Text className="text-base text-muted-foreground mt-2">
              No worries, we'll send you reset instructions.
            </Text>
          </View>

          {/* Error Message */}
          {error && (
            <View className="flex-row items-center bg-destructive/10 rounded-lg p-4 mb-6">
              <AlertCircle size={20} color="#ef4444" />
              <Text className="text-destructive ml-2 flex-1">{error}</Text>
            </View>
          )}

          {/* Email Input */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
            <View className="flex-row items-center border border-input rounded-lg bg-background">
              <View className="pl-4">
                <Mail size={20} color="#6b7280" />
              </View>
              <TextInput
                className="flex-1 px-4 py-3 text-foreground"
                placeholder="name@example.com"
                placeholderTextColor="#9ca3af"
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

          {/* Reset Password Button */}
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center"
            style={{ opacity: loading ? 0.5 : 1 }}
            onPress={handleResetPassword}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">
                Reset Password
              </Text>
            )}
          </TouchableOpacity>

          {/* Remember Password Link */}
          <View className="flex-row justify-center mt-6">
            <Text className="text-muted-foreground">Remember your password? </Text>
            <TouchableOpacity onPress={handleBackToLogin} disabled={loading}>
              <Text className="text-primary font-medium">Sign in</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

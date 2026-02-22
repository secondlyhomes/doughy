// src/features/auth/screens/SignupScreen.tsx
// Signup screen converted from web SignUpForm

import React from 'react';
import { KeyboardAvoidingView, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { useKeyboardAvoidance } from '@/hooks';
import { ThemedSafeAreaView } from '@/components';
import { SignupSuccessView, SignupFormFields, useSignupForm } from './signup';

export function SignupScreen() {
  const router = useRouter();
  const keyboardProps = useKeyboardAvoidance({ hasNavigationHeader: false });

  const form = useSignupForm();

  const handleLogin = () => {
    router.push('/(auth)/sign-in');
  };

  // Success screen
  if (form.success) {
    return (
      <SignupSuccessView
        email={form.email}
        onBackToSignIn={handleLogin}
      />
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
          <SignupFormFields
            emailInputRef={form.emailInputRef}
            passwordInputRef={form.passwordInputRef}
            confirmPasswordInputRef={form.confirmPasswordInputRef}
            fullName={form.fullName}
            setFullName={form.setFullName}
            email={form.email}
            setEmail={form.setEmail}
            password={form.password}
            setPassword={form.setPassword}
            confirmPassword={form.confirmPassword}
            setConfirmPassword={form.setConfirmPassword}
            showPassword={form.showPassword}
            setShowPassword={form.setShowPassword}
            showConfirmPassword={form.showConfirmPassword}
            setShowConfirmPassword={form.setShowConfirmPassword}
            agreeToTerms={form.agreeToTerms}
            setAgreeToTerms={form.setAgreeToTerms}
            error={form.error}
            loading={form.loading}
            passwordRequirements={form.passwordRequirements}
            handleSignup={form.handleSignup}
            handleLogin={handleLogin}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

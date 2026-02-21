// src/features/auth/screens/signup/useSignupForm.ts

import { useState, useRef } from 'react';
import type { TextInput as TextInputType } from 'react-native';
import { useAuth } from '../../hooks/useAuth';
import { getPasswordRequirements, isPasswordValid } from './signup-validation';

export function useSignupForm() {
  const { signUp, isLoading } = useAuth();

  // Input refs for form navigation
  const emailInputRef = useRef<TextInputType>(null);
  const passwordInputRef = useRef<TextInputType>(null);
  const confirmPasswordInputRef = useRef<TextInputType>(null);

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
  const passwordRequirements = getPasswordRequirements(password);
  const passwordValid = isPasswordValid(passwordRequirements);

  const loading = isLoading || isSubmitting;

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
    if (!passwordValid) {
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

  return {
    // Refs
    emailInputRef,
    passwordInputRef,
    confirmPasswordInputRef,
    // State
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
    success,
    loading,
    // Derived
    passwordRequirements,
    passwordValid,
    // Actions
    handleSignup,
  };
}

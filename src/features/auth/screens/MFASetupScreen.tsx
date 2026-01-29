// src/features/auth/screens/MFASetupScreen.tsx
// Multi-Factor Authentication setup screen

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Copy, CheckCircle, ArrowLeft } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner, Button } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import * as Clipboard from 'expo-clipboard';
import { MFACodeInput } from '../components/MFACodeInput';
import {
  enrollMFA,
  verifyMFAEnrollment,
  type MFAEnrollResult,
} from '../services/mfaService';

type SetupStep = 'loading' | 'scan' | 'verify' | 'success';

export function MFASetupScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [step, setStep] = useState<SetupStep>('loading');
  const [enrollmentData, setEnrollmentData] = useState<MFAEnrollResult | null>(null);
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);

  // Start enrollment on mount
  useEffect(() => {
    const startEnrollment = async () => {
      const result = await enrollMFA();
      if (result.success) {
        setEnrollmentData(result);
        setStep('scan');
      } else {
        setError(result.error || 'Failed to start MFA setup');
        setStep('scan'); // Exit loading state so error is visible
      }
    };

    startEnrollment();
  }, []);

  const handleCopySecret = useCallback(async () => {
    if (enrollmentData?.secret) {
      await Clipboard.setStringAsync(enrollmentData.secret);
      setCopiedSecret(true);
      setTimeout(() => setCopiedSecret(false), 2000);
    }
  }, [enrollmentData?.secret]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || !enrollmentData?.factorId) return;

    setIsVerifying(true);
    setError(null);

    const result = await verifyMFAEnrollment(enrollmentData.factorId, code);

    if (result.success) {
      setStep('success');
    } else {
      setError(result.error || 'Invalid code. Please try again.');
      setCode('');
    }

    setIsVerifying(false);
  }, [code, enrollmentData?.factorId]);

  // Auto-verify when code is complete
  useEffect(() => {
    if (code.length === 6 && step === 'verify') {
      handleVerify();
    }
  }, [code, step, handleVerify]);

  const handleBack = () => {
    router.back();
  };

  const handleContinueToVerify = () => {
    setStep('verify');
    setError(null);
  };

  const handleDone = () => {
    router.back();
  };

  // Loading state
  if (step === 'loading') {
    return (
      <ThemedSafeAreaView className="flex-1">
        <LoadingSpinner fullScreen text="Setting up MFA..." />
      </ThemedSafeAreaView>
    );
  }

  // Success state
  if (step === 'success') {
    return (
      <ThemedSafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center px-6">
          <View className="w-20 h-20 rounded-full items-center justify-center mb-6" style={{ backgroundColor: withOpacity(colors.success, 'medium') }}>
            <CheckCircle size={48} color={colors.success} />
          </View>
          <Text className="text-2xl font-bold text-center" style={{ color: colors.foreground }}>
            MFA Enabled!
          </Text>
          <Text className="text-center mt-2 mb-8" style={{ color: colors.mutedForeground }}>
            Your account is now protected with two-factor authentication.
          </Text>
          <Button onPress={handleDone} size="lg">
            Done
          </Button>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader title="Set Up MFA" backButton bordered onBack={handleBack} />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingVertical: 24 }}
      >
        {step === 'scan' && (
          <>
            {/* Icon */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                <Shield size={32} color={colors.info} />
              </View>
            </View>

            {/* Instructions */}
            <Text className="text-lg font-semibold text-center mb-2" style={{ color: colors.foreground }}>
              Scan QR Code
            </Text>
            <Text className="text-center mb-6" style={{ color: colors.mutedForeground }}>
              Open your authenticator app (like Google Authenticator or Authy) and scan this QR code.
            </Text>

            {/* QR Code */}
            {enrollmentData?.qrCode && (
              <View className="items-center mb-6">
                <View className="p-4 rounded-lg" style={{ backgroundColor: colors.card }}>
                  <Image
                    source={{ uri: enrollmentData.qrCode }}
                    style={{ width: 200, height: 200 }}
                    resizeMode="contain"
                  />
                </View>
              </View>
            )}

            {/* Manual entry */}
            <View className="rounded-lg p-4 mb-6" style={{ backgroundColor: withOpacity(colors.muted, 'opaque') }}>
              <Text className="text-sm text-center mb-2" style={{ color: colors.mutedForeground }}>
                Or enter this code manually:
              </Text>
              <View className="flex-row items-center justify-center">
                <Text className="font-mono text-sm mr-2" style={{ color: colors.foreground }}>
                  {enrollmentData?.secret}
                </Text>
                <TouchableOpacity onPress={handleCopySecret}>
                  {copiedSecret ? (
                    <CheckCircle size={18} color={colors.success} />
                  ) : (
                    <Copy size={18} color={colors.mutedForeground} />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Continue button */}
            <Button onPress={handleContinueToVerify} size="lg" className="w-full">
              Continue
            </Button>
          </>
        )}

        {step === 'verify' && (
          <>
            {/* Icon */}
            <View className="items-center mb-6">
              <View className="w-16 h-16 rounded-full items-center justify-center" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                <Shield size={32} color={colors.info} />
              </View>
            </View>

            {/* Instructions */}
            <Text className="text-lg font-semibold text-center mb-2" style={{ color: colors.foreground }}>
              Enter Verification Code
            </Text>
            <Text className="text-center mb-8" style={{ color: colors.mutedForeground }}>
              Enter the 6-digit code from your authenticator app to verify setup.
            </Text>

            {/* Code input */}
            <View className="mb-6">
              <MFACodeInput
                value={code}
                onChange={setCode}
                disabled={isVerifying}
                error={!!error}
              />
            </View>

            {/* Error message */}
            {error && (
              <View className="rounded-lg p-3 mb-6" style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}>
                <Text className="text-sm text-center" style={{ color: colors.destructive }}>{error}</Text>
              </View>
            )}

            {/* Verifying indicator */}
            {isVerifying && (
              <View className="mb-6">
                <LoadingSpinner text="Verifying..." />
              </View>
            )}

            {/* Back to scan button */}
            <TouchableOpacity
              className="py-3"
              onPress={() => setStep('scan')}
              disabled={isVerifying}
            >
              <Text className="text-center" style={{ color: colors.primary }}>Back to QR Code</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

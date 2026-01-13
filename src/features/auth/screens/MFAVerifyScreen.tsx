// src/features/auth/screens/MFAVerifyScreen.tsx
// MFA verification screen (used during login when MFA is required)

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Shield, ArrowLeft } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MFACodeInput } from '../components/MFACodeInput';
import { useAuth } from '../hooks/useAuth';
import {
  createMFAChallenge,
  verifyMFAChallenge,
  listMFAFactors,
} from '../services/mfaService';

export function MFAVerifyScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ factorId?: string }>();

  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isVerifying, setIsVerifying] = useState(false);
  const [factorId, setFactorId] = useState<string | null>(params.factorId || null);
  const [challengeId, setChallengeId] = useState<string | null>(null);

  // Initialize MFA challenge
  useEffect(() => {
    const initChallenge = async () => {
      try {
        // If no factorId provided, get it from the list
        let fid = factorId;
        if (!fid) {
          const factorsResult = await listMFAFactors();
          if (factorsResult.success && factorsResult.factors?.length) {
            const verifiedFactor = factorsResult.factors.find(f => f.status === 'verified');
            if (verifiedFactor) {
              fid = verifiedFactor.id;
              setFactorId(fid);
            }
          }
        }

        if (!fid) {
          setError('MFA not configured. Please contact support.');
          setIsLoading(false);
          return;
        }

        // Create challenge
        const challengeResult = await createMFAChallenge(fid);
        if (challengeResult.success && challengeResult.challengeId) {
          setChallengeId(challengeResult.challengeId);
        } else {
          setError(challengeResult.error || 'Failed to create MFA challenge');
        }
      } catch (err) {
        setError('Failed to initialize MFA verification');
      } finally {
        setIsLoading(false);
      }
    };

    initChallenge();
  }, [factorId]);

  const handleVerify = useCallback(async () => {
    if (code.length !== 6 || !factorId || !challengeId) return;

    setIsVerifying(true);
    setError(null);

    const result = await verifyMFAChallenge(factorId, challengeId, code);

    if (result.success) {
      // MFA verification successful - navigate to main app
      router.replace('/(tabs)');
    } else {
      setError(result.error || 'Invalid code. Please try again.');
      setCode('');
      setIsVerifying(false);
    }
  }, [code, factorId, challengeId, router]);

  // Auto-verify when code is complete
  useEffect(() => {
    if (code.length === 6 && !isVerifying && challengeId) {
      handleVerify();
    }
  }, [code, isVerifying, challengeId, handleVerify]);

  const handleBack = () => {
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
          <Text className="text-muted-foreground mt-4">
            Preparing verification...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center px-4 py-3">
          <TouchableOpacity onPress={handleBack} className="p-2">
            <ArrowLeft size={24} color="#6b7280" />
          </TouchableOpacity>
        </View>

        <View className="flex-1 justify-center px-6">
          {/* Icon */}
          <View className="items-center mb-6">
            <View className="w-20 h-20 rounded-full bg-primary/10 items-center justify-center">
              <Shield size={40} color="#3b82f6" />
            </View>
          </View>

          {/* Instructions */}
          <Text className="text-2xl font-bold text-foreground text-center mb-2">
            Two-Factor Authentication
          </Text>
          <Text className="text-muted-foreground text-center mb-8">
            Enter the 6-digit code from your authenticator app
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
            <View className="bg-destructive/10 rounded-lg p-3 mb-6">
              <Text className="text-destructive text-sm text-center">{error}</Text>
            </View>
          )}

          {/* Verifying indicator */}
          {isVerifying && (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="#3b82f6" />
              <Text className="text-muted-foreground ml-2">Verifying...</Text>
            </View>
          )}

          {/* Help text */}
          <Text className="text-sm text-muted-foreground text-center mt-8">
            Open your authenticator app to view your code.
            {'\n'}If you've lost access, contact support.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

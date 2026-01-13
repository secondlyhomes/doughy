// src/features/settings/screens/SecurityScreen.tsx
// Security settings screen

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Shield,
  Smartphone,
  Key,
  ChevronRight,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner, Button } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import {
  listMFAFactors,
  unenrollMFA,
  isMFAEnabled,
  type MFAFactor,
} from '@/features/auth/services/mfaService';

export function SecurityScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<MFAFactor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRemoving, setIsRemoving] = useState(false);

  // Load MFA status
  useEffect(() => {
    const loadMFAStatus = async () => {
      setIsLoading(true);
      const enabled = await isMFAEnabled();
      setMfaEnabled(enabled);

      const factorsResult = await listMFAFactors();
      if (factorsResult.success && factorsResult.factors) {
        setMfaFactors(factorsResult.factors);
      }
      setIsLoading(false);
    };

    loadMFAStatus();
  }, []);

  const handleSetupMFA = useCallback(() => {
    router.push('/(auth)/mfa-setup');
  }, [router]);

  const handleRemoveMFA = useCallback(async (factorId: string) => {
    Alert.alert(
      'Remove Two-Factor Authentication',
      'Are you sure you want to disable 2FA? This will make your account less secure.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setIsRemoving(true);
            const result = await unenrollMFA(factorId);

            if (result.success) {
              setMfaEnabled(false);
              setMfaFactors(prev => prev.filter(f => f.id !== factorId));
              Alert.alert('Success', 'Two-factor authentication has been disabled.');
            } else {
              Alert.alert('Error', result.error || 'Failed to remove 2FA');
            }
            setIsRemoving(false);
          },
        },
      ]
    );
  }, []);

  const handleChangePassword = useCallback(() => {
    router.push('/(tabs)/settings/change-password');
  }, [router]);

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1">
        <ScreenHeader title="Security" backButton bordered />
        <LoadingSpinner fullScreen />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader title="Security" backButton bordered />

      <ScrollView className="flex-1 p-4">
        {/* Two-Factor Authentication */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          TWO-FACTOR AUTHENTICATION
        </Text>

        <View className="rounded-lg mb-6" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-center p-4 border-b border-border">
            <View className="w-10 h-10 rounded-full bg-primary/10 items-center justify-center">
              <Shield size={20} color={colors.info} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-foreground font-medium">
                Two-Factor Authentication
              </Text>
              <View className="flex-row items-center mt-1">
                {mfaEnabled ? (
                  <>
                    <CheckCircle size={14} color={colors.success} />
                    <Text className="text-sm text-success ml-1">Enabled</Text>
                  </>
                ) : (
                  <>
                    <XCircle size={14} color={colors.destructive} />
                    <Text className="text-sm text-destructive ml-1">Not enabled</Text>
                  </>
                )}
              </View>
            </View>
          </View>

          {/* MFA Factors List */}
          {mfaFactors.filter(f => f.status === 'verified').map((factor) => (
            <View
              key={factor.id}
              className="flex-row items-center p-4 border-b border-border"
            >
              <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
                <Smartphone size={20} color={colors.mutedForeground} />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-foreground">
                  {factor.friendlyName || 'Authenticator App'}
                </Text>
                <Text className="text-sm text-muted-foreground">
                  Added {new Date(factor.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Button
                variant="ghost"
                size="icon"
                onPress={() => handleRemoveMFA(factor.id)}
                disabled={isRemoving}
                loading={isRemoving}
              >
                {!isRemoving && <Trash2 size={20} color={colors.destructive} />}
              </Button>
            </View>
          ))}

          {/* Setup / Add MFA */}
          <TouchableOpacity
            className="flex-row items-center p-4"
            onPress={handleSetupMFA}
          >
            <View className="w-10 h-10 rounded-full bg-success/20 items-center justify-center">
              <Shield size={20} color={colors.success} />
            </View>
            <Text className="flex-1 ml-4 text-primary font-medium">
              {mfaEnabled ? 'Add Another Device' : 'Set Up 2FA'}
            </Text>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Info */}
        <View className="bg-info/10 rounded-lg p-4 mb-6">
          <Text className="text-info-foreground text-sm">
            Two-factor authentication adds an extra layer of security to your account
            by requiring a code from your authenticator app when signing in.
          </Text>
        </View>

        {/* Password */}
        <Text className="text-sm font-medium text-muted-foreground mb-3">
          PASSWORD
        </Text>

        <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
          <TouchableOpacity
            className="flex-row items-center p-4"
            onPress={handleChangePassword}
          >
            <View className="w-10 h-10 rounded-full bg-muted items-center justify-center">
              <Key size={20} color={colors.mutedForeground} />
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-foreground font-medium">Change Password</Text>
              <Text className="text-sm text-muted-foreground">
                Update your account password
              </Text>
            </View>
            <ChevronRight size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>

        {/* Security Tips */}
        <View className="mt-8">
          <Text className="text-sm font-medium text-muted-foreground mb-3">
            SECURITY TIPS
          </Text>
          <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
            <Text className="text-sm text-foreground mb-2">
              • Use a unique, strong password
            </Text>
            <Text className="text-sm text-foreground mb-2">
              • Enable two-factor authentication
            </Text>
            <Text className="text-sm text-foreground mb-2">
              • Don't share your login credentials
            </Text>
            <Text className="text-sm text-foreground">
              • Sign out from shared devices
            </Text>
          </View>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

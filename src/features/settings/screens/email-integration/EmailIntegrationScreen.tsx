// src/features/settings/screens/email-integration/EmailIntegrationScreen.tsx
// Email Integration Settings Screen - allows landlords to connect Gmail

import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert, RefreshControl } from 'react-native';
import { Stack } from 'expo-router';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useNativeHeader } from '@/hooks';
import {
  useGmailAuth,
  handleGmailAuthCallback,
  getGmailConnection,
  disconnectGmail,
  triggerGmailSync,
  isGmailAuthConfigured,
  GmailConnection,
} from '@/services/gmail';

import { ConnectionCard } from './ConnectionCard';
import { DetectedPlatforms } from './DetectedPlatforms';
import { HowItWorksSection, SecurityNote } from './HowItWorksSection';

export function EmailIntegrationScreen() {
  const colors = useThemeColors();

  // Gmail auth hook
  const { request, response, promptAsync } = useGmailAuth();

  const { headerOptions } = useNativeHeader({
    title: 'Email Integration',
    fallbackRoute: '/(tabs)/settings',
  });

  // Local state
  const [connection, setConnection] = useState<GmailConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Check if Gmail OAuth is configured
  const isConfigured = isGmailAuthConfigured();

  // Fetch connection on mount
  const fetchConnection = useCallback(async () => {
    try {
      const conn = await getGmailConnection();
      setConnection(conn);
    } catch (error) {
      console.error('[EmailIntegration] Error fetching connection:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchConnection();
  }, [fetchConnection]);

  // Handle OAuth response
  useEffect(() => {
    if (response?.type === 'success' && response.params.code) {
      const handleCallback = async () => {
        if (!request?.codeVerifier) {
          Alert.alert('Error', 'OAuth flow incomplete. Please try again.');
          setIsConnecting(false);
          return;
        }

        const result = await handleGmailAuthCallback(
          response.params.code,
          request.codeVerifier
        );

        setIsConnecting(false);

        if (result.success) {
          Alert.alert(
            'Gmail Connected',
            `Successfully connected ${result.email}. OpenClaw will now scan for rental platform emails.`
          );
          fetchConnection();
        } else {
          Alert.alert('Connection Failed', result.error || 'Failed to connect Gmail');
        }
      };

      handleCallback();
    } else if (response?.type === 'error') {
      setIsConnecting(false);
      Alert.alert('Error', 'OAuth authorization failed. Please try again.');
    } else if (response?.type === 'dismiss') {
      setIsConnecting(false);
    }
  }, [response, request, fetchConnection]);

  // Connect Gmail
  const handleConnect = async () => {
    if (!isConfigured) {
      Alert.alert(
        'Not Configured',
        'Gmail integration is not yet configured. Please contact support.'
      );
      return;
    }

    setIsConnecting(true);
    try {
      await promptAsync();
    } catch {
      setIsConnecting(false);
      Alert.alert('Error', 'Failed to start OAuth flow');
    }
  };

  // Manual sync
  const handleSync = async () => {
    if (!connection) return;

    setIsSyncing(true);
    try {
      const result = await triggerGmailSync(connection.id);

      if (result.success) {
        const message = result.newMessages
          ? `Found ${result.newMessages} new message${result.newMessages > 1 ? 's' : ''}`
          : 'No new messages found';
        Alert.alert('Sync Complete', message);
        fetchConnection();
      } else {
        Alert.alert('Sync Failed', result.error || 'Failed to sync Gmail');
      }
    } catch {
      Alert.alert('Error', 'Failed to sync Gmail');
    } finally {
      setIsSyncing(false);
    }
  };

  // Disconnect Gmail
  const handleDisconnect = () => {
    if (!connection) return;

    Alert.alert(
      'Disconnect Gmail',
      'Are you sure you want to disconnect Gmail? OpenClaw will no longer receive emails from rental platforms.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            setIsDisconnecting(true);
            try {
              const success = await disconnectGmail(connection.id);

              if (success) {
                setConnection(null);
                Alert.alert('Disconnected', 'Gmail has been disconnected from OpenClaw.');
              } else {
                Alert.alert('Error', 'Failed to disconnect Gmail');
              }
            } catch {
              Alert.alert('Error', 'Failed to disconnect Gmail');
            } finally {
              setIsDisconnecting(false);
            }
          },
        },
      ]
    );
  };

  // Pull to refresh
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchConnection();
  }, [fetchConnection]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedView className="flex-1 items-center justify-center">
          <LoadingSpinner />
        </ThemedView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status Card */}
        <View className="p-4">
          <ConnectionCard
            connection={connection}
            isConfigured={isConfigured}
            isConnecting={isConnecting}
            isSyncing={isSyncing}
            isDisconnecting={isDisconnecting}
            onConnect={handleConnect}
            onSync={handleSync}
            onDisconnect={handleDisconnect}
          />
        </View>

        {/* Detected Platforms */}
        {connection && connection.detected_platforms && connection.detected_platforms.length > 0 && (
          <View className="p-4">
            <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
              DETECTED PLATFORMS
            </Text>
            <DetectedPlatforms platforms={connection.detected_platforms} />
          </View>
        )}

        {/* How It Works */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
            HOW IT WORKS
          </Text>
          <HowItWorksSection />
        </View>

        {/* Security Note */}
        <View className="p-4">
          <SecurityNote />
        </View>
        </ScrollView>
      </ThemedSafeAreaView>
    </>
  );
}

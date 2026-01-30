/**
 * Email Integration Settings Screen
 *
 * Allows landlords to connect their Gmail account to receive platform inquiries
 * directly in MoltBot. Shows connection status, last sync time, and detected platforms.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ChevronLeft,
  Mail,
  Check,
  X,
  RefreshCw,
  AlertCircle,
  Clock,
  Unlink,
  Shield,
  Building2,
  Home,
  Plane,
} from 'lucide-react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import {
  useGmailAuth,
  handleGmailAuthCallback,
  getGmailConnection,
  disconnectGmail,
  triggerGmailSync,
  formatLastSyncTime,
  isGmailAuthConfigured,
  GmailConnection,
} from '@/services/gmail';

// Platform display info
const PLATFORM_INFO: Record<string, { name: string; icon: React.ReactNode; color: string }> = {
  airbnb: { name: 'Airbnb', icon: <Home size={16} />, color: '#FF5A5F' },
  furnishedfinder: { name: 'Furnished Finder', icon: <Building2 size={16} />, color: '#4A90A4' },
  zillow: { name: 'Zillow', icon: <Building2 size={16} />, color: '#006AFF' },
  turbotenant: { name: 'TurboTenant', icon: <Building2 size={16} />, color: '#00B5AD' },
  hotpads: { name: 'HotPads', icon: <Building2 size={16} />, color: '#6B4EFF' },
  craigslist: { name: 'Craigslist', icon: <Building2 size={16} />, color: '#5A3D8A' },
  vrbo: { name: 'VRBO', icon: <Plane size={16} />, color: '#3B5998' },
};

export function EmailIntegrationScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  // Gmail auth hook
  const { request, response, promptAsync, redirectUri } = useGmailAuth();

  // Local state
  const [connection, setConnection] = useState<GmailConnection | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Check if Gmail OAuth is configured
  const isConfigured = isGmailAuthConfigured();

  // Fetch connection on mount
  const fetchConnection = useCallback(async () => {
    setFetchError(null);
    try {
      const conn = await getGmailConnection();
      setConnection(conn);
    } catch (error) {
      console.error('[EmailIntegration] Error fetching connection:', error);
      setFetchError('Unable to check Gmail connection status. Pull to refresh.');
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
            `Successfully connected ${result.email}. MoltBot will now scan for rental platform emails.`
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
    } catch (error) {
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
    } catch (error) {
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
      'Are you sure you want to disconnect Gmail? MoltBot will no longer receive emails from rental platforms.',
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
                Alert.alert('Disconnected', 'Gmail has been disconnected from MoltBot.');
              } else {
                Alert.alert('Error', 'Failed to disconnect Gmail');
              }
            } catch (error) {
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
      <ThemedView className="flex-1 items-center justify-center">
        <LoadingSpinner />
      </ThemedView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View
        className="flex-row items-center px-4 py-3 border-b"
        style={{ borderColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
            Email Integration
          </Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            Connect Gmail to receive platform inquiries
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Connection Status Card */}
        <View className="p-4">
          <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
            <View className="flex-row items-center mb-4">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{
                  backgroundColor: connection
                    ? withOpacity(colors.success, 'light')
                    : colors.muted,
                }}
              >
                <Mail
                  size={24}
                  color={connection ? colors.success : colors.mutedForeground}
                />
              </View>
              <View className="flex-1 ml-4">
                <Text className="font-semibold" style={{ color: colors.foreground }}>
                  Gmail Connection
                </Text>
                <View className="flex-row items-center mt-1">
                  {connection ? (
                    <>
                      <Check size={14} color={colors.success} />
                      <Text className="ml-1 text-sm" style={{ color: colors.success }}>
                        Connected
                      </Text>
                    </>
                  ) : (
                    <>
                      <X size={14} color={colors.mutedForeground} />
                      <Text className="ml-1 text-sm" style={{ color: colors.mutedForeground }}>
                        Not connected
                      </Text>
                    </>
                  )}
                </View>
              </View>
            </View>

            {connection ? (
              <>
                {/* Connected Email */}
                <View
                  className="py-3"
                  style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                >
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                    Connected Account
                  </Text>
                  <Text className="font-medium mt-1" style={{ color: colors.foreground }}>
                    {connection.email_address}
                  </Text>
                </View>

                {/* Last Sync */}
                <View
                  className="flex-row items-center py-3"
                  style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                >
                  <Clock size={16} color={colors.mutedForeground} />
                  <Text className="ml-2 text-sm" style={{ color: colors.mutedForeground }}>
                    Last checked: {formatLastSyncTime(connection.last_sync_at)}
                  </Text>
                </View>

                {/* Sync Error */}
                {connection.sync_error && (
                  <View
                    className="flex-row items-center py-3"
                    style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                  >
                    <AlertCircle size={16} color={colors.destructive} />
                    <Text className="ml-2 text-sm" style={{ color: colors.destructive }}>
                      {connection.sync_error}
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View
                  className="flex-row pt-4 gap-3"
                  style={{ borderTopWidth: 1, borderTopColor: colors.border }}
                >
                  <TouchableOpacity
                    className="flex-1 flex-row items-center justify-center py-3 rounded-lg"
                    style={{ backgroundColor: colors.primary }}
                    onPress={handleSync}
                    disabled={isSyncing}
                  >
                    {isSyncing ? (
                      <LoadingSpinner size="small" color={colors.primaryForeground} />
                    ) : (
                      <>
                        <RefreshCw size={18} color={colors.primaryForeground} />
                        <Text className="ml-2 font-medium" style={{ color: colors.primaryForeground }}>
                          Sync Now
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="flex-row items-center justify-center py-3 px-4 rounded-lg"
                    style={{ backgroundColor: colors.muted }}
                    onPress={handleDisconnect}
                    disabled={isDisconnecting}
                  >
                    {isDisconnecting ? (
                      <LoadingSpinner size="small" color={colors.destructive} />
                    ) : (
                      <Unlink size={18} color={colors.destructive} />
                    )}
                  </TouchableOpacity>
                </View>
              </>
            ) : (
              <>
                {/* Connect Button */}
                <TouchableOpacity
                  className="flex-row items-center justify-center py-3 rounded-lg mt-2"
                  style={{
                    backgroundColor: isConfigured ? colors.primary : colors.muted,
                  }}
                  onPress={handleConnect}
                  disabled={isConnecting || !isConfigured}
                >
                  {isConnecting ? (
                    <LoadingSpinner size="small" color={colors.primaryForeground} />
                  ) : (
                    <>
                      <Mail
                        size={18}
                        color={isConfigured ? colors.primaryForeground : colors.mutedForeground}
                      />
                      <Text
                        className="ml-2 font-medium"
                        style={{
                          color: isConfigured ? colors.primaryForeground : colors.mutedForeground,
                        }}
                      >
                        {isConfigured ? 'Connect Gmail' : 'Coming Soon'}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>

                {!isConfigured && (
                  <Text className="text-sm text-center mt-3" style={{ color: colors.mutedForeground }}>
                    Gmail integration is being configured. Check back soon.
                  </Text>
                )}
              </>
            )}
          </View>
        </View>

        {/* Detected Platforms */}
        {connection && connection.detected_platforms && connection.detected_platforms.length > 0 && (
          <View className="p-4">
            <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
              DETECTED PLATFORMS
            </Text>

            <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
              <View className="flex-row flex-wrap gap-2">
                {connection.detected_platforms.map((platform) => {
                  const info = PLATFORM_INFO[platform.toLowerCase()] || {
                    name: platform,
                    icon: <Building2 size={16} />,
                    color: colors.primary,
                  };

                  return (
                    <View
                      key={platform}
                      className="flex-row items-center px-3 py-2 rounded-full"
                      style={{ backgroundColor: withOpacity(info.color, 'muted') }}
                    >
                      {React.cloneElement(info.icon as React.ReactElement, {
                        color: info.color,
                      })}
                      <Text className="ml-2 text-sm font-medium" style={{ color: info.color }}>
                        {info.name}
                      </Text>
                    </View>
                  );
                })}
              </View>
              <Text className="text-sm mt-3" style={{ color: colors.mutedForeground }}>
                MoltBot found emails from these platforms in your inbox
              </Text>
            </View>
          </View>
        )}

        {/* How It Works */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-2 px-2" style={{ color: colors.mutedForeground }}>
            HOW IT WORKS
          </Text>

          <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
            <View className="flex-row mb-4">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
              >
                <Text className="font-bold" style={{ color: colors.primary }}>1</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium" style={{ color: colors.foreground }}>
                  Connect your Gmail
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                  MoltBot only requests read-only access to scan for platform emails
                </Text>
              </View>
            </View>

            <View className="flex-row mb-4">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
              >
                <Text className="font-bold" style={{ color: colors.primary }}>2</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium" style={{ color: colors.foreground }}>
                  Automatic scanning
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                  We check for new emails from Airbnb, Furnished Finder, Zillow, and other platforms
                </Text>
              </View>
            </View>

            <View className="flex-row">
              <View
                className="w-8 h-8 rounded-full items-center justify-center mr-3"
                style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
              >
                <Text className="font-bold" style={{ color: colors.primary }}>3</Text>
              </View>
              <View className="flex-1">
                <Text className="font-medium" style={{ color: colors.foreground }}>
                  Inquiries in your inbox
                </Text>
                <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                  New inquiries appear in MoltBot ready for AI-assisted responses
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Security Note */}
        <View className="p-4">
          <View
            className="rounded-lg p-4 flex-row"
            style={{ backgroundColor: withOpacity(colors.success, 'muted') }}
          >
            <Shield size={20} color={colors.success} />
            <View className="flex-1 ml-3">
              <Text className="font-medium" style={{ color: colors.success }}>
                Your data is safe
              </Text>
              <Text className="text-sm mt-1" style={{ color: colors.foreground }}>
                MoltBot uses read-only access. We never modify, delete, or send emails from your account.
                You can revoke access anytime.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

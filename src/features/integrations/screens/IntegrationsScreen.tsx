// src/features/integrations/screens/IntegrationsScreen.tsx
// Screen for managing third-party integrations (Seam, Tracerfy)

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert, Switch, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Wifi,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronRight,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  ExternalLink,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  Button,
  Badge,
  Card,
  Input,
  FormField,
  TAB_BAR_SAFE_PADDING,
} from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import {
  useIntegrations,
  useIntegrationMutations,
} from '../hooks/useIntegrations';
import {
  IntegrationProvider,
  IntegrationStatus,
  INTEGRATION_PROVIDERS,
} from '../types';

export function IntegrationsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const { data, isLoading, refetch } = useIntegrations();
  const { updateSeam, updateTracerfy, testConnection, disconnect, isSaving } =
    useIntegrationMutations();

  // Local state for API key inputs
  const [seamApiKey, setSeamApiKey] = useState('');
  const [tracerfyApiKey, setTracerfyApiKey] = useState('');
  const [showSeamKey, setShowSeamKey] = useState(false);
  const [showTracerfyKey, setShowTracerfyKey] = useState(false);

  // Initialize local state from fetched data
  useEffect(() => {
    if (data) {
      setSeamApiKey(data.seam?.apiKey || '');
      setTracerfyApiKey(data.tracerfy?.apiKey || '');
    }
  }, [data]);

  const handleBack = () => router.back();

  const handleSaveSeam = async () => {
    try {
      await updateSeam({
        apiKey: seamApiKey,
        enabled: true,
      });
      const connected = await testConnection('seam');
      if (connected) {
        Alert.alert('Success', 'Seam connected successfully!');
      } else {
        Alert.alert('Warning', 'API key saved but connection test failed. Please verify your key.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save');
    }
  };

  const handleSaveTracerfy = async () => {
    try {
      await updateTracerfy({
        apiKey: tracerfyApiKey,
        enabled: true,
      });
      const connected = await testConnection('tracerfy');
      if (connected) {
        Alert.alert('Success', 'Tracerfy connected successfully!');
      } else {
        Alert.alert('Warning', 'API key saved but connection test failed. Please verify your key.');
      }
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save');
    }
  };

  const handleDisconnect = (provider: IntegrationProvider) => {
    const providerName = INTEGRATION_PROVIDERS[provider].name;
    Alert.alert(
      `Disconnect ${providerName}`,
      `Are you sure you want to disconnect ${providerName}? Your API key will be removed.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: async () => {
            try {
              await disconnect(provider);
              if (provider === 'seam') {
                setSeamApiKey('');
              } else {
                setTracerfyApiKey('');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to disconnect');
            }
          },
        },
      ]
    );
  };

  const handleToggleTracerfyAutoSkipTrace = async (enabled: boolean) => {
    try {
      await updateTracerfy({ autoSkipTrace: enabled });
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const handleToggleTracerfyAutoMatch = async (enabled: boolean) => {
    try {
      await updateTracerfy({ autoMatchToProperty: enabled });
    } catch (error) {
      Alert.alert('Error', 'Failed to update setting');
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case 'connected':
        return <CheckCircle2 size={20} color={colors.success} />;
      case 'error':
        return <AlertCircle size={20} color={colors.destructive} />;
      default:
        return <XCircle size={20} color={colors.mutedForeground} />;
    }
  };

  const getStatusBadge = (status: IntegrationStatus, enabled: boolean) => {
    if (!enabled) {
      return <Badge variant="secondary">Disabled</Badge>;
    }
    switch (status) {
      case 'connected':
        return <Badge variant="success">Connected</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="warning">Not Connected</Badge>;
    }
  };

  if (isLoading && !data) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading integrations..." />
      </ThemedSafeAreaView>
    );
  }

  const seam = data?.seam;
  const tracerfy = data?.tracerfy;

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader title="Integrations" backButton onBack={handleBack} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING,
        }}
      >
        {/* Seam - Smart Home */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                <Text style={{ fontSize: 24 }}>🔐</Text>
              </View>
              <View>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.lg,
                    fontWeight: '600',
                  }}
                >
                  Seam
                </Text>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.xs,
                  }}
                >
                  Smart Locks (Schlage)
                </Text>
              </View>
            </View>
            {seam && getStatusBadge(seam.status, seam.enabled)}
          </View>

          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.sm,
              marginBottom: SPACING.md,
            }}
          >
            Control smart locks and generate access codes for guests. Currently supporting Schlage locks.
          </Text>

          <FormField label="API Key" className="mb-3">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  value={seamApiKey}
                  onChangeText={setSeamApiKey}
                  placeholder="Enter Seam API key..."
                  secureTextEntry={!showSeamKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowSeamKey(!showSeamKey)}
                className="p-3 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                {showSeamKey ? (
                  <EyeOff size={20} color={colors.mutedForeground} />
                ) : (
                  <Eye size={20} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            </View>
          </FormField>

          <View className="flex-row gap-2">
            <Button
              onPress={handleSaveSeam}
              disabled={isSaving || !seamApiKey.trim()}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : seam?.status === 'connected' ? 'Update' : 'Connect'}
            </Button>
            {seam?.status === 'connected' && (
              <Button
                variant="destructive"
                onPress={() => handleDisconnect('seam')}
                disabled={isSaving}
              >
                <Trash2 size={18} color="white" />
              </Button>
            )}
          </View>

          {seam?.error && (
            <View
              className="mt-3 p-3 rounded-lg flex-row items-center gap-2"
              style={{ backgroundColor: withOpacity(colors.destructive, 'light') }}
            >
              <AlertCircle size={16} color={colors.destructive} />
              <Text
                style={{
                  color: colors.destructive,
                  fontSize: FONT_SIZES.sm,
                  flex: 1,
                }}
              >
                {seam.error}
              </Text>
            </View>
          )}
        </Card>

        {/* Tracerfy - Skip Tracing */}
        <Card className="mb-4">
          <View className="flex-row items-center justify-between mb-4">
            <View className="flex-row items-center gap-3">
              <View
                className="w-12 h-12 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                <Text style={{ fontSize: 24 }}>🔍</Text>
              </View>
              <View>
                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: FONT_SIZES.lg,
                    fontWeight: '600',
                  }}
                >
                  Tracerfy
                </Text>
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.xs,
                  }}
                >
                  Skip Tracing
                </Text>
              </View>
            </View>
            {tracerfy && getStatusBadge(tracerfy.status, tracerfy.enabled)}
          </View>

          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.sm,
              marginBottom: SPACING.md,
            }}
          >
            Find contact information for leads and automatically match them to property addresses.
          </Text>

          <FormField label="API Key" className="mb-3">
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Input
                  value={tracerfyApiKey}
                  onChangeText={setTracerfyApiKey}
                  placeholder="Enter Tracerfy API key..."
                  secureTextEntry={!showTracerfyKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
              <TouchableOpacity
                onPress={() => setShowTracerfyKey(!showTracerfyKey)}
                className="p-3 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.muted }}
              >
                {showTracerfyKey ? (
                  <EyeOff size={20} color={colors.mutedForeground} />
                ) : (
                  <Eye size={20} color={colors.mutedForeground} />
                )}
              </TouchableOpacity>
            </View>
          </FormField>

          {/* Tracerfy Settings */}
          {tracerfy?.status === 'connected' && (
            <View className="mb-3">
              <View
                className="flex-row items-center justify-between p-3 rounded-lg mb-2"
                style={{ backgroundColor: colors.muted }}
              >
                <View className="flex-1 mr-3">
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: FONT_SIZES.sm,
                      fontWeight: '500',
                    }}
                  >
                    Auto Skip Trace
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Automatically search for contact info on new leads
                  </Text>
                </View>
                <Switch
                  value={tracerfy.autoSkipTrace}
                  onValueChange={handleToggleTracerfyAutoSkipTrace}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>

              <View
                className="flex-row items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: colors.muted }}
              >
                <View className="flex-1 mr-3">
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: FONT_SIZES.sm,
                      fontWeight: '500',
                    }}
                  >
                    Auto Match to Property
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Automatically link leads to property addresses
                  </Text>
                </View>
                <Switch
                  value={tracerfy.autoMatchToProperty}
                  onValueChange={handleToggleTracerfyAutoMatch}
                  trackColor={{ false: colors.border, true: colors.primary }}
                  thumbColor={colors.card}
                />
              </View>

              {tracerfy.creditsRemaining !== undefined && (
                <View className="mt-2 p-3 rounded-lg" style={{ backgroundColor: colors.muted }}>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Credits Remaining
                  </Text>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: FONT_SIZES.lg,
                      fontWeight: '600',
                    }}
                  >
                    {tracerfy.creditsRemaining}
                  </Text>
                </View>
              )}
            </View>
          )}

          <View className="flex-row gap-2">
            <Button
              onPress={handleSaveTracerfy}
              disabled={isSaving || !tracerfyApiKey.trim()}
              className="flex-1"
            >
              {isSaving ? 'Saving...' : tracerfy?.status === 'connected' ? 'Update' : 'Connect'}
            </Button>
            {tracerfy?.status === 'connected' && (
              <Button
                variant="destructive"
                onPress={() => handleDisconnect('tracerfy')}
                disabled={isSaving}
              >
                <Trash2 size={18} color="white" />
              </Button>
            )}
          </View>

          {tracerfy?.error && (
            <View
              className="mt-3 p-3 rounded-lg flex-row items-center gap-2"
              style={{ backgroundColor: withOpacity(colors.destructive, 'light') }}
            >
              <AlertCircle size={16} color={colors.destructive} />
              <Text
                style={{
                  color: colors.destructive,
                  fontSize: FONT_SIZES.sm,
                  flex: 1,
                }}
              >
                {tracerfy.error}
              </Text>
            </View>
          )}
        </Card>

        {/* Help Text */}
        <View className="px-2">
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.xs,
              textAlign: 'center',
            }}
          >
            API keys are stored securely and encrypted. Contact support if you need help setting up integrations.
          </Text>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

export default IntegrationsScreen;

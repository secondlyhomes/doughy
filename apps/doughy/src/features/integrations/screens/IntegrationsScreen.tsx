// src/features/integrations/screens/IntegrationsScreen.tsx
// Screen for managing third-party integrations (Seam, Tracerfy)

import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import {
  LoadingSpinner,
  TAB_BAR_SAFE_PADDING,
} from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import {
  useIntegrations,
  useIntegrationMutations,
} from '../hooks/useIntegrations';
import {
  IntegrationProvider,
  INTEGRATION_PROVIDERS,
} from '../types';
import { SeamIntegrationCard } from '../components/SeamIntegrationCard';
import { TracerfyIntegrationCard } from '../components/TracerfyIntegrationCard';

export function IntegrationsScreen() {
  const colors = useThemeColors();

  const { data, isLoading, refetch } = useIntegrations();
  const { updateSeam, updateTracerfy, testConnection, disconnect, isSaving } =
    useIntegrationMutations();

  // Local state for API key inputs
  const [seamApiKey, setSeamApiKey] = useState('');
  const [tracerfyApiKey, setTracerfyApiKey] = useState('');
  const [showSeamKey, setShowSeamKey] = useState(false);
  const [showTracerfyKey, setShowTracerfyKey] = useState(false);

  const { headerOptions } = useNativeHeader({
    title: 'Integrations',
    fallbackRoute: '/(tabs)/settings',
  });

  // Initialize local state from fetched data
  useEffect(() => {
    if (data) {
      setSeamApiKey(data.seam?.apiKey || '');
      setTracerfyApiKey(data.tracerfy?.apiKey || '');
    }
  }, [data]);

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

  if (isLoading && !data) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading integrations..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  const seam = data?.seam;
  const tracerfy = data?.tracerfy;

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingHorizontal: SPACING.md,
          paddingBottom: TAB_BAR_SAFE_PADDING,
        }}
      >
        {/* Seam - Smart Home */}
        <SeamIntegrationCard
          seam={seam}
          seamApiKey={seamApiKey}
          setSeamApiKey={setSeamApiKey}
          showSeamKey={showSeamKey}
          setShowSeamKey={setShowSeamKey}
          isSaving={isSaving}
          onSave={handleSaveSeam}
          onDisconnect={() => handleDisconnect('seam')}
        />

        {/* Tracerfy - Skip Tracing */}
        <TracerfyIntegrationCard
          tracerfy={tracerfy}
          tracerfyApiKey={tracerfyApiKey}
          setTracerfyApiKey={setTracerfyApiKey}
          showTracerfyKey={showTracerfyKey}
          setShowTracerfyKey={setShowTracerfyKey}
          isSaving={isSaving}
          onSave={handleSaveTracerfy}
          onDisconnect={() => handleDisconnect('tracerfy')}
          onToggleAutoSkipTrace={handleToggleTracerfyAutoSkipTrace}
          onToggleAutoMatch={handleToggleTracerfyAutoMatch}
        />

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
    </>
  );
}

export default IntegrationsScreen;

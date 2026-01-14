// src/features/admin/screens/IntegrationsScreen.tsx
// Integrations management screen for admin

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Switch,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Home,
  MapPin,
  Database,
  CreditCard,
  Mail,
  Phone,
  Map,
  FileText,
  Link,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner, Button } from '@/components/ui';
import {
  getIntegrations,
  toggleIntegration,
  syncIntegration,
  type Integration,
  type IntegrationStatus,
} from '../services/integrationsService';

export function IntegrationsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [syncingId, setSyncingId] = useState<string | null>(null);

  const loadIntegrations = useCallback(async () => {
    const result = await getIntegrations();
    if (result.success && result.integrations) {
      setIntegrations(result.integrations);
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadIntegrations().finally(() => setIsLoading(false));
  }, [loadIntegrations]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadIntegrations();
    setIsRefreshing(false);
  }, [loadIntegrations]);

  const handleToggle = useCallback(async (integration: Integration, enabled: boolean) => {
    const action = enabled ? 'enable' : 'disable';
    Alert.alert(
      `${action.charAt(0).toUpperCase() + action.slice(1)} Integration`,
      `Are you sure you want to ${action} ${integration.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: action.charAt(0).toUpperCase() + action.slice(1),
          onPress: async () => {
            const result = await toggleIntegration(integration.id, enabled);
            if (result.success) {
              setIntegrations((prev) =>
                prev.map((i) =>
                  i.id === integration.id
                    ? { ...i, status: enabled ? 'active' : 'inactive' }
                    : i
                )
              );
            } else {
              Alert.alert('Error', result.error || `Failed to ${action} integration`);
            }
          },
        },
      ]
    );
  }, []);

  const handleSync = useCallback(async (integration: Integration) => {
    setSyncingId(integration.id);
    const result = await syncIntegration(integration.id);

    if (result.success) {
      setIntegrations((prev) =>
        prev.map((i) =>
          i.id === integration.id
            ? { ...i, lastSync: new Date().toISOString() }
            : i
        )
      );
      Alert.alert('Success', `${integration.name} synced successfully`);
    } else {
      Alert.alert('Error', result.error || 'Failed to sync integration');
    }

    setSyncingId(null);
  }, []);

  const getIcon = (iconName: string) => {
    const iconProps = { size: 24, color: colors.info };
    switch (iconName) {
      case 'home':
        return <Home {...iconProps} />;
      case 'map-pin':
        return <MapPin {...iconProps} />;
      case 'database':
        return <Database {...iconProps} />;
      case 'credit-card':
        return <CreditCard {...iconProps} />;
      case 'mail':
        return <Mail {...iconProps} />;
      case 'phone':
        return <Phone {...iconProps} />;
      case 'map':
        return <Map {...iconProps} />;
      case 'file-signature':
        return <FileText {...iconProps} />;
      default:
        return <Link {...iconProps} />;
    }
  };

  const getStatusIcon = (status: IntegrationStatus) => {
    switch (status) {
      case 'active':
        return <CheckCircle size={16} color={colors.success} />;
      case 'inactive':
        return <XCircle size={16} color={colors.mutedForeground} />;
      case 'error':
        return <AlertCircle size={16} color={colors.destructive} />;
      case 'pending':
        return <Clock size={16} color={colors.warning} />;
    }
  };

  const getStatusColor = (status: IntegrationStatus) => {
    switch (status) {
      case 'active':
        return colors.success;
      case 'inactive':
        return colors.mutedForeground;
      case 'error':
        return colors.destructive;
      case 'pending':
        return colors.warning;
    }
  };

  const formatLastSync = (timestamp: string | undefined) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1">
        <ScreenHeader title="Integrations" backButton bordered />
        <LoadingSpinner fullScreen />
      </ThemedSafeAreaView>
    );
  }

  const activeCount = integrations.filter((i) => i.status === 'active').length;
  const errorCount = integrations.filter((i) => i.status === 'error').length;

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader title="Integrations" backButton bordered />

      {/* Stats */}
      <View className="flex-row px-4 py-3 gap-4" style={{ backgroundColor: `${colors.muted}80` }}>
        <View className="flex-row items-center">
          <CheckCircle size={16} color={colors.success} />
          <Text className="text-sm ml-1" style={{ color: colors.mutedForeground }}>
            {activeCount} Active
          </Text>
        </View>
        {errorCount > 0 && (
          <View className="flex-row items-center">
            <AlertCircle size={16} color={colors.destructive} />
            <Text className="text-sm ml-1" style={{ color: colors.destructive }}>
              {errorCount} Error{errorCount !== 1 ? 's' : ''}
            </Text>
          </View>
        )}
      </View>

      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {integrations.map((integration) => (
          <View
            key={integration.id}
            className="mx-4 my-2 p-4 rounded-lg border"
            style={{ backgroundColor: colors.card, borderColor: colors.border }}
          >
            <View className="flex-row items-start">
              <View className="w-12 h-12 rounded-lg items-center justify-center" style={{ backgroundColor: `${colors.primary}1A` }}>
                {getIcon(integration.icon)}
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="font-medium" style={{ color: colors.foreground }}>
                    {integration.name}
                  </Text>
                  <View className="ml-2">{getStatusIcon(integration.status)}</View>
                </View>
                <Text className="text-sm mt-0.5" style={{ color: colors.mutedForeground }}>
                  {integration.description}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Text className="text-xs capitalize" style={{ color: getStatusColor(integration.status) }}>
                    {integration.status}
                  </Text>
                  {integration.lastSync && (
                    <>
                      <Text className="text-xs mx-2" style={{ color: colors.mutedForeground }}>•</Text>
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        Synced {formatLastSync(integration.lastSync)}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Switch
                value={integration.status === 'active'}
                onValueChange={(enabled) => handleToggle(integration, enabled)}
                trackColor={{ false: colors.muted, true: colors.info }}
                thumbColor={integration.status === 'active' ? colors.primary : colors.mutedForeground}
                disabled={integration.status === 'pending'}
              />
            </View>

            {/* Action Buttons */}
            {integration.status === 'active' && (
              <View className="flex-row mt-3 pt-3 border-t" style={{ borderColor: colors.border }}>
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => handleSync(integration)}
                  disabled={syncingId === integration.id}
                  loading={syncingId === integration.id}
                >
                  {syncingId !== integration.id && (
                    <RefreshCw size={16} color={colors.mutedForeground} />
                  )}
                  {syncingId === integration.id ? 'Syncing...' : 'Sync Now'}
                </Button>
              </View>
            )}

            {integration.status === 'error' && (
              <View className="mt-3 p-2 rounded" style={{ backgroundColor: `${colors.destructive}1A` }}>
                <Text className="text-xs" style={{ color: colors.destructive }}>
                  Connection error. Please check your API credentials and try again.
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

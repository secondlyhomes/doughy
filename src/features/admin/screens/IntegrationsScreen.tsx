// src/features/admin/screens/IntegrationsScreen.tsx
// Integrations management screen for admin

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Switch,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getIntegrations,
  toggleIntegration,
  syncIntegration,
  type Integration,
  type IntegrationStatus,
} from '../services/integrationsService';

export function IntegrationsScreen() {
  const navigation = useNavigation();

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
    const iconProps = { size: 24, color: '#3b82f6' };
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
        return <CheckCircle size={16} color="#22c55e" />;
      case 'inactive':
        return <XCircle size={16} color="#6b7280" />;
      case 'error':
        return <AlertCircle size={16} color="#ef4444" />;
      case 'pending':
        return <Clock size={16} color="#f59e0b" />;
    }
  };

  const getStatusColor = (status: IntegrationStatus) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-gray-500';
      case 'error':
        return 'text-red-600';
      case 'pending':
        return 'text-amber-600';
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
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
            <ArrowLeft size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
            Integrations
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  const activeCount = integrations.filter((i) => i.status === 'active').length;
  const errorCount = integrations.filter((i) => i.status === 'error').length;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="p-2">
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
          Integrations
        </Text>
      </View>

      {/* Stats */}
      <View className="flex-row px-4 py-3 bg-muted/50 gap-4">
        <View className="flex-row items-center">
          <CheckCircle size={16} color="#22c55e" />
          <Text className="text-sm text-muted-foreground ml-1">
            {activeCount} Active
          </Text>
        </View>
        {errorCount > 0 && (
          <View className="flex-row items-center">
            <AlertCircle size={16} color="#ef4444" />
            <Text className="text-sm text-red-600 ml-1">
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
            className="mx-4 my-2 p-4 bg-card rounded-lg border border-border"
          >
            <View className="flex-row items-start">
              <View className="w-12 h-12 rounded-lg bg-primary/10 items-center justify-center">
                {getIcon(integration.icon)}
              </View>
              <View className="flex-1 ml-3">
                <View className="flex-row items-center">
                  <Text className="text-foreground font-medium">
                    {integration.name}
                  </Text>
                  <View className="ml-2">{getStatusIcon(integration.status)}</View>
                </View>
                <Text className="text-sm text-muted-foreground mt-0.5">
                  {integration.description}
                </Text>
                <View className="flex-row items-center mt-2">
                  <Text className={`text-xs capitalize ${getStatusColor(integration.status)}`}>
                    {integration.status}
                  </Text>
                  {integration.lastSync && (
                    <>
                      <Text className="text-xs text-muted-foreground mx-2">•</Text>
                      <Text className="text-xs text-muted-foreground">
                        Synced {formatLastSync(integration.lastSync)}
                      </Text>
                    </>
                  )}
                </View>
              </View>
              <Switch
                value={integration.status === 'active'}
                onValueChange={(enabled) => handleToggle(integration, enabled)}
                trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
                thumbColor={integration.status === 'active' ? '#3b82f6' : '#f4f4f5'}
                disabled={integration.status === 'pending'}
              />
            </View>

            {/* Action Buttons */}
            {integration.status === 'active' && (
              <View className="flex-row mt-3 pt-3 border-t border-border">
                <TouchableOpacity
                  className="flex-row items-center px-3 py-2 bg-muted rounded-lg"
                  onPress={() => handleSync(integration)}
                  disabled={syncingId === integration.id}
                >
                  {syncingId === integration.id ? (
                    <ActivityIndicator size="small" color="#3b82f6" />
                  ) : (
                    <RefreshCw size={16} color="#6b7280" />
                  )}
                  <Text className="text-sm text-muted-foreground ml-2">
                    {syncingId === integration.id ? 'Syncing...' : 'Sync Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {integration.status === 'error' && (
              <View className="mt-3 p-2 bg-red-50 rounded">
                <Text className="text-xs text-red-600">
                  Connection error. Please check your API credentials and try again.
                </Text>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

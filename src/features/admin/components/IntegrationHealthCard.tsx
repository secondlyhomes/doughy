// src/features/admin/components/IntegrationHealthCard.tsx
// Component to display Supabase connection health

import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { Database, RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { supabase, USE_MOCK_DATA } from '@/lib/supabase';

interface ConnectionHealth {
  connected: boolean;
  apiKeyCount: number;
  error?: string;
  latency?: number;
}

export function IntegrationHealthCard() {
  const colors = useThemeColors();
  const [health, setHealth] = useState<ConnectionHealth | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    const startTime = Date.now();

    try {
      // Test connection by querying api_keys table
      const { data, error, count } = await supabase
        .from('security_api_keys')
        .select('*', { count: 'exact', head: false });

      const latency = Date.now() - startTime;

      if (error) {
        setHealth({
          connected: false,
          apiKeyCount: 0,
          error: error.message,
        });
      } else {
        setHealth({
          connected: true,
          apiKeyCount: count || data?.length || 0,
          latency,
        });
      }
    } catch (error) {
      setHealth({
        connected: false,
        apiKeyCount: 0,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    if (!USE_MOCK_DATA) {
      checkConnection();
    }
  }, []);

  if (USE_MOCK_DATA) {
    return (
      <View style={[styles.card, { backgroundColor: withOpacity(colors.warning, 'muted'), borderColor: colors.warning }]}>
        <View style={styles.header}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={[styles.title, { color: colors.warning }]}>Mock Data Mode</Text>
        </View>
        <Text style={[styles.message, { color: colors.warning }]}>
          Not connected to Supabase - using in-memory mock data
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.header}>
        <Database size={20} color={health?.connected ? colors.success : colors.mutedForeground} />
        <Text style={[styles.title, { color: colors.foreground }]}>Supabase Connection</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={checkConnection}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <RefreshCw size={16} color={colors.primary} />
          )}
        </TouchableOpacity>
      </View>

      {health && (
        <View style={styles.status}>
          {health.connected ? (
            <>
              <View style={styles.statusRow}>
                <CheckCircle size={16} color={colors.success} />
                <Text style={[styles.statusText, { color: colors.success }]}>Connected</Text>
              </View>
              <Text style={[styles.details, { color: colors.mutedForeground }]}>
                {health.apiKeyCount} API key{health.apiKeyCount !== 1 ? 's' : ''} in database
              </Text>
              {health.latency && (
                <Text style={[styles.latency, { color: colors.mutedForeground }]}>
                  Response time: {health.latency}ms
                </Text>
              )}
            </>
          ) : (
            <>
              <View style={styles.statusRow}>
                <AlertTriangle size={16} color={colors.destructive} />
                <Text style={[styles.statusText, { color: colors.destructive }]}>Connection Error</Text>
              </View>
              {health.error && (
                <Text style={[styles.error, { color: colors.destructive }]}>{health.error}</Text>
              )}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 8,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  refreshButton: {
    padding: 4,
  },
  status: {
    gap: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusText: {
    fontSize: 13,
    fontWeight: '500',
  },
  details: {
    fontSize: 12,
    marginLeft: 22,
  },
  latency: {
    fontSize: 11,
    marginLeft: 22,
  },
  message: {
    fontSize: 12,
  },
  error: {
    fontSize: 11,
    marginLeft: 22,
    marginTop: 4,
  },
});

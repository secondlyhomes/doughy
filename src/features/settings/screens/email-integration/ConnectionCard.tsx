// src/features/settings/screens/email-integration/ConnectionCard.tsx
// Connection status card for Gmail integration

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Mail, Check, X, RefreshCw, AlertCircle, Clock, Unlink } from 'lucide-react-native';
import { LoadingSpinner } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { formatLastSyncTime, type GmailConnection } from '@/services/gmail';

interface ConnectionCardProps {
  connection: GmailConnection | null;
  isConfigured: boolean;
  isConnecting: boolean;
  isSyncing: boolean;
  isDisconnecting: boolean;
  onConnect: () => void;
  onSync: () => void;
  onDisconnect: () => void;
}

export function ConnectionCard({
  connection,
  isConfigured,
  isConnecting,
  isSyncing,
  isDisconnecting,
  onConnect,
  onSync,
  onDisconnect,
}: ConnectionCardProps) {
  const colors = useThemeColors();

  return (
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
              onPress={onSync}
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
              onPress={onDisconnect}
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
            onPress={onConnect}
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
  );
}

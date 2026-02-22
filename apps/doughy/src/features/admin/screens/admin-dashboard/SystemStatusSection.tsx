// src/features/admin/screens/admin-dashboard/SystemStatusSection.tsx
// System status display section

import React from 'react';
import { View, Text } from 'react-native';
import { Server, CheckCircle, AlertTriangle, XCircle, Activity } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import type { SystemHealth } from '../../services/adminService';
import { getStatusColor } from './utils';

interface SystemStatusSectionProps {
  systems: SystemHealth[];
}

function getStatusIcon(status: string, colors: ReturnType<typeof useThemeColors>) {
  switch (status) {
    case 'operational':
      return <CheckCircle size={16} color={colors.success} />;
    case 'degraded':
      return <AlertTriangle size={16} color={colors.warning} />;
    case 'outage':
      return <XCircle size={16} color={colors.destructive} />;
    default:
      return <Activity size={16} color={colors.mutedForeground} />;
  }
}

export function SystemStatusSection({ systems }: SystemStatusSectionProps) {
  const colors = useThemeColors();

  return (
    <View className="p-4">
      <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
        System Status
      </Text>
      <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
        {systems.map((system, index) => (
          <View
            key={system.name}
            className="flex-row items-center p-4"
            style={
              index !== systems.length - 1
                ? { borderBottomWidth: 1, borderColor: colors.border }
                : undefined
            }
          >
            <Server size={20} color={colors.mutedForeground} />
            <View className="flex-1 ml-3">
              <Text className="font-medium" style={{ color: colors.foreground }}>
                {system.name}
              </Text>
              {system.latency != null && (
                <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                  Response: {system.latency}ms
                </Text>
              )}
            </View>
            <View className="flex-row items-center">
              {getStatusIcon(system.status, colors)}
              <Text
                className="ml-2 text-sm capitalize"
                style={{ color: getStatusColor(system.status, colors) }}
              >
                {system.status}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

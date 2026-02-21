// src/features/admin/screens/ai-security-dashboard/PatternListItem.tsx
// Individual pattern row in the pattern list (toggle, edit, delete actions)

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useThemeColors } from '@/contexts/ThemeContext';
import { Switch, Badge } from '@/components/ui';
import { BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';

import type { SecurityPattern } from './types';

interface PatternListItemProps {
  item: SecurityPattern;
  togglingId: string | null;
  onToggleActive: (item: SecurityPattern) => void;
  onEdit: (item: SecurityPattern) => void;
  onDelete: (item: SecurityPattern) => void;
}

const getSeverityColor = (sev: string | undefined | null, colors: ReturnType<typeof useThemeColors>): string => {
  if (sev === 'critical') return colors.destructive;
  if (sev === 'high') return colors.warning;
  if (sev === 'medium') return '#f59e0b';
  return colors.mutedForeground;
};

const formatThreatType = (type: string | undefined | null): string => {
  if (!type) return 'unknown';
  return type.replace(/_/g, ' ');
};

export function PatternListItem({
  item,
  togglingId,
  onToggleActive,
  onEdit,
  onDelete,
}: PatternListItemProps) {
  const colors = useThemeColors();
  const severityLabel = item.severity || 'unknown';
  const severityColor = getSeverityColor(item.severity, colors);

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: BORDER_RADIUS.lg,
        padding: 12,
        marginBottom: 8,
      }}
    >
      <View
        style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' }}
      >
        <View style={{ flex: 1, marginRight: 8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Badge
              variant="outline"
              style={{
                backgroundColor: severityColor + '20',
                borderColor: severityColor,
                marginRight: 6,
              }}
            >
              <Text style={{ fontSize: 10, color: severityColor, fontWeight: '600' }}>
                {severityLabel.toUpperCase()}
              </Text>
            </Badge>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>
              {formatThreatType(item.threatType)}
            </Text>
          </View>
          <Text
            style={{ fontSize: 12, color: colors.foreground, fontFamily: 'monospace' }}
            numberOfLines={2}
          >
            {item.pattern}
          </Text>
          {item.description && (
            <Text
              style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 4 }}
              numberOfLines={1}
            >
              {item.description}
            </Text>
          )}
          <Text style={{ fontSize: 10, color: colors.mutedForeground, marginTop: 4 }}>
            {item.hitCount} hits
          </Text>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          {togglingId === item.id ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Switch checked={item.isActive} onCheckedChange={() => onToggleActive(item)} />
          )}
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <TouchableOpacity
              onPress={() => onEdit(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="pencil" size={ICON_SIZES.md} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onDelete(item)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={ICON_SIZES.md} color={colors.destructive} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
}

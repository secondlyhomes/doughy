// src/components/ui/HeaderActionMenu.tsx
// Vertical "..." menu button for detail screen headers
// Opens a bottom sheet with contextual actions (Edit, Delete, etc.)

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MoreVertical } from 'lucide-react-native';
import type { LucideIcon } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES, ICON_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { BottomSheet } from './BottomSheet';

export interface HeaderAction {
  label: string;
  icon?: LucideIcon;
  onPress: () => void;
  destructive?: boolean;
  disabled?: boolean;
}

export interface HeaderActionMenuProps {
  actions: HeaderAction[];
  /** Icon size for the trigger button */
  iconSize?: number;
}

export function HeaderActionMenu({ actions, iconSize = ICON_SIZES.xl }: HeaderActionMenuProps) {
  const colors = useThemeColors();
  const [visible, setVisible] = useState(false);

  const handleAction = useCallback((action: HeaderAction) => {
    setVisible(false);
    // Small delay so sheet closes before action fires
    setTimeout(() => action.onPress(), 150);
  }, []);

  return (
    <>
      <TouchableOpacity
        onPress={() => setVisible(true)}
        style={styles.trigger}
        accessibilityLabel="More actions"
        accessibilityRole="button"
      >
        <MoreVertical size={iconSize} color={colors.foreground} />
      </TouchableOpacity>

      <BottomSheet
        visible={visible}
        onClose={() => setVisible(false)}
        title="Actions"
      >
        <View style={styles.list}>
          {actions.map((action, index) => {
            const Icon = action.icon;
            const color = action.destructive ? colors.destructive : colors.foreground;
            return (
              <TouchableOpacity
                key={index}
                onPress={() => handleAction(action)}
                disabled={action.disabled}
                style={[
                  styles.item,
                  { borderBottomColor: colors.border },
                  index === actions.length - 1 && styles.lastItem,
                  action.disabled && styles.disabled,
                ]}
                accessibilityLabel={action.label}
                accessibilityRole="button"
              >
                {Icon && <Icon size={ICON_SIZES.lg} color={color} />}
                <Text style={[styles.label, { color }]}>{action.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: SPACING.sm,
  },
  list: {
    paddingBottom: SPACING.lg,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  lastItem: {
    borderBottomWidth: 0,
  },
  label: {
    fontSize: FONT_SIZES.base,
    fontWeight: '500',
  },
  disabled: {
    opacity: 0.4,
  },
});

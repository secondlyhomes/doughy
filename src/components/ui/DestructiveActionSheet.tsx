// src/components/ui/DestructiveActionSheet.tsx
// Consistent pattern for dangerous actions (delete, archive, disconnect)

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { AlertTriangle, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';

export interface DestructiveActionSheetProps {
  /** Whether the sheet is visible */
  isOpen: boolean;
  /** Callback when the sheet is closed */
  onClose: () => void;
  /** Title of the confirmation dialog */
  title: string;
  /** Description explaining what will happen */
  description: string;
  /** Label for the confirm button (default: "Delete") */
  confirmLabel?: string;
  /** Callback when action is confirmed */
  onConfirm: () => void;
  /** Whether the action is in progress */
  isLoading?: boolean;
  /** Label for the cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Custom icon for the header (default: AlertTriangle) */
  icon?: LucideIcon;
  /** Variant for the visual style */
  variant?: 'danger' | 'warning';
  /** Optional item name to highlight in the description */
  itemName?: string;
}

export function DestructiveActionSheet({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  isLoading = false,
  cancelLabel = 'Cancel',
  icon: Icon = AlertTriangle,
  variant = 'danger',
  itemName,
}: DestructiveActionSheetProps) {
  const colors = useThemeColors();

  const variantColor = variant === 'danger' ? colors.destructive : colors.warning;

  return (
    <BottomSheet visible={isOpen} onClose={onClose} title={title}>
      {/* Icon and Description */}
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: withOpacity(variantColor, 'light') },
          ]}
        >
          <Icon size={32} color={variantColor} />
        </View>

        <Text style={[styles.description, { color: colors.foreground }]}>
          {itemName && itemName.length > 0 && description.includes(itemName) ? (
            <>
              {description.split(itemName)[0]}
              <Text style={styles.itemName}>{itemName}</Text>
              {description.split(itemName).slice(1).join(itemName)}
            </>
          ) : (
            description
          )}
        </Text>

        <Text style={[styles.warning, { color: colors.mutedForeground }]}>
          This action cannot be undone.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <Button
          variant="outline"
          onPress={onClose}
          disabled={isLoading}
          style={styles.button}
        >
          {cancelLabel}
        </Button>
        <Button
          variant="destructive"
          onPress={onConfirm}
          disabled={isLoading}
          loading={isLoading}
          style={styles.button}
        >
          <View style={styles.confirmContent}>
            <Trash2 size={16} color={colors.destructiveForeground} />
            <Text style={[styles.confirmLabel, { color: colors.destructiveForeground }]}>
              {isLoading ? 'Deleting...' : confirmLabel}
            </Text>
          </View>
        </Button>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingVertical: SPACING.lg,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.base,
    textAlign: 'center',
    lineHeight: FONT_SIZES.base * 1.5,
  },
  itemName: {
    fontWeight: '700',
  },
  warning: {
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  button: {
    flex: 1,
  },
  confirmContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  confirmLabel: {
    // Note: Color now applied inline using colors.destructiveForeground
    fontWeight: '600',
  },
});

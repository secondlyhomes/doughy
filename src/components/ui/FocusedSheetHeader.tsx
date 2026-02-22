// src/components/ui/FocusedSheetHeader.tsx
// Header sub-component for FocusedSheet (cancel, title, done/close)

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { styles } from '@/components/ui/focused-sheet-styles';

interface FocusedSheetHeaderProps {
  title: string;
  subtitle?: string;
  cancelLabel: string;
  doneLabel?: string;
  doneDisabled: boolean;
  isSubmitting: boolean;
  onClose: () => void;
  onDone?: () => void;
}

export function FocusedSheetHeader({
  title,
  subtitle,
  cancelLabel,
  doneLabel,
  doneDisabled,
  isSubmitting,
  onClose,
  onDone,
}: FocusedSheetHeaderProps) {
  const colors = useThemeColors();

  return (
    <View style={[styles.header, { borderBottomColor: colors.border }]}>
      {/* Cancel Button */}
      <TouchableOpacity
        onPress={onClose}
        style={styles.headerButton}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        accessibilityRole="button"
        accessibilityLabel={cancelLabel}
      >
        <Text style={[styles.cancelText, { color: colors.primary }]}>
          {cancelLabel}
        </Text>
      </TouchableOpacity>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text
          style={[styles.title, { color: colors.foreground }]}
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle && (
          <Text
            style={[styles.subtitle, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        )}
      </View>

      {/* Done Button or Close */}
      {doneLabel && onDone ? (
        <TouchableOpacity
          onPress={onDone}
          style={styles.headerButton}
          disabled={doneDisabled || isSubmitting}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={doneLabel}
          accessibilityState={{ disabled: doneDisabled || isSubmitting }}
        >
          <Text
            style={[
              styles.doneText,
              {
                color: doneDisabled || isSubmitting
                  ? colors.mutedForeground
                  : colors.primary,
              },
            ]}
          >
            {isSubmitting ? 'Saving...' : doneLabel}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={onClose}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        >
          <X size={20} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// src/components/ui/FilterSheet.tsx
// Base component for filter sheets with consistent structure
// Provides header (close, title, reset), scrollable content, and footer (clear, apply)

import React from 'react';
import { View, Text, TouchableOpacity, Modal, ScrollView } from 'react-native';
import { X, RotateCcw, Check } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { Button } from './Button';
import { BottomSheet, BottomSheetSection } from './BottomSheet';
import { withOpacity } from '@/lib/design-utils';

export interface FilterSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Close handler */
  onClose: () => void;
  /** Title displayed in header */
  title?: string;
  /** Reset handler - called when reset button is pressed */
  onReset?: () => void;
  /** Apply handler - called when apply button is pressed */
  onApply?: () => void;
  /** Whether there are active filters (shows indicator) */
  hasActiveFilters?: boolean;
  /** Whether there are unsaved changes (enables apply button) */
  hasUnsavedChanges?: boolean;
  /** Filter content */
  children: React.ReactNode;
  /**
   * Presentation style:
   * - 'modal': Full-screen modal (iOS page sheet style)
   * - 'sheet': Bottom sheet overlay
   */
  presentation?: 'modal' | 'sheet';
  /**
   * Footer style:
   * - 'apply': Single "Apply Filters" button (for deferred mode)
   * - 'done': "Clear Filters" + "Done" buttons (for immediate mode)
   * - 'none': No footer buttons
   */
  footerStyle?: 'apply' | 'done' | 'none';
  /** Custom apply button label */
  applyLabel?: string;
  /** Custom clear button label */
  clearLabel?: string;
}

/**
 * FilterSheet - Base component for filter sheets
 *
 * Provides consistent structure for filter UIs:
 * - Header with close, title, and reset buttons
 * - Scrollable content area
 * - Footer with action buttons
 *
 * @example Modal presentation with apply button (deferred filters)
 * ```tsx
 * <FilterSheet
 *   visible={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   title="Filter Leads"
 *   onReset={resetFilters}
 *   onApply={handleApply}
 *   hasActiveFilters={hasActiveFilters}
 *   hasUnsavedChanges={hasUnsavedChanges}
 *   presentation="modal"
 *   footerStyle="apply"
 * >
 *   <FilterSection title="Status">
 *     {statusOptions.map(...)}
 *   </FilterSection>
 * </FilterSheet>
 * ```
 *
 * @example Bottom sheet with done button (immediate filters)
 * ```tsx
 * <FilterSheet
 *   visible={showFilters}
 *   onClose={() => setShowFilters(false)}
 *   title="Contact Filters"
 *   onReset={resetFilters}
 *   hasActiveFilters={hasActiveFilters}
 *   presentation="sheet"
 *   footerStyle="done"
 * >
 *   <FilterSection title="Type">
 *     {typeOptions.map(...)}
 *   </FilterSection>
 * </FilterSheet>
 * ```
 */
export function FilterSheet({
  visible,
  onClose,
  title = 'Filters',
  onReset,
  onApply,
  hasActiveFilters = false,
  hasUnsavedChanges = false,
  children,
  presentation = 'modal',
  footerStyle = 'apply',
  applyLabel = 'Apply Filters',
  clearLabel = 'Clear Filters',
}: FilterSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  // Header component (shared between modal and sheet)
  const Header = () => (
    <View
      className="flex-row items-center justify-between px-4 py-4"
      style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
    >
      <TouchableOpacity onPress={onClose} className="p-1" hitSlop={8}>
        <X size={24} color={colors.mutedForeground} />
      </TouchableOpacity>

      <View className="flex-row items-center">
        <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
          {title}
        </Text>
        {hasActiveFilters && (
          <View
            className="w-2 h-2 rounded-full ml-2"
            style={{ backgroundColor: colors.primary }}
          />
        )}
      </View>

      {onReset ? (
        <TouchableOpacity onPress={onReset} className="flex-row items-center" hitSlop={8}>
          <RotateCcw size={16} color={colors.primary} />
          <Text className="ml-1" style={{ color: colors.primary }}>
            Reset
          </Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 60 }} />
      )}
    </View>
  );

  // Footer component (shared between modal and sheet)
  const Footer = () => {
    if (footerStyle === 'none') return null;

    return (
      <View
        className="px-4 pb-4 pt-2"
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingBottom: insets.bottom + 16,
        }}
      >
        {footerStyle === 'apply' ? (
          <Button onPress={onApply ?? onClose} size="lg" className="w-full">
            {applyLabel}
          </Button>
        ) : (
          <View className="flex-row gap-3">
            <Button variant="outline" onPress={onReset} className="flex-1">
              {clearLabel}
            </Button>
            <Button onPress={onClose} className="flex-1">
              Done
            </Button>
          </View>
        )}
      </View>
    );
  };

  // Modal presentation
  if (presentation === 'modal') {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={onClose}
      >
        <ThemedSafeAreaView className="flex-1" edges={['top']}>
          <Header />
          <ScrollView className="flex-1 px-4 pt-4">
            {children}
            {/* Bottom padding for scroll content */}
            <View className="h-24" />
          </ScrollView>
          <Footer />
        </ThemedSafeAreaView>
      </Modal>
    );
  }

  // Bottom sheet presentation
  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      {children}
      {footerStyle !== 'none' && (
        <View className="flex-row gap-3 pt-4 pb-6">
          {footerStyle === 'apply' ? (
            <Button onPress={onApply ?? onClose} size="lg" className="w-full">
              {applyLabel}
            </Button>
          ) : (
            <>
              <Button variant="outline" onPress={onReset} className="flex-1">
                {clearLabel}
              </Button>
              <Button onPress={onClose} className="flex-1">
                Done
              </Button>
            </>
          )}
        </View>
      )}
    </BottomSheet>
  );
}

// Re-export BottomSheetSection as FilterSection for convenience
export { BottomSheetSection as FilterSection };
export type { BottomSheetSectionProps as FilterSectionProps } from './BottomSheet';

/**
 * FilterOptionButton - Selectable option for filter lists
 */
export interface FilterOptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function FilterOptionButton({ label, selected, onPress }: FilterOptionButtonProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      className="flex-row items-center justify-between px-4 py-3 rounded-lg mb-2"
      style={{
        backgroundColor: selected ? withOpacity(colors.primary, 'muted') : colors.muted,
        borderWidth: selected ? 1 : 0,
        borderColor: selected ? colors.primary : 'transparent',
      }}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${label}${selected ? ', selected' : ''}`}
      accessibilityState={{ selected }}
    >
      <Text
        className="text-base"
        style={{
          color: selected ? colors.primary : colors.foreground,
          fontWeight: selected ? '500' : 'normal',
        }}
      >
        {label}
      </Text>
      {selected && <Check size={18} color={colors.primary} />}
    </TouchableOpacity>
  );
}

/**
 * FilterChip - Compact pill-style filter option
 */
export interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export function FilterChip({
  label,
  isActive,
  onPress,
  accessibilityLabel,
}: FilterChipProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      className="px-4 py-2 rounded-full border"
      style={{
        backgroundColor: isActive ? colors.primary : colors.muted,
        borderColor: isActive ? colors.primary : colors.border,
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${label}${isActive ? ', selected' : ''}`}
      accessibilityState={{ selected: isActive }}
    >
      <Text
        className="text-sm font-medium"
        style={{ color: isActive ? colors.primaryForeground : colors.foreground }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

/**
 * FilterToggleRow - Binary toggle for sort order or similar options
 */
export interface FilterToggleRowProps {
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
}

export function FilterToggleRow({
  options,
  selectedValue,
  onSelect,
}: FilterToggleRowProps) {
  const colors = useThemeColors();

  return (
    <View className="flex-row gap-3">
      {options.map((option) => {
        const isSelected = selectedValue === option.value;
        return (
          <TouchableOpacity
            key={option.value}
            className="flex-1 py-3 rounded-lg items-center"
            style={{
              backgroundColor: isSelected ? colors.primary : colors.muted,
            }}
            onPress={() => onSelect(option.value)}
            accessibilityRole="button"
            accessibilityLabel={`${option.label}${isSelected ? ', selected' : ''}`}
            accessibilityState={{ selected: isSelected }}
          >
            <Text
              className="font-medium"
              style={{
                color: isSelected ? colors.primaryForeground : colors.foreground,
              }}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default FilterSheet;

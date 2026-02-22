// src/components/ui/filter-sheet-types.ts
// Types for FilterSheet and related components

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

export interface FilterOptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}

export interface FilterToggleRowProps {
  options: Array<{ label: string; value: string }>;
  selectedValue: string;
  onSelect: (value: string) => void;
}

// src/components/ui/focused-sheet-types.ts
// Type definitions for FocusedSheet component family

import React from 'react';

export interface FocusedSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Callback when sheet should close */
  onClose: () => void;
  /** Sheet title displayed in header */
  title: string;
  /** Optional subtitle displayed below title */
  subtitle?: string;
  /** Sheet content */
  children?: React.ReactNode;
  /** Text for done/submit button. If not provided, only close button shown */
  doneLabel?: string;
  /** Callback when done button pressed */
  onDone?: () => void;
  /** Whether done button is disabled */
  doneDisabled?: boolean;
  /** Whether form is currently submitting (shows loading state) */
  isSubmitting?: boolean;
  /** Text for cancel button. Defaults to "Cancel" */
  cancelLabel?: string;
  /** Whether content should be wrapped in ScrollView. Default: true */
  scrollable?: boolean;
  /** Optional progress indicator (0-1) for multi-step flows */
  progress?: number;
  /** Optional step text like "Step 1 of 4" */
  stepText?: string;
}

export interface FocusedSheetSectionProps {
  title?: string;
  children?: React.ReactNode;
}

export interface FocusedSheetFooterProps {
  children?: React.ReactNode;
}

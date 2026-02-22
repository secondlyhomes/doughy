// src/components/ui/ConfirmButton.tsx
// Inline confirmation button: tap once → "REALLY DELETE?" → tap again → executes
// Replaces modal/alert confirmations for destructive actions

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { ActivityIndicator } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from './Button';
import type { ButtonProps } from './Button';

export interface ConfirmButtonProps extends Omit<ButtonProps, 'onPress' | 'children'> {
  /** Label shown initially (e.g. "Delete Item") */
  label: string;
  /** Label shown after first tap (e.g. "REALLY DELETE?") — defaults to "REALLY {label}?" */
  confirmLabel?: string;
  /** Called when user confirms (taps the second time) */
  onConfirm: () => void | Promise<void>;
  /** Auto-reset after this many ms if user doesn't confirm. Default: 3000 */
  resetTimeout?: number;
}

export function ConfirmButton({
  label,
  confirmLabel,
  onConfirm,
  resetTimeout = 3000,
  variant = 'destructive',
  ...buttonProps
}: ConfirmButtonProps) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-reset to initial state after timeout
  useEffect(() => {
    if (confirming) {
      timerRef.current = setTimeout(() => setConfirming(false), resetTimeout);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [confirming, resetTimeout]);

  const handlePress = useCallback(async () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }

    // Second tap — execute
    if (timerRef.current) clearTimeout(timerRef.current);
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
      setConfirming(false);
    }
  }, [confirming, onConfirm]);

  const displayLabel = confirming
    ? (confirmLabel || `REALLY ${label.toUpperCase()}?`)
    : label;

  return (
    <Button
      variant={variant}
      onPress={handlePress}
      disabled={loading}
      {...buttonProps}
    >
      {loading ? <ActivityIndicator size="small" color="white" /> : displayLabel}
    </Button>
  );
}

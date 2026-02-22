// src/features/focus/components/touch-log-types.ts
// Types and constants for TouchLogSheet

import React from 'react';
import {
  Phone,
  PhoneCall,
  Voicemail,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react-native';
import { TouchType, TouchOutcome } from '../hooks/useContactTouches';
import { FocusedProperty } from '@/contexts/FocusModeContext';

// ============================================
// Types
// ============================================

export interface TouchLogSheetProps {
  visible: boolean;
  onClose: () => void;
  focusedProperty?: FocusedProperty | null;
  onSuccess?: () => void;
}

export interface TouchTypeOption {
  value: TouchType;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

export interface OutcomeOption {
  value: TouchOutcome;
  label: string;
  icon: React.ComponentType<{ size: number; color: string }>;
}

// ============================================
// Constants
// ============================================

export const TOUCH_TYPES: TouchTypeOption[] = [
  { value: 'first_call', label: 'First Call', icon: Phone },
  { value: 'follow_up', label: 'Follow-up', icon: PhoneCall },
  { value: 'voicemail', label: 'Voicemail', icon: Voicemail },
];

export const OUTCOMES: OutcomeOption[] = [
  { value: 'connected', label: 'Connected', icon: CheckCircle2 },
  { value: 'no_answer', label: 'No Answer', icon: XCircle },
  { value: 'voicemail_left', label: 'Left Voicemail', icon: Voicemail },
  { value: 'callback_scheduled', label: 'Callback Scheduled', icon: Clock },
];

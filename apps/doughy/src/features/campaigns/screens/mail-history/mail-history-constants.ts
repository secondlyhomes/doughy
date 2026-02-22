// src/features/campaigns/screens/mail-history/mail-history-constants.ts
// Status configuration for mail history entries

import {
  Clock,
  CheckCircle,
  XCircle,
  Send,
  AlertCircle,
} from 'lucide-react-native';
import type { DripTouchStatus } from '../../types';

export interface StatusConfig {
  label: string;
  color: 'default' | 'success' | 'destructive' | 'warning' | 'info';
  icon: typeof CheckCircle;
}

export const STATUS_CONFIG: Record<DripTouchStatus, StatusConfig> = {
  pending: { label: 'Pending', color: 'default', icon: Clock },
  sending: { label: 'Sending', color: 'info', icon: Send },
  sent: { label: 'Sent', color: 'info', icon: Send },
  delivered: { label: 'Delivered', color: 'success', icon: CheckCircle },
  failed: { label: 'Failed', color: 'destructive', icon: XCircle },
  skipped: { label: 'Skipped', color: 'warning', icon: AlertCircle },
  bounced: { label: 'Bounced', color: 'destructive', icon: XCircle },
};

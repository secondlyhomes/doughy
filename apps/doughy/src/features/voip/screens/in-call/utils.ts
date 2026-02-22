// src/features/voip/screens/in-call/utils.ts
// Utility functions for InCallScreen

import type { CallStatus } from '../../types';

// Semantic color keys for call status - maps to theme colors
export type StatusColorKey = 'warning' | 'success' | 'muted' | 'destructive';

export function getStatusDisplay(status: CallStatus | null): { text: string; colorKey: StatusColorKey } {
  switch (status) {
    case 'initiating':
      return { text: 'Initiating...', colorKey: 'warning' };
    case 'ringing':
      return { text: 'Ringing...', colorKey: 'warning' };
    case 'connecting':
      return { text: 'Connecting...', colorKey: 'warning' };
    case 'connected':
      return { text: 'Connected', colorKey: 'success' };
    case 'on_hold':
      return { text: 'On Hold', colorKey: 'warning' };
    case 'ended':
      return { text: 'Call Ended', colorKey: 'muted' };
    case 'failed':
      return { text: 'Call Failed', colorKey: 'destructive' };
    case 'busy':
      return { text: 'Busy', colorKey: 'destructive' };
    case 'no_answer':
      return { text: 'No Answer', colorKey: 'destructive' };
    default:
      return { text: 'Unknown', colorKey: 'muted' };
  }
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

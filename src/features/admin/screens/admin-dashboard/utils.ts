// src/features/admin/screens/admin-dashboard/utils.ts
// Utility functions for admin dashboard

import type { ThemeColors } from '@/contexts/ThemeContext';

export function getStatusColor(status: string, colors: ThemeColors): string {
  switch (status) {
    case 'operational':
      return colors.success;
    case 'degraded':
      return colors.warning;
    case 'outage':
      return colors.destructive;
    default:
      return colors.mutedForeground;
  }
}

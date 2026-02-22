// src/features/integrations/components/integration-status-helpers.tsx
// Shared status display helpers for integration cards

import React from 'react';
import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { IntegrationStatus } from '../types';

export function getStatusIcon(status: IntegrationStatus, colors: { success: string; destructive: string; mutedForeground: string }) {
  switch (status) {
    case 'connected':
      return <CheckCircle2 size={20} color={colors.success} />;
    case 'error':
      return <AlertCircle size={20} color={colors.destructive} />;
    default:
      return <XCircle size={20} color={colors.mutedForeground} />;
  }
}

export function getStatusBadge(status: IntegrationStatus, enabled: boolean) {
  if (!enabled) {
    return <Badge variant="secondary">Disabled</Badge>;
  }
  switch (status) {
    case 'connected':
      return <Badge variant="success">Connected</Badge>;
    case 'error':
      return <Badge variant="destructive">Error</Badge>;
    default:
      return <Badge variant="warning">Not Connected</Badge>;
  }
}

/**
 * Activity Display Constants
 *
 * Channel labels, status config, resolution labels, and tier config
 * used by activity components and detail views.
 */

import type { ApprovalChannel } from '@/types'

/** Unified channel labels — used in ActivityCard and ActivityDetail */
export const CHANNEL_LABELS: Record<ApprovalChannel, string> = {
  app: 'App',
  discord: 'Discord',
  whatsapp: 'WhatsApp',
  sms: 'SMS',
  slack: 'Slack',
  'auto-policy': 'Auto',
  api: 'API',
}

/** Status badge config for activity entries */
export const STATUS_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'error' | 'warning' | 'info' | 'default' }
> = {
  approved: { label: 'Approved', variant: 'success' },
  denied: { label: 'Denied', variant: 'error' },
  'auto-approved': { label: 'Auto', variant: 'info' },
  'auto-executed': { label: 'Auto', variant: 'info' },
  executed: { label: 'Executed', variant: 'success' },
  failed: { label: 'Failed', variant: 'error' },
  pending: { label: 'Pending', variant: 'warning' },
  expired: { label: 'Timed out', variant: 'default' },
}

/** Resolution method labels for audit trail */
export const RESOLUTION_LABELS: Record<string, string> = {
  'manual-user': 'User (manual)',
  'auto-policy': 'Auto-policy',
  'auto-autonomous': 'Autonomous mode',
  timeout: 'Timed out',
  denied: 'User denied',
}

/** Tier badge config for detail views */
export const TIER_CONFIG: Record<
  string,
  { label: string; variant: 'success' | 'warning' | 'error' | 'info' | 'default' }
> = {
  none: { label: 'None', variant: 'default' },
  low: { label: 'Low Risk', variant: 'success' },
  medium: { label: 'Medium Risk', variant: 'warning' },
  high: { label: 'High Risk', variant: 'error' },
  blocked: { label: 'Blocked', variant: 'error' },
}

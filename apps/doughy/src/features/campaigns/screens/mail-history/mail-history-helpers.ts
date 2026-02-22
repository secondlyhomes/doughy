// src/features/campaigns/screens/mail-history/mail-history-helpers.ts
// Helper functions for mail history display

import type { MailHistoryEntry } from '../../hooks/useMailHistory';

export function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function formatTimeAgo(dateString: string | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString();
}

export function getContactName(entry: MailHistoryEntry): string {
  const contact = entry.enrollment?.contact;
  if (contact) {
    return `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown';
  }
  return 'Unknown';
}

export function formatAddress(recipient: Record<string, unknown> | undefined): string {
  if (!recipient) return 'No address';
  const line1 = recipient.address_line1 || recipient.line1 || '';
  return String(line1) || 'No address';
}

export function formatCost(cost: number | null | undefined): string {
  if (cost === null || cost === undefined) return '-';
  return `${cost.toFixed(2)} credits`;
}

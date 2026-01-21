// src/features/focus/types/nudges.ts
// Types for the nudge/reminder system

export type NudgePriority = 'high' | 'medium' | 'low';

export type NudgeType =
  | 'stale_lead'
  | 'deal_stalled'
  | 'action_overdue'
  | 'action_due_soon'
  | 'capture_pending';

export type NudgeEntityType = 'lead' | 'deal' | 'property' | 'capture';

export interface Nudge {
  id: string;
  type: NudgeType;
  priority: NudgePriority;
  title: string;
  subtitle?: string;
  entityType: NudgeEntityType;
  entityId: string;
  entityName?: string;
  propertyAddress?: string;
  daysOverdue?: number;
  dueDate?: string;
  createdAt: string;
}

export interface NudgeSummary {
  total: number;
  high: number;
  medium: number;
  low: number;
}

// Configuration for nudge display
export const NUDGE_TYPE_CONFIG: Record<NudgeType, {
  label: string;
  icon: string;
  color: 'destructive' | 'warning' | 'info' | 'primary';
}> = {
  stale_lead: {
    label: 'Follow Up',
    icon: 'phone-missed',
    color: 'warning',
  },
  deal_stalled: {
    label: 'Deal Stalled',
    icon: 'alert-circle',
    color: 'warning',
  },
  action_overdue: {
    label: 'Overdue',
    icon: 'clock',
    color: 'destructive',
  },
  action_due_soon: {
    label: 'Due Soon',
    icon: 'calendar',
    color: 'info',
  },
  capture_pending: {
    label: 'Needs Triage',
    icon: 'inbox',
    color: 'primary',
  },
};

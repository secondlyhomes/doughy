// src/features/deals/types/events.ts
// Zone B: Shared contract for deal events (used by both Zone A and Zone B)

/**
 * All possible deal event types for the timeline
 */
export type DealEventType =
  | 'stage_change'
  | 'next_action_set'
  | 'offer_created'
  | 'offer_sent'
  | 'offer_countered'
  | 'walkthrough_started'
  | 'walkthrough_completed'
  | 'assumption_updated'
  | 'seller_report_generated'
  | 'document_uploaded'
  | 'document_signed'
  | 'risk_score_changed'
  | 'note'
  | 'ai_action_applied'
  | 'ai_job_completed';

/**
 * A single event in the deal timeline
 */
export interface DealEvent {
  id: string;
  deal_id: string;
  event_type: DealEventType;
  title: string;
  description?: string;
  metadata?: Record<string, unknown>;
  source: 'system' | 'user' | 'ai';
  created_by?: string;
  created_at: string;
}

/**
 * Key events that are shown in Focus Mode (filtered timeline)
 */
export const KEY_EVENT_TYPES: DealEventType[] = [
  'stage_change',
  'offer_sent',
  'offer_countered',
  'walkthrough_completed',
  'seller_report_generated',
  'document_signed',
];

/**
 * Display configuration for event types
 */
export const EVENT_TYPE_CONFIG: Record<
  DealEventType,
  { label: string; iconName: string; colorKey: string }
> = {
  stage_change: {
    label: 'Stage Changed',
    iconName: 'RefreshCw',
    colorKey: 'primary',
  },
  next_action_set: {
    label: 'Next Action Set',
    iconName: 'Target',
    colorKey: 'info',
  },
  offer_created: {
    label: 'Offer Created',
    iconName: 'FileText',
    colorKey: 'success',
  },
  offer_sent: {
    label: 'Offer Sent',
    iconName: 'Send',
    colorKey: 'success',
  },
  offer_countered: {
    label: 'Offer Countered',
    iconName: 'MessageSquare',
    colorKey: 'warning',
  },
  walkthrough_started: {
    label: 'Walkthrough Started',
    iconName: 'Camera',
    colorKey: 'info',
  },
  walkthrough_completed: {
    label: 'Walkthrough Completed',
    iconName: 'CheckCircle',
    colorKey: 'success',
  },
  assumption_updated: {
    label: 'Assumption Updated',
    iconName: 'Calculator',
    colorKey: 'warning',
  },
  seller_report_generated: {
    label: 'Seller Report Generated',
    iconName: 'Share2',
    colorKey: 'success',
  },
  document_uploaded: {
    label: 'Document Uploaded',
    iconName: 'Upload',
    colorKey: 'info',
  },
  document_signed: {
    label: 'Document Signed',
    iconName: 'PenTool',
    colorKey: 'success',
  },
  risk_score_changed: {
    label: 'Risk Score Changed',
    iconName: 'Shield',
    colorKey: 'warning',
  },
  note: {
    label: 'Note Added',
    iconName: 'FileText',
    colorKey: 'mutedForeground',
  },
  ai_action_applied: {
    label: 'AI Action Applied',
    iconName: 'Sparkles',
    colorKey: 'primary',
  },
  ai_job_completed: {
    label: 'AI Job Completed',
    iconName: 'CheckCircle',
    colorKey: 'success',
  },
};

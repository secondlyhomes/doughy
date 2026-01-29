// src/features/focus/index.ts
// Focus Feature - property-centric utilities and nudge system
// NOTE: FocusScreen has been archived - the Focus tab is now the Inbox tab
// which uses LeadInboxListScreen from the lead-inbox feature

// Hooks (still useful for property-centric features in Leads tab)
export {
  useNudges,
  useRecentProperties,
  usePropertyTimeline,
} from './hooks';

// Types
export type {
  Nudge,
  NudgeType,
  NudgePriority,
  NudgeEntityType,
  NudgeSummary,
} from './types';

export { NUDGE_TYPE_CONFIG } from './types';

// Re-export hook types
export type { RecentPropertyEntry } from './hooks/useRecentProperties';
export type { TimelineEvent } from './hooks/usePropertyTimeline';

// src/features/focus/hooks/index.ts
// Focus feature hooks

export { useNudges } from './useNudges';
export { useRecentProperties } from './useRecentProperties';
export { usePropertyTimeline } from './usePropertyTimeline';
export {
  useTouchesForLead,
  useRecentTouches,
  useLeadTouchStats,
  useCreateTouch,
  useUpdateTouch,
  useDeleteTouch,
} from './useContactTouches';

export type { RecentPropertyEntry } from './useRecentProperties';
export type { TimelineEvent } from './usePropertyTimeline';
export type {
  TouchType,
  TouchOutcome,
  ContactTouch,
  TouchInsert,
  LeadTouchStats,
} from './useContactTouches';

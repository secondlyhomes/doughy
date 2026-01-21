// src/features/focus/index.ts
// Focus Feature - dual-mode capture & awareness tab

// Screen
export { FocusScreen } from './screens/FocusScreen';

// Components
export {
  FocusHeader,
  FocusedPropertyCard,
  PropertySelector,
  NudgeCard,
  NudgesList,
} from './components';

// Hooks
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

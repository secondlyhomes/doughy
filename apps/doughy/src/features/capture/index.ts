// src/features/capture/index.ts
// Capture Feature - intake & triage center

// Screen
export { CaptureScreen } from './screens/CaptureScreen';

// Components
export { CaptureItemCard, TriageQueue, PushToLeadSheet } from './components';

// Hooks
export {
  useCaptureItems,
  usePendingCaptureCount,
  useCaptureItem,
  useCreateCaptureItem,
  useUpdateCaptureItem,
  useAssignCaptureItem,
  useDismissCaptureItem,
  useDeleteCaptureItem,
} from './hooks';

// Types
export type {
  CaptureItem,
  CaptureItemType,
  CaptureItemStatus,
  CaptureItemInsert,
  CaptureItemUpdate,
  PushToLeadData,
} from './types';

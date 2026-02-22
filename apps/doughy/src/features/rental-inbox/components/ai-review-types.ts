// src/features/rental-inbox/components/ai-review-types.ts
// Type definitions for the AIReviewCard component

import type {
  AIResponseQueueItem,
  EditSeverity,
  ApprovalMetadata,
} from '@/stores/rental-conversations-store';

// Re-export store types for convenience
export type { EditSeverity, ApprovalMetadata };

export interface AIReviewCardProps {
  pendingResponse: AIResponseQueueItem;
  onApprove: (metadata: ApprovalMetadata) => void;
  onReject: (responseTimeSeconds: number) => void;
  isProcessing?: boolean;
}

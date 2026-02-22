// src/features/field-mode/types/index.ts
// Re-export types from deals for convenience

export {
  type DealWalkthrough,
  type WalkthroughStatus,
  type WalkthroughItem,
  type PhotoBucket,
  type AISummary,
  PHOTO_BUCKET_CONFIG,
} from '../../deals/types';

import type { PhotoBucket as PhotoBucketType } from '../../deals/types';

// Additional field-mode specific types

/**
 * Voice recording state
 */
export interface VoiceRecordingState {
  isRecording: boolean;
  isPaused: boolean;
  duration: number; // seconds
  uri?: string;
}

/**
 * Photo capture result
 */
export interface CapturedPhoto {
  uri: string;
  width: number;
  height: number;
  base64?: string;
}

/**
 * Walkthrough progress tracking
 */
export interface WalkthroughProgress {
  totalPhotos: number;
  totalMemos: number;
  bucketsWithContent: PhotoBucketType[];
  isComplete: boolean;
}

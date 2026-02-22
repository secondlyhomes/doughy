// src/features/assistant/components/jobs-tab-types.ts
// Type definitions and constants for JobsTab

import {
  Clock,
  Loader2,
  CheckCircle,
  XCircle,
  X,
} from 'lucide-react-native';

import { AIJob, AIJobStatus } from '../types/jobs';

export interface JobsTabProps {
  dealId?: string;
  onJobPress?: (job: AIJob) => void;
}

export interface JobCardProps {
  job: AIJob;
  onPress: () => void;
  onCancel?: (e: any) => void;
}

// Status icon mapping
export const STATUS_ICONS: Record<AIJobStatus, React.ComponentType<any>> = {
  queued: Clock,
  running: Loader2,
  succeeded: CheckCircle,
  failed: XCircle,
  cancelled: X,
};

// src/features/assistant/types/jobs.ts
// AI Jobs types for background processing

/**
 * AI Job status
 */
export type AIJobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';

/**
 * AI Job types - what kind of job is being run
 */
export type AIJobType =
  | 'generate_seller_report'
  | 'generate_offer_packet'
  | 'organize_walkthrough'
  | 'extract_facts'
  | 'summarize_timeline'
  | 'prepare_esign_envelope'
  | 'analyze_comps'
  | 'web_research';

/**
 * AI Job entity
 */
export interface AIJob {
  id: string;
  deal_id?: string;
  job_type: AIJobType;
  status: AIJobStatus;
  progress: number; // 0-100
  input_json?: Record<string, unknown>;
  result_json?: Record<string, unknown>;
  result_artifact_ids?: string[];
  error_message?: string;
  created_by?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

/**
 * Job type configuration
 */
export interface JobTypeConfig {
  label: string;
  description: string;
  icon: string;
  estimatedDuration: string; // e.g., "30 seconds", "2-3 minutes"
  cancellable: boolean;
}

/**
 * Job type display configuration
 */
export const JOB_TYPE_CONFIG: Record<AIJobType, JobTypeConfig> = {
  generate_seller_report: {
    label: 'Generate Seller Report',
    description: 'Creating transparent options report for seller',
    icon: 'file-text',
    estimatedDuration: '30-60 seconds',
    cancellable: true,
  },
  generate_offer_packet: {
    label: 'Generate Offer Packet',
    description: 'Creating offer document with terms',
    icon: 'file-plus',
    estimatedDuration: '20-40 seconds',
    cancellable: true,
  },
  organize_walkthrough: {
    label: 'Organize Walkthrough',
    description: 'AI organizing photos and transcribing voice notes',
    icon: 'camera',
    estimatedDuration: '1-2 minutes',
    cancellable: true,
  },
  extract_facts: {
    label: 'Extract Facts',
    description: 'Pulling stated facts and flagging inconsistencies',
    icon: 'search',
    estimatedDuration: '15-30 seconds',
    cancellable: false,
  },
  summarize_timeline: {
    label: 'Summarize Timeline',
    description: 'Creating summary of deal activity',
    icon: 'list',
    estimatedDuration: '10-20 seconds',
    cancellable: false,
  },
  prepare_esign_envelope: {
    label: 'Prepare E-Sign',
    description: 'Setting up DocuSign envelope with field mapping',
    icon: 'pen-tool',
    estimatedDuration: '30-45 seconds',
    cancellable: true,
  },
  analyze_comps: {
    label: 'Analyze Comps',
    description: 'Analyzing comparable properties for ARV',
    icon: 'bar-chart-2',
    estimatedDuration: '20-30 seconds',
    cancellable: false,
  },
  web_research: {
    label: 'Web Research',
    description: 'Researching property and market data',
    icon: 'globe',
    estimatedDuration: '1-3 minutes',
    cancellable: true,
  },
};

/**
 * Job status display configuration
 */
export const JOB_STATUS_CONFIG: Record<AIJobStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  queued: { label: 'Queued', color: 'gray', icon: 'clock' },
  running: { label: 'Running', color: 'blue', icon: 'loader' },
  succeeded: { label: 'Completed', color: 'green', icon: 'check-circle' },
  failed: { label: 'Failed', color: 'red', icon: 'x-circle' },
  cancelled: { label: 'Cancelled', color: 'gray', icon: 'x' },
};

/**
 * Create a new job input
 */
export interface CreateJobInput {
  deal_id?: string;
  job_type: AIJobType;
  input_json?: Record<string, unknown>;
}

/**
 * Job result with artifacts
 */
export interface JobResult {
  success: boolean;
  data?: Record<string, unknown>;
  artifact_ids?: string[];
  error?: string;
}

/**
 * Get pending job count
 */
export function getPendingJobCount(jobs: AIJob[]): number {
  return jobs.filter(j => j.status === 'queued' || j.status === 'running').length;
}

/**
 * Get active job (currently running)
 */
export function getActiveJob(jobs: AIJob[]): AIJob | undefined {
  return jobs.find(j => j.status === 'running');
}

/**
 * Check if a job is in a terminal state
 */
export function isJobTerminal(job: AIJob): boolean {
  return job.status === 'succeeded' || job.status === 'failed' || job.status === 'cancelled';
}

/**
 * Check if a job can be cancelled
 */
export function canCancelJob(job: AIJob): boolean {
  if (isJobTerminal(job)) return false;
  return JOB_TYPE_CONFIG[job.job_type]?.cancellable ?? false;
}

/**
 * Generate a mock job ID (for development)
 */
export function generateMockJobId(): string {
  return `job_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Create a mock job for development
 */
export function createMockJob(
  jobType: AIJobType,
  dealId?: string,
  status: AIJobStatus = 'queued'
): AIJob {
  return {
    id: generateMockJobId(),
    deal_id: dealId,
    job_type: jobType,
    status,
    progress: status === 'succeeded' ? 100 : status === 'running' ? 50 : 0,
    created_at: new Date().toISOString(),
    started_at: status === 'running' || status === 'succeeded' ? new Date().toISOString() : undefined,
    completed_at: status === 'succeeded' ? new Date().toISOString() : undefined,
  };
}

// src/features/assistant/hooks/useAIJobs.ts
// Hook to manage AI jobs for background processing

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, USE_MOCK_DATA } from '@/lib/supabase';

import {
  AIJob,
  AIJobType,
  AIJobStatus,
  CreateJobInput,
  getPendingJobCount,
  getActiveJob,
  isJobTerminal,
  canCancelJob,
  generateMockJobId,
  createMockJob,
  JOB_TYPE_CONFIG,
} from '../types/jobs';

// ============================================
// Mock data for development
// ============================================

const MOCK_JOBS: AIJob[] = [
  createMockJob('generate_seller_report', 'deal-1', 'succeeded'),
  createMockJob('organize_walkthrough', 'deal-1', 'running'),
];

// ============================================
// Data fetching functions
// ============================================

/**
 * Fetch jobs for a deal
 */
async function fetchJobs(dealId?: string): Promise<AIJob[]> {
  if (!dealId) return [];

  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 300));
    return MOCK_JOBS.filter(j => j.deal_id === dealId || !dealId);
  }

  // Note: ai_jobs table type will be available after running migrations
  const { data, error } = await (supabase as any)
    .from('assistant_jobs')
    .select('*')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data as AIJob[]) || [];
}

/**
 * Create a new job
 */
async function createJobRequest(input: CreateJobInput): Promise<AIJob> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('[Mock] Created AI job:', input);
    return {
      id: generateMockJobId(),
      deal_id: input.deal_id,
      job_type: input.job_type,
      status: 'queued',
      progress: 0,
      input_json: input.input_json,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await (supabase as any)
    .from('assistant_jobs')
    .insert({
      deal_id: input.deal_id,
      job_type: input.job_type,
      input_json: input.input_json,
      status: 'queued',
      progress: 0,
    })
    .select()
    .single();

  if (error) throw error;
  return data as AIJob;
}

/**
 * Cancel a job
 */
async function cancelJobRequest(jobId: string): Promise<AIJob> {
  if (USE_MOCK_DATA) {
    await new Promise(resolve => setTimeout(resolve, 200));
    console.log('[Mock] Cancelled AI job:', jobId);
    return {
      id: jobId,
      job_type: 'generate_seller_report',
      status: 'cancelled',
      progress: 0,
      created_at: new Date().toISOString(),
    };
  }

  const { data, error } = await (supabase as any)
    .from('assistant_jobs')
    .update({ status: 'cancelled' })
    .eq('id', jobId)
    .select()
    .single();

  if (error) throw error;
  return data as AIJob;
}

/**
 * Hook return type
 */
export interface UseAIJobsReturn {
  /** All jobs for the current deal */
  jobs: AIJob[];
  /** Currently running job (if any) */
  activeJob: AIJob | undefined;
  /** Number of pending jobs (queued + running) */
  pendingCount: number;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  error: Error | null;
  /** Create a new job */
  createJob: (input: CreateJobInput) => Promise<AIJob>;
  /** Cancel a job */
  cancelJob: (jobId: string) => Promise<AIJob>;
  /** Check if a job can be cancelled */
  canCancel: (job: AIJob) => boolean;
  /** Refetch jobs */
  refetch: () => void;
}

/**
 * Hook options
 */
export interface UseAIJobsOptions {
  /** Auto-refetch interval in ms (default: 5000) */
  refetchInterval?: number;
  /** Whether to enable polling (default: true) */
  enablePolling?: boolean;
}

/**
 * Hook to manage AI jobs for a deal
 */
export function useAIJobs(
  dealId?: string,
  options?: UseAIJobsOptions
): UseAIJobsReturn {
  const queryClient = useQueryClient();
  const refetchInterval = options?.refetchInterval ?? 5000;
  const enablePolling = options?.enablePolling ?? true;

  // Query for fetching jobs
  const {
    data: jobs = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['ai-jobs', dealId],
    queryFn: () => fetchJobs(dealId),
    enabled: !!dealId,
    refetchInterval: enablePolling ? refetchInterval : false,
    staleTime: 2000,
  });

  // Mutation for creating jobs
  const createJobMutation = useMutation({
    mutationFn: createJobRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', dealId] });
    },
  });

  // Mutation for cancelling jobs
  const cancelJobMutation = useMutation({
    mutationFn: cancelJobRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-jobs', dealId] });
    },
  });

  // Derived values
  const activeJob = useMemo(() => getActiveJob(jobs), [jobs]);
  const pendingCount = useMemo(() => getPendingJobCount(jobs), [jobs]);

  // Callbacks
  const handleCreateJob = useCallback(
    async (input: CreateJobInput): Promise<AIJob> => {
      return createJobMutation.mutateAsync(input);
    },
    [createJobMutation]
  );

  const handleCancelJob = useCallback(
    async (jobId: string): Promise<AIJob> => {
      return cancelJobMutation.mutateAsync(jobId);
    },
    [cancelJobMutation]
  );

  const handleCanCancel = useCallback(
    (job: AIJob): boolean => canCancelJob(job),
    []
  );

  const handleRefetch = useCallback(() => {
    refetch();
  }, [refetch]);

  return {
    jobs,
    activeJob,
    pendingCount,
    isLoading,
    error: error as Error | null,
    createJob: handleCreateJob,
    cancelJob: handleCancelJob,
    canCancel: handleCanCancel,
    refetch: handleRefetch,
  };
}

/**
 * Hook to get job status updates with real-time subscription
 */
export function useJobStatus(jobId?: string): {
  job: AIJob | null;
  isLoading: boolean;
  isComplete: boolean;
  isRunning: boolean;
  progress: number;
} {
  const [job, setJob] = useState<AIJob | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setIsLoading(false);
      return;
    }

    // Initial fetch
    const fetchJob = async () => {
      if (USE_MOCK_DATA) {
        const mockJob = MOCK_JOBS.find(j => j.id === jobId) || null;
        setJob(mockJob);
        setIsLoading(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from('assistant_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (!error && data) {
        setJob(data as AIJob);
      }
      setIsLoading(false);
    };

    fetchJob();

    // Skip realtime in mock mode
    if (USE_MOCK_DATA) return;

    // Set up real-time subscription
    const subscription = supabase
      .channel(`job-${jobId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'ai_jobs', filter: `id=eq.${jobId}` },
        (payload) => {
          setJob(payload.new as AIJob);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [jobId]);

  return {
    job,
    isLoading,
    isComplete: job ? isJobTerminal(job) : false,
    isRunning: job?.status === 'running',
    progress: job?.progress ?? 0,
  };
}

export default useAIJobs;

// src/features/assistant/hooks/useJobWatcher.ts
// React hook for watching AI job progress with proper cleanup

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface AIJob {
  id: string;
  deal_id: string;
  job_type: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  progress: number;
  input_json?: Record<string, unknown>;
  result_json?: Record<string, unknown>;
  result_artifact_ids?: string[];
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

export interface JobWatcherState {
  job: AIJob | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook to watch an AI job's progress with automatic cleanup
 * @param jobId - The job ID to watch (null to stop watching)
 * @returns Current job state
 */
export function useJobWatcher(jobId: string | null): JobWatcherState {
  const [state, setState] = useState<JobWatcherState>({
    job: null,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    // No job to watch
    if (!jobId) {
      setState({ job: null, isLoading: false, error: null });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));

    // Fetch initial job status
    const fetchJob = async () => {
      try {
        const { data, error } = await supabase
          .from('ai_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) throw error;

        setState({ job: data as AIJob, isLoading: false, error: null });
        return data as AIJob;
      } catch (error) {
        setState({
          job: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
        return null;
      }
    };

    // Poll for job status updates
    const pollInterval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('ai_jobs')
          .select('*')
          .eq('id', jobId)
          .single();

        if (error) throw error;

        const job = data as AIJob;
        setState({ job, isLoading: false, error: null });

        // Stop polling when job completes
        if (job.status === 'succeeded' || job.status === 'failed') {
          clearInterval(pollInterval);
        }
      } catch (error) {
        setState({
          job: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Unknown error'),
        });
        clearInterval(pollInterval);
      }
    }, 1000); // Poll every second

    // Fetch initial status
    fetchJob();

    // Cleanup on unmount or when jobId changes
    return () => {
      clearInterval(pollInterval);
    };
  }, [jobId]);

  return state;
}

/**
 * ShareButton Component
 *
 * Button component to trigger share sheet for a task
 */

import React from 'react';
import { useShare } from '../hooks/useShareSheet';
import { ShareableTask } from '../types';

interface ShareButtonProps {
  task: ShareableTask;
}

/**
 * Share Button Component
 */
export function ShareButton({ task }: ShareButtonProps) {
  const { shareTask } = useShare();

  const handleShare = async () => {
    const result = await shareTask(task);

    if (result?.action === 'sharedAction') {
      // Track share event
      console.log('Task shared via:', result.activityType);
    }
  };

  return (
    <button onClick={handleShare}>
      Share Task
    </button>
  );
}

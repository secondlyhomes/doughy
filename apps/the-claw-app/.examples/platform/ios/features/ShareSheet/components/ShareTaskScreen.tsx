/**
 * ShareTaskScreen Component
 *
 * Screen for sharing a task with preview
 */

import React from 'react';
import { Alert } from 'react-native';
import { useShare } from '../hooks/useShareSheet';
import { ShareManager } from '../ShareManager';
import { ShareableTask } from '../types';

interface ShareTaskScreenProps {
  task: ShareableTask;
}

/**
 * Share Task Screen
 */
export function ShareTaskScreen({ task }: ShareTaskScreenProps) {
  const { shareTask, copyToClipboard } = useShare();

  const handleShare = async () => {
    const result = await shareTask(task);

    if (result) {
      Alert.alert('Success', 'Task shared successfully');
    }
  };

  const handleCopy = async () => {
    await copyToClipboard(task);
  };

  const previewContent = ShareManager.formatTaskForSharing(task).message;

  return (
    <div style={{ padding: 20 }}>
      <h2>Share Task</h2>

      <div style={{ marginTop: 20 }}>
        <button
          onClick={handleShare}
          style={{
            padding: '12px 24px',
            backgroundColor: '#007AFF',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 17,
            fontWeight: '600',
            marginRight: 12,
          }}
        >
          Share via...
        </button>

        <button
          onClick={handleCopy}
          style={{
            padding: '12px 24px',
            backgroundColor: '#F2F2F7',
            color: '#000000',
            border: 'none',
            borderRadius: 8,
            fontSize: 17,
            fontWeight: '600',
          }}
        >
          Copy to Clipboard
        </button>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3>Preview</h3>
        <div
          style={{
            padding: 16,
            backgroundColor: '#F2F2F7',
            borderRadius: 8,
            whiteSpace: 'pre-wrap',
          }}
        >
          {previewContent}
        </div>
      </div>
    </div>
  );
}

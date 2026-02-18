/**
 * Interaction Tracking Hook
 *
 * Tracks delays in the interaction queue using InteractionManager.
 */

import { useEffect } from 'react';
import { InteractionManager, Platform } from 'react-native';
import { MetricType, PerformanceMetric } from '../types';

interface UseInteractionTrackingOptions {
  enabled: boolean;
  onMetric: (metric: PerformanceMetric) => void;
}

/**
 * Hook for tracking interaction delays
 */
export function useInteractionTracking({
  enabled,
  onMetric,
}: UseInteractionTrackingOptions): void {
  useEffect(() => {
    if (!enabled) return;

    const startTime = Date.now();

    const handle = InteractionManager.runAfterInteractions(() => {
      const interactionDelay = Date.now() - startTime;

      onMetric({
        type: MetricType.INTERACTION,
        name: 'interaction_delay',
        value: interactionDelay,
        unit: 'ms',
        timestamp: Date.now(),
        tags: {
          platform: Platform.OS,
        },
      });
    });

    return () => {
      handle.cancel();
    };
  }, [enabled, onMetric]);
}

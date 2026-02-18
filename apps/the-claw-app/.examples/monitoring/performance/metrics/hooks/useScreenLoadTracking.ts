/**
 * Screen Load Tracking Hook
 *
 * Tracks screen load performance with manual start/end markers.
 *
 * @example
 * ```typescript
 * function DashboardScreen() {
 *   const { markLoadStart, markLoadEnd } = useScreenLoadTracking('Dashboard');
 *
 *   useEffect(() => {
 *     markLoadStart();
 *     fetchData().then(() => {
 *       markLoadEnd();
 *     });
 *   }, []);
 * }
 * ```
 */

import { useRef } from 'react';
import { InteractionManager } from 'react-native';

interface ScreenLoadTrackingResult {
  markLoadStart: () => void;
  markLoadEnd: () => void;
}

/**
 * Custom hook for tracking screen load performance
 */
export function useScreenLoadTracking(
  screenName: string,
  onComplete?: (duration: number) => void
): ScreenLoadTrackingResult {
  const loadStartRef = useRef<number | null>(null);

  const markLoadStart = () => {
    loadStartRef.current = Date.now();
  };

  const markLoadEnd = () => {
    if (loadStartRef.current) {
      InteractionManager.runAfterInteractions(() => {
        const duration = Date.now() - loadStartRef.current!;

        if (onComplete) {
          onComplete(duration);
        }

        if (__DEV__) {
          console.log(`[Metrics] Screen load (${screenName}): ${duration}ms`);
        }

        loadStartRef.current = null;
      });
    }
  };

  return { markLoadStart, markLoadEnd };
}

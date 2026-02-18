/**
 * useConditionalBack Hook
 *
 * Hook for conditionally handling back gestures
 */

import { useEffect, useRef } from 'react';
import { BackGestureInterceptor } from '../utils/BackGestureInterceptor';

/**
 * Hook for conditionally handling back gestures
 *
 * Registers/unregisters the back callback based on the shouldHandle condition
 *
 * @param shouldHandle - Whether to handle back gestures
 * @param onBack - Callback when back is invoked
 */
export function useConditionalBack(
  shouldHandle: boolean,
  onBack: () => void | Promise<void>
): void {
  const callbackId = useRef(`back-${Date.now()}`).current;

  useEffect(() => {
    if (shouldHandle) {
      BackGestureInterceptor.register(callbackId, {
        onBackInvoked: onBack,
      });
    } else {
      BackGestureInterceptor.unregister(callbackId);
    }

    return () => {
      BackGestureInterceptor.unregister(callbackId);
    };
  }, [shouldHandle, onBack, callbackId]);
}

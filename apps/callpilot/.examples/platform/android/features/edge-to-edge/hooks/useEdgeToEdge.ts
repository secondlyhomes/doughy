/**
 * useEdgeToEdge Hook
 *
 * React hook for enabling and managing edge-to-edge display mode.
 */

import { useEffect, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { EdgeToEdgeManager } from '../EdgeToEdgeManager';
import { UseEdgeToEdgeOptions, UseEdgeToEdgeResult } from '../types';

/**
 * Hook for enabling edge-to-edge display mode
 *
 * @param options - Configuration options
 * @param options.enabled - Whether to enable edge-to-edge (default: true)
 * @param options.style - System bar styling options
 * @returns Object containing isEdgeToEdge state and current insets
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const { isEdgeToEdge, insets } = useEdgeToEdge({
 *     enabled: true,
 *     style: {
 *       statusBarColor: 'transparent',
 *       statusBarStyle: 'dark-content',
 *     },
 *   });
 *
 *   return (
 *     <View style={{ paddingTop: insets.top }}>
 *       {/* content *\/}
 *     </View>
 *   );
 * }
 * ```
 */
export function useEdgeToEdge(options?: UseEdgeToEdgeOptions): UseEdgeToEdgeResult {
  const [isEdgeToEdge, setIsEdgeToEdge] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    const shouldEnable = options?.enabled !== false && EdgeToEdgeManager.isSupported();

    if (shouldEnable) {
      EdgeToEdgeManager.enable(options?.style).then(() => {
        setIsEdgeToEdge(true);
      });
    }

    return () => {
      if (shouldEnable) {
        EdgeToEdgeManager.disable().then(() => {
          setIsEdgeToEdge(false);
        });
      }
    };
  }, [options?.enabled]);

  return {
    isEdgeToEdge,
    insets,
  };
}

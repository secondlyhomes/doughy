/**
 * useDynamicSystemBars Hook
 *
 * Hook for dynamically updating system bar styling based on content.
 */

import { useEffect } from 'react';
import { EdgeToEdgeManager } from '../EdgeToEdgeManager';

/**
 * Hook for dynamically updating system bar styling
 *
 * Useful for screens where the content changes and requires
 * different system bar styles (e.g., switching between light
 * and dark content areas).
 *
 * @param isDarkContent - Whether the content behind system bars is dark
 *
 * @example
 * ```tsx
 * function MyScreen() {
 *   const [isDark, setIsDark] = useState(false);
 *   useDynamicSystemBars(isDark);
 *
 *   return (
 *     <View style={{ backgroundColor: isDark ? '#000' : '#fff' }}>
 *       {/* content *\/}
 *     </View>
 *   );
 * }
 * ```
 */
export function useDynamicSystemBars(isDarkContent: boolean): void {
  useEffect(() => {
    EdgeToEdgeManager.updateSystemBarStyle({
      statusBarStyle: isDarkContent ? 'dark-content' : 'light-content',
      navigationBarStyle: isDarkContent ? 'dark' : 'light',
    });
  }, [isDarkContent]);
}

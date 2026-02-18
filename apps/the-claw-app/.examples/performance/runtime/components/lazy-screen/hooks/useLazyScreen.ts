/**
 * LazyScreen Hooks
 *
 * Custom hooks for preloading lazy-loaded screens.
 */

import { useEffect, useRef } from 'react'
import { preloadScreen } from '../LazyScreen'

/**
 * Hook to preload screen on mount
 *
 * @param importFn - Function that returns dynamic import promise
 *
 * @example
 * ```tsx
 * function HomeScreen() {
 *   usePreloadScreen(() => import('./screens/profile-screen'))
 * }
 * ```
 */
export function usePreloadScreen(importFn: () => Promise<any>): void {
  useEffect(() => {
    preloadScreen(importFn)
  }, [])
}

/**
 * Hook to preload screen when visibility condition is met
 *
 * @param importFn - Function that returns dynamic import promise
 * @param enabled - Whether to enable preloading
 *
 * @example
 * ```tsx
 * function ListItem({ item }) {
 *   const ref = useRef(null)
 *   const isVisible = useIsVisible(ref)
 *
 *   usePreloadScreenOnVisible(
 *     () => import('./screens/detail-screen'),
 *     isVisible
 *   )
 *
 *   return <View ref={ref}>...</View>
 * }
 * ```
 */
export function usePreloadScreenOnVisible(
  importFn: () => Promise<any>,
  enabled: boolean
): void {
  const hasPreloaded = useRef(false)

  useEffect(() => {
    if (enabled && !hasPreloaded.current) {
      hasPreloaded.current = true
      preloadScreen(importFn)
    }
  }, [enabled, importFn])
}

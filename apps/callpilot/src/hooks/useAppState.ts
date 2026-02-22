/**
 * useAppState Hook
 *
 * Tracks app foreground/background state
 * Useful for pausing/resuming operations when app is backgrounded
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const appState = useAppState()
 *
 *   useEffect(() => {
 *     if (appState === 'active') {
 *       // App came to foreground - refresh data
 *       refreshData()
 *     }
 *   }, [appState])
 *
 *   return <Text>App is {appState}</Text>
 * }
 * ```
 */

import { useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'

export function useAppState(): AppStateStatus {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState)

  useEffect(() => {
    const subscription = AppState.addEventListener('change', setAppState)

    return () => {
      subscription.remove()
    }
  }, [])

  return appState
}

/**
 * NotificationInit
 *
 * Headless component that initializes push notifications.
 * Only loads in development builds — skipped entirely in Expo Go
 * where expo-notifications has limited support.
 */

import { useEffect, useState } from 'react'
import Constants from 'expo-constants'

const isExpoGo = Constants.executionEnvironment === 'storeClient'

function NotificationLoader() {
  const [Hook, setHook] = useState<{ useNotifications: () => void } | null>(null)

  useEffect(() => {
    if (isExpoGo) return
    // Dynamic import avoids loading expo-notifications in Expo Go
    import('@/hooks/useNotifications').then((mod) => {
      setHook({ useNotifications: mod.useNotifications })
    })
  }, [])

  if (!Hook) return null
  return <NotificationRunner useNotifications={Hook.useNotifications} />
}

function NotificationRunner({ useNotifications }: { useNotifications: () => void }) {
  useNotifications()
  return null
}

export function NotificationInit() {
  if (isExpoGo) return null
  return <NotificationLoader />
}

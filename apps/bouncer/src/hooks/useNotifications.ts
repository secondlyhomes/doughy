/**
 * useNotifications Hook
 *
 * Manages push notification lifecycle:
 * - Registers token on mount (when authenticated)
 * - Listens for incoming notifications
 * - Handles notification taps (deep linking)
 * - Cleans up on sign out
 */

import { useEffect, useRef, useCallback } from 'react'
import * as Notifications from 'expo-notifications'
import type { EventSubscription } from 'expo-modules-core'
import { router } from 'expo-router'
import { useAuth } from '@/contexts/AuthContext'
import {
  registerForPushNotifications,
  savePushToken,
  removePushToken,
  clearBadge,
} from '@/lib/notifications'

export function useNotifications() {
  const { user } = useAuth()
  const tokenRef = useRef<string | null>(null)
  const notificationListener = useRef<EventSubscription | null>(null)
  const responseListener = useRef<EventSubscription | null>(null)

  // Register token when user is authenticated
  useEffect(() => {
    if (!user?.id) return

    let cancelled = false

    async function register() {
      const token = await registerForPushNotifications()
      if (cancelled || !token) return

      tokenRef.current = token
      await savePushToken(user!.id, token)
    }

    register()

    return () => {
      cancelled = true
    }
  }, [user?.id])

  // Listen for notifications (foreground)
  useEffect(() => {
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('[Notifications] Received:', notification.request.content.data?.type)
      }
    )

    // Listen for notification taps — all routes go to the main control panel
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      () => {
        router.push('/(main)')
        clearBadge()
      }
    )

    return () => {
      notificationListener.current?.remove()
      responseListener.current?.remove()
    }
  }, [])

  // Clear badge when app comes to foreground
  useEffect(() => {
    if (user?.id) {
      clearBadge()
    }
  }, [user?.id])

  // Deactivate token on sign out
  const deactivateToken = useCallback(async () => {
    if (user?.id && tokenRef.current) {
      await removePushToken(user.id, tokenRef.current)
      tokenRef.current = null
    }
  }, [user?.id])

  return { deactivateToken }
}

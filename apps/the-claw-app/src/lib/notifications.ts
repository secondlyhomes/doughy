/**
 * Push Notification Setup
 *
 * Handles Expo push notification registration, Android channel setup,
 * and token management against claw.push_tokens.
 */

import * as Notifications from 'expo-notifications'
import * as Device from 'expo-device'
import { Platform } from 'react-native'
import { supabase } from './supabase'

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
})

/**
 * Register for push notifications and return the Expo push token.
 * Returns null if permissions denied or not on a physical device.
 */
export async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications only work on physical devices
  if (!Device.isDevice) {
    console.log('[Notifications] Not a physical device, skipping registration')
    return null
  }

  // Check existing permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync()
  let finalStatus = existingStatus

  // Request if not already granted
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync()
    finalStatus = status
  }

  if (finalStatus !== 'granted') {
    console.log('[Notifications] Permission denied')
    return null
  }

  // Set up Android notification channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4d7c5f',
    })

    await Notifications.setNotificationChannelAsync('approvals', {
      name: 'Approvals',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#4d7c5f',
    })
  }

  // Get Expo push token
  try {
    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    )
    return tokenData.data
  } catch (err) {
    console.warn('[Notifications] Failed to get push token:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * Save push token to claw.push_tokens via Supabase (upsert).
 * Uses the authenticated user's JWT for RLS.
 */
export async function savePushToken(userId: string, token: string): Promise<boolean> {
  const platform = Platform.OS as 'ios' | 'android' | 'web'
  const deviceName = Device.deviceName || `${Device.brand || ''} ${Device.modelName || ''}`.trim() || undefined

  const { error } = await supabase
    .schema('claw')
    .from('push_tokens')
    .upsert(
      {
        user_id: userId,
        token,
        platform,
        device_name: deviceName,
        is_active: true,
        last_used_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,token' }
    )

  if (error) {
    console.error('[Notifications] Failed to save push token:', error.message)
    return false
  }

  return true
}

/**
 * Remove push token from claw.push_tokens (on sign out).
 */
export async function removePushToken(userId: string, token: string): Promise<void> {
  const { error } = await supabase
    .schema('claw')
    .from('push_tokens')
    .update({ is_active: false })
    .eq('user_id', userId)
    .eq('token', token)

  if (error) {
    console.error('[Notifications] Failed to deactivate push token:', error.message)
  }
}

/**
 * Clear the badge count.
 */
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0)
}

/**
 * Push Notifications Testing Utilities
 *
 * Helper functions for testing push notifications in development
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  sendNotification,
  scheduleLocalNotification,
} from './notificationService';
import type { NotificationPayload, ScheduleNotificationRequest } from './types';

// ============================================================================
// Test Notification Builders
// ============================================================================

/**
 * Create a simple test notification
 */
export function createTestNotification(
  title = 'Test Notification',
  body = 'This is a test notification'
): NotificationPayload {
  return {
    title,
    body,
    data: {
      type: 'test',
      timestamp: Date.now(),
    },
    badge: 1,
    sound: true,
  };
}

/**
 * Create notification with deep link
 */
export function createDeepLinkTestNotification(
  screen: string,
  params?: Record<string, any>
): NotificationPayload {
  return {
    title: 'Deep Link Test',
    body: `Navigate to ${screen}`,
    data: {
      type: 'test-deeplink',
      deepLink: {
        screen,
        params,
      },
    },
    sound: true,
  };
}

/**
 * Create notification with action buttons (iOS)
 */
export function createActionTestNotification(
  categoryId: 'message' | 'task' | 'social' | 'reminder'
): NotificationPayload {
  return {
    title: 'Action Test',
    body: 'Test action buttons by swiping or long-pressing',
    categoryId,
    data: {
      type: 'test-actions',
    },
    sound: true,
  };
}

/**
 * Create notification with image attachment
 */
export function createImageTestNotification(imageUrl: string): NotificationPayload {
  return {
    title: 'Image Test',
    body: 'This notification includes an image',
    attachments: [
      {
        url: imageUrl,
        type: 'image',
      },
    ],
    data: {
      type: 'test-image',
    },
  };
}

// ============================================================================
// Quick Test Functions
// ============================================================================

/**
 * Send immediate test notification (local)
 */
export async function sendTestNotificationNow(
  notification?: Partial<NotificationPayload>
): Promise<string> {
  const defaultNotification = createTestNotification();
  const finalNotification = { ...defaultNotification, ...notification };

  return await Notifications.scheduleNotificationAsync({
    content: {
      title: finalNotification.title,
      body: finalNotification.body,
      data: finalNotification.data || {},
      sound: finalNotification.sound as any,
      badge: finalNotification.badge,
    },
    trigger: null, // Send immediately
  });
}

/**
 * Schedule test notification after delay
 */
export async function sendTestNotificationDelayed(
  seconds: number,
  notification?: Partial<NotificationPayload>
): Promise<string> {
  const defaultNotification = createTestNotification();
  const finalNotification = { ...defaultNotification, ...notification };

  return await scheduleLocalNotification({
    notification: finalNotification,
    trigger: {
      type: 'timeInterval',
      seconds,
    },
  });
}

/**
 * Test all notification categories (iOS)
 */
export async function testAllCategories(): Promise<void> {
  const categories: Array<'message' | 'task' | 'social' | 'reminder'> = [
    'message',
    'task',
    'social',
    'reminder',
  ];

  for (let i = 0; i < categories.length; i++) {
    const category = categories[i];
    await scheduleLocalNotification({
      notification: createActionTestNotification(category),
      trigger: {
        type: 'timeInterval',
        seconds: (i + 1) * 5, // 5s, 10s, 15s, 20s
      },
    });
  }

  console.log('Scheduled 4 test notifications with different categories');
}

/**
 * Test deep linking
 */
export async function testDeepLink(
  screen: string,
  params?: Record<string, any>
): Promise<void> {
  await sendTestNotificationNow(createDeepLinkTestNotification(screen, params));
  console.log(`Sent deep link test to ${screen}`);
}

/**
 * Test badge count
 */
export async function testBadge(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
  await sendTestNotificationNow({
    title: 'Badge Test',
    body: `Badge count set to ${count}`,
    badge: count,
  });
}

// ============================================================================
// Remote Push Testing
// ============================================================================

/**
 * Send test remote push notification via Edge Function
 */
export async function sendRemoteTestNotification(
  userId: string,
  notification?: Partial<NotificationPayload>
): Promise<void> {
  const defaultNotification = createTestNotification();
  const finalNotification = { ...defaultNotification, ...notification };

  await sendNotification({
    userId,
    notification: finalNotification,
  });

  console.log('Sent remote test notification to user:', userId);
}

// ============================================================================
// Stress Testing
// ============================================================================

/**
 * Send multiple test notifications (stress test)
 */
export async function sendBulkTestNotifications(count: number): Promise<void> {
  const promises = [];

  for (let i = 1; i <= count; i++) {
    promises.push(
      scheduleLocalNotification({
        notification: {
          title: `Test ${i}`,
          body: `Notification number ${i} of ${count}`,
          data: {
            type: 'bulk-test',
            index: i,
          },
        },
        trigger: {
          type: 'timeInterval',
          seconds: i * 2, // 2s apart
        },
      })
    );
  }

  await Promise.all(promises);
  console.log(`Scheduled ${count} test notifications`);
}

/**
 * Test rapid-fire notifications (1 per second)
 */
export async function rapidFireTest(count: number): Promise<void> {
  for (let i = 1; i <= count; i++) {
    await sendTestNotificationNow({
      title: `Rapid Test ${i}`,
      body: `Notification ${i} of ${count}`,
    });
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
}

// ============================================================================
// Debug Helpers
// ============================================================================

/**
 * Log current notification state
 */
export async function logNotificationState(): Promise<void> {
  console.log('=== Notification State ===');

  // Permissions
  const permissions = await Notifications.getPermissionsAsync();
  console.log('Permissions:', JSON.stringify(permissions, null, 2));

  // Badge count
  const badge = await Notifications.getBadgeCountAsync();
  console.log('Badge count:', badge);

  // Scheduled notifications
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  console.log('Scheduled notifications:', scheduled.length);
  scheduled.forEach((n, i) => {
    console.log(`  ${i + 1}. ${n.content.title} - ${JSON.stringify(n.trigger)}`);
  });

  // Presented notifications
  const presented = await Notifications.getPresentedNotificationsAsync();
  console.log('Presented notifications:', presented.length);

  // Android channels (if applicable)
  if (Platform.OS === 'android') {
    const channels = await Notifications.getNotificationChannelsAsync();
    console.log('Notification channels:', channels.length);
    channels.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.name} (${c.id})`);
    });
  }
}

/**
 * Clear all test data
 */
export async function clearAllTestNotifications(): Promise<void> {
  // Cancel all scheduled
  await Notifications.cancelAllScheduledNotificationsAsync();

  // Dismiss all presented
  await Notifications.dismissAllNotificationsAsync();

  // Clear badge
  await Notifications.setBadgeCountAsync(0);

  console.log('Cleared all test notifications');
}

/**
 * Get push token for testing
 */
export async function getTestPushToken(): Promise<string | null> {
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return tokenData.data;
  } catch (error) {
    console.error('Failed to get push token:', error);
    return null;
  }
}

// ============================================================================
// Test Suites
// ============================================================================

/**
 * Run comprehensive notification test suite
 */
export async function runFullTestSuite(): Promise<void> {
  console.log('Starting notification test suite...');

  // 1. Immediate notification
  console.log('Test 1: Immediate notification');
  await sendTestNotificationNow();
  await delay(2000);

  // 2. Delayed notification
  console.log('Test 2: Delayed notification (5s)');
  await sendTestNotificationDelayed(5, {
    title: 'Delayed Test',
    body: 'This was scheduled 5 seconds ago',
  });
  await delay(2000);

  // 3. Badge test
  console.log('Test 3: Badge count');
  await testBadge(3);
  await delay(2000);

  // 4. Sound test
  console.log('Test 4: Custom sound');
  await sendTestNotificationNow({
    title: 'Sound Test',
    body: 'Listen for custom sound',
    sound: 'default',
  });
  await delay(2000);

  // 5. Data payload test
  console.log('Test 5: Data payload');
  await sendTestNotificationNow({
    title: 'Data Test',
    body: 'Check console for data payload',
    data: {
      type: 'test',
      customField: 'custom value',
      timestamp: Date.now(),
    },
  });

  console.log('Test suite complete');
  await logNotificationState();
}

/**
 * Test notification permissions flow
 */
export async function testPermissionsFlow(): Promise<void> {
  console.log('Testing permissions flow...');

  // Check current status
  const initial = await Notifications.getPermissionsAsync();
  console.log('Initial status:', initial.status);

  // Request permissions
  const result = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  console.log('After request:', result.status);

  // Send test notification if granted
  if (result.status === 'granted') {
    await sendTestNotificationNow({
      title: 'Permission Granted',
      body: 'Notifications are now enabled',
    });
  }
}

// ============================================================================
// Utilities
// ============================================================================

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Create a cURL command for testing remote notifications
 */
export function generateCurlCommand(pushToken: string): string {
  return `curl -H "Content-Type: application/json" -X POST "https://exp.host/--/api/v2/push/send" -d '{
  "to": "${pushToken}",
  "title": "Test from cURL",
  "body": "This notification was sent using cURL",
  "data": {"test": true}
}'`;
}

/**
 * Expo Push Tool command
 */
export function generateExpoPushToolCommand(pushToken: string): string {
  return `npx expo-push-tool ${pushToken}`;
}

// ============================================================================
// Export Test Menu Component
// ============================================================================

/**
 * Example test menu screen
 */
export const NotificationTestScreen = `
import React from 'react';
import { View, ScrollView, Button, Text, StyleSheet } from 'react-native';
import * as TestUtils from './testing-utils';

export function NotificationTestScreen() {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Notification Tests</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basic Tests</Text>
        <Button title="Send Now" onPress={() => TestUtils.sendTestNotificationNow()} />
        <Button title="Send in 5s" onPress={() => TestUtils.sendTestNotificationDelayed(5)} />
        <Button title="Test Badge (5)" onPress={() => TestUtils.testBadge(5)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Categories (iOS)</Text>
        <Button title="Test All Categories" onPress={() => TestUtils.testAllCategories()} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Stress Tests</Text>
        <Button title="Send 5 Notifications" onPress={() => TestUtils.sendBulkTestNotifications(5)} />
        <Button title="Rapid Fire (3)" onPress={() => TestUtils.rapidFireTest(3)} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Debug</Text>
        <Button title="Log State" onPress={() => TestUtils.logNotificationState()} />
        <Button title="Clear All" onPress={() => TestUtils.clearAllTestNotifications()} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Full Suite</Text>
        <Button title="Run Full Test Suite" onPress={() => TestUtils.runFullTestSuite()} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '600', marginBottom: 10 },
});
`;

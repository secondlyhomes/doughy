/**
 * Notification Handler Examples
 *
 * Demonstrates handling notification responses and app integration
 */

import React from 'react';
import { Alert } from 'react-native';
import { PushNotificationsProvider } from '../PushNotificationsContext';

// ============================================================================
// Handle Notification Responses
// ============================================================================

export function NotificationHandlerExample() {
  // Set up in App.tsx
  const handleNotificationReceived = (notification: any) => {
    console.log('Notification received while app open:', notification);

    // Show in-app alert or banner
    Alert.alert(notification.title, notification.body);
  };

  const handleNotificationTapped = (response: any) => {
    const { actionIdentifier, notification } = response;
    const data = notification.request.content.data;

    // Handle action buttons
    if (actionIdentifier === 'reply') {
      // User tapped Reply
      const userText = response.userText;
      console.log('User replied:', userText);
      // Send reply...
    } else if (actionIdentifier === 'complete') {
      // User tapped Complete (for tasks)
      console.log('Mark task as complete:', data.taskId);
      // Update task...
    } else {
      // User tapped notification itself
      if (data?.deepLink) {
        // Navigate to screen
        console.log('Navigate to:', data.deepLink);
      }
    }
  };

  return (
    <PushNotificationsProvider
      onNotificationReceived={handleNotificationReceived}
      onNotificationTapped={handleNotificationTapped}
      autoRegister={true}
    >
      {/* Your app */}
    </PushNotificationsProvider>
  );
}

// ============================================================================
// Complete Integration in App.tsx
// ============================================================================

// Placeholder component for example
function YourAppNavigator() {
  return null;
}

export function AppWithNotifications() {
  return (
    <PushNotificationsProvider
      autoRegister={true}
      onNotificationReceived={(notification) => {
        // Handle foreground notifications
        console.log('Received:', notification);
      }}
      onNotificationTapped={(response) => {
        // Handle notification taps
        const deepLink = response.notification.request.content.data?.deepLink;
        if (deepLink) {
          // Navigate using your navigation system
          // navigationRef.current?.navigate(deepLink.screen, deepLink.params);
        }
      }}
    >
      <YourAppNavigator />
    </PushNotificationsProvider>
  );
}

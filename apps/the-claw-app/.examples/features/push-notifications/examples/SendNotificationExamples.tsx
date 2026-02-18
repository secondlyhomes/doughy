/**
 * Send Notification Examples
 *
 * Demonstrates sending individual and batch notifications
 */

import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { sendNotification, sendBatchNotifications } from '../notificationService';
import { styles } from './styles';

// ============================================================================
// Send Notification to User
// ============================================================================

export function SendNotificationExample({ targetUserId }: { targetUserId: string }) {
  const sendWelcomeNotification = async () => {
    try {
      await sendNotification({
        userId: targetUserId,
        notification: {
          title: 'Welcome!',
          body: 'Thanks for joining our app',
          data: {
            type: 'welcome',
            deepLink: {
              screen: 'Home',
            },
          },
          badge: 1,
          sound: true,
        },
      });
      Alert.alert('Success', 'Notification sent!');
    } catch (error) {
      Alert.alert('Error', 'Failed to send notification');
    }
  };

  const sendTaskNotification = async () => {
    await sendNotification({
      userId: targetUserId,
      notification: {
        title: 'Task Assigned',
        body: 'You have been assigned to "Update Documentation"',
        categoryId: 'task', // Shows Complete and View buttons
        data: {
          type: 'task',
          taskId: 'task-123',
          deepLink: {
            screen: 'TaskDetail',
            params: { id: 'task-123' },
          },
        },
        priority: 'high',
      },
    });
  };

  const sendMessageNotification = async () => {
    await sendNotification({
      userId: targetUserId,
      notification: {
        title: 'New Message from Sarah',
        body: 'Hey! Are you available for a quick call?',
        categoryId: 'message', // Shows Reply and View buttons
        data: {
          type: 'message',
          conversationId: 'conv-456',
          senderId: 'user-789',
          deepLink: {
            screen: 'Conversation',
            params: { id: 'conv-456' },
          },
        },
        badge: 1,
        sound: 'message.wav',
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Send Notifications</Text>
      <Button title="Send Welcome" onPress={sendWelcomeNotification} />
      <Button title="Send Task Assignment" onPress={sendTaskNotification} />
      <Button title="Send Message" onPress={sendMessageNotification} />
    </View>
  );
}

// ============================================================================
// Batch Notifications
// ============================================================================

export function SendBatchNotificationExample({ userIds }: { userIds: string[] }) {
  const sendAnnouncementToAll = async () => {
    try {
      await sendBatchNotifications({
        userIds,
        notification: {
          title: 'System Maintenance',
          body: 'Scheduled maintenance tonight at 11 PM EST',
          data: {
            type: 'announcement',
            announcementId: 'ann-001',
          },
          priority: 'high',
        },
      });
      Alert.alert('Success', `Sent to ${userIds.length} users`);
    } catch (error) {
      Alert.alert('Error', 'Failed to send batch notifications');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Batch Notifications</Text>
      <Text>Recipients: {userIds.length}</Text>
      <Button title="Send Announcement to All" onPress={sendAnnouncementToAll} />
    </View>
  );
}

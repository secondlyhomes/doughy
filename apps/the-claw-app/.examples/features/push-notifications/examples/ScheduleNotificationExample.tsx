/**
 * Schedule Local Notifications Example
 *
 * Demonstrates scheduling reminders and recurring notifications
 */

import React from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { usePushNotifications } from '../PushNotificationsContext';
import { styles } from './styles';

export function ScheduleNotificationExample() {
  const { scheduleNotification, cancelAllScheduledNotifications } =
    usePushNotifications();

  const scheduleReminderIn5Minutes = async () => {
    const identifier = await scheduleNotification({
      notification: {
        title: 'Reminder',
        body: 'Time to check your tasks!',
        data: { type: 'reminder' },
        sound: true,
      },
      trigger: {
        type: 'timeInterval',
        seconds: 300, // 5 minutes
      },
    });
    Alert.alert('Scheduled', `Reminder will appear in 5 minutes (${identifier})`);
  };

  const scheduleDailyReminder = async () => {
    await scheduleNotification({
      notification: {
        title: 'Daily Check-in',
        body: 'Time for your daily review!',
        data: { type: 'daily-reminder' },
      },
      trigger: {
        type: 'daily',
        hour: 9,
        minute: 0,
      },
    });
    Alert.alert('Scheduled', 'Daily reminder set for 9:00 AM');
  };

  const scheduleWeeklyReport = async () => {
    await scheduleNotification({
      notification: {
        title: 'Weekly Report',
        body: 'Your weekly summary is ready',
        data: { type: 'weekly-report' },
      },
      trigger: {
        type: 'weekly',
        weekday: 1, // Monday
        hour: 10,
        minute: 0,
      },
    });
    Alert.alert('Scheduled', 'Weekly report set for Mondays at 10:00 AM');
  };

  const cancelAll = async () => {
    await cancelAllScheduledNotifications();
    Alert.alert('Cancelled', 'All scheduled notifications removed');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Schedule Notifications</Text>
      <Button title="Reminder in 5 min" onPress={scheduleReminderIn5Minutes} />
      <Button title="Daily at 9 AM" onPress={scheduleDailyReminder} />
      <Button title="Weekly Monday 10 AM" onPress={scheduleWeeklyReport} />
      <Button title="Cancel All" onPress={cancelAll} color="red" />
    </View>
  );
}

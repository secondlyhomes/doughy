/**
 * Notification Settings Screen Example
 *
 * Demonstrates permission management and badge controls
 */

import React, { useState } from 'react';
import { View, Text, Button, Alert, Switch } from 'react-native';
import { usePushNotifications } from '../PushNotificationsContext';
import { styles } from './styles';

export function NotificationSettingsScreen() {
  const {
    permissionStatus,
    isRegistered,
    requestPermissions,
    registerPushToken,
    unregisterPushToken,
    setBadgeCount,
    clearBadge,
  } = usePushNotifications();

  const [notificationsEnabled, setNotificationsEnabled] = useState(isRegistered);

  const handleToggleNotifications = async () => {
    if (notificationsEnabled) {
      // Disable
      await unregisterPushToken();
      setNotificationsEnabled(false);
    } else {
      // Enable
      const status = await requestPermissions();
      if (status === 'granted') {
        await registerPushToken();
        setNotificationsEnabled(true);
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in Settings to receive updates.',
          [{ text: 'OK' }]
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification Settings</Text>

      <View style={styles.row}>
        <Text>Enable Push Notifications</Text>
        <Switch
          value={notificationsEnabled}
          onValueChange={handleToggleNotifications}
        />
      </View>

      <View style={styles.info}>
        <Text>Status: {permissionStatus}</Text>
        <Text>Registered: {isRegistered ? 'Yes' : 'No'}</Text>
      </View>

      {/* Badge Controls */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Badge Management</Text>
        <Button title="Set Badge to 5" onPress={() => setBadgeCount(5)} />
        <Button title="Clear Badge" onPress={clearBadge} />
      </View>
    </View>
  );
}

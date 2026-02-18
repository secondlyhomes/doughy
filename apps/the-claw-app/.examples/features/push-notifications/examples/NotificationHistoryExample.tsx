/**
 * Notification History Example
 *
 * Demonstrates displaying notification history in a list
 */

import React, { useEffect, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { getNotificationHistory } from '../notificationService';
import type { NotificationLog } from '../types';
import { styles } from './styles';

export function NotificationHistoryScreen({ userId }: { userId: string }) {
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setLoading(true);
    const history = await getNotificationHistory(userId, 50);
    setNotifications(history);
    setLoading(false);
  };

  const renderNotification = ({ item }: { item: NotificationLog }) => (
    <View style={styles.notificationItem}>
      <Text style={styles.notificationTitle}>{item.title}</Text>
      <Text style={styles.notificationBody}>{item.body}</Text>
      <View style={styles.notificationMeta}>
        <Text style={styles.notificationStatus}>{item.status}</Text>
        <Text style={styles.notificationDate}>
          {new Date(item.created_at).toLocaleString()}
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notification History</Text>
      {loading ? (
        <Text>Loading...</Text>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={(item) => item.id}
          refreshing={loading}
          onRefresh={loadHistory}
        />
      )}
    </View>
  );
}

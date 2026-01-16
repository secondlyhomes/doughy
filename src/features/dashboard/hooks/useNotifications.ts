// src/features/dashboard/hooks/useNotifications.ts
// Hook to generate and manage notifications with AsyncStorage persistence
// Generates notifications from overdue deals and at-risk actions

import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { Notification } from '../components/NotificationCard';
import { useDealsWithActions } from '@/features/deals/hooks/useDeals';

const DISMISSED_NOTIFICATIONS_KEY = '@doughy/dismissed_notifications';

export function useNotifications() {
  const router = useRouter();
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch deals with actions
  const { deals, isLoading: isLoadingDeals } = useDealsWithActions(20); // Get up to 20 deals

  // Load dismissed notification IDs from AsyncStorage
  useEffect(() => {
    const loadDismissedIds = async () => {
      try {
        const stored = await AsyncStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          setDismissedIds(parsed);
        }
      } catch (error) {
        console.error('Failed to load dismissed notifications:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDismissedIds();
  }, []);

  // Generate notifications from deals
  const generateNotifications = useCallback((): Notification[] => {
    if (!deals || deals.length === 0) return [];

    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const notifications: Notification[] = [];

    deals.forEach((deal) => {
      if (!deal.next_action_due) return;

      const dueDate = new Date(deal.next_action_due);
      dueDate.setHours(0, 0, 0, 0);
      const nowDate = new Date(now);
      nowDate.setHours(0, 0, 0, 0);

      const isOverdue = dueDate < nowDate;
      const isDueSoon = dueDate <= tomorrow && !isOverdue;

      // Overdue notification
      if (isOverdue) {
        const daysDiff = Math.floor((nowDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        notifications.push({
          id: `overdue-${deal.id}`,
          type: 'overdue',
          title: 'Overdue Action',
          message: `${deal.property?.address || 'Deal'} - ${deal.next_action || 'Action needed'} (${daysDiff} day${daysDiff === 1 ? '' : 's'} overdue)`,
          actionLabel: 'View Deal',
          onAction: () => router.push(`/(tabs)/deals/${deal.id}`),
          timestamp: dueDate,
        });
      }
      // Due soon notification (within 24 hours)
      else if (isDueSoon) {
        notifications.push({
          id: `due-soon-${deal.id}`,
          type: 'warning',
          title: 'Action Due Soon',
          message: `${deal.property?.address || 'Deal'} - ${deal.next_action || 'Action needed'} (due ${dueDate.toLocaleDateString()})`,
          actionLabel: 'View Deal',
          onAction: () => router.push(`/(tabs)/deals/${deal.id}`),
          timestamp: now,
        });
      }
    });

    // Sort by priority (overdue first) then by timestamp
    return notifications.sort((a, b) => {
      if (a.type === 'overdue' && b.type !== 'overdue') return -1;
      if (a.type !== 'overdue' && b.type === 'overdue') return 1;
      return a.timestamp.getTime() - b.timestamp.getTime();
    });
  }, [deals, router]);

  // Filter out dismissed notifications
  const notifications = generateNotifications().filter(
    (notification) => !dismissedIds.includes(notification.id)
  );

  // Dismiss a single notification
  const dismiss = useCallback(async (id: string) => {
    try {
      const newDismissedIds = [...dismissedIds, id];
      setDismissedIds(newDismissedIds);
      await AsyncStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(newDismissedIds));
    } catch (error) {
      console.error('Failed to dismiss notification:', error);
    }
  }, [dismissedIds]);

  // Dismiss all notifications
  const dismissAll = useCallback(async () => {
    try {
      const allIds = notifications.map((n) => n.id);
      const newDismissedIds = [...dismissedIds, ...allIds];
      setDismissedIds(newDismissedIds);
      await AsyncStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify(newDismissedIds));
    } catch (error) {
      console.error('Failed to dismiss all notifications:', error);
    }
  }, [notifications, dismissedIds]);

  // Clear dismissed IDs older than 7 days (cleanup)
  const clearOldDismissedIds = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(DISMISSED_NOTIFICATIONS_KEY);
      if (stored) {
        // For simplicity, just clear all if list gets too long (>100 items)
        const parsed = JSON.parse(stored);
        if (parsed.length > 100) {
          await AsyncStorage.setItem(DISMISSED_NOTIFICATIONS_KEY, JSON.stringify([]));
          setDismissedIds([]);
        }
      }
    } catch (error) {
      console.error('Failed to clear old dismissed IDs:', error);
    }
  }, []);

  // Clear old dismissed IDs on mount
  useEffect(() => {
    clearOldDismissedIds();
  }, []);

  return {
    notifications,
    dismiss,
    dismissAll,
    isLoading: isLoading || isLoadingDeals,
  };
}

/**
 * Push Notifications Hook
 *
 * Custom hook for managing push notifications state and actions.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import {
  registerPushToken,
  unregisterPushToken,
  scheduleLocalNotification,
  cancelScheduledNotification,
  cancelAllScheduledNotifications,
  setBadgeCount as setAppBadgeCount,
  clearBadge as clearAppBadge,
  getDeviceInfo,
} from '../notificationService';
import {
  PushNotificationsContextValue,
  PermissionStatus,
  NotificationPayload,
  NotificationResponse,
  ScheduleNotificationRequest,
} from '../types';
import {
  setupNotificationCategories,
  parseNotificationPayload,
  parseNotificationResponse,
} from '../utils/notification-utils';

export interface UsePushNotificationsOptions {
  onNotificationReceived?: (notification: NotificationPayload) => void;
  onNotificationTapped?: (response: NotificationResponse) => void;
  autoRegister?: boolean;
  onDeepLink?: (response: NotificationResponse) => void;
}

export interface UsePushNotificationsReturn extends PushNotificationsContextValue {}

export function usePushNotificationsCore(
  options: UsePushNotificationsOptions = {}
): UsePushNotificationsReturn {
  const { onNotificationReceived, onNotificationTapped, autoRegister = false, onDeepLink } = options;

  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('undetermined');
  const [isRegistered, setIsRegistered] = useState(false);
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();

  useEffect(() => {
    if (Platform.OS === 'ios') setupNotificationCategories();
  }, []);

  const checkPermissions = useCallback(async (): Promise<void> => {
    const { status } = await Notifications.getPermissionsAsync();
    setPermissionStatus(status as PermissionStatus);
  }, []);

  const requestPermissions = useCallback(async (): Promise<PermissionStatus> => {
    if (!Device.isDevice) {
      console.warn('Push notifications only work on physical devices');
      return 'denied';
    }
    try {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true, allowBadge: true, allowSound: true,
          allowDisplayInCarPlay: true, allowCriticalAlerts: false,
          allowProvisional: false, allowAnnouncements: false,
        },
      });
      setPermissionStatus(status as PermissionStatus);
      return status as PermissionStatus;
    } catch (error) {
      console.error('Failed to request permissions:', error);
      return 'denied';
    }
  }, []);

  const registerPushTokenAction = useCallback(async (): Promise<void> => {
    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
      });
      const token = tokenData.data;
      setExpoPushToken(token);
      await registerPushToken({ token, ...getDeviceInfo() });
      setIsRegistered(true);
    } catch (error) {
      console.error('Failed to register push token:', error);
      throw error;
    }
  }, []);

  const unregisterPushTokenAction = useCallback(async (): Promise<void> => {
    try {
      if (expoPushToken) {
        await unregisterPushToken(expoPushToken);
        setExpoPushToken(null);
        setIsRegistered(false);
      }
    } catch (error) {
      console.error('Failed to unregister push token:', error);
      throw error;
    }
  }, [expoPushToken]);

  const registerIfPermitted = useCallback(async (): Promise<void> => {
    const { status } = await Notifications.getPermissionsAsync();
    if (status === 'granted') await registerPushTokenAction();
  }, [registerPushTokenAction]);

  const handleDeepLink = useCallback((response: NotificationResponse): void => {
    const deepLink = response.notification.request.content.data?.deepLink;
    if (!deepLink) return;
    onDeepLink?.(response);
  }, [onDeepLink]);

  useEffect(() => {
    checkPermissions();
    if (autoRegister) registerIfPermitted();

    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      onNotificationReceived?.(parseNotificationPayload(notification));
    });

    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      const parsed = parseNotificationResponse(response);
      onNotificationTapped?.(parsed);
      handleDeepLink(parsed);
    });

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [autoRegister, checkPermissions, handleDeepLink, onNotificationReceived, onNotificationTapped, registerIfPermitted]);

  const setBadgeCount = useCallback(async (count: number) => setAppBadgeCount(count), []);
  const clearBadge = useCallback(async () => clearAppBadge(), []);
  const scheduleNotification = useCallback(async (req: ScheduleNotificationRequest) => scheduleLocalNotification(req), []);
  const cancelScheduledNotificationAction = useCallback(async (id: string) => cancelScheduledNotification(id), []);
  const cancelAllScheduledNotificationsAction = useCallback(async () => cancelAllScheduledNotifications(), []);

  return {
    expoPushToken,
    permissionStatus,
    isRegistered,
    requestPermissions,
    registerPushToken: registerPushTokenAction,
    unregisterPushToken: unregisterPushTokenAction,
    setBadgeCount,
    clearBadge,
    scheduleNotification,
    cancelScheduledNotification: cancelScheduledNotificationAction,
    cancelAllScheduledNotifications: cancelAllScheduledNotificationsAction,
    onNotificationReceived,
    onNotificationTapped,
  };
}

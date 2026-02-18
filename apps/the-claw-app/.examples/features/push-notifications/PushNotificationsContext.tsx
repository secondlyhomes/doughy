/**
 * Push Notifications Context
 *
 * Thin provider wrapper around usePushNotificationsCore hook.
 * Provides push notification state and actions via React Context.
 */

import React, { createContext, useContext, ReactNode } from 'react';
import {
  usePushNotificationsCore,
  UsePushNotificationsOptions,
} from './hooks/usePushNotifications';
import { PushNotificationsContextValue, NotificationPayload, NotificationResponse } from './types';
import { configureNotificationHandler } from './utils/notification-utils';

// Configure notification behavior on module load
configureNotificationHandler();

// ============================================================================
// Context
// ============================================================================

const PushNotificationsContext = createContext<
  PushNotificationsContextValue | undefined
>(undefined);

// ============================================================================
// Provider
// ============================================================================

export interface PushNotificationsProviderProps {
  children: ReactNode;
  onNotificationReceived?: (notification: NotificationPayload) => void;
  onNotificationTapped?: (response: NotificationResponse) => void;
  autoRegister?: boolean;
}

export function PushNotificationsProvider({
  children,
  onNotificationReceived,
  onNotificationTapped,
  autoRegister = false,
}: PushNotificationsProviderProps) {
  const options: UsePushNotificationsOptions = {
    onNotificationReceived,
    onNotificationTapped,
    autoRegister,
  };

  const value = usePushNotificationsCore(options);

  return (
    <PushNotificationsContext.Provider value={value}>
      {children}
    </PushNotificationsContext.Provider>
  );
}

// ============================================================================
// Hook
// ============================================================================

export function usePushNotifications(): PushNotificationsContextValue {
  const context = useContext(PushNotificationsContext);

  if (!context) {
    throw new Error(
      'usePushNotifications must be used within PushNotificationsProvider'
    );
  }

  return context;
}

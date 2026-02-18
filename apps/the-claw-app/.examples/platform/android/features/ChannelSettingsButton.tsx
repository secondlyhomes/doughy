/**
 * ChannelSettingsButton.tsx
 *
 * UI component for opening channel settings
 */

import React from 'react';
import { Button } from 'react-native';
import { NotificationChannelManager } from './NotificationChannelManager';

interface ChannelSettingsButtonProps {
  channelId: string;
}

/**
 * Button to open notification channel settings
 */
export function ChannelSettingsButton({ channelId }: ChannelSettingsButtonProps) {
  const handleOpenSettings = async () => {
    await NotificationChannelManager.openChannelSettings(channelId);
  };

  if (!NotificationChannelManager.isSupported()) {
    return null;
  }

  return <Button title="Notification Settings" onPress={handleOpenSettings} />;
}

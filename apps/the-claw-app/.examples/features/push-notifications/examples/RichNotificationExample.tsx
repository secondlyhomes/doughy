/**
 * Rich Notifications Example
 *
 * Demonstrates notifications with images and video attachments
 */

import React from 'react';
import { View, Text, Button } from 'react-native';
import { sendNotification } from '../notificationService';
import { styles } from './styles';

export function RichNotificationExample({ userId }: { userId: string }) {
  const sendPhotoNotification = async () => {
    await sendNotification({
      userId,
      notification: {
        title: 'New Photo',
        body: 'John shared a photo with you',
        attachments: [
          {
            url: 'https://example.com/photo.jpg',
            type: 'image',
          },
        ],
        data: {
          type: 'photo',
          photoId: 'photo-123',
          deepLink: {
            screen: 'PhotoViewer',
            params: { id: 'photo-123' },
          },
        },
      },
    });
  };

  const sendVideoNotification = async () => {
    await sendNotification({
      userId,
      notification: {
        title: 'Video Ready',
        body: 'Your video has finished processing',
        attachments: [
          {
            url: 'https://example.com/video.mp4',
            type: 'video',
            thumbnail: 'https://example.com/thumbnail.jpg',
          },
        ],
        data: {
          type: 'video',
          videoId: 'video-456',
        },
      },
    });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rich Notifications</Text>
      <Button title="Send Photo Notification" onPress={sendPhotoNotification} />
      <Button title="Send Video Notification" onPress={sendVideoNotification} />
    </View>
  );
}

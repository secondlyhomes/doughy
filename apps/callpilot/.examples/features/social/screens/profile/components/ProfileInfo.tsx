/**
 * ProfileInfo Component
 *
 * Displays bio, location, website, and join date information.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from '../styles';
import type { ProfileInfoProps } from '../types';

/**
 * Formats a date string to "Month Year" format
 */
function formatJoinDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });
}

/**
 * Profile info section with bio and metadata
 *
 * @example
 * ```tsx
 * <ProfileInfo
 *   bio="Software developer"
 *   location="New York, NY"
 *   website="https://example.com"
 *   createdAt="2024-01-15T00:00:00Z"
 * />
 * ```
 */
export function ProfileInfo({
  bio,
  location,
  website,
  createdAt,
}: ProfileInfoProps) {
  return (
    <>
      {/* Bio Section */}
      {bio && (
        <View style={styles.section}>
          <Text style={styles.bio}>{bio}</Text>
        </View>
      )}

      {/* Additional Info Section */}
      <View style={styles.section}>
        {location && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>📍</Text>
            <Text style={styles.infoText}>{location}</Text>
          </View>
        )}
        {website && (
          <View style={styles.infoRow}>
            <Text style={styles.infoIcon}>🔗</Text>
            <Text style={styles.infoLink}>{website}</Text>
          </View>
        )}
        <View style={styles.infoRow}>
          <Text style={styles.infoIcon}>📅</Text>
          <Text style={styles.infoText}>Joined {formatJoinDate(createdAt)}</Text>
        </View>
      </View>
    </>
  );
}

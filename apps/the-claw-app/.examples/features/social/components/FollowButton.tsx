/**
 * Follow Button Component
 *
 * Button to follow/unfollow users with loading states.
 */

import React, { useState, useEffect } from 'react';
import { Pressable, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { colors, spacing, borderRadius } from '@/theme/tokens';
import { useSocial } from '../contexts/SocialContext';

interface FollowButtonProps {
  userId: string;
  size?: 'small' | 'medium' | 'large';
  style?: any;
}

/**
 * Follow Button
 *
 * @example
 * ```tsx
 * <FollowButton userId={targetUser.id} size="medium" />
 * ```
 */
export function FollowButton({ userId, size = 'medium', style }: FollowButtonProps) {
  const { followUser, unfollowUser, getFollowRelationship } = useSocial();
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    checkRelationship();
  }, [userId]);

  const checkRelationship = async () => {
    try {
      setChecking(true);
      const relationship = await getFollowRelationship(userId);
      setIsFollowing(relationship.isFollowing);
    } catch (error) {
      console.error('Error checking relationship:', error);
    } finally {
      setChecking(false);
    }
  };

  const handlePress = async () => {
    try {
      setLoading(true);

      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error('Error toggling follow:', error);
      // Revert on error
      setIsFollowing(!isFollowing);
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <Pressable disabled style={[styles.button, styles[size], styles.buttonDisabled, style]}>
        <ActivityIndicator size="small" color={colors.neutral[400]} />
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={[
        styles.button,
        styles[size],
        isFollowing ? styles.buttonFollowing : styles.buttonFollow,
        loading && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={isFollowing ? colors.neutral[600] : colors.white}
        />
      ) : (
        <Text style={[styles.text, isFollowing ? styles.textFollowing : styles.textFollow]}>
          {isFollowing ? 'Following' : 'Follow'}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    minWidth: 70,
  },
  medium: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[2],
    minWidth: 100,
  },
  large: {
    paddingHorizontal: spacing[6],
    paddingVertical: spacing[3],
    minWidth: 120,
  },
  buttonFollow: {
    backgroundColor: colors.primary[500],
  },
  buttonFollowing: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  text: {
    fontWeight: '600',
  },
  textFollow: {
    color: colors.white,
    fontSize: 14,
  },
  textFollowing: {
    color: colors.neutral[700],
    fontSize: 14,
  },
});

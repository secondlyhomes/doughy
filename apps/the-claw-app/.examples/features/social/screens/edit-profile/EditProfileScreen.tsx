/**
 * Edit Profile Screen
 *
 * Screen to edit user profile information and avatar.
 * This is a thin component that composes extracted pieces.
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { colors } from '@/theme/tokens';
import { useEditProfile } from './hooks/useEditProfile';
import { ProfileForm } from './components/ProfileForm';
import { AvatarEditor } from './components/AvatarEditor';
import type { EditProfileScreenProps } from './types';
import { styles } from './styles';

/**
 * Edit Profile Screen
 *
 * @example
 * ```tsx
 * <EditProfileScreen
 *   onSave={() => navigation.goBack()}
 *   onCancel={() => navigation.goBack()}
 * />
 * ```
 */
export function EditProfileScreen({ onSave, onCancel }: EditProfileScreenProps) {
  const {
    profile,
    loading,
    saving,
    formState,
    setFormField,
    handleSave,
    handleAvatarUpload,
  } = useEditProfile({ onSaveSuccess: onSave });

  // Loading state
  if (loading && !profile) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
      </View>
    );
  }

  // Error state
  if (!profile) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Profile not found</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={onCancel} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
        <Text style={styles.title}>Edit Profile</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={styles.saveButton}
        >
          {saving ? (
            <ActivityIndicator size="small" color={colors.primary[600]} />
          ) : (
            <Text style={styles.saveText}>Save</Text>
          )}
        </Pressable>
      </View>

      {/* Avatar */}
      <AvatarEditor
        userId={profile.user_id}
        currentAvatarUrl={profile.avatar_url}
        onUpload={handleAvatarUpload}
      />

      {/* Form */}
      <ProfileForm formState={formState} onFieldChange={setFormField} />

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>* Required field</Text>
      </View>
    </ScrollView>
  );
}

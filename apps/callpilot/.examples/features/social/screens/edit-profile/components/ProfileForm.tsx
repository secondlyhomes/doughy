/**
 * Profile Form Component
 *
 * Form fields for editing user profile information.
 */

import React from 'react';
import { View, Text, TextInput } from 'react-native';
import type { ProfileFormProps } from '../types';
import { styles } from '../styles';

/**
 * Profile Form
 *
 * Renders input fields for username, full name, bio, website, and location.
 *
 * @example
 * ```tsx
 * <ProfileForm
 *   formState={formState}
 *   onFieldChange={(field, value) => setFormField(field, value)}
 * />
 * ```
 */
export function ProfileForm({ formState, onFieldChange }: ProfileFormProps) {
  return (
    <View style={styles.form}>
      {/* Username */}
      <View style={styles.field}>
        <Text style={styles.label}>Username *</Text>
        <TextInput
          style={styles.input}
          value={formState.username}
          onChangeText={(value) => onFieldChange('username', value)}
          placeholder="Enter username"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Full Name */}
      <View style={styles.field}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput
          style={styles.input}
          value={formState.fullName}
          onChangeText={(value) => onFieldChange('fullName', value)}
          placeholder="Enter your full name"
        />
      </View>

      {/* Bio */}
      <View style={styles.field}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={formState.bio}
          onChangeText={(value) => onFieldChange('bio', value)}
          placeholder="Tell us about yourself"
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
        <Text style={styles.hint}>{formState.bio.length} / 160 characters</Text>
      </View>

      {/* Website */}
      <View style={styles.field}>
        <Text style={styles.label}>Website</Text>
        <TextInput
          style={styles.input}
          value={formState.website}
          onChangeText={(value) => onFieldChange('website', value)}
          placeholder="https://example.com"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
      </View>

      {/* Location */}
      <View style={styles.field}>
        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={formState.location}
          onChangeText={(value) => onFieldChange('location', value)}
          placeholder="City, Country"
        />
      </View>
    </View>
  );
}

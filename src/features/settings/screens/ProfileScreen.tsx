// src/features/settings/screens/ProfileScreen.tsx
// Profile editing screen for mobile
// Uses useThemeColors() for reliable dark mode support

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Mail, Save, Camera } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { GlassButton } from '@/components/ui';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner } from '@/components/ui';

export function ProfileScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, profile, refetchProfile, isLoading: authLoading } = useAuth();

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Initialize form with profile data
  useEffect(() => {
    if (profile?.full_name) {
      const nameParts = profile.full_name.split(' ');
      setFirstName(nameParts[0] || '');
      setLastName(nameParts.slice(1).join(' ') || '');
    }
  }, [profile]);

  // Track changes
  useEffect(() => {
    const currentFullName = profile?.full_name || '';
    const newFullName = `${firstName} ${lastName}`.trim();
    setHasChanges(currentFullName !== newFullName);
  }, [firstName, lastName, profile]);

  const handleSave = async () => {
    if (!user?.id) return;

    setIsSaving(true);
    try {
      const fullName = `${firstName} ${lastName}`.trim();

      // DB schema has: name, first_name, last_name (not full_name)
      const { error } = await supabase
        .from('profiles')
        .update({
          name: fullName,
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await refetchProfile();

      Alert.alert('Success', 'Your profile has been updated.');
      setHasChanges(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      Alert.alert('Error', message);
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    if (firstName || lastName) {
      return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.slice(0, 2).toUpperCase();
    }
    return 'U';
  };

  if (authLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
      <ScrollView className="flex-1">
        {/* Header */}
        <View
          className="flex-row items-center p-4"
          style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
        >
          <GlassButton
            icon={<ArrowLeft size={24} color={colors.foreground} />}
            onPress={() => router.back()}
            size={40}
            effect="clear"
            containerStyle={{ marginRight: 16 }}
            accessibilityLabel="Go back"
          />
          <Text className="text-xl font-semibold" style={{ color: colors.foreground }}>Edit Profile</Text>
        </View>

        <View className="p-6">
          {/* Avatar Section */}
          <View className="items-center mb-8">
            <View className="relative">
              <View
                className="w-24 h-24 rounded-full items-center justify-center"
                style={{ backgroundColor: colors.primary }}
              >
                <Text className="text-2xl font-bold" style={{ color: colors.primaryForeground }}>
                  {getInitials()}
                </Text>
              </View>
              <TouchableOpacity
                className="absolute bottom-0 right-0 rounded-full p-2"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                onPress={() => Alert.alert('Coming Soon', 'Avatar upload will be available soon.')}
              >
                <Camera size={16} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <Text className="text-sm mt-2" style={{ color: colors.mutedForeground }}>Tap to change photo</Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* First Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>First Name</Text>
              <View
                className="flex-row items-center rounded-lg"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="pl-4">
                  <User size={20} color={colors.mutedForeground} />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3"
                  placeholder="Enter first name"
                  placeholderTextColor={colors.mutedForeground}
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!isSaving}
                  style={{ color: colors.foreground }}
                />
              </View>
            </View>

            {/* Last Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Last Name</Text>
              <View
                className="flex-row items-center rounded-lg"
                style={{ backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="pl-4">
                  <User size={20} color={colors.mutedForeground} />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3"
                  placeholder="Enter last name"
                  placeholderTextColor={colors.mutedForeground}
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!isSaving}
                  style={{ color: colors.foreground }}
                />
              </View>
            </View>

            {/* Email (Read-only) */}
            <View className="mb-4">
              <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Email</Text>
              <View
                className="flex-row items-center rounded-lg"
                style={{ backgroundColor: colors.muted, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="pl-4">
                  <Mail size={20} color={colors.mutedForeground} />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3"
                  value={user?.email || ''}
                  editable={false}
                  style={{ color: colors.mutedForeground }}
                />
              </View>
              <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                Email cannot be changed
              </Text>
            </View>

            {/* Account Info */}
            <View className="rounded-lg p-4 mt-4" style={{ backgroundColor: colors.card }}>
              <Text className="text-sm font-medium mb-3" style={{ color: colors.foreground }}>Account Information</Text>

              <View className="flex-row justify-between mb-2">
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>Account Type</Text>
                <Text className="text-sm capitalize" style={{ color: colors.foreground }}>{profile?.role || 'User'}</Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>Email Verified</Text>
                <Text className="text-sm" style={{ color: colors.foreground }}>
                  {profile?.email_verified ? 'Yes' : 'No'}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>Member Since</Text>
                <Text className="text-sm" style={{ color: colors.foreground }}>
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <Button
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
            loading={isSaving}
            size="lg"
            className="w-full mt-8"
          >
            {!isSaving && <Save size={20} color={colors.primaryForeground} />}
            Save Changes
          </Button>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

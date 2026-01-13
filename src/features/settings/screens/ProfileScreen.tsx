// src/features/settings/screens/ProfileScreen.tsx
// Profile editing screen for mobile

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, User, Mail, Save, Camera } from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { RootStackParamList } from '@/types';

type ProfileScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Profile'>;

export function ProfileScreen() {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
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
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-background"
    >
      <ScrollView className="flex-1">
        {/* Header */}
        <View className="flex-row items-center p-4 border-b border-border">
          <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
            <ArrowLeft size={24} color="#374151" />
          </TouchableOpacity>
          <Text className="text-xl font-semibold text-foreground">Edit Profile</Text>
        </View>

        <View className="p-6">
          {/* Avatar Section */}
          <View className="items-center mb-8">
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-primary items-center justify-center">
                <Text className="text-primary-foreground text-2xl font-bold">
                  {getInitials()}
                </Text>
              </View>
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-card border border-border rounded-full p-2"
                onPress={() => Alert.alert('Coming Soon', 'Avatar upload will be available soon.')}
              >
                <Camera size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <Text className="text-sm text-muted-foreground mt-2">Tap to change photo</Text>
          </View>

          {/* Form */}
          <View className="space-y-4">
            {/* First Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">First Name</Text>
              <View className="flex-row items-center border border-input rounded-lg bg-background">
                <View className="pl-4">
                  <User size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3 text-foreground"
                  placeholder="Enter first name"
                  placeholderTextColor="#9ca3af"
                  value={firstName}
                  onChangeText={setFirstName}
                  autoCapitalize="words"
                  editable={!isSaving}
                />
              </View>
            </View>

            {/* Last Name */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Last Name</Text>
              <View className="flex-row items-center border border-input rounded-lg bg-background">
                <View className="pl-4">
                  <User size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3 text-foreground"
                  placeholder="Enter last name"
                  placeholderTextColor="#9ca3af"
                  value={lastName}
                  onChangeText={setLastName}
                  autoCapitalize="words"
                  editable={!isSaving}
                />
              </View>
            </View>

            {/* Email (Read-only) */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
              <View className="flex-row items-center border border-input rounded-lg bg-muted">
                <View className="pl-4">
                  <Mail size={20} color="#6b7280" />
                </View>
                <TextInput
                  className="flex-1 px-4 py-3 text-muted-foreground"
                  value={user?.email || ''}
                  editable={false}
                />
              </View>
              <Text className="text-xs text-muted-foreground mt-1">
                Email cannot be changed
              </Text>
            </View>

            {/* Account Info */}
            <View className="bg-card rounded-lg p-4 mt-4">
              <Text className="text-sm font-medium text-foreground mb-3">Account Information</Text>

              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-muted-foreground">Account Type</Text>
                <Text className="text-sm text-foreground capitalize">{profile?.role || 'User'}</Text>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-muted-foreground">Email Verified</Text>
                <Text className="text-sm text-foreground">
                  {profile?.email_verified ? 'Yes' : 'No'}
                </Text>
              </View>

              <View className="flex-row justify-between">
                <Text className="text-sm text-muted-foreground">Member Since</Text>
                <Text className="text-sm text-foreground">
                  {user?.created_at
                    ? new Date(user.created_at).toLocaleDateString()
                    : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center flex-row justify-center mt-8"
            style={{ opacity: !hasChanges || isSaving ? 0.5 : 1 }}
            onPress={handleSave}
            disabled={!hasChanges || isSaving}
          >
            {isSaving ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <>
                <Save size={20} color="#ffffff" />
                <Text className="text-primary-foreground font-semibold text-base ml-2">
                  Save Changes
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

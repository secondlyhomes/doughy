// src/features/admin/screens/UserDetailScreen.tsx
// User detail and edit screen for admin

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useToast } from '@/components/ui/Toast';
import { ArrowLeft, Mail, Shield, Calendar, Clock, MoreVertical, Trash2, RotateCcw } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { ScreenHeader, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { getUserById, updateUserRole, restoreUser, deleteUser, getRoleLabel, type AdminUser, type UserRole } from '../services/userService';
import { UserProfileHeader } from '../components/UserProfileHeader';
import { UserInfoRow } from '../components/UserInfoRow';
import { UserRoleButton } from '../components/UserRoleButton';

export function UserDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { toast } = useToast();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const isSelf = currentUser?.id === userId;

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    const result = await getUserById(userId);
    if (result.success && result.user) setUser(result.user);
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleChangeRole = useCallback(async (newRole: UserRole) => {
    if (!user || isSelf) {
      if (isSelf) toast({ type: 'error', title: 'Not Allowed', description: 'You cannot change your own role.' });
      return;
    }

    Alert.alert('Change Role', `Are you sure you want to change this user's role to ${getRoleLabel(newRole)}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Change',
        onPress: async () => {
          setIsUpdating(true);
          const result = await updateUserRole(userId, newRole);
          if (result.success) {
            setUser((prev) => prev ? { ...prev, role: newRole } : null);
            toast({ type: 'success', title: 'Role Updated', description: `User is now ${getRoleLabel(newRole)}` });
          } else {
            toast({ type: 'error', title: 'Update Failed', description: result.error || 'Failed to update role', duration: 6000 });
          }
          setIsUpdating(false);
        },
      },
    ]);
  }, [user, userId, isSelf, toast]);

  const handleRestoreUser = useCallback(async () => {
    if (!user) return;
    Alert.alert('Restore User', 'Are you sure you want to restore this user?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Restore',
        onPress: async () => {
          setIsUpdating(true);
          const result = await restoreUser(userId);
          if (result.success) {
            setUser((prev) => prev ? { ...prev, isDeleted: false } : null);
            toast({ type: 'success', title: 'User Restored', description: 'The user account has been restored' });
          } else {
            toast({ type: 'error', title: 'Restore Failed', description: result.error || 'Failed to restore user', duration: 6000 });
          }
          setIsUpdating(false);
        },
      },
    ]);
  }, [user, userId, toast]);

  const handleDeleteUser = useCallback(() => {
    if (isSelf) {
      toast({ type: 'error', title: 'Not Allowed', description: 'You cannot delete your own account from here.' });
      return;
    }

    Alert.alert('Delete User', 'Are you sure you want to delete this user? This can be reversed by restoring the user.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setIsUpdating(true);
          const result = await deleteUser(userId);
          if (result.success) {
            toast({ type: 'success', title: 'User Deleted', description: 'The user account has been deleted' });
            router.back();
          } else {
            toast({ type: 'error', title: 'Delete Failed', description: result.error || 'Failed to delete user', duration: 6000 });
            setIsUpdating(false);
          }
        },
      },
    ]);
  }, [userId, router, isSelf, toast]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  if (isLoading || !user) {
    return (
      <ThemedSafeAreaView className="flex-1">
        <ScreenHeader title="User Details" backButton bordered />
        <View className="flex-1 items-center justify-center">
          {isLoading ? <LoadingSpinner fullScreen /> : <Text style={{ color: colors.mutedForeground }}>User not found</Text>}
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1">
      {/* Header */}
      <ScreenHeader
        title="User Details"
        backButton
        bordered
        rightAction={
          !isSelf ? (
            <TouchableOpacity className="p-2" onPress={() => setShowActions(!showActions)}>
              <MoreVertical size={20} color={colors.mutedForeground} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      {/* Actions Menu */}
      {showActions && !isSelf && (
        <View className="absolute top-16 right-4 rounded-lg shadow-lg z-10 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
          {user.isDeleted ? (
            <TouchableOpacity className="flex-row items-center px-4 py-3" onPress={() => { setShowActions(false); handleRestoreUser(); }}>
              <RotateCcw size={18} color={colors.success} />
              <Text className="ml-3" style={{ color: colors.success }}>Restore User</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity className="flex-row items-center px-4 py-3" onPress={() => { setShowActions(false); handleDeleteUser(); }}>
              <Trash2 size={18} color={colors.destructive} />
              <Text className="ml-3" style={{ color: colors.destructive }}>Delete User</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView className="flex-1" contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}>
        {isSelf && (
          <View className="mx-4 mt-4 p-3 rounded-lg" style={{ backgroundColor: withOpacity(colors.info, 'muted') }}>
            <Text className="text-sm" style={{ color: colors.info }}>This is your account. Some actions are restricted.</Text>
          </View>
        )}

        {/* Profile Header */}
        <UserProfileHeader name={user.name} email={user.email} isDeleted={user.isDeleted} />

        {/* Info Section */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>ACCOUNT INFORMATION</Text>
          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <UserInfoRow icon={<Mail size={20} color={colors.mutedForeground} />} label="Email" value={user.email} />
            <UserInfoRow icon={<Shield size={20} color={colors.mutedForeground} />} label="Role" value={getRoleLabel(user.role)} />
            <UserInfoRow icon={<Calendar size={20} color={colors.mutedForeground} />} label="Joined" value={formatDate(user.createdAt)} />
            <UserInfoRow icon={<Clock size={20} color={colors.mutedForeground} />} label="Last Updated" value={formatDate(user.updatedAt)} hideBorder />
          </View>
        </View>

        {/* Role Management */}
        {!isSelf && (
          <View className="p-4">
            <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>CHANGE ROLE</Text>
            <View className="flex-row gap-2">
              <UserRoleButton label="User" active={user.role === 'user'} onPress={() => handleChangeRole('user')} disabled={isUpdating} />
              <UserRoleButton label="Support" active={user.role === 'support'} onPress={() => handleChangeRole('support')} disabled={isUpdating} />
              <UserRoleButton label="Admin" active={user.role === 'admin'} onPress={() => handleChangeRole('admin')} disabled={isUpdating} />
            </View>
          </View>
        )}

        {isUpdating && (
          <View className="py-4">
            <LoadingSpinner text="Updating..." />
          </View>
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

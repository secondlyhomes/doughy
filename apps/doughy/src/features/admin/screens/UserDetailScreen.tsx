// src/features/admin/screens/UserDetailScreen.tsx
// User detail and edit screen for admin

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { useToast } from '@/components/ui/Toast';
import { Mail, Shield, Calendar, Clock, MoreVertical, Trash2, RotateCcw } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { formatDateTime } from '@/lib/formatters';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, TAB_BAR_SAFE_PADDING, DestructiveActionSheet } from '@/components/ui';
import { useNativeHeader } from '@/hooks';
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
  const [showDeleteSheet, setShowDeleteSheet] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const isSelf = currentUser?.id === userId;

  const { headerOptions } = useNativeHeader({
    title: 'User Details',
    fallbackRoute: '/(tabs)/admin/users',
    rightAction: !isSelf ? (
      <TouchableOpacity style={{ padding: 8 }} onPress={() => setShowActions(!showActions)}>
        <MoreVertical size={20} color={colors.mutedForeground} />
      </TouchableOpacity>
    ) : undefined,
  });

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    setLoadError(null);
    const result = await getUserById(userId);
    if (result.success && result.user) {
      setUser(result.user);
    } else {
      setLoadError(result.error || 'Failed to load user');
    }
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
    setShowDeleteSheet(true);
  }, [isSelf, toast]);

  const handleConfirmDeleteUser = useCallback(async () => {
    setIsUpdating(true);
    const result = await deleteUser(userId);
    if (result.success) {
      toast({ type: 'success', title: 'User Deleted', description: 'The user account has been deleted' });
      setShowDeleteSheet(false);
      router.back();
    } else {
      toast({ type: 'error', title: 'Delete Failed', description: result.error || 'Failed to delete user', duration: 6000 });
      setIsUpdating(false);
    }
  }, [userId, router, toast]);

  const formatDateValue = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return formatDateTime(dateString);
  };

  if (isLoading || !user) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View className="flex-1 items-center justify-center">
            {isLoading ? (
              <LoadingSpinner fullScreen />
            ) : loadError ? (
              <Text style={{ color: colors.destructive }}>{loadError}</Text>
            ) : (
              <Text style={{ color: colors.mutedForeground }}>User not found</Text>
            )}
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
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
            <UserInfoRow icon={<Calendar size={20} color={colors.mutedForeground} />} label="Joined" value={formatDateValue(user.createdAt)} />
            <UserInfoRow icon={<Clock size={20} color={colors.mutedForeground} />} label="Last Updated" value={formatDateValue(user.updatedAt)} hideBorder />
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

        {/* Delete Confirmation Sheet */}
        <DestructiveActionSheet
          isOpen={showDeleteSheet}
          onClose={() => setShowDeleteSheet(false)}
          title="Delete User"
          description={`Are you sure you want to delete ${user?.email || 'this user'}? This can be reversed by restoring the user.`}
          confirmLabel="Delete"
          onConfirm={handleConfirmDeleteUser}
          isLoading={isUpdating}
          itemName={user?.email}
        />
      </ThemedSafeAreaView>
    </>
  );
}

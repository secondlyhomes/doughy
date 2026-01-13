// src/features/admin/screens/UserDetailScreen.tsx
// User detail and edit screen for admin

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Calendar,
  Clock,
  MoreVertical,
  Trash2,
  RotateCcw,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/hooks/useAuth';
import {
  getUserById,
  updateUserRole,
  restoreUser,
  deleteUser,
  getRoleLabel,
  type AdminUser,
  type UserRole,
} from '../services/userService';

export function UserDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const userId = params.userId as string;
  const { user: currentUser } = useAuth();

  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showActions, setShowActions] = useState(false);

  // Check if viewing self
  const isSelf = currentUser?.id === userId;

  const loadUser = useCallback(async () => {
    setIsLoading(true);
    const result = await getUserById(userId);
    if (result.success && result.user) {
      setUser(result.user);
    }
    setIsLoading(false);
  }, [userId]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const handleChangeRole = useCallback(async (newRole: UserRole) => {
    if (!user) return;

    // Prevent self-demotion
    if (isSelf) {
      Alert.alert('Not Allowed', 'You cannot change your own role.');
      return;
    }

    Alert.alert(
      'Change Role',
      `Are you sure you want to change this user's role to ${getRoleLabel(newRole)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Change',
          onPress: async () => {
            setIsUpdating(true);
            const result = await updateUserRole(userId, newRole);
            if (result.success) {
              setUser((prev) => prev ? { ...prev, role: newRole } : null);
              Alert.alert('Success', 'User role updated');
            } else {
              Alert.alert('Error', result.error || 'Failed to update role');
            }
            setIsUpdating(false);
          },
        },
      ]
    );
  }, [user, userId, isSelf]);

  const handleRestoreUser = useCallback(async () => {
    if (!user) return;

    Alert.alert(
      'Restore User',
      'Are you sure you want to restore this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: async () => {
            setIsUpdating(true);
            const result = await restoreUser(userId);
            if (result.success) {
              setUser((prev) => prev ? { ...prev, isDeleted: false } : null);
              Alert.alert('Success', 'User restored');
            } else {
              Alert.alert('Error', result.error || 'Failed to restore user');
            }
            setIsUpdating(false);
          },
        },
      ]
    );
  }, [user, userId]);

  const handleDeleteUser = useCallback(() => {
    // Prevent self-deletion
    if (isSelf) {
      Alert.alert('Not Allowed', 'You cannot delete your own account from here.');
      return;
    }

    Alert.alert(
      'Delete User',
      'Are you sure you want to delete this user? This can be reversed by restoring the user.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);
            const result = await deleteUser(userId);
            if (result.success) {
              Alert.alert('Success', 'User deleted');
              router.back();
            } else {
              Alert.alert('Error', result.error || 'Failed to delete user');
              setIsUpdating(false);
            }
          },
        },
      ]
    );
  }, [userId, router, isSelf]);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
            User Details
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        <View className="flex-row items-center px-4 py-3 border-b border-border">
          <TouchableOpacity onPress={() => router.back()} className="p-2">
            <ArrowLeft size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
            User Details
          </Text>
        </View>
        <View className="flex-1 items-center justify-center">
          <Text className="text-muted-foreground">User not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <TouchableOpacity onPress={() => router.back()} className="p-2">
          <ArrowLeft size={24} color="#6b7280" />
        </TouchableOpacity>
        <Text className="flex-1 text-lg font-semibold text-foreground ml-2">
          User Details
        </Text>
        {!isSelf && (
          <TouchableOpacity
            className="p-2"
            onPress={() => setShowActions(!showActions)}
          >
            <MoreVertical size={20} color="#6b7280" />
          </TouchableOpacity>
        )}
      </View>

      {/* Actions Menu */}
      {showActions && !isSelf && (
        <View className="absolute top-16 right-4 bg-card border border-border rounded-lg shadow-lg z-10">
          {user.isDeleted ? (
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setShowActions(false);
                handleRestoreUser();
              }}
            >
              <RotateCcw size={18} color="#22c55e" />
              <Text className="ml-3 text-green-600">Restore User</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-row items-center px-4 py-3"
              onPress={() => {
                setShowActions(false);
                handleDeleteUser();
              }}
            >
              <Trash2 size={18} color="#ef4444" />
              <Text className="ml-3 text-destructive">Delete User</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <ScrollView className="flex-1">
        {/* Self indicator */}
        {isSelf && (
          <View className="mx-4 mt-4 p-3 bg-blue-50 rounded-lg">
            <Text className="text-blue-700 text-sm">
              This is your account. Some actions are restricted.
            </Text>
          </View>
        )}

        {/* Profile Header */}
        <View className="items-center py-8 border-b border-border">
          <View className="w-24 h-24 rounded-full bg-primary/10 items-center justify-center">
            <User size={48} color="#3b82f6" />
          </View>
          <Text className="text-xl font-semibold text-foreground mt-4">
            {user.name || 'No Name'}
          </Text>
          <Text className="text-muted-foreground">{user.email}</Text>
          <View className="flex-row items-center mt-2">
            <View
              className="w-2 h-2 rounded-full mr-2"
              style={{ backgroundColor: user.isDeleted ? '#ef4444' : '#22c55e' }}
            />
            <Text className="text-sm text-muted-foreground">
              {user.isDeleted ? 'Deleted' : 'Active'}
            </Text>
          </View>
        </View>

        {/* Info Section */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
            ACCOUNT INFORMATION
          </Text>
          <View className="bg-card rounded-lg">
            <InfoRow
              icon={<Mail size={20} color="#6b7280" />}
              label="Email"
              value={user.email}
            />
            <InfoRow
              icon={<Shield size={20} color="#6b7280" />}
              label="Role"
              value={getRoleLabel(user.role)}
            />
            <InfoRow
              icon={<Calendar size={20} color="#6b7280" />}
              label="Joined"
              value={formatDate(user.createdAt)}
            />
            <InfoRow
              icon={<Clock size={20} color="#6b7280" />}
              label="Last Updated"
              value={formatDate(user.updatedAt)}
              hideBorder
            />
          </View>
        </View>

        {/* Role Management - disabled for self */}
        {!isSelf && (
          <View className="p-4">
            <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
              CHANGE ROLE
            </Text>
            <View className="flex-row gap-2">
              <RoleButton
                label="User"
                active={user.role === 'user'}
                onPress={() => handleChangeRole('user')}
                disabled={isUpdating}
              />
              <RoleButton
                label="Support"
                active={user.role === 'support'}
                onPress={() => handleChangeRole('support')}
                disabled={isUpdating}
              />
              <RoleButton
                label="Admin"
                active={user.role === 'admin'}
                onPress={() => handleChangeRole('admin')}
                disabled={isUpdating}
              />
            </View>
          </View>
        )}

        {isUpdating && (
          <View className="items-center py-4">
            <ActivityIndicator size="small" color="#3b82f6" />
            <Text className="text-sm text-muted-foreground mt-2">Updating...</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  hideBorder?: boolean;
}

function InfoRow({ icon, label, value, hideBorder }: InfoRowProps) {
  return (
    <View
      className={`flex-row items-center p-4 ${
        !hideBorder ? 'border-b border-border' : ''
      }`}
    >
      {icon}
      <Text className="text-muted-foreground ml-3 w-28">{label}</Text>
      <Text className="flex-1 text-foreground">{value}</Text>
    </View>
  );
}

interface RoleButtonProps {
  label: string;
  active: boolean;
  onPress: () => void;
  disabled: boolean;
}

function RoleButton({ label, active, onPress, disabled }: RoleButtonProps) {
  return (
    <TouchableOpacity
      className={`flex-1 py-3 rounded-lg items-center ${
        active ? 'bg-primary' : 'bg-card border border-border'
      } ${disabled ? 'opacity-50' : ''}`}
      onPress={onPress}
      disabled={disabled || active}
    >
      <Text
        className={`font-medium ${
          active ? 'text-primary-foreground' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

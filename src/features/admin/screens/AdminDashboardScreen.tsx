// src/features/admin/screens/AdminDashboardScreen.tsx
// Admin dashboard screen for mobile

import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Users, TrendingUp, Database, Activity, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, Button, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { SPACING } from '@/constants/design-tokens';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import {
  getAdminStats,
  getSystemHealth,
  type AdminStats,
  type SystemHealth,
} from '../services/adminService';
import { testUserService } from '../services/testUserService';
import {
  fetchAllApiKeys,
  getSecurityHealthSummary,
  getKeysNeedingAttention,
} from '../services/securityHealthService';
import type { SecurityHealthSummary } from '../types/security';
import {
  StatCard,
  SystemStatusSection,
  SecurityHealthCard,
  DevToolsSection,
  AccountSection,
} from './admin-dashboard';

export function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { isLoading: authLoading, signOut } = useAuth();
  const { canViewAdminPanel, canManageUsers } = usePermissions();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systems, setSystems] = useState<SystemHealth[]>([]);
  const [securitySummary, setSecuritySummary] = useState<SecurityHealthSummary | null>(null);
  const [keysNeedingAttention, setKeysNeedingAttention] = useState(0);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsResult, healthResult, keysResult] = await Promise.all([
        getAdminStats(),
        getSystemHealth(),
        fetchAllApiKeys(),
      ]);

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      } else if (!statsResult.success) {
        console.error('Failed to load stats:', statsResult.error);
        Alert.alert('Stats Error', statsResult.error || 'Failed to load statistics');
      }

      if (healthResult.success && healthResult.systems) {
        setSystems(healthResult.systems);
      } else if (!healthResult.success) {
        console.error('Failed to load system health:', healthResult.error);
        Alert.alert('Health Check Error', healthResult.error || 'Failed to load system health');
      }

      if (keysResult.success && keysResult.keys.length > 0) {
        const summary = getSecurityHealthSummary(keysResult.keys);
        setSecuritySummary(summary);
        const attention = getKeysNeedingAttention(keysResult.keys);
        setKeysNeedingAttention(attention.length);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      Alert.alert(
        'Failed to Load',
        'Could not load dashboard data. Please check your connection and try again.'
      );
    }
  }, []);

  useEffect(() => {
    setIsLoading(true);
    loadDashboardData().finally(() => setIsLoading(false));
  }, [loadDashboardData]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  }, [loadDashboardData]);

  const handleSignOut = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setIsSigningOut(true);
          try {
            await signOut();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out. Please try again.');
          } finally {
            setIsSigningOut(false);
          }
        },
      },
    ]);
  };

  const handleSeedTestUsers = async () => {
    const safetyCheck = testUserService.canSeedTestUsers();
    if (!safetyCheck.allowed) {
      Alert.alert('Cannot Seed Test Users', safetyCheck.reason || 'Safety check failed');
      return;
    }

    if (!canManageUsers) {
      Alert.alert('Access Denied', 'You need admin or support permissions to seed test users.');
      return;
    }

    const userCount = testUserService.getTestUserCount();
    Alert.alert(
      'Seed Test Users',
      `This will create ${userCount} test users with @example.com emails.\n\nIncludes:\n- 3 Admins\n- 4 Support\n- 10 Standard\n- 10 Users\n- 5 Beta testers\n- 8 Edge cases (unicode, special chars, etc.)\n\nContinue?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Create Test Users',
          onPress: async () => {
            setIsSeeding(true);
            try {
              const result = await testUserService.seedTestUsers();
              if (result.success) {
                const warnings = result.warnings?.length
                  ? `\n\nUpdated existing: ${result.warnings.length}`
                  : '';
                Alert.alert(
                  'Success',
                  `Test users created successfully!\n\nCreated/Updated: ${result.count} users${warnings}`,
                  [{ text: 'OK', onPress: handleRefresh }]
                );
              } else {
                Alert.alert(
                  'Seed Failed',
                  `Some errors occurred:\n\n${result.errors?.slice(0, 5).join('\n') || 'Unknown error'}\n\nCreated: ${result.count} users`
                );
              }
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to seed test users');
            } finally {
              setIsSeeding(false);
            }
          },
        },
      ]
    );
  };

  const handleClearTestUsers = async () => {
    const safetyCheck = testUserService.canSeedTestUsers();
    if (!safetyCheck.allowed) {
      Alert.alert('Cannot Clear Test Users', safetyCheck.reason || 'Safety check failed');
      return;
    }

    if (!canManageUsers) {
      Alert.alert('Access Denied', 'You need admin or support permissions to clear test users.');
      return;
    }

    Alert.alert(
      'Remove Test Users?',
      'This will permanently delete ALL users with @example.com emails.\n\nThis action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove Test Users',
          style: 'destructive',
          onPress: async () => {
            setIsClearing(true);
            try {
              const result = await testUserService.clearTestUsers();
              if (result.success) {
                Alert.alert(
                  'Success',
                  `Test users removed successfully!\n\nDeleted: ${result.count} users`,
                  [{ text: 'OK', onPress: handleRefresh }]
                );
              } else {
                Alert.alert(
                  'Clear Failed',
                  `Some errors occurred:\n\n${result.errors?.slice(0, 5).join('\n') || 'Unknown error'}\n\nDeleted: ${result.count} users`
                );
              }
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : 'Failed to clear test users');
            } finally {
              setIsClearing(false);
            }
          },
        },
      ]
    );
  };

  if (!authLoading && !canViewAdminPanel) {
    return (
      <ThemedSafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center p-6">
          <AlertTriangle size={48} color={colors.destructive} />
          <Text className="text-xl font-semibold mt-4" style={{ color: colors.foreground }}>
            Access Denied
          </Text>
          <Text className="text-center mt-2" style={{ color: colors.mutedForeground }}>
            You don't have permission to access the admin dashboard.
          </Text>
          <Button onPress={() => router.back()} className="mt-6">
            Go Back
          </Button>
        </View>
      </ThemedSafeAreaView>
    );
  }

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading dashboard..." />
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING + SPACING['4xl'] * 2 }}
        contentInsetAdjustmentBehavior="automatic"
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />}
      >
        {/* Stats Cards */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            Overview
          </Text>
          <View className="flex-row flex-wrap">
            <StatCard
              icon={<Users size={24} color={colors.info} />}
              title="Total Users"
              value={stats?.totalUsers.toString() || '0'}
              subtitle={`${stats?.activeUsers || 0} active`}
              onPress={() => router.push('/(admin)/users')}
              cardColor={colors.card}
            />
            <StatCard
              icon={<TrendingUp size={24} color={colors.success} />}
              title="Total Leads"
              value={stats?.totalLeads.toString() || '0'}
              subtitle="All time"
              cardColor={colors.card}
            />
            <StatCard
              icon={<Database size={24} color={colors.warning} />}
              title="Properties"
              value={stats?.totalProperties.toString() || '0'}
              subtitle="In database"
              cardColor={colors.card}
            />
            <StatCard
              icon={<Activity size={24} color={colors.primary} />}
              title="New This Week"
              value={stats?.newUsersThisWeek.toString() || '0'}
              subtitle="Users"
              cardColor={colors.card}
            />
          </View>
        </View>

        <SystemStatusSection systems={systems} />

        <SecurityHealthCard
          score={securitySummary?.score ?? null}
          totalKeys={securitySummary?.totalKeys ?? 0}
          keysNeedingAttention={keysNeedingAttention}
          onPress={() => router.push('/(admin)/security')}
        />

        {__DEV__ && canManageUsers && (
          <DevToolsSection
            isSeeding={isSeeding}
            isClearing={isClearing}
            onSeedTestUsers={handleSeedTestUsers}
            onClearTestUsers={handleClearTestUsers}
          />
        )}

        <AccountSection isSigningOut={isSigningOut} onSignOut={handleSignOut} />

        <View className="p-4">
          <Button variant="outline" onPress={handleRefresh}>
            <RefreshCw size={18} color={colors.mutedForeground} />
            Refresh Data
          </Button>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

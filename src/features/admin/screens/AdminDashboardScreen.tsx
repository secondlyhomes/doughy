// src/features/admin/screens/AdminDashboardScreen.tsx
// Admin dashboard screen for mobile

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Users,
  Database,
  Server,
  AlertTriangle,
  TrendingUp,
  Activity,
  ChevronRight,
  RefreshCw,
  CheckCircle,
  XCircle,
  Link,
  FileText,
  LogOut,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, Button, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import {
  getAdminStats,
  getSystemHealth,
  type AdminStats,
  type SystemHealth,
} from '../services/adminService';

export function AdminDashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { isLoading: authLoading, signOut } = useAuth();
  const { canViewAdminPanel } = usePermissions();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [systems, setSystems] = useState<SystemHealth[]>([]);

  const loadDashboardData = useCallback(async () => {
    try {
      const [statsResult, healthResult] = await Promise.all([
        getAdminStats(),
        getSystemHealth(),
      ]);

      if (statsResult.success && statsResult.stats) {
        setStats(statsResult.stats);
      }

      if (healthResult.success && healthResult.systems) {
        setSystems(healthResult.systems);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
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
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
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
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return colors.success;
      case 'degraded':
        return colors.warning;
      case 'outage':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle size={16} color={colors.success} />;
      case 'degraded':
        return <AlertTriangle size={16} color={colors.warning} />;
      case 'outage':
        return <XCircle size={16} color={colors.destructive} />;
      default:
        return <Activity size={16} color={colors.mutedForeground} />;
    }
  };

  // Check if user has admin access (uses consistent permission check)
  if (!authLoading && !canViewAdminPanel) {
    return (
      <ThemedSafeAreaView className="flex-1">
        <View className="flex-1 items-center justify-center p-6">
          <AlertTriangle size={48} color={colors.destructive} />
          <Text className="text-xl font-semibold mt-4" style={{ color: colors.foreground }}>Access Denied</Text>
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
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING + insets.bottom }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
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

        {/* System Status */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            System Status
          </Text>
          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            {systems.map((system, index) => (
              <View
                key={system.name}
                className="flex-row items-center p-4"
                style={index !== systems.length - 1 ? { borderBottomWidth: 1, borderColor: colors.border } : undefined}
              >
                <Server size={20} color={colors.mutedForeground} />
                <View className="flex-1 ml-3">
                  <Text className="font-medium" style={{ color: colors.foreground }}>{system.name}</Text>
                  {system.latency != null && (
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                      Response: {system.latency}ms
                    </Text>
                  )}
                </View>
                <View className="flex-row items-center">
                  {getStatusIcon(system.status)}
                  <Text
                    className="ml-2 text-sm capitalize"
                    style={{ color: getStatusColor(system.status) }}
                  >
                    {system.status}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            Quick Actions
          </Text>
          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <AdminActionItem
              icon={<Users size={20} color={colors.mutedForeground} />}
              title="Manage Users"
              subtitle="View and manage user accounts"
              onPress={() => router.push('/(admin)/users')}
            />
            <AdminActionItem
              icon={<Link size={20} color={colors.mutedForeground} />}
              title="Integrations"
              subtitle="Manage external integrations"
              onPress={() => router.push('/(admin)/integrations')}
            />
            <AdminActionItem
              icon={<FileText size={20} color={colors.mutedForeground} />}
              title="System Logs"
              subtitle="View system and error logs"
              onPress={() => router.push('/(admin)/logs')}
              hideBorder
            />
          </View>
        </View>

        {/* Account Actions */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            Account
          </Text>
          <View className="rounded-lg" style={{ backgroundColor: colors.card }}>
            <TouchableOpacity
              className="flex-row items-center p-4"
              onPress={handleSignOut}
              disabled={isSigningOut}
            >
              <LogOut size={20} color={colors.destructive} />
              <Text className="flex-1 ml-3 font-medium" style={{ color: colors.destructive }}>
                {isSigningOut ? 'Signing out...' : 'Sign Out'}
              </Text>
              {isSigningOut && <LoadingSpinner size="small" color={colors.destructive} />}
            </TouchableOpacity>
          </View>
        </View>

        {/* Refresh Button */}
        <View className="p-4 pb-8">
          <Button variant="outline" onPress={handleRefresh}>
            <RefreshCw size={18} color={colors.mutedForeground} />
            Refresh Data
          </Button>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

// Helper components
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  onPress?: () => void;
  cardColor?: string;
}

function StatCard({ icon, title, value, subtitle, onPress, cardColor }: StatCardProps) {
  const colors = useThemeColors();
  const content = (
    <View className="rounded-lg p-4" style={{ backgroundColor: cardColor }}>
      {icon}
      <Text className="text-2xl font-bold mt-2" style={{ color: colors.foreground }}>{value}</Text>
      <Text className="text-sm" style={{ color: colors.foreground }}>{title}</Text>
      <Text className="text-xs" style={{ color: colors.mutedForeground }}>{subtitle}</Text>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity className="w-1/2 p-2" onPress={onPress} activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    );
  }

  return <View className="w-1/2 p-2">{content}</View>;
}

interface AdminActionItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  hideBorder?: boolean;
}

function AdminActionItem({ icon, title, subtitle, onPress, hideBorder }: AdminActionItemProps) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className="flex-row items-center p-4"
      style={!hideBorder ? { borderBottomWidth: 1, borderColor: colors.border } : undefined}
      onPress={onPress}
    >
      {icon}
      <View className="flex-1 ml-3">
        <Text className="font-medium" style={{ color: colors.foreground }}>{title}</Text>
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>{subtitle}</Text>
      </View>
      <ChevronRight size={20} color={colors.mutedForeground} />
    </TouchableOpacity>
  );
}

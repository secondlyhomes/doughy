// src/features/admin/screens/AdminDashboardScreen.tsx
// Admin dashboard screen for mobile

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { RootStackParamList } from '@/types';

type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SystemStatus {
  name: string;
  status: 'operational' | 'degraded' | 'outage';
  lastChecked: string;
}

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalLeads: number;
  totalProperties: number;
}

export function AdminDashboardScreen() {
  const navigation = useNavigation<AdminDashboardScreenNavigationProp>();
  const { profile } = useAuth();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Mock data - in production, fetch from API
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    activeUsers: 0,
    totalLeads: 0,
    totalProperties: 0,
  });

  const [systemStatus, setSystemStatus] = useState<SystemStatus[]>([
    { name: 'API Server', status: 'operational', lastChecked: new Date().toISOString() },
    { name: 'Database', status: 'operational', lastChecked: new Date().toISOString() },
    { name: 'Authentication', status: 'operational', lastChecked: new Date().toISOString() },
  ]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      // TODO: Fetch real data from API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock stats
      setStats({
        totalUsers: 156,
        activeUsers: 42,
        totalLeads: 1247,
        totalProperties: 89,
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadDashboardData();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational':
        return '#22c55e';
      case 'degraded':
        return '#f59e0b';
      case 'outage':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational':
        return <CheckCircle size={16} color="#22c55e" />;
      case 'degraded':
        return <AlertTriangle size={16} color="#f59e0b" />;
      case 'outage':
        return <XCircle size={16} color="#ef4444" />;
      default:
        return <Activity size={16} color="#6b7280" />;
    }
  };

  // Check if user has admin access
  if (profile?.role !== 'admin' && profile?.role !== 'super_admin') {
    return (
      <View className="flex-1 bg-background items-center justify-center p-6">
        <AlertTriangle size={48} color="#ef4444" />
        <Text className="text-xl font-semibold text-foreground mt-4">Access Denied</Text>
        <Text className="text-muted-foreground text-center mt-2">
          You don't have permission to access the admin dashboard.
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-lg py-3 px-6 mt-6"
          onPress={() => navigation.goBack()}
        >
          <Text className="text-primary-foreground font-semibold">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
        <Text className="text-muted-foreground mt-4">Loading dashboard...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View className="p-6 border-b border-border">
        <Text className="text-2xl font-bold text-foreground">Admin Dashboard</Text>
        <Text className="text-muted-foreground mt-1">System overview and management</Text>
      </View>

      {/* Stats Cards */}
      <View className="p-4">
        <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
          OVERVIEW
        </Text>
        <View className="flex-row flex-wrap">
          <StatCard
            icon={<Users size={24} color="#6366f1" />}
            title="Total Users"
            value={stats.totalUsers.toString()}
            subtitle={`${stats.activeUsers} active`}
          />
          <StatCard
            icon={<TrendingUp size={24} color="#22c55e" />}
            title="Total Leads"
            value={stats.totalLeads.toString()}
            subtitle="All time"
          />
          <StatCard
            icon={<Database size={24} color="#f59e0b" />}
            title="Properties"
            value={stats.totalProperties.toString()}
            subtitle="In database"
          />
          <StatCard
            icon={<Activity size={24} color="#8b5cf6" />}
            title="Uptime"
            value="99.9%"
            subtitle="Last 30 days"
          />
        </View>
      </View>

      {/* System Status */}
      <View className="p-4">
        <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
          SYSTEM STATUS
        </Text>
        <View className="bg-card rounded-lg">
          {systemStatus.map((system, index) => (
            <View
              key={system.name}
              className={`flex-row items-center p-4 ${
                index !== systemStatus.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <Server size={20} color="#6b7280" />
              <View className="flex-1 ml-3">
                <Text className="text-foreground font-medium">{system.name}</Text>
                <Text className="text-xs text-muted-foreground">
                  Last checked: {new Date(system.lastChecked).toLocaleTimeString()}
                </Text>
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
        <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
          QUICK ACTIONS
        </Text>
        <View className="bg-card rounded-lg">
          <AdminActionItem
            icon={<Users size={20} color="#6b7280" />}
            title="Manage Users"
            subtitle="View and manage user accounts"
            onPress={() => {
              // TODO: Navigate to users screen
            }}
          />
          <AdminActionItem
            icon={<Database size={20} color="#6b7280" />}
            title="Database Management"
            subtitle="View database statistics"
            onPress={() => {
              // TODO: Navigate to database screen
            }}
          />
          <AdminActionItem
            icon={<AlertTriangle size={20} color="#6b7280" />}
            title="View Logs"
            subtitle="System and error logs"
            onPress={() => {
              // TODO: Navigate to logs screen
            }}
            hideBorder
          />
        </View>
      </View>

      {/* Refresh Button */}
      <View className="p-4 pb-8">
        <TouchableOpacity
          className="bg-card border border-border rounded-lg py-3 flex-row items-center justify-center"
          onPress={handleRefresh}
        >
          <RefreshCw size={18} color="#6b7280" />
          <Text className="text-foreground font-medium ml-2">Refresh Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

// Helper components
interface StatCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
}

function StatCard({ icon, title, value, subtitle }: StatCardProps) {
  return (
    <View className="w-1/2 p-2">
      <View className="bg-card rounded-lg p-4">
        {icon}
        <Text className="text-2xl font-bold text-foreground mt-2">{value}</Text>
        <Text className="text-sm text-foreground">{title}</Text>
        <Text className="text-xs text-muted-foreground">{subtitle}</Text>
      </View>
    </View>
  );
}

interface AdminActionItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onPress: () => void;
  hideBorder?: boolean;
}

function AdminActionItem({ icon, title, subtitle, onPress, hideBorder }: AdminActionItemProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center p-4 ${!hideBorder ? 'border-b border-border' : ''}`}
      onPress={onPress}
    >
      {icon}
      <View className="flex-1 ml-3">
        <Text className="text-foreground font-medium">{title}</Text>
        <Text className="text-sm text-muted-foreground">{subtitle}</Text>
      </View>
      <ChevronRight size={20} color="#6b7280" />
    </TouchableOpacity>
  );
}

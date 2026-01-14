// Dashboard Screen - React Native (Inbox/Today)
// Shows top deal actions and quick stats
// Uses useThemeColors() for reliable dark mode support

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { ThemedSafeAreaView } from '@/components';
import { useRouter } from 'expo-router';
import {
  TrendingUp,
  Clock,
  CreditCard,
  Briefcase,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  X,
  Phone,
  Camera,
  Calculator,
  FileText,
  MessageCircle,
  CheckCircle,
  FolderPlus,
  BarChart2,
  Play
} from 'lucide-react-native';

// Zone A UI Components
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { getTrendColor } from '@/utils';

// Zone D Components
import { QuickActionFAB } from '@/features/layout';

// Deal imports
import {
  useDealsWithActions,
  useDeals,
  calculateNextAction,
  getDealAddress,
  getDealLeadName,
  DEAL_STAGE_CONFIG,
  Deal,
} from '@/features/deals';
import type { ActionCategory } from '@/features/deals/hooks/useNextAction';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    value: string;
    isPositive?: boolean;
  };
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  const colors = useThemeColors();
  return (
    <View className="rounded-xl p-4 flex-1 min-w-[45%]" style={{ backgroundColor: colors.card }}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm" style={{ color: colors.mutedForeground }}>{title}</Text>
        {icon}
      </View>
      <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>{value}</Text>
      {trend && (
        <View className="flex-row items-center mt-1">
          {(() => {
            const isPositive = trend.isPositive ?? (trend.direction === 'up');
            const trendColor = getTrendColor(isPositive, colors);
            return (
              <>
                {trend.direction === 'up' ? (
                  <ArrowUp size={12} color={trendColor} />
                ) : (
                  <ArrowDown size={12} color={trendColor} />
                )}
                <Text style={{ color: trendColor }} className="text-xs ml-1">{trend.value}</Text>
              </>
            );
          })()}
        </View>
      )}
    </View>
  );
}

function ActionIcon({ category, color, size = 16 }: { category: ActionCategory; color: string; size?: number }) {
  switch (category) {
    case 'contact':
      return <Phone size={size} color={color} />;
    case 'analyze':
      return <BarChart2 size={size} color={color} />;
    case 'walkthrough':
      return <Camera size={size} color={color} />;
    case 'underwrite':
      return <Calculator size={size} color={color} />;
    case 'offer':
      return <FileText size={size} color={color} />;
    case 'negotiate':
      return <MessageCircle size={size} color={color} />;
    case 'close':
      return <CheckCircle size={size} color={color} />;
    case 'followup':
      return <Clock size={size} color={color} />;
    case 'document':
      return <FolderPlus size={size} color={color} />;
    default:
      return <Play size={size} color={color} />;
  }
}

function getPriorityColorValue(priority: 'high' | 'medium' | 'low', colors: ReturnType<typeof useThemeColors>): string {
  switch (priority) {
    case 'high':
      return colors.destructive;
    case 'medium':
      return colors.warning;
    case 'low':
      return colors.info;
    default:
      return colors.muted;
  }
}

export function DashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const tabBarHeight = useBottomTabBarHeight();
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const { deals: actionDeals, isLoading: dealsLoading, refetch: refetchDeals } = useDealsWithActions(5);
  const { deals: allDeals } = useDeals({ activeOnly: true });

  const activeDeals = allDeals.length;
  const dealsInNegotiation = allDeals.filter(d => d.stage === 'negotiating' || d.stage === 'under_contract').length;
  const overdueActions = actionDeals.filter(d => {
    const action = calculateNextAction(d);
    return action.isOverdue;
  }).length;

  const onRefresh = async () => {
    setRefreshing(true);
    await refetchDeals();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAddLead = () => {
    router.push('/(tabs)/leads/add');
  };

  const handleAddProperty = () => {
    router.push('/(tabs)/properties');
  };

  const handleStartChat = () => {
    router.push('/assistant');
  };

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: tabBarHeight }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
        {/* Alert Banner */}
        {showAlert && overdueActions > 0 && (
          <View
            className="rounded-lg p-4 mb-4"
            style={{ backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: colors.warning }}
          >
            <View className="flex-row items-start">
              <View className="rounded-full p-2 mr-3" style={{ backgroundColor: withOpacity(colors.warning, 'light') }}>
                <AlertTriangle size={20} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium" style={{ color: colors.foreground }}>Overdue Actions</Text>
                <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                  {overdueActions} deal{overdueActions !== 1 ? 's' : ''} {overdueActions !== 1 ? 'have' : 'has'} overdue actions that need attention
                </Text>
                <View className="flex-row mt-3 gap-2">
                  <TouchableOpacity
                    className="rounded-md px-3 py-2"
                    style={{ borderWidth: 1, borderColor: colors.border }}
                    onPress={() => router.push('/(tabs)/deals')}
                    accessibilityLabel="View deals requiring attention"
                    accessibilityRole="button"
                  >
                    <Text className="text-sm" style={{ color: colors.foreground }}>View Deals</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="px-3 py-2"
                    onPress={() => setShowAlert(false)}
                    accessibilityLabel="Dismiss alert"
                    accessibilityRole="button"
                  >
                    <Text className="text-sm" style={{ color: colors.mutedForeground }}>Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowAlert(false)}
                accessibilityLabel="Close alert"
                accessibilityRole="button"
              >
                <X size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <StatCard
            title="Active Deals"
            value={activeDeals}
            icon={<Briefcase size={16} color={colors.info} />}
          />
          <StatCard
            title="In Negotiation"
            value={dealsInNegotiation}
            icon={<MessageCircle size={16} color={colors.info} />}
          />
          <StatCard
            title="Overdue Actions"
            value={overdueActions}
            icon={<AlertTriangle size={16} color={overdueActions > 0 ? colors.destructive : colors.info} />}
          />
          <StatCard
            title="AI Credits"
            value="750"
            icon={<CreditCard size={16} color={colors.info} />}
          />
        </View>

        {/* Top Actions */}
        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-center mb-2">
            <Clock size={20} color={colors.primary} />
            <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>Today's Actions</Text>
          </View>
          <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
            Top deals requiring your attention
          </Text>

          {dealsLoading ? (
            <View className="py-8 items-center">
              <Text style={{ color: colors.mutedForeground }}>Loading deals...</Text>
            </View>
          ) : actionDeals.length === 0 ? (
            <View className="py-8 items-center">
              <CheckCircle size={32} color={colors.success} />
              <Text className="font-medium mt-2" style={{ color: colors.foreground }}>All caught up!</Text>
              <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>No pending actions</Text>
            </View>
          ) : (
            actionDeals.map((deal) => {
              const nextAction = calculateNextAction(deal);
              const stageConfig = DEAL_STAGE_CONFIG[deal.stage];
              const address = getDealAddress(deal);
              const sellerName = getDealLeadName(deal);

              return (
                <TouchableOpacity
                  key={deal.id}
                  className="rounded-lg p-3 mb-2"
                  style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
                  onPress={() => router.push(`/(tabs)/deals/${deal.id}`)}
                  accessibilityLabel={`${nextAction.priority} priority: ${nextAction.action} for ${address}`}
                  accessibilityRole="button"
                  accessibilityHint="Opens deal cockpit"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-start flex-1">
                      <View className="px-2 py-1 rounded mr-3" style={{ backgroundColor: getPriorityColorValue(nextAction.priority, colors) }}>
                        <ActionIcon category={nextAction.category} color={colors.primaryForeground} size={14} />
                      </View>
                      <View className="flex-1">
                        <Text className="text-sm font-medium" style={{ color: colors.foreground }} numberOfLines={2}>
                          {nextAction.action}
                        </Text>
                        <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }} numberOfLines={1}>
                          {address || 'No address'} {sellerName ? `• ${sellerName}` : ''}
                        </Text>
                        <View className="flex-row items-center mt-1">
                          <View
                            className="px-2 py-0.5 rounded"
                            style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
                          >
                            <Text style={{ color: colors.primary }} className="text-xs">
                              {stageConfig.label}
                            </Text>
                          </View>
                          {nextAction.isOverdue && (
                            <Text className="text-xs ml-2" style={{ color: colors.destructive }}>Overdue</Text>
                          )}
                        </View>
                      </View>
                    </View>
                    <ArrowRight size={16} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              );
            })
          )}

          <TouchableOpacity
            className="flex-row items-center justify-center mt-3 py-2"
            onPress={() => router.push('/(tabs)/deals')}
            accessibilityLabel="View all deals"
            accessibilityRole="button"
          >
            <Text className="text-sm mr-1" style={{ color: colors.primary }}>View All Deals</Text>
            <ArrowRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="rounded-xl p-4" style={{ backgroundColor: colors.card }}>
          <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 rounded-lg p-4 items-center"
              style={{ backgroundColor: colors.primary }}
              onPress={() => router.push('/(tabs)/deals')}
              accessibilityLabel="View all deals"
              accessibilityRole="button"
            >
              <Briefcase size={24} color={colors.primaryForeground} />
              <Text className="font-medium mt-2" style={{ color: colors.primaryForeground }}>All Deals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 rounded-lg p-4 items-center"
              style={{ backgroundColor: colors.secondary }}
              onPress={() => router.push('/(tabs)/leads/add')}
              accessibilityLabel="Add new lead"
              accessibilityRole="button"
            >
              <Phone size={24} color={colors.secondaryForeground} />
              <Text className="font-medium mt-2" style={{ color: colors.secondaryForeground }}>Add Lead</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Bottom padding for FAB */}
        <View className="h-20" />
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <QuickActionFAB
        onAddLead={handleAddLead}
        onAddProperty={handleAddProperty}
        onStartChat={handleStartChat}
      />
    </ThemedSafeAreaView>
  );
}

export default DashboardScreen;

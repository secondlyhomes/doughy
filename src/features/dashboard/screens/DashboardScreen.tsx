// Dashboard Screen - React Native (Inbox/Today)
// Shows top deal actions and quick stats

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
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
import { Card, CardContent, CardHeader, CardTitle, Badge, Progress, ScreenHeader } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
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
    isPositive?: boolean; // Whether this trend is good (green) or bad (red), defaults to direction=up being positive
  };
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  const colors = useThemeColors();
  return (
    <View className="rounded-xl p-4 flex-1 min-w-[45%]" style={{ backgroundColor: colors.card }}>
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-muted-foreground">{title}</Text>
        {icon}
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      {trend && (
        <View className="flex-row items-center mt-1">
          {/* Determine if trend is positive - default to direction=up being positive */}
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

/**
 * Get the icon component for an action category
 */
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

/**
 * Get priority badge color
 */
function getPriorityColor(priority: 'high' | 'medium' | 'low'): string {
  switch (priority) {
    case 'high':
      return 'bg-destructive';
    case 'medium':
      return 'bg-warning';
    case 'low':
      return 'bg-info';
    default:
      return 'bg-muted';
  }
}

export function DashboardScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  // Fetch deals with actions
  const { deals: actionDeals, isLoading: dealsLoading, refetch: refetchDeals } = useDealsWithActions(5);
  const { deals: allDeals } = useDeals({ activeOnly: true });

  // Calculate stats from real deal data
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
    // Navigate to Leads tab, then to AddLead screen
    router.push('/(tabs)/leads/add');
  };

  const handleAddProperty = () => {
    // Navigate to Properties tab
    router.push('/(tabs)/properties');
  };

  const handleStartChat = () => {
    // Navigate to the assistant modal
    router.push('/assistant');
  };

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View className="p-4">
          {/* Header */}
        <ScreenHeader title="Inbox" subtitle="Your deals at a glance" className="px-0 pt-0" />

        {/* Alert Banner - show only if there are overdue actions */}
        {showAlert && overdueActions > 0 && (
          <View className="border-l-4 border-l-warning rounded-lg p-4 mb-4" style={{ backgroundColor: colors.card }}>
            <View className="flex-row items-start">
              <View className="bg-warning/20 rounded-full p-2 mr-3">
                <AlertTriangle size={20} color={colors.warning} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">Overdue Actions</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  {overdueActions} deal{overdueActions !== 1 ? 's' : ''} {overdueActions !== 1 ? 'have' : 'has'} overdue actions that need attention
                </Text>
                <View className="flex-row mt-3 gap-2">
                  <TouchableOpacity
                    className="border border-border rounded-md px-3 py-2"
                    onPress={() => router.push('/(tabs)/deals')}
                    accessibilityLabel="View deals requiring attention"
                    accessibilityRole="button"
                  >
                    <Text className="text-sm text-foreground">View Deals</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="px-3 py-2"
                    onPress={() => setShowAlert(false)}
                    accessibilityLabel="Dismiss alert"
                    accessibilityRole="button"
                  >
                    <Text className="text-sm text-muted-foreground">Dismiss</Text>
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

        {/* Top Actions - Deals requiring attention */}
        <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card }}>
          <View className="flex-row items-center mb-2">
            <Clock size={20} color={colors.primary} />
            <Text className="text-lg font-semibold text-foreground ml-2">Today's Actions</Text>
          </View>
          <Text className="text-sm text-muted-foreground mb-4">
            Top deals requiring your attention
          </Text>

          {dealsLoading ? (
            <View className="py-8 items-center">
              <Text className="text-muted-foreground">Loading deals...</Text>
            </View>
          ) : actionDeals.length === 0 ? (
            <View className="py-8 items-center">
              <CheckCircle size={32} color={colors.success} />
              <Text className="text-foreground font-medium mt-2">All caught up!</Text>
              <Text className="text-muted-foreground text-sm mt-1">No pending actions</Text>
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
                  className="bg-primary/10 rounded-lg p-3 mb-2"
                  onPress={() => router.push(`/(tabs)/deals/${deal.id}`)}
                  accessibilityLabel={`${nextAction.priority} priority: ${nextAction.action} for ${address}`}
                  accessibilityRole="button"
                  accessibilityHint="Opens deal cockpit"
                >
                  <View className="flex-row items-start justify-between">
                    <View className="flex-row items-start flex-1">
                      {/* Priority badge */}
                      <View className={`${getPriorityColor(nextAction.priority)} px-2 py-1 rounded mr-3`}>
                        <ActionIcon category={nextAction.category} color="white" size={14} />
                      </View>
                      <View className="flex-1">
                        {/* Action text */}
                        <Text className="text-sm font-medium text-foreground" numberOfLines={2}>
                          {nextAction.action}
                        </Text>
                        {/* Deal info */}
                        <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                          {address || 'No address'} {sellerName ? `• ${sellerName}` : ''}
                        </Text>
                        {/* Stage badge */}
                        <View className="flex-row items-center mt-1">
                          <View
                            className="px-2 py-0.5 rounded"
                            style={{ backgroundColor: `${colors.primary}20` }}
                          >
                            <Text style={{ color: colors.primary }} className="text-xs">
                              {stageConfig.label}
                            </Text>
                          </View>
                          {nextAction.isOverdue && (
                            <Text className="text-xs text-destructive ml-2">Overdue</Text>
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
            <Text className="text-sm text-primary mr-1">View All Deals</Text>
            <ArrowRight size={14} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="rounded-xl p-4" style={{ backgroundColor: colors.card }}>
          <Text className="text-lg font-semibold text-foreground mb-4">Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary rounded-lg p-4 items-center"
              onPress={() => router.push('/(tabs)/deals')}
              accessibilityLabel="View all deals"
              accessibilityRole="button"
            >
              <Briefcase size={24} color={colors.primaryForeground} />
              <Text className="text-primary-foreground font-medium mt-2">All Deals</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-secondary rounded-lg p-4 items-center"
              onPress={() => router.push('/(tabs)/leads/add')}
              accessibilityLabel="Add new lead"
              accessibilityRole="button"
            >
              <Phone size={24} color={colors.secondaryForeground} />
              <Text className="text-secondary-foreground font-medium mt-2">Add Lead</Text>
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

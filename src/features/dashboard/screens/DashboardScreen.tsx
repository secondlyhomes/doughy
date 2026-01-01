// Dashboard Screen - React Native
// Converted from web app src/features/dashboard/pages/DashboardOverview.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  TrendingUp,
  Clock,
  CreditCard,
  Users,
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  ArrowRight,
  X
} from 'lucide-react-native';

// Zone A UI Components
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Badge } from '@/components/ui';
import { Progress } from '@/components/ui';

import { RootStackParamList } from '@/types';

type DashboardNavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
}

function StatCard({ title, value, icon, trend }: StatCardProps) {
  return (
    <View className="bg-card rounded-xl p-4 flex-1 min-w-[45%]">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-sm text-muted-foreground">{title}</Text>
        {icon}
      </View>
      <Text className="text-2xl font-bold text-foreground">{value}</Text>
      {trend && (
        <View className="flex-row items-center mt-1">
          {trend.direction === 'up' ? (
            <ArrowUp size={12} color="#22c55e" />
          ) : (
            <ArrowDown size={12} color="#22c55e" />
          )}
          <Text className="text-xs text-green-500 ml-1">{trend.value}</Text>
        </View>
      )}
    </View>
  );
}

interface PriorityLead {
  name: string;
  company: string;
  status: 'Hot' | 'Warm' | 'Cold';
  lastContact: string;
  value: string;
}

export function DashboardScreen() {
  const navigation = useNavigation<DashboardNavigationProp>();
  const [refreshing, setRefreshing] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  // Mock data - will be replaced with real data from Supabase
  const conversionRate = 24.8;
  const responseTime = 2.4;
  const activeLeads = 56;

  const priorityLeads: PriorityLead[] = [
    { name: 'Sarah Johnson', company: 'Acme Corp', status: 'Hot', lastContact: '3 days ago', value: '$15,000' },
    { name: 'Michael Brown', company: 'Tech Solutions', status: 'Hot', lastContact: '2 days ago', value: '$8,750' },
    { name: 'Emily Davis', company: 'Global Industries', status: 'Warm', lastContact: '4 days ago', value: '$12,000' },
  ];

  const onRefresh = async () => {
    setRefreshing(true);
    // TODO: Fetch fresh data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Hot': return 'bg-red-500';
      case 'Warm': return 'bg-amber-500';
      case 'Cold': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-background"
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View className="p-4">
        {/* Header */}
        <View className="mb-4">
          <Text className="text-2xl font-bold text-foreground">Dashboard</Text>
          <Text className="text-muted-foreground">Your business at a glance</Text>
        </View>

        {/* Alert Banner */}
        {showAlert && (
          <View className="bg-card border-l-4 border-l-amber-500 rounded-lg p-4 mb-4">
            <View className="flex-row items-start">
              <View className="bg-amber-500/20 rounded-full p-2 mr-3">
                <AlertTriangle size={20} color="#f59e0b" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-foreground">Response Time Alert</Text>
                <Text className="text-sm text-muted-foreground mt-1">
                  3 high-value leads have been waiting over 24 hours for a response
                </Text>
                <View className="flex-row mt-3 gap-2">
                  <TouchableOpacity
                    className="border border-border rounded-md px-3 py-2"
                    onPress={() => navigation.navigate('Leads' as any)}
                  >
                    <Text className="text-sm text-foreground">View Leads</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    className="px-3 py-2"
                    onPress={() => setShowAlert(false)}
                  >
                    <Text className="text-sm text-muted-foreground">Dismiss</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <TouchableOpacity onPress={() => setShowAlert(false)}>
                <X size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Stats Grid */}
        <View className="flex-row flex-wrap gap-3 mb-6">
          <StatCard
            title="Conversion Rate"
            value={`${conversionRate}%`}
            icon={<TrendingUp size={16} color="#3b82f6" />}
            trend={{ direction: 'up', value: '+2.3% from last month' }}
          />
          <StatCard
            title="Avg. Response Time"
            value={`${responseTime}h`}
            icon={<Clock size={16} color="#3b82f6" />}
            trend={{ direction: 'down', value: '-18% from last week' }}
          />
          <StatCard
            title="Credits Used"
            value="750"
            icon={<CreditCard size={16} color="#3b82f6" />}
          />
          <StatCard
            title="Active Leads"
            value={activeLeads}
            icon={<Users size={16} color="#3b82f6" />}
          />
        </View>

        {/* Priority Leads */}
        <View className="bg-card rounded-xl p-4 mb-4">
          <View className="flex-row items-center mb-2">
            <AlertTriangle size={20} color="#3b82f6" />
            <Text className="text-lg font-semibold text-foreground ml-2">Priority Leads</Text>
          </View>
          <Text className="text-sm text-muted-foreground mb-4">
            Leads that need immediate action
          </Text>

          {priorityLeads.map((lead, index) => (
            <TouchableOpacity
              key={index}
              className="bg-primary/10 rounded-lg p-3 mb-2"
              onPress={() => navigation.navigate('LeadDetail', { id: String(index + 1) })}
            >
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className={`${getStatusColor(lead.status)} px-2 py-1 rounded mr-3`}>
                    <Text className="text-white text-xs font-medium">{lead.status}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{lead.name}</Text>
                    <Text className="text-xs text-muted-foreground">
                      {lead.company} • {lead.value}
                    </Text>
                  </View>
                </View>
                <View className="items-end">
                  <Text className="text-xs text-muted-foreground">Last: {lead.lastContact}</Text>
                  <ArrowRight size={16} color="#6b7280" />
                </View>
              </View>
            </TouchableOpacity>
          ))}

          <TouchableOpacity
            className="flex-row items-center justify-center mt-3 py-2"
            onPress={() => navigation.navigate('Leads' as any)}
          >
            <Text className="text-sm text-primary mr-1">View All Leads</Text>
            <ArrowRight size={14} color="#3b82f6" />
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View className="bg-card rounded-xl p-4">
          <Text className="text-lg font-semibold text-foreground mb-4">Quick Actions</Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary rounded-lg p-4 items-center"
              onPress={() => navigation.navigate('AddLead')}
            >
              <Users size={24} color="white" />
              <Text className="text-white font-medium mt-2">Add Lead</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-secondary rounded-lg p-4 items-center"
              onPress={() => navigation.navigate('Assistant')}
            >
              <TrendingUp size={24} color="#1f2937" />
              <Text className="text-secondary-foreground font-medium mt-2">AI Assistant</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

export default DashboardScreen;

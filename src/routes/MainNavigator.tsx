// src/routes/MainNavigator.tsx
// Main app tab navigator - Zone D implementation
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Platform } from 'react-native';
import { Home, Building, Users, MessageCircle, Settings } from 'lucide-react-native';
import { MainTabParamList } from './types';

// Zone D: Dashboard (COMPLETE)
import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen';
// Zone C: Properties (COMPLETE)
import { RealEstateNavigator } from '@/features/real-estate';
// Zone D: Leads (COMPLETE)
import { LeadsNavigator } from './LeadsNavigator';
// Zone D: Conversations/Assistant (COMPLETE)
import { ConversationsNavigator } from './ConversationsNavigator';
// Zone B: Settings Navigator (COMPLETE)
import { SettingsNavigator } from './SettingsNavigator';
// Zone D: Badge support
import { useUnreadCounts, formatBadgeCount } from '@/features/layout';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Theme colors
const PRIMARY_COLOR = '#2563eb';
const MUTED_COLOR = '#64748b';

export function MainNavigator() {
  const { counts } = useUnreadCounts();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: PRIMARY_COLOR,
        tabBarInactiveTintColor: MUTED_COLOR,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarBadgeStyle: {
          backgroundColor: '#ef4444',
          fontSize: 10,
          fontWeight: '600',
          minWidth: 18,
          height: 18,
          borderRadius: 9,
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Properties"
        component={RealEstateNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Building size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadsNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          tabBarBadge: formatBadgeCount(counts.leads),
        }}
      />
      <Tab.Screen
        name="Conversations"
        component={ConversationsNavigator}
        options={{
          headerShown: false,
          title: 'AI Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: formatBadgeCount(counts.conversations),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsNavigator}
        options={{
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

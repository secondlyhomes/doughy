// Bottom Tab Navigation - React Native
// Converted from web app sidebar navigation to mobile bottom tabs

import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import {
  Home,
  Users,
  Building,
  MessageCircle,
  Settings
} from 'lucide-react-native';

// Import screens
import { DashboardScreen } from '@/features/dashboard/screens/DashboardScreen';
import { LeadsListScreen } from '@/features/leads/screens/LeadsListScreen';
import { AssistantScreen } from '@/features/assistant/screens/AssistantScreen';
// Zone C: Real Estate
import { RealEstateNavigator } from '@/features/real-estate';
// Zone B: Settings (COMPLETE)
import { SettingsScreen } from '@/features/settings/screens/SettingsScreen';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e5e7eb',
          paddingBottom: 4,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
          headerShown: false,
        }}
      />
      <Tab.Screen
        name="Leads"
        component={LeadsListScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
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
        name="Assistant"
        component={AssistantScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          title: 'AI Chat',
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default MainTabs;

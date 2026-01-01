// src/routes/MainNavigator.tsx
// Main app tab navigator
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Platform } from 'react-native';
import { Home, Building, Users, MessageCircle, Settings } from 'lucide-react-native';
import { MainTabParamList } from './types';

// TODO: Import actual screens from features when converted
// Zone D: Dashboard
// Zone C: Properties
import { RealEstateNavigator } from '@/features/real-estate';
// Zone D: Leads
// Zone D: Conversations
// Zone B: Settings

// Placeholder screens
const DashboardScreen = () => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-xl font-bold text-foreground">Dashboard</Text>
    <Text className="text-muted-foreground">TODO: Zone D - Implement dashboard</Text>
  </View>
);

// PropertiesScreen now uses RealEstateNavigator (Zone C complete)

const LeadsScreen = () => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-xl font-bold text-foreground">Leads</Text>
    <Text className="text-muted-foreground">TODO: Zone D - Implement leads</Text>
  </View>
);

const ConversationsScreen = () => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-xl font-bold text-foreground">Conversations</Text>
    <Text className="text-muted-foreground">TODO: Zone D - Implement conversations</Text>
  </View>
);

const SettingsScreen = () => (
  <View className="flex-1 items-center justify-center bg-background">
    <Text className="text-xl font-bold text-foreground">Settings</Text>
    <Text className="text-muted-foreground">TODO: Zone B - Implement settings</Text>
  </View>
);

const Tab = createBottomTabNavigator<MainTabParamList>();

// Theme colors
const PRIMARY_COLOR = '#2563eb';
const MUTED_COLOR = '#64748b';

export function MainNavigator() {
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
        component={LeadsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={{
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
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

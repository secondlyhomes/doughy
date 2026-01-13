// app/(tabs)/_layout.tsx
// Bottom tab navigator layout
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { Home, Building, Users, MessageCircle, Settings } from 'lucide-react-native';
import { useUnreadCounts, formatBadgeCount } from '@/features/layout';
import { useThemeColors } from '@/context/ThemeContext';

export default function TabLayout() {
  const { counts } = useUnreadCounts();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        tabBarStyle: {
          backgroundColor: colors.card,
          borderTopColor: colors.border,
          paddingBottom: Platform.OS === 'ios' ? 20 : 8,
          paddingTop: 8,
          height: Platform.OS === 'ios' ? 80 : 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        tabBarBadgeStyle: {
          backgroundColor: colors.destructive,
          fontSize: 10,
          fontWeight: '600',
          minWidth: 18,
          height: 18,
          borderRadius: 9,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: 'Properties',
          tabBarIcon: ({ color, size }) => <Building size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
          tabBarBadge: formatBadgeCount(counts.leads),
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'AI Chat',
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
          tabBarBadge: formatBadgeCount(counts.conversations),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

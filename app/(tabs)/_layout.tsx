// app/(tabs)/_layout.tsx
// Bottom tab navigator layout with floating glass tab bar
import { Tabs } from 'expo-router';
import { Home, Building, Users, MessageCircle, Settings } from 'lucide-react-native';
import { useUnreadCounts, formatBadgeCount } from '@/features/layout';
import { useThemeColors } from '@/context/ThemeContext';
import { FloatingGlassTabBar } from '@/components/ui/FloatingGlassTabBar';

export default function TabLayout() {
  const { counts } = useUnreadCounts();
  const colors = useThemeColors();

  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
      sceneContainerStyle={{
        // Add bottom padding so content doesn't hide behind floating tab bar
        paddingBottom: 72,
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

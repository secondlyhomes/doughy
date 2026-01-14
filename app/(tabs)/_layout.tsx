// app/(tabs)/_layout.tsx
// Bottom tab navigator layout with floating glass tab bar
// MVP Deal OS: Inbox → Deals → Properties → Settings
import { Tabs } from 'expo-router';
import { Inbox, Briefcase, Building, Users, MessageCircle, Settings } from 'lucide-react-native';
import { useUnreadCounts, formatBadgeCount } from '@/features/layout';
import { useThemeColors } from '@/context/ThemeContext';
import { FloatingGlassTabBar, TAB_BAR_SAFE_PADDING } from '@/components/ui/FloatingGlassTabBar';

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
        paddingBottom: TAB_BAR_SAFE_PADDING,
      }}
    >
      {/* MVP Tab Order: Inbox → Deals → Properties → Settings */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inbox',
          tabBarIcon: ({ color, size }) => <Inbox size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="deals"
        options={{
          title: 'Deals',
          tabBarIcon: ({ color, size }) => <Briefcase size={size} color={color} />,
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
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Settings size={size} color={color} />,
        }}
      />
      {/* Hidden tabs - still accessible via navigation but not in tab bar */}
      <Tabs.Screen
        name="leads"
        options={{
          title: 'Leads',
          href: null, // Hide from tab bar (FloatingGlassTabBar filters by href)
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="conversations"
        options={{
          title: 'AI Chat',
          href: null, // Hide from tab bar (FloatingGlassTabBar filters by href)
          tabBarIcon: ({ color, size }) => <MessageCircle size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

// app/(admin)/_layout.tsx
// Admin console with bottom tab navigation using floating liquid glass tab bar
import { Tabs, Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { Home, Users, FileText, Link } from 'lucide-react-native';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useThemeColors } from '@/context/ThemeContext';
import { FloatingGlassTabBar } from '@/components/ui/FloatingGlassTabBar';

export default function AdminLayout() {
  const { isLoading } = useAuth();
  const { canViewAdminPanel } = usePermissions();
  const colors = useThemeColors();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.info} />
      </View>
    );
  }

  // Redirect to main app if user doesn't have admin access
  if (!canViewAdminPanel) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Tabs
      tabBar={(props) => <FloatingGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
      }}
      sceneContainerStyle={{
        paddingBottom: 72, // Space for floating tab bar
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
        name="users"
        options={{
          title: 'Users',
          tabBarIcon: ({ color, size }) => <Users size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ color, size }) => <FileText size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="integrations"
        options={{
          title: 'Integrations',
          tabBarIcon: ({ color, size }) => <Link size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}

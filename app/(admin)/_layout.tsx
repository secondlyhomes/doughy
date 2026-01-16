// app/(admin)/_layout.tsx
// Admin console with NATIVE iOS liquid glass tab bar
// Uses native UITabBarController on iOS for automatic liquid glass appearance
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, DynamicColorIOS } from 'react-native';
import { NativeTabs, Icon, Label } from 'expo-router/unstable-native-tabs';
import { usePermissions } from '@/features/auth/hooks/usePermissions';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useTheme, useThemeColors } from '@/context/ThemeContext';

export default function AdminLayout() {
  const { isLoading } = useAuth();
  const { canViewAdminPanel } = usePermissions();
  const { isDark } = useTheme();
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
    <NativeTabs
      backgroundColor="transparent"
      blurEffect={isDark ? "systemUltraThinMaterialDark" : "systemUltraThinMaterialLight"}
      tintColor={DynamicColorIOS({
        light: '#4d7c5f',
        dark: '#6b9b7e',
      })}
      shadowColor="transparent"
    >
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="users">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Users</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="logs">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Logs</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="integrations">
        <Icon sf={{ default: 'link', selected: 'link.circle.fill' }} />
        <Label>Integrations</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

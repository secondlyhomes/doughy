// app/(tabs)/_layout.tsx
// Bottom tab navigator layout with NATIVE iOS liquid glass tab bar
// Uses native UITabBarController on iOS for automatic liquid glass appearance
import { View, ActivityIndicator, DynamicColorIOS } from 'react-native';
import { Redirect } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useUnreadCounts } from '@/features/layout';
import { useTheme, useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { counts } = useUnreadCounts();
  const { isDark } = useTheme();
  const colors = useThemeColors();

  // Auth guard - show loading while checking auth
  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // Redirect to sign-in if not authenticated
  if (!isAuthenticated) {
    return <Redirect href="/(auth)/sign-in" />;
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
      {/* MVP Tab Order: Inbox → Deals → Properties → Settings */}
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: 'tray', selected: 'tray.fill' }} />
        <Label>Inbox</Label>
        {counts.leads > 0 && <Badge value={String(counts.leads)} />}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="deals">
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Deals</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="properties">
        <Icon sf={{ default: 'building.2', selected: 'building.2.fill' }} />
        <Label>Properties</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>

      {/* Hidden tabs - still accessible via navigation but not in tab bar */}
      <NativeTabs.Trigger name="leads" hidden />
      <NativeTabs.Trigger name="conversations" hidden />
    </NativeTabs>
  );
}

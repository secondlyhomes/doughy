// app/(tabs)/_layout.tsx
// Bottom tab navigator layout with NATIVE iOS liquid glass tab bar
// Uses native UITabBarController on iOS for automatic liquid glass appearance
// Supports platform switching between RE Investor and Landlord modes
import { View, ActivityIndicator, DynamicColorIOS } from 'react-native';
import { Redirect } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useUnreadCounts } from '@/features/layout';
import { useTheme, useThemeColors } from '@/context/ThemeContext';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { usePlatform } from '@/contexts/PlatformContext';

export default function TabLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { counts } = useUnreadCounts();
  const { isDark } = useTheme();
  const colors = useThemeColors();
  const { activePlatform } = usePlatform();

  const isLandlord = activePlatform === 'landlord';

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
      {/* ========== RE INVESTOR TABS ========== */}
      {/* Tab Order: Focus → Leads → Deals → Portfolio → Settings */}
      <NativeTabs.Trigger name="index" hidden={isLandlord}>
        <Icon sf={{ default: 'scope', selected: 'scope' }} />
        <Label>Focus</Label>
        {counts.captureItems > 0 && <Badge>{String(counts.captureItems)}</Badge>}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="leads" hidden={isLandlord}>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Leads</Label>
        {counts.leads > 0 && <Badge>{String(counts.leads)}</Badge>}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="deals" hidden={isLandlord}>
        <Icon sf={{ default: 'doc.text', selected: 'doc.text.fill' }} />
        <Label>Deals</Label>
        {counts.overdueDeals > 0 && <Badge>{String(counts.overdueDeals)}</Badge>}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="portfolio" hidden={isLandlord}>
        <Icon sf={{ default: 'briefcase', selected: 'briefcase.fill' }} />
        <Label>Portfolio</Label>
      </NativeTabs.Trigger>

      {/* ========== LANDLORD TABS ========== */}
      {/* Tab Order: Inbox → Properties → Bookings → Contacts → Settings */}
      <NativeTabs.Trigger name="inbox" hidden={!isLandlord}>
        <Icon sf={{ default: 'tray', selected: 'tray.fill' }} />
        <Label>Inbox</Label>
        {/* TODO: Add unread message count badge */}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="rental-properties" hidden={!isLandlord}>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Properties</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bookings" hidden={!isLandlord}>
        <Icon sf={{ default: 'calendar', selected: 'calendar' }} />
        <Label>Bookings</Label>
        {/* TODO: Add upcoming check-in badge */}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="contacts" hidden={!isLandlord}>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Contacts</Label>
      </NativeTabs.Trigger>

      {/* ========== SHARED TABS ========== */}
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>

      {/* Hidden tabs - accessible via navigation but not in tab bar */}
      <NativeTabs.Trigger name="properties" hidden />
      <NativeTabs.Trigger name="conversations" hidden />
    </NativeTabs>
  );
}

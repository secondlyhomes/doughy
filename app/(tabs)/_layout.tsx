// app/(tabs)/_layout.tsx
// Bottom tab navigator layout with NATIVE iOS liquid glass tab bar
// Uses native UITabBarController on iOS for automatic liquid glass appearance
// Supports platform switching between RE Investor and Landlord modes
//
// Tab Design (4 tabs per platform):
// - Investor: Inbox → Pipeline → Contacts → Settings
// - Landlord: Inbox → Properties → Contacts → Settings
import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { NativeTabs, Icon, Label, Badge } from 'expo-router/unstable-native-tabs';
import { useUnreadCounts } from '@/features/layout';
import { useTheme, useThemeColors } from '@/contexts/ThemeContext';
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
    <View style={{ flex: 1, backgroundColor: colors.background }}>
    <NativeTabs
      backgroundColor="transparent"
      blurEffect={isDark ? "systemUltraThinMaterialDark" : "systemUltraThinMaterialLight"}
      tintColor={colors.primary}
      shadowColor="transparent"
      disableTransparentOnScrollEdge
    >
      {/* ========== RE INVESTOR TABS (4 tabs) ========== */}
      {/* Tab Order: Inbox → Pipeline → Contacts → Settings */}
      <NativeTabs.Trigger name="investor-inbox" hidden={isLandlord}>
        <Icon sf={{ default: 'tray', selected: 'tray.fill' }} />
        <Label>Inbox</Label>
        {counts.investorInbox > 0 && (
          <Badge>{String(counts.investorInbox)}</Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="pipeline" hidden={isLandlord}>
        <Icon sf={{ default: 'chart.line.uptrend.xyaxis', selected: 'chart.line.uptrend.xyaxis' }} />
        <Label>Pipeline</Label>
        {(counts.leads > 0 || counts.overdueDeals > 0) && (
          <Badge>{String(counts.leads + counts.overdueDeals)}</Badge>
        )}
      </NativeTabs.Trigger>

      {/* ========== LANDLORD TABS (4 tabs) ========== */}
      {/* Tab Order: Inbox → Properties → Contacts → Settings */}
      <NativeTabs.Trigger name="landlord-inbox" hidden={!isLandlord}>
        <Icon sf={{ default: 'tray', selected: 'tray.fill' }} />
        <Label>Inbox</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="rental-properties" hidden={!isLandlord}>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Properties</Label>
      </NativeTabs.Trigger>

      {/* ========== SHARED TABS ========== */}
      <NativeTabs.Trigger name="contacts">
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Contacts</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>

      {/* ========== HIDDEN TABS (accessible via navigation but not in tab bar) ========== */}
      {/* Old investor tabs - now consolidated into Pipeline */}
      <NativeTabs.Trigger name="leads" hidden />
      <NativeTabs.Trigger name="deals" hidden />
      <NativeTabs.Trigger name="portfolio" hidden />

      {/* Old landlord tabs - Bookings moved to Properties */}
      <NativeTabs.Trigger name="bookings" hidden />

      {/* Other hidden tabs */}
      <NativeTabs.Trigger name="properties" hidden />
    </NativeTabs>
    </View>
  );
}

// app/(tabs)/_layout.tsx
// Bottom tab navigator layout with NATIVE iOS liquid glass tab bar
// Uses native UITabBarController on iOS for automatic liquid glass appearance
// Supports platform switching between RE Investor and Landlord modes
//
// Tab Design (4 tabs per platform):
// - Investor: Leads → Properties → Deals → Settings
// - Landlord: People → Properties → Bookings → Settings
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
      {/* Tab Order: Leads → Properties → Deals → Settings */}
      <NativeTabs.Trigger name="leads" hidden={isLandlord}>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>Leads</Label>
        {counts.leads > 0 && (
          <Badge>{String(counts.leads)}</Badge>
        )}
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="properties" hidden={isLandlord}>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Properties</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="deals" hidden={isLandlord}>
        <Icon sf={{ default: 'handshake', selected: 'handshake.fill' }} />
        <Label>Deals</Label>
        {counts.overdueDeals > 0 && (
          <Badge>{String(counts.overdueDeals)}</Badge>
        )}
      </NativeTabs.Trigger>

      {/* ========== LANDLORD TABS (4 tabs) ========== */}
      {/* Tab Order: People → Properties → Bookings → Settings */}
      <NativeTabs.Trigger name="contacts" hidden={!isLandlord}>
        <Icon sf={{ default: 'person.2', selected: 'person.2.fill' }} />
        <Label>People</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="rental-properties" hidden={!isLandlord}>
        <Icon sf={{ default: 'house', selected: 'house.fill' }} />
        <Label>Properties</Label>
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="bookings" hidden={!isLandlord}>
        <Icon sf={{ default: 'calendar', selected: 'calendar' }} />
        <Label>Bookings</Label>
      </NativeTabs.Trigger>

      {/* ========== SHARED TABS ========== */}
      <NativeTabs.Trigger name="settings">
        <Icon sf={{ default: 'gearshape', selected: 'gearshape.fill' }} />
        <Label>Settings</Label>
      </NativeTabs.Trigger>

      {/* ========== HIDDEN TABS (accessible via navigation but not in tab bar) ========== */}
      {/* Inbox tabs - moved to CallPilot, keep routes for deep links */}
      <NativeTabs.Trigger name="investor-inbox" hidden />
      <NativeTabs.Trigger name="landlord-inbox" hidden />

      {/* Pipeline - now split into Leads/Properties/Deals */}
      <NativeTabs.Trigger name="pipeline" hidden />
      <NativeTabs.Trigger name="portfolio" hidden />
      <NativeTabs.Trigger name="campaigns" hidden />

      {/* Other hidden tabs */}
      <NativeTabs.Trigger name="conversations" hidden />
    </NativeTabs>
    </View>
  );
}

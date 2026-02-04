/**
 * PropertyDetailScreen
 *
 * Detailed view of a single property with tabbed navigation for different sections:
 * Overview, Analysis, Comps, Financing, Repairs, and Documents.
 *
 * Uses native Stack.Screen header for consistent iOS styling (matches RentalPropertyDetailScreen).
 */

import React, { useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  Alert,
  Pressable,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams, usePathname, Stack } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Edit2, ArrowLeft, MoreVertical } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner, SimpleFAB, BottomSheet } from '@/components/ui';
import { FAB_BOTTOM_OFFSET, FAB_SIZE } from '@/components/ui/FloatingGlassTabBar';
import { SPACING, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import {
  PropertyHeader,
  PropertyOverviewTab,
  PropertyAnalysisTab,
  PropertyCompsTab,
  PropertyFinancingTab,
  PropertyRepairsTab,
  PropertyDocsTab,
  PropertyActionsSheet,
} from '../components';
import { useProperty, usePropertyMutations } from '../hooks/useProperties';
import { usePropertyDeals } from '@/features/deals/hooks/usePropertyDeals';

const TAB_IDS = {
  OVERVIEW: 'overview',
  ANALYSIS: 'analysis',
  COMPS: 'comps',
  FINANCING: 'financing',
  REPAIRS: 'repairs',
  DOCS: 'docs',
} as const;

export function PropertyDetailScreen() {
  const router = useRouter();
  const pathname = usePathname();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;
  const initialTab = params.initialTab as string | undefined;

  const { property, isLoading, error, refetch } = useProperty(propertyId);
  const { deleteProperty } = usePropertyMutations();

  // Fetch deals linked to this property for deal selector
  const { data: propertyDeals = [] } = usePropertyDeals(propertyId);

  const [activeTab, setActiveTab] = useState<string>(initialTab || TAB_IDS.OVERVIEW);
  const [showActionsSheet, setShowActionsSheet] = useState(false);
  const [showDealSelector, setShowDealSelector] = useState(false);

  // Safe back navigation with fallback for deep-linking scenarios
  const handleBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/properties');
    }
  }, [router]);

  const handleEdit = useCallback(() => {
    // Navigate within the same tab stack (NativeTabs can't navigate to hidden tabs)
    if (pathname.includes('/leads/')) {
      router.push(`/(tabs)/leads/property/edit/${propertyId}`);
    } else if (pathname.includes('/deals/')) {
      router.push(`/(tabs)/deals/property/edit/${propertyId}`);
    } else {
      // Default: within properties tab (or direct access)
      router.push(`/(tabs)/properties/edit/${propertyId}`);
    }
  }, [router, propertyId, pathname]);

  const handleDelete = useCallback(() => {
    Alert.alert(
      'Delete Property',
      'Are you sure you want to delete this property? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteProperty(propertyId);
            if (success) {
              router.back();
            } else {
              Alert.alert('Error', 'Failed to delete property. Please try again.');
            }
          },
        },
      ]
    );
  }, [deleteProperty, propertyId, router]);

  const handleStatusChange = useCallback(() => {
    refetch();
  }, [refetch]);

  // Handle deal selection from the selector sheet
  const handleDealSelected = useCallback((dealId: string) => {
    setShowDealSelector(false);
    router.push({
      pathname: `/(tabs)/deals/${dealId}` as any,
      params: { fromProperty: propertyId },
    });
  }, [router, propertyId]);

  // Native header options for consistent iOS styling (matches RentalPropertyDetailScreen)
  const headerOptions = useMemo((): NativeStackNavigationOptions => ({
    headerShown: true,
    headerStyle: { backgroundColor: colors.background },
    headerShadowVisible: false,
    headerStatusBarHeight: insets.top,
    headerTitle: () => (
      <View style={{ alignItems: 'center' }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {property?.address || 'Property Details'}
        </Text>
      </View>
    ),
    headerLeft: () => (
      <TouchableOpacity onPress={handleBack} style={{ padding: SPACING.sm }}>
        <ArrowLeft size={ICON_SIZES.xl} color={colors.foreground} />
      </TouchableOpacity>
    ),
    headerRight: property
      ? () => (
          <TouchableOpacity onPress={() => setShowActionsSheet(true)} style={{ padding: SPACING.sm }}>
            <MoreVertical size={ICON_SIZES.xl} color={colors.foreground} />
          </TouchableOpacity>
        )
      : undefined,
  }), [colors, insets.top, property, handleBack]);

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading property..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  if (error || !property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1 items-center justify-center px-4" edges={[]}>
          <Text className="text-center mb-4" style={{ color: colors.destructive }}>
            {error?.message || 'Property not found'}
          </Text>
          <Button onPress={handleBack}>Go Back</Button>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: FAB_BOTTOM_OFFSET + FAB_SIZE + 32, // Clear the FAB
          }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          stickyHeaderIndices={[1]} // Make tabs sticky
        >
        {/* Property Header with Image and Basic Info */}
        <PropertyHeader property={property} />

        {/* Tab Bar - Simple inline implementation (no custom components) */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, backgroundColor: colors.background }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.muted }}>
              {Object.entries(TAB_IDS).map(([key, value]) => (
                <Pressable
                  key={value}
                  onPress={() => setActiveTab(value)}
                  style={[
                    { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 16 },
                    activeTab === value && {
                      backgroundColor: colors.background,
                      ...getShadowStyle(colors, { size: 'sm' }),
                    },
                  ]}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: '500',
                      color: activeTab === value ? colors.foreground : colors.mutedForeground,
                    }}
                  >
                    {key.charAt(0) + key.slice(1).toLowerCase()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* Tab Content - Simple conditional rendering */}
        <View style={{ paddingHorizontal: 16, paddingTop: 12 }}>
          {activeTab === TAB_IDS.OVERVIEW && <PropertyOverviewTab property={property} />}
          {activeTab === TAB_IDS.ANALYSIS && <PropertyAnalysisTab property={property} />}
          {activeTab === TAB_IDS.COMPS && <PropertyCompsTab property={property} onPropertyUpdate={refetch} />}
          {activeTab === TAB_IDS.FINANCING && <PropertyFinancingTab property={property} />}
          {activeTab === TAB_IDS.REPAIRS && <PropertyRepairsTab property={property} onPropertyUpdate={refetch} />}
          {activeTab === TAB_IDS.DOCS && <PropertyDocsTab property={property} />}
        </View>
      </ScrollView>

        {/* Edit FAB - primary action */}
        <SimpleFAB
          icon={<Edit2 size={24} color="white" />}
          onPress={handleEdit}
          accessibilityLabel="Edit property"
        />
      </View>

      {/* Property Actions Sheet */}
      <PropertyActionsSheet
        property={property}
        isOpen={showActionsSheet}
        onClose={() => setShowActionsSheet(false)}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onStatusChange={handleStatusChange}
      />

      {/* Deal Selector Sheet (for properties with multiple deals) */}
      <BottomSheet
        visible={showDealSelector}
        onClose={() => setShowDealSelector(false)}
        title="Select Deal"
      >
        <View className="py-2">
          {propertyDeals.map((deal) => (
            <Pressable
              key={deal.id}
              onPress={() => handleDealSelected(deal.id)}
              className="px-4 py-3 border-b"
              style={{ borderBottomColor: colors.border }}
            >
              <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
                {deal.lead?.name || 'Unknown Lead'}
              </Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>
                Stage: {deal.stage} • Created {new Date(deal.created_at || '').toLocaleDateString()}
              </Text>
            </Pressable>
          ))}
          {propertyDeals.length === 0 && (
            <View className="px-4 py-6 items-center">
              <Text style={{ color: colors.mutedForeground }}>No deals found for this property</Text>
            </View>
          )}
        </View>
      </BottomSheet>
      </ThemedSafeAreaView>
    </>
  );
}

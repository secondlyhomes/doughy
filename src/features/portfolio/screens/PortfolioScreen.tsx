// src/features/portfolio/screens/PortfolioScreen.tsx
// Main portfolio screen showing all properties in the user's portfolio

import React, { useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Briefcase, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner, ScreenHeader, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { usePortfolio } from '../hooks/usePortfolio';
import { PortfolioSummaryCard, PortfolioPropertyCard } from '../components';

export function PortfolioScreen() {
  const colors = useThemeColors();
  const router = useRouter();
  const { properties, summary, isLoading, error, refetch } = usePortfolio();

  const handlePropertyPress = useCallback((propertyId: string) => {
    router.push(`/(tabs)/properties/${propertyId}`);
  }, [router]);

  const handleAddProperty = useCallback(() => {
    router.push('/(tabs)/deals');
  }, [router]);

  // Loading state
  if (isLoading && properties.length === 0) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading portfolio..." />
      </ThemedSafeAreaView>
    );
  }

  // Error state
  if (error && properties.length === 0) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <ScreenHeader title="Portfolio" />
        <View className="flex-1 items-center justify-center px-4">
          <Text className="text-center mb-4" style={{ color: colors.destructive }}>
            {error.message || 'Failed to load portfolio'}
          </Text>
          <Button onPress={() => refetch()}>Retry</Button>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <ScreenHeader
        title="Portfolio"
        rightAction={
          <Button variant="ghost" size="icon" onPress={handleAddProperty}>
            <Plus size={20} color={colors.foreground} />
          </Button>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={refetch}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Card */}
        <PortfolioSummaryCard summary={summary} />

        {/* Properties Section */}
        <View className="mt-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              Properties
            </Text>
            <Text className="text-sm" style={{ color: colors.mutedForeground }}>
              {properties.length} total
            </Text>
          </View>

          {/* Empty State */}
          {properties.length === 0 && (
            <View
              className="py-12 items-center rounded-xl"
              style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
            >
              <Briefcase size={48} color={colors.mutedForeground} />
              <Text className="text-lg font-semibold mt-4" style={{ color: colors.foreground }}>
                No Properties Yet
              </Text>
              <Text
                className="text-center mt-2 px-8"
                style={{ color: colors.mutedForeground }}
              >
                Close deals to add properties to your portfolio
              </Text>
              <Button className="mt-4" onPress={handleAddProperty}>
                View Deals
              </Button>
            </View>
          )}

          {/* Property Cards */}
          {properties.map((property) => (
            <PortfolioPropertyCard
              key={property.id}
              property={property}
              onPress={handlePropertyPress}
            />
          ))}
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

export default PortfolioScreen;

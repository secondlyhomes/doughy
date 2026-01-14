// src/features/deals/screens/DealDocsScreen.tsx
// Document vault screen for a specific deal
// Wraps the existing PropertyDocsTab component

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, FolderOpen, Plus } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner } from '@/components/ui';
import { useDeal } from '../hooks/useDeals';
import { PropertyDocsTab } from '../../real-estate/components/PropertyDocsTab';
import { getDealAddress, getDealLeadName } from '../types';

export function DealDocsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dealId: string }>();
  const colors = useThemeColors();
  const dealId = params.dealId || '';

  const { deal, isLoading, error } = useDeal(dealId);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  // Loading state
  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading documents..." />
      </ThemedSafeAreaView>
    );
  }

  // Error state
  if (error || !deal) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center px-4" edges={['top']}>
        <FolderOpen size={48} color={colors.destructive} />
        <Text className="text-center mt-4 mb-4" style={{ color: colors.destructive }}>
          {error?.message || 'Deal not found'}
        </Text>
        <Button onPress={handleBack}>Go Back</Button>
      </ThemedSafeAreaView>
    );
  }

  // No property linked
  if (!deal.property) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        {/* Header */}
        <View className="flex-row items-center px-4 py-3 border-b" style={{ borderColor: colors.border }}>
          <TouchableOpacity
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="p-2 -ml-2 mr-2"
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Documents</Text>
        </View>

        {/* Empty state */}
        <View className="flex-1 items-center justify-center px-8">
          <FolderOpen size={64} color={colors.mutedForeground} />
          <Text className="text-lg font-semibold mt-4 text-center" style={{ color: colors.foreground }}>
            No Property Linked
          </Text>
          <Text className="text-sm mt-2 text-center" style={{ color: colors.mutedForeground }}>
            Link a property to this deal to manage documents.
          </Text>
        </View>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={handleBack}
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="p-2 -ml-2 mr-2"
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Documents</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }} numberOfLines={1}>
              {getDealAddress(deal)}
            </Text>
          </View>
        </View>
      </View>

      {/* Documents Tab Content */}
      <View className="flex-1 p-4">
        <PropertyDocsTab property={deal.property} />
      </View>
    </ThemedSafeAreaView>
  );
}

export default DealDocsScreen;

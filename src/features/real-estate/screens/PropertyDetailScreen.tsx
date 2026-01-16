/**
 * PropertyDetailScreen
 *
 * Detailed view of a single property with tabbed navigation for different sections:
 * Overview, Analysis, Comps, Financing, Repairs, and Documents.
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Pressable,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Edit2, Trash2, MoreHorizontal } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { getShadowStyle } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner } from '@/components/ui';
import { useTabBarPadding } from '@/hooks/useTabBarPadding';
import {
  PropertyHeader,
  PropertyQuickStats,
  PropertyOverviewTab,
  PropertyAnalysisTab,
  PropertyCompsTab,
  PropertyFinancingTab,
  PropertyRepairsTab,
  PropertyDocsTab,
  PropertyActionsSheet,
} from '../components';
import { useProperty, usePropertyMutations } from '../hooks/useProperties';

const TAB_IDS = {
  OVERVIEW: 'overview',
  ANALYSIS: 'analysis',
  COMPS: 'comps',
  FINANCING: 'financing',
  REPAIRS: 'repairs',
  DOCS: 'docs',
} as const;

// Height of the fixed bottom action bar (padding + button height + border)
const BOTTOM_BAR_HEIGHT = 72;

export function PropertyDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();
  const propertyId = params.id as string;

  const { property, isLoading, error, refetch } = useProperty(propertyId);
  const { deleteProperty, isLoading: isDeleting } = usePropertyMutations();
  const { buttonBottom } = useTabBarPadding();

  const [activeTab, setActiveTab] = useState<string>(TAB_IDS.OVERVIEW);
  const [showActionsSheet, setShowActionsSheet] = useState(false);

  const handleBack = useCallback(() => {
    router.back();
  }, [router]);

  const handleEdit = useCallback(() => {
    router.push(`/(tabs)/properties/edit/${propertyId}`);
  }, [router, propertyId]);

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

  const handleShare = useCallback(() => {
    setShowActionsSheet(true);
  }, []);

  const handleMore = useCallback(() => {
    setShowActionsSheet(true);
  }, []);

  const handleStatusChange = useCallback(() => {
    refetch();
  }, [refetch]);



  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading property..." />
      </ThemedSafeAreaView>
    );
  }

  if (error || !property) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center px-4" edges={['top']}>
        <Text className="text-center mb-4" style={{ color: colors.destructive }}>
          {error?.message || 'Property not found'}
        </Text>
        <Button onPress={handleBack}>Go Back</Button>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingBottom: BOTTOM_BAR_HEIGHT + 16, // Clear the fixed bottom bar
          }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />
          }
          stickyHeaderIndices={[1]} // Make tabs sticky
        >
        {/* Property Header with Image and Basic Info */}
        <PropertyHeader
          property={property}
          onBack={handleBack}
          onShare={handleShare}
          onMore={handleMore}
        />

        {/* Tab Bar - Simple inline implementation (no custom components) */}
        <View className="px-4 pt-2 pb-0" style={{ backgroundColor: colors.background }}>
          <PropertyQuickStats property={property} />

          <View className="mt-4">
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
        </View>

        {/* Tab Content - Simple conditional rendering */}
        <View className="px-4 mt-2">
          {activeTab === TAB_IDS.OVERVIEW && <PropertyOverviewTab property={property} />}
          {activeTab === TAB_IDS.ANALYSIS && <PropertyAnalysisTab property={property} />}
          {activeTab === TAB_IDS.COMPS && <PropertyCompsTab property={property} onPropertyUpdate={refetch} />}
          {activeTab === TAB_IDS.FINANCING && <PropertyFinancingTab property={property} />}
          {activeTab === TAB_IDS.REPAIRS && <PropertyRepairsTab property={property} onPropertyUpdate={refetch} />}
          {activeTab === TAB_IDS.DOCS && <PropertyDocsTab property={property} />}
        </View>
      </ScrollView>

        {/* Fixed Bottom Action Bar */}
        <View
          className="flex-row gap-3 p-4"
          style={{
            position: 'absolute',
            bottom: buttonBottom, // Positioned above tab bar + safe area
            left: 0,
            right: 0,
            backgroundColor: colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Button onPress={handleEdit} className="flex-1">
            <Edit2 size={20} color={colors.primaryForeground} />
            Edit
          </Button>
          <Button variant="secondary" onPress={() => setShowActionsSheet(true)} size="icon">
            <MoreHorizontal size={20} color={colors.foreground} />
          </Button>
          <Button
            variant="destructive"
            onPress={handleDelete}
            disabled={isDeleting}
            loading={isDeleting}
            size="icon"
          >
            {!isDeleting && <Trash2 size={20} color={colors.destructiveForeground} />}
          </Button>
        </View>
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
    </ThemedSafeAreaView>
  );
}

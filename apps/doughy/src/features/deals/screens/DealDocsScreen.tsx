// src/features/deals/screens/DealDocsScreen.tsx
// Document vault screen for a specific deal
// Shows 2-tier hierarchy: Seller Documents + Property Documents

import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { FolderOpen, User, Home, ChevronDown, ChevronRight, ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui';
import { useNativeHeader } from '@/hooks';
import { useDeal } from '../hooks/useDeals';
import { PropertyDocsTab } from '../../real-estate/components/PropertyDocsTab';
import { DocumentTypeFilter, DocumentFilterType } from '../../real-estate/components/DocumentTypeFilter';
import { LeadDocsTab } from '../../leads/components/LeadDocsTab';
import { getDealAddress, getDealLeadName } from '../types';

export function DealDocsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dealId: string }>();
  const colors = useThemeColors();
  const dealId = params.dealId || '';

  const { deal, isLoading, error } = useDeal(dealId);

  const [sellerDocsOpen, setSellerDocsOpen] = useState(true);
  const [propertyDocsOpen, setPropertyDocsOpen] = useState(true);
  const [propertyDocFilter, setPropertyDocFilter] = useState<DocumentFilterType>('all');

  const { headerOptions, handleBack } = useNativeHeader({
    title: 'Documents',
    subtitle: deal?.property ? getDealAddress(deal) : undefined,
    fallbackRoute: deal ? `/(tabs)/deals/${dealId}` : '/(tabs)/deals',
  });

  const handleViewLead = useCallback(() => {
    if (deal?.lead_id) {
      router.push(`/(tabs)/leads/${deal.lead_id}`);
    }
  }, [router, deal?.lead_id]);

  // Loading state
  if (isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading documents..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  // Error state
  if (error || !deal) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1 items-center justify-center px-4" edges={[]}>
          <FolderOpen size={48} color={colors.destructive} />
          <Text className="text-center mt-4 mb-4" style={{ color: colors.destructive }}>
            {error?.message || 'Deal not found'}
          </Text>
          <Button onPress={handleBack}>Go Back</Button>
        </ThemedSafeAreaView>
      </>
    );
  }

  // No property linked
  if (!deal.property) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
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
      </>
    );
  }

  const leadName = getDealLeadName(deal);
  const hasLead = deal.lead_id && leadName !== 'No lead linked';

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        {/* 2-Tier Document Sections */}
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: Seller Documents (read-only) */}
        {hasLead && (
          <View className="mb-4">
            <Collapsible open={sellerDocsOpen} onOpenChange={setSellerDocsOpen}>
              <CollapsibleTrigger>
                <View
                  className="flex-row items-center justify-between p-4 rounded-xl"
                  style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
                >
                  <View className="flex-row items-center">
                    <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: withOpacity(colors.info, 'muted') }}>
                      <User size={20} color={colors.info} />
                    </View>
                    <View>
                      <Text className="font-semibold" style={{ color: colors.foreground }}>Seller Documents</Text>
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>{leadName}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <TouchableOpacity
                      onPress={handleViewLead}
                      className="mr-3 p-2 rounded-lg"
                      style={{ backgroundColor: colors.muted }}
                    >
                      <ExternalLink size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                    {sellerDocsOpen ? (
                      <ChevronDown size={20} color={colors.mutedForeground} />
                    ) : (
                      <ChevronRight size={20} color={colors.mutedForeground} />
                    )}
                  </View>
                </View>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <View className="mt-2">
                  <LeadDocsTab
                    leadId={deal.lead_id!}
                    leadName={leadName}
                    readOnly
                  />
                </View>
              </CollapsibleContent>
            </Collapsible>
          </View>
        )}

        {/* Section 2: Property Documents (full access with filter) */}
        <View>
          <Collapsible open={propertyDocsOpen} onOpenChange={setPropertyDocsOpen}>
            <CollapsibleTrigger>
              <View
                className="flex-row items-center justify-between p-4 rounded-xl"
                style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
              >
                <View className="flex-row items-center">
                  <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                    <Home size={20} color={colors.primary} />
                  </View>
                  <View>
                    <Text className="font-semibold" style={{ color: colors.foreground }}>Property Documents</Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }} numberOfLines={1}>
                      {getDealAddress(deal)}
                    </Text>
                  </View>
                </View>
                {propertyDocsOpen ? (
                  <ChevronDown size={20} color={colors.mutedForeground} />
                ) : (
                  <ChevronRight size={20} color={colors.mutedForeground} />
                )}
              </View>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <View className="mt-2">
                {/* Document Type Filter */}
                <View className="mb-3">
                  <DocumentTypeFilter
                    selectedType={propertyDocFilter}
                    onSelectType={setPropertyDocFilter}
                  />
                </View>
                <PropertyDocsTab
                  property={deal.property}
                  filterType={propertyDocFilter}
                  hideHeader
                />
              </View>
            </CollapsibleContent>
          </Collapsible>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
    </>
  );
}

export default DealDocsScreen;

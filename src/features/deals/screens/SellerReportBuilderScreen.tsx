// src/features/deals/screens/SellerReportBuilderScreen.tsx
// Screen for building and previewing seller options reports

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Save, Eye, Edit3, Share2 } from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, Input, TAB_BAR_SAFE_PADDING, TAB_BAR_HEIGHT } from '@/components/ui';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SellerReportOptions,
  WeHandleOptions,
  ReportAssumptions,
} from '../types';
import {
  defaultWeHandleOptions,
  mockSellerReportOptions,
  mockReportAssumptions,
  formatCurrency,
} from '../data/mockSellerReport';
import { WeHandleToggles } from '../components/WeHandleToggles';
import { SellerReportPreview } from '../components/SellerReportPreview';
import { ShareReportSheet } from '../components/ShareReportSheet';

type ViewMode = 'edit' | 'preview';

interface SellerReportBuilderScreenProps {
  dealId?: string;
}

export function SellerReportBuilderScreen({ dealId }: SellerReportBuilderScreenProps) {
  const router = useRouter();
  const params = useLocalSearchParams<{ dealId: string }>();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const effectiveDealId = dealId || params.dealId || 'demo';

  // State
  const [viewMode, setViewMode] = useState<ViewMode>('edit');
  const [sellerName, setSellerName] = useState('John Smith');
  const [propertyAddress, setPropertyAddress] = useState('123 Main Street, Anytown, USA');
  const [options, setOptions] = useState<SellerReportOptions>(mockSellerReportOptions);
  const [weHandle, setWeHandle] = useState<WeHandleOptions>(defaultWeHandleOptions);
  const [assumptions, setAssumptions] = useState<ReportAssumptions>(mockReportAssumptions);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [shareToken, setShareToken] = useState<string>();

  // Parse currency input
  const parseCurrency = (text: string): number => {
    return parseInt(text.replace(/[^0-9]/g, ''), 10) || 0;
  };

  // Update cash option
  const updateCashOption = (field: string, value: number) => {
    setOptions((prev) => ({
      ...prev,
      cash: {
        ...prev.cash!,
        [field]: value,
      },
    }));
  };

  // Update seller finance option
  const updateSellerFinanceOption = (field: string, value: number) => {
    setOptions((prev) => ({
      ...prev,
      seller_finance: {
        ...prev.seller_finance!,
        [field]: value,
      },
    }));
  };

  // Update subject-to option
  const updateSubjectToOption = (field: string, value: number) => {
    setOptions((prev) => ({
      ...prev,
      subject_to: {
        ...prev.subject_to!,
        [field]: value,
      },
    }));
  };

  // Handle save
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Generate mock share token
    const token = Math.random().toString(36).substring(2, 15);
    setShareToken(token);

    console.log('Saving seller report:', { options, weHandle, assumptions, dealId: effectiveDealId });

    setIsSaving(false);
    Alert.alert('Saved', 'Your seller report has been saved.');
  }, [options, weHandle, assumptions, effectiveDealId]);

  // Toggle view mode
  const toggleViewMode = useCallback(() => {
    setViewMode((prev) => (prev === 'edit' ? 'preview' : 'edit'));
  }, []);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
        <View className="flex-row items-center flex-1">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3 p-1"
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              Seller Report
            </Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {viewMode === 'edit' ? 'Edit options' : 'Preview report'}
            </Text>
          </View>
        </View>

        {/* Action buttons */}
        <View className="flex-row items-center gap-2">
          <TouchableOpacity
            onPress={() => setShowShareSheet(true)}
            className="p-2"
            accessibilityLabel="Share report"
            accessibilityRole="button"
          >
            <Share2 size={22} color={colors.primary} />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={toggleViewMode}
            className="p-2"
            accessibilityLabel={viewMode === 'edit' ? 'Preview report' : 'Edit report'}
            accessibilityRole="button"
          >
            {viewMode === 'edit' ? (
              <Eye size={22} color={colors.primary} />
            ) : (
              <Edit3 size={22} color={colors.primary} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSave}
            disabled={isSaving}
            className="p-2"
            accessibilityLabel="Save report"
            accessibilityRole="button"
          >
            {isSaving ? (
              <LoadingSpinner size="small" />
            ) : (
              <Save size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Edit Mode */}
      {viewMode === 'edit' && (
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: TAB_BAR_SAFE_PADDING }}
          showsVerticalScrollIndicator={false}
        >
          {/* Basic Info */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Report Details</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <View>
                <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                  Seller Name
                </Text>
                <Input
                  value={sellerName}
                  onChangeText={setSellerName}
                  placeholder="Enter seller name"
                />
              </View>
              <View>
                <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>
                  Property Address
                </Text>
                <Input
                  value={propertyAddress}
                  onChangeText={setPropertyAddress}
                  placeholder="Enter property address"
                />
              </View>
            </CardContent>
          </Card>

          {/* Cash Offer Options */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Cash Offer Range</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Low</Text>
                  <Input
                    value={options.cash?.price_low?.toString() || ''}
                    onChangeText={(text) => updateCashOption('price_low', parseCurrency(text))}
                    placeholder="$0"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>High</Text>
                  <Input
                    value={options.cash?.price_high?.toString() || ''}
                    onChangeText={(text) => updateCashOption('price_high', parseCurrency(text))}
                    placeholder="$0"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Close Days (Min)</Text>
                  <Input
                    value={options.cash?.close_days_low?.toString() || ''}
                    onChangeText={(text) => updateCashOption('close_days_low', parseInt(text, 10) || 0)}
                    placeholder="14"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Close Days (Max)</Text>
                  <Input
                    value={options.cash?.close_days_high?.toString() || ''}
                    onChangeText={(text) => updateCashOption('close_days_high', parseInt(text, 10) || 0)}
                    placeholder="30"
                    keyboardType="numeric"
                  />
                </View>
              </View>
            </CardContent>
          </Card>

          {/* Seller Finance Options */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Seller Finance Option</CardTitle>
            </CardHeader>
            <CardContent className="gap-3">
              <View className="flex-row gap-3">
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Price Low</Text>
                  <Input
                    value={options.seller_finance?.price_low?.toString() || ''}
                    onChangeText={(text) => updateSellerFinanceOption('price_low', parseCurrency(text))}
                    placeholder="$0"
                    keyboardType="numeric"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Price High</Text>
                  <Input
                    value={options.seller_finance?.price_high?.toString() || ''}
                    onChangeText={(text) => updateSellerFinanceOption('price_high', parseCurrency(text))}
                    placeholder="$0"
                    keyboardType="numeric"
                  />
                </View>
              </View>
              <View>
                <Text className="text-sm font-medium mb-1" style={{ color: colors.foreground }}>Monthly Payment</Text>
                <Input
                  value={options.seller_finance?.monthly_payment?.toString() || ''}
                  onChangeText={(text) => updateSellerFinanceOption('monthly_payment', parseCurrency(text))}
                  placeholder="$0"
                  keyboardType="numeric"
                />
              </View>
            </CardContent>
          </Card>

          {/* What We Handle */}
          <View className="mb-4">
            <WeHandleToggles value={weHandle} onChange={setWeHandle} />
          </View>
        </ScrollView>
      )}

      {/* Preview Mode */}
      {viewMode === 'preview' && (
        <SellerReportPreview
          propertyAddress={propertyAddress}
          sellerName={sellerName}
          options={options}
          weHandle={weHandle}
          assumptions={assumptions}
        />
      )}

      {/* Bottom action bar */}
      <View
        className="absolute left-0 right-0 p-4 border-t"
        style={{ bottom: TAB_BAR_HEIGHT + insets.bottom, borderColor: colors.border, backgroundColor: colors.background }}
      >
        <TouchableOpacity
          onPress={toggleViewMode}
          className="py-3 rounded-lg items-center"
          style={{ backgroundColor: colors.primary }}
          accessibilityLabel={viewMode === 'edit' ? 'Preview report' : 'Back to editing'}
          accessibilityRole="button"
        >
          <Text className="text-base font-semibold" style={{ color: colors.primaryForeground }}>
            {viewMode === 'edit' ? 'Preview Report' : 'Back to Edit'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Share Sheet */}
      <ShareReportSheet
        visible={showShareSheet}
        onClose={() => setShowShareSheet(false)}
        sellerName={sellerName}
        propertyAddress={propertyAddress}
        shareToken={shareToken}
      />
    </ThemedSafeAreaView>
  );
}

export default SellerReportBuilderScreen;

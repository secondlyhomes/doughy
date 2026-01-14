// src/features/deals/components/SellerReportPreview.tsx
// Component for previewing the seller options report

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import {
  DollarSign,
  FileText,
  Home,
  Clock,
  TrendingUp,
  CheckCircle2,
  Info,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import {
  SellerReportOptions,
  WeHandleOptions,
  ReportAssumptions,
  DEAL_STRATEGY_CONFIG,
} from '../types';
import {
  WE_HANDLE_CONFIG,
  formatCurrency,
  formatPriceRange,
  formatCloseRange,
} from '../data/mockSellerReport';

interface SellerReportPreviewProps {
  propertyAddress: string;
  sellerName: string;
  options: SellerReportOptions;
  weHandle: WeHandleOptions;
  assumptions: ReportAssumptions;
}

export function SellerReportPreview({
  propertyAddress,
  sellerName,
  options,
  weHandle,
  assumptions,
}: SellerReportPreviewProps) {
  const colors = useThemeColors();

  // Get active "we handle" items
  const activeHandleItems = (Object.keys(weHandle) as (keyof WeHandleOptions)[])
    .filter((key) => weHandle[key])
    .map((key) => WE_HANDLE_CONFIG[key].label);

  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ paddingBottom: 40 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View className="items-center py-6 border-b border-border mb-4">
        <Text className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
          Property Options Report
        </Text>
        <Text className="text-lg font-bold text-foreground text-center">
          {propertyAddress}
        </Text>
        <Text className="text-sm text-muted-foreground mt-1">
          Prepared for {sellerName}
        </Text>
      </View>

      {/* Cash Option */}
      {options.cash && (
        <Card className="mb-3 mx-4">
          <CardHeader className="pb-2">
            <View className="flex-row items-center gap-2">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.success + '20' }}
              >
                <DollarSign size={18} color={colors.success} />
              </View>
              <CardTitle className="text-base">Cash Offer</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-muted-foreground">Offer Range</Text>
              <Text className="text-lg font-bold text-success">
                {formatPriceRange(options.cash.price_low, options.cash.price_high)}
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted-foreground">Close Time</Text>
              <View className="flex-row items-center gap-1">
                <Clock size={14} color={colors.mutedForeground} />
                <Text className="text-sm text-foreground">
                  {formatCloseRange(options.cash.close_days_low, options.cash.close_days_high)}
                </Text>
              </View>
            </View>
            <View
              className="mt-3 p-2 rounded-md"
              style={{ backgroundColor: colors.success + '10' }}
            >
              <Text className="text-xs text-muted-foreground">
                Quick, hassle-free sale with no financing contingencies
              </Text>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Seller Finance Option */}
      {options.seller_finance && (
        <Card className="mb-3 mx-4">
          <CardHeader className="pb-2">
            <View className="flex-row items-center gap-2">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.primary + '20' }}
              >
                <FileText size={18} color={colors.primary} />
              </View>
              <CardTitle className="text-base">Seller Financing</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-muted-foreground">Price Range</Text>
              <Text className="text-lg font-bold text-primary">
                {formatPriceRange(options.seller_finance.price_low, options.seller_finance.price_high)}
              </Text>
            </View>
            {options.seller_finance.down_payment && (
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-sm text-muted-foreground">Down Payment</Text>
                <Text className="text-sm text-foreground">
                  {formatCurrency(options.seller_finance.down_payment)}
                </Text>
              </View>
            )}
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-muted-foreground">Monthly Payment</Text>
              <Text className="text-sm text-foreground font-medium">
                {formatCurrency(options.seller_finance.monthly_payment)}/mo
              </Text>
            </View>
            <View className="flex-row justify-between items-center">
              <Text className="text-sm text-muted-foreground">Term</Text>
              <Text className="text-sm text-foreground">
                {options.seller_finance.term_years} years
              </Text>
            </View>
            <View
              className="mt-3 p-2 rounded-md"
              style={{ backgroundColor: colors.primary + '10' }}
            >
              <Text className="text-xs text-muted-foreground">
                Higher price with steady monthly income, secured by the property
              </Text>
            </View>
          </CardContent>
        </Card>
      )}

      {/* Subject-To Option */}
      {options.subject_to && (
        <Card className="mb-3 mx-4">
          <CardHeader className="pb-2">
            <View className="flex-row items-center gap-2">
              <View
                className="w-8 h-8 rounded-lg items-center justify-center"
                style={{ backgroundColor: colors.warning + '20' }}
              >
                <Home size={18} color={colors.warning} />
              </View>
              <CardTitle className="text-base">Subject-To</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-sm text-muted-foreground">Price Range</Text>
              <Text className="text-lg font-bold text-warning">
                {formatPriceRange(options.subject_to.price_low, options.subject_to.price_high)}
              </Text>
            </View>
            {options.subject_to.catch_up_amount && options.subject_to.catch_up_amount > 0 && (
              <View className="flex-row justify-between items-center">
                <Text className="text-sm text-muted-foreground">We Catch Up</Text>
                <Text className="text-sm text-foreground">
                  {formatCurrency(options.subject_to.catch_up_amount)}
                </Text>
              </View>
            )}
            <View
              className="mt-3 p-2 rounded-md"
              style={{ backgroundColor: colors.warning + '10' }}
            >
              <Text className="text-xs text-muted-foreground">
                We take over your existing payments, protecting your credit
              </Text>
            </View>
          </CardContent>
        </Card>
      )}

      {/* What We Handle */}
      {activeHandleItems.length > 0 && (
        <Card className="mb-3 mx-4">
          <CardHeader className="pb-2">
            <View className="flex-row items-center gap-2">
              <CheckCircle2 size={18} color={colors.success} />
              <CardTitle className="text-base">What We Handle</CardTitle>
            </View>
          </CardHeader>
          <CardContent>
            {activeHandleItems.map((item, index) => (
              <View key={index} className="flex-row items-center gap-2 py-1">
                <View
                  className="w-5 h-5 rounded-full items-center justify-center"
                  style={{ backgroundColor: colors.success + '20' }}
                >
                  <CheckCircle2 size={12} color={colors.success} />
                </View>
                <Text className="text-sm text-foreground">{item}</Text>
              </View>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Assumptions/Disclosure */}
      <Card className="mx-4">
        <CardHeader className="pb-2">
          <View className="flex-row items-center gap-2">
            <Info size={18} color={colors.info} />
            <CardTitle className="text-base">How We Calculated</CardTitle>
          </View>
        </CardHeader>
        <CardContent>
          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-muted-foreground">Estimated ARV</Text>
            <Text className="text-sm text-foreground">
              {formatCurrency(assumptions.arv_estimate)}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground mb-3">
            {assumptions.arv_source}
          </Text>

          <View className="flex-row justify-between items-center mb-2">
            <Text className="text-sm text-muted-foreground">Repair Estimate</Text>
            <Text className="text-sm text-foreground">
              {formatCurrency(assumptions.repair_estimate)}
            </Text>
          </View>
          <Text className="text-xs text-muted-foreground">
            {assumptions.repair_source}
          </Text>
        </CardContent>
      </Card>
    </ScrollView>
  );
}

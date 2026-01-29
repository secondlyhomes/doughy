// src/features/campaigns/screens/DirectMailCreditsScreen.tsx
// Direct Mail Credits Screen - Purchase credits, view balance and history

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import {
  Button,
  TAB_BAR_SAFE_PADDING,
  LoadingSpinner,
} from '@/components/ui';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  TrendingUp,
  Check,
  Star,
  Zap,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import {
  useMailCredits,
  useMailCreditTransactions,
  useCreditPackages,
  usePurchaseCredits,
  formatCredits,
} from '../hooks/useMailCredits';
import type { CreditPackage } from '../types';

// =============================================================================
// Package Card Component
// =============================================================================

interface PackageCardProps {
  pkg: CreditPackage;
  isSelected: boolean;
  onSelect: () => void;
  isPopular?: boolean;
}

function PackageCard({ pkg, isSelected, onSelect, isPopular }: PackageCardProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      className={`rounded-xl p-4 mb-3 border-2 ${isPopular ? 'relative overflow-hidden' : ''}`}
      style={{
        backgroundColor: isSelected ? withOpacity(colors.primary, 'light') : colors.card,
        borderColor: isSelected ? colors.primary : colors.border,
      }}
      onPress={onSelect}
    >
      {isPopular && (
        <View
          className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg"
          style={{ backgroundColor: colors.primary }}
        >
          <View className="flex-row items-center">
            <Star size={12} color={colors.primaryForeground} />
            <Text className="text-xs font-medium ml-1" style={{ color: colors.primaryForeground }}>
              Popular
            </Text>
          </View>
        </View>
      )}

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
            {pkg.name}
          </Text>
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>
            {pkg.credits} credits
          </Text>
        </View>

        <View className="items-end">
          <Text className="text-xl font-bold" style={{ color: colors.foreground }}>
            {pkg.price_formatted}
          </Text>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            {pkg.per_credit}/credit
          </Text>
          {pkg.savings_percent && (
            <View
              className="mt-1 px-2 py-0.5 rounded-full"
              style={{ backgroundColor: withOpacity(colors.success, 'light') }}
            >
              <Text className="text-xs font-medium" style={{ color: colors.success }}>
                Save {pkg.savings_percent}%
              </Text>
            </View>
          )}
        </View>
      </View>

      {isSelected && (
        <View
          className="absolute top-4 left-4 w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.primary }}
        >
          <Check size={12} color={colors.primaryForeground} />
        </View>
      )}
    </TouchableOpacity>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export function DirectMailCreditsScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const { data: credits, isLoading: creditsLoading } = useMailCredits();
  const { data: transactions, isLoading: transactionsLoading } = useMailCreditTransactions(10);
  const { data: packages, isLoading: packagesLoading } = useCreditPackages();
  const purchaseCredits = usePurchaseCredits();

  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = useCallback(async () => {
    if (!selectedPackage) {
      Alert.alert('Select a Package', 'Please select a credit package to purchase.');
      return;
    }

    try {
      const result = await purchaseCredits.mutateAsync({
        packageId: selectedPackage,
        createCheckout: true,
      });

      if (result.checkout_url) {
        // Open Stripe Checkout
        Linking.openURL(result.checkout_url);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start purchase. Please try again.');
    }
  }, [selectedPackage, purchaseCredits]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
        <Text className="text-lg font-semibold ml-2" style={{ color: colors.foreground }}>
          Mail Credits
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-4 pt-4"
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
      >
        {/* Current Balance */}
        <View
          className="rounded-xl p-6 mb-6"
          style={{ backgroundColor: colors.primary }}
        >
          <View className="flex-row items-center mb-2">
            <CreditCard size={20} color={colors.primaryForeground} />
            <Text className="ml-2 text-sm" style={{ color: colors.primaryForeground }}>
              Current Balance
            </Text>
          </View>
          <Text className="text-4xl font-bold" style={{ color: colors.primaryForeground }}>
            {creditsLoading ? '...' : formatCredits(credits?.balance || 0)}
          </Text>
          <Text className="text-sm mt-1" style={{ color: withOpacity(colors.primaryForeground, 'strong') }}>
            credits available
          </Text>
        </View>

        {/* Credit Packages */}
        <View className="mb-6">
          <View className="flex-row items-center mb-3">
            <Zap size={20} color={colors.foreground} />
            <Text className="ml-2 text-lg font-semibold" style={{ color: colors.foreground }}>
              Buy Credits
            </Text>
          </View>

          {packagesLoading ? (
            <LoadingSpinner />
          ) : (
            <>
              {packages?.map((pkg, index) => (
                <PackageCard
                  key={pkg.id}
                  pkg={pkg}
                  isSelected={selectedPackage === pkg.id}
                  onSelect={() => setSelectedPackage(pkg.id)}
                  isPopular={index === 2} // Pro Pack
                />
              ))}

              <Button
                onPress={handlePurchase}
                disabled={!selectedPackage || purchaseCredits.isPending}
                className="mt-2"
              >
                {purchaseCredits.isPending ? 'Processing...' : 'Purchase Credits'}
              </Button>
            </>
          )}
        </View>

        {/* Recent Transactions */}
        <View className="mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <View className="flex-row items-center">
              <TrendingUp size={20} color={colors.foreground} />
              <Text className="ml-2 text-lg font-semibold" style={{ color: colors.foreground }}>
                Recent Activity
              </Text>
            </View>
          </View>

          <View className="rounded-xl" style={{ backgroundColor: colors.card }}>
            {transactionsLoading ? (
              <View className="p-4">
                <LoadingSpinner />
              </View>
            ) : transactions?.length === 0 ? (
              <View className="p-4">
                <Text className="text-sm text-center" style={{ color: colors.mutedForeground }}>
                  No transactions yet
                </Text>
              </View>
            ) : (
              transactions?.map((tx, index) => (
                <View
                  key={tx.id}
                  className={`flex-row items-center justify-between p-4 ${
                    index < (transactions?.length || 0) - 1 ? 'border-b' : ''
                  }`}
                  style={{ borderBottomColor: colors.border }}
                >
                  <View className="flex-1">
                    <Text className="font-medium" style={{ color: colors.foreground }}>
                      {tx.type === 'purchase' ? tx.package_name : tx.description}
                    </Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                      {formatDate(tx.created_at)}
                    </Text>
                  </View>
                  <Text
                    className="font-semibold"
                    style={{
                      color: tx.amount > 0 ? colors.success : colors.foreground,
                    }}
                  >
                    {tx.amount > 0 ? '+' : ''}{formatCredits(tx.amount)}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

export default DirectMailCreditsScreen;

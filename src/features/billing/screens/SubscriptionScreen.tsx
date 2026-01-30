// src/features/billing/screens/SubscriptionScreen.tsx
// Subscription and billing screen for mobile
// Uses useThemeColors() for reliable dark mode support

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle,
  Star,
  Zap,
  Crown,
  ExternalLink,
  AlertCircle,
} from 'lucide-react-native';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { ThemedSafeAreaView } from '@/components';
import { Button, LoadingSpinner } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  icon: React.ReactNode;
}

interface Subscription {
  planId: string;
  planName: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export function SubscriptionScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { profile } = useAuth();

  const plans: Plan[] = [
    {
      id: 'starter',
      name: 'Starter',
      price: 0,
      interval: 'month',
      features: ['100 credits/month', 'Basic analytics', 'Email support'],
      icon: <Zap size={24} color={colors.mutedForeground} />,
    },
    {
      id: 'personal',
      name: 'Personal',
      price: 29,
      interval: 'month',
      features: ['1,000 credits/month', 'Advanced analytics', 'Priority support', 'API access'],
      popular: true,
      icon: <Star size={24} color={colors.warning} />,
    },
    {
      id: 'professional',
      name: 'Professional',
      price: 99,
      interval: 'month',
      features: [
        '5,000 credits/month',
        'Full analytics suite',
        '24/7 support',
        'API access',
        'Custom integrations',
      ],
      icon: <Crown size={24} color={colors.primary} />,
    },
  ];
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsTotal, setCreditsTotal] = useState(100);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
    setLoadError(null);
    try {
      // TODO: Fetch real subscription data from API
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Mock subscription data
      setSubscription({
        planId: 'starter',
        planName: 'Starter',
        status: 'active',
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        cancelAtPeriodEnd: false,
      });
      setCreditsUsed(67);
      setCreditsTotal(100);
    } catch (error) {
      console.error('Failed to load subscription:', error);
      setLoadError('Unable to load subscription data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgrade = (planId: string) => {
    Alert.alert(
      'Upgrade Plan',
      'You will be redirected to complete your subscription upgrade.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // TODO: Open Stripe checkout or handle in-app purchase
            Linking.openURL('https://doughy.ai/pricing');
          },
        },
      ]
    );
  };

  const handleManageBilling = () => {
    Alert.alert(
      'Manage Billing',
      'You will be redirected to the billing portal.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Continue',
          onPress: () => {
            // TODO: Open Stripe customer portal
            Linking.openURL('https://doughy.ai/billing');
          },
        },
      ]
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
      case 'trialing':
        return colors.success;
      case 'canceled':
        return colors.mutedForeground;
      case 'past_due':
        return colors.destructive;
      default:
        return colors.mutedForeground;
    }
  };

  if (isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen />
      </ThemedSafeAreaView>
    );
  }

  if (loadError) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center px-4" edges={['top']}>
        <AlertCircle size={48} color={colors.destructive} />
        <Text className="text-center mt-4 mb-4" style={{ color: colors.foreground }}>
          {loadError}
        </Text>
        <Button onPress={loadSubscriptionData}>Retry</Button>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <View
        className="flex-row items-center p-4"
        style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
      >
        <TouchableOpacity onPress={() => router.back()} className="mr-4">
          <ArrowLeft size={24} color={colors.mutedForeground} />
        </TouchableOpacity>
        <Text className="text-xl font-semibold" style={{ color: colors.foreground }}>Subscription</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Current Plan */}
        {subscription && (
          <View className="p-4">
            <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
              CURRENT PLAN
            </Text>
            <View className="rounded-lg p-4" style={{ backgroundColor: colors.card }}>
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <CreditCard size={24} color={colors.primary} />
                  <Text className="text-lg font-semibold ml-3" style={{ color: colors.foreground }}>
                    {subscription.planName}
                  </Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: withOpacity(getStatusColor(subscription.status), 'light') }}
                >
                  <Text
                    className="text-sm font-medium capitalize"
                    style={{ color: getStatusColor(subscription.status) }}
                  >
                    {subscription.status}
                  </Text>
                </View>
              </View>

              {/* Credits Usage */}
              <View className="mb-4">
                <View className="flex-row justify-between mb-2">
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>Credits Used</Text>
                  <Text className="text-sm" style={{ color: colors.foreground }}>
                    {creditsUsed} / {creditsTotal}
                  </Text>
                </View>
                <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.muted }}>
                  <View
                    className="h-full rounded-full"
                    style={{ backgroundColor: colors.primary, width: `${(creditsUsed / creditsTotal) * 100}%` }}
                  />
                </View>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>Renews On</Text>
                <Text className="text-sm" style={{ color: colors.foreground }}>
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Text>
              </View>

              <Button
                variant="ghost"
                onPress={handleManageBilling}
                className="mt-4"
              >
                Manage Billing
                <ExternalLink size={16} color={colors.primary} />
              </Button>
            </View>
          </View>
        )}

        {/* Available Plans */}
        <View className="p-4">
          <Text className="text-sm font-medium mb-3 px-2" style={{ color: colors.mutedForeground }}>
            AVAILABLE PLANS
          </Text>

          {plans.map((plan) => (
            <View
              key={plan.id}
              className="rounded-lg p-4 mb-3"
              style={{
                backgroundColor: colors.card,
                borderWidth: plan.popular ? 2 : 1,
                borderColor: plan.popular ? colors.primary : colors.border,
              }}
            >
              {plan.popular && (
                <View
                  className="absolute -top-3 right-4 px-3 py-1 rounded-full"
                  style={{ backgroundColor: colors.primary }}
                >
                  <Text className="text-xs font-medium" style={{ color: colors.primaryForeground }}>Popular</Text>
                </View>
              )}

              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  {plan.icon}
                  <Text className="text-lg font-semibold ml-3" style={{ color: colors.foreground }}>{plan.name}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold" style={{ color: colors.foreground }}>
                    ${plan.price}
                  </Text>
                  <Text className="text-xs" style={{ color: colors.mutedForeground }}>/{plan.interval}</Text>
                </View>
              </View>

              <View className="mb-4">
                {plan.features.map((feature, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <CheckCircle size={16} color={colors.success} />
                    <Text className="text-sm ml-2" style={{ color: colors.mutedForeground }}>{feature}</Text>
                  </View>
                ))}
              </View>

              <Button
                variant={subscription?.planId === plan.id ? 'secondary' : plan.popular ? 'default' : 'outline'}
                onPress={() => handleUpgrade(plan.id)}
                disabled={subscription?.planId === plan.id}
                className="w-full"
              >
                {subscription?.planId === plan.id ? 'Current Plan' : 'Upgrade'}
              </Button>
            </View>
          ))}
        </View>

        {/* Help Section */}
        <View className="p-4 pb-8">
          <View
            className="rounded-lg p-4 flex-row"
            style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}
          >
            <AlertCircle size={20} color={colors.primary} />
            <View className="flex-1 ml-3">
              <Text className="text-sm font-medium" style={{ color: colors.primary }}>Need help with billing?</Text>
              <Text className="text-sm mt-1" style={{ color: colors.mutedForeground }}>
                Contact our support team for assistance with subscriptions and billing questions.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

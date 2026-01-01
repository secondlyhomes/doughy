// src/features/billing/screens/SubscriptionScreen.tsx
// Subscription and billing screen for mobile

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { RootStackParamList } from '@/types';

type SubscriptionScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

const plans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    interval: 'month',
    features: ['100 credits/month', 'Basic analytics', 'Email support'],
    icon: <Zap size={24} color="#6b7280" />,
  },
  {
    id: 'personal',
    name: 'Personal',
    price: 29,
    interval: 'month',
    features: ['1,000 credits/month', 'Advanced analytics', 'Priority support', 'API access'],
    popular: true,
    icon: <Star size={24} color="#f59e0b" />,
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
    icon: <Crown size={24} color="#8b5cf6" />,
  },
];

export function SubscriptionScreen() {
  const navigation = useNavigation<SubscriptionScreenNavigationProp>();
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [creditsUsed, setCreditsUsed] = useState(0);
  const [creditsTotal, setCreditsTotal] = useState(100);

  useEffect(() => {
    loadSubscriptionData();
  }, []);

  const loadSubscriptionData = async () => {
    setIsLoading(true);
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
        return '#22c55e';
      case 'canceled':
        return '#6b7280';
      case 'past_due':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center p-4 border-b border-border">
        <TouchableOpacity onPress={() => navigation.goBack()} className="mr-4">
          <ArrowLeft size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="text-xl font-semibold text-foreground">Subscription</Text>
      </View>

      <ScrollView className="flex-1">
        {/* Current Plan */}
        {subscription && (
          <View className="p-4">
            <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
              CURRENT PLAN
            </Text>
            <View className="bg-card rounded-lg p-4">
              <View className="flex-row items-center justify-between mb-4">
                <View className="flex-row items-center">
                  <CreditCard size={24} color="#6366f1" />
                  <Text className="text-lg font-semibold text-foreground ml-3">
                    {subscription.planName}
                  </Text>
                </View>
                <View
                  className="px-3 py-1 rounded-full"
                  style={{ backgroundColor: `${getStatusColor(subscription.status)}20` }}
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
                  <Text className="text-sm text-muted-foreground">Credits Used</Text>
                  <Text className="text-sm text-foreground">
                    {creditsUsed} / {creditsTotal}
                  </Text>
                </View>
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full bg-primary rounded-full"
                    style={{ width: `${(creditsUsed / creditsTotal) * 100}%` }}
                  />
                </View>
              </View>

              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-muted-foreground">Renews On</Text>
                <Text className="text-sm text-foreground">
                  {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </Text>
              </View>

              <TouchableOpacity
                className="flex-row items-center justify-center bg-primary/10 rounded-lg py-3 mt-4"
                onPress={handleManageBilling}
              >
                <Text className="text-primary font-medium">Manage Billing</Text>
                <ExternalLink size={16} color="#6366f1" className="ml-2" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Available Plans */}
        <View className="p-4">
          <Text className="text-sm font-medium text-muted-foreground mb-3 px-2">
            AVAILABLE PLANS
          </Text>

          {plans.map((plan) => (
            <View
              key={plan.id}
              className={`bg-card rounded-lg p-4 mb-3 ${
                plan.popular ? 'border-2 border-primary' : 'border border-border'
              }`}
            >
              {plan.popular && (
                <View className="absolute -top-3 right-4 bg-primary px-3 py-1 rounded-full">
                  <Text className="text-xs text-primary-foreground font-medium">Popular</Text>
                </View>
              )}

              <View className="flex-row items-center justify-between mb-3">
                <View className="flex-row items-center">
                  {plan.icon}
                  <Text className="text-lg font-semibold text-foreground ml-3">{plan.name}</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-foreground">
                    ${plan.price}
                  </Text>
                  <Text className="text-xs text-muted-foreground">/{plan.interval}</Text>
                </View>
              </View>

              <View className="mb-4">
                {plan.features.map((feature, index) => (
                  <View key={index} className="flex-row items-center mb-2">
                    <CheckCircle size={16} color="#22c55e" />
                    <Text className="text-sm text-muted-foreground ml-2">{feature}</Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                className={`rounded-lg py-3 items-center ${
                  subscription?.planId === plan.id
                    ? 'bg-muted'
                    : plan.popular
                    ? 'bg-primary'
                    : 'bg-card border border-primary'
                }`}
                onPress={() => handleUpgrade(plan.id)}
                disabled={subscription?.planId === plan.id}
              >
                <Text
                  className={`font-semibold ${
                    subscription?.planId === plan.id
                      ? 'text-muted-foreground'
                      : plan.popular
                      ? 'text-primary-foreground'
                      : 'text-primary'
                  }`}
                >
                  {subscription?.planId === plan.id ? 'Current Plan' : 'Upgrade'}
                </Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>

        {/* Help Section */}
        <View className="p-4 pb-8">
          <View className="bg-primary/10 rounded-lg p-4 flex-row">
            <AlertCircle size={20} color="#6366f1" />
            <View className="flex-1 ml-3">
              <Text className="text-sm text-primary font-medium">Need help with billing?</Text>
              <Text className="text-sm text-muted-foreground mt-1">
                Contact our support team for assistance with subscriptions and billing questions.
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

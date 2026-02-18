/**
 * Subscription Plans Component
 *
 * Displays available pricing plans with features and selection.
 * Thin orchestration component that composes extracted pieces.
 */

import React from 'react'
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '@/theme'
import { PRICING_PLANS } from '../stripe/types'
import { styles } from './styles'
import { useSubscriptionPlans } from './hooks/useSubscriptionPlans'
import { PlanCard } from './components/PlanCard'
import type { SubscriptionPlansProps } from './types'

export function SubscriptionPlans({ onSubscribed }: SubscriptionPlansProps) {
  const theme = useTheme()
  const {
    selectedPlanId,
    isLoading,
    setSelectedPlanId,
    handleSubscribe,
    calculateSavingsPercent,
  } = useSubscriptionPlans({ onSubscribed })

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Choose Your Plan
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
          Start your premium experience today
        </Text>
      </View>

      {/* Plan Cards */}
      <View style={styles.plans}>
        {PRICING_PLANS.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isSelected={selectedPlanId === plan.id}
            savingsPercent={calculateSavingsPercent(plan)}
            onSelect={setSelectedPlanId}
          />
        ))}
      </View>

      {/* Subscribe Button */}
      <TouchableOpacity
        style={[
          styles.subscribeButton,
          {
            backgroundColor: theme.colors.primary,
            opacity: isLoading || !selectedPlanId ? 0.5 : 1,
          },
        ]}
        onPress={handleSubscribe}
        disabled={isLoading || !selectedPlanId}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.text.inverse} />
        ) : (
          <Text style={[styles.subscribeButtonText, { color: theme.colors.text.inverse }]}>
            Subscribe Now
          </Text>
        )}
      </TouchableOpacity>

      {/* Disclaimer */}
      <Text style={[styles.disclaimer, { color: theme.colors.text.tertiary }]}>
        Cancel anytime. No hidden fees. Secure payment powered by Stripe.
      </Text>
    </ScrollView>
  )
}

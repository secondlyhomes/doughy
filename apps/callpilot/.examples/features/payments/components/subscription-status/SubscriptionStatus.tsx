/**
 * Subscription Status Component
 *
 * Displays current subscription status with management options.
 * This is a thin component that composes extracted sub-components.
 */

import React from 'react'
import { View, Text } from 'react-native'
import { styles } from './styles'
import { useSubscriptionStatusLogic } from './hooks/useSubscriptionStatusLogic'
import { StatusBadge } from './components/StatusBadge'
import { PlanDetails } from './components/PlanDetails'
import { ActionButtons } from './components/ActionButtons'

/**
 * No subscription view - shown when user doesn't have premium
 */
function NoSubscriptionView({ theme }: { theme: { colors: { surface: string; text: { primary: string; secondary: string } } } }) {
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <Text style={[styles.title, { color: theme.colors.text.primary }]}>
        No Active Subscription
      </Text>
      <Text style={[styles.subtitle, { color: theme.colors.text.secondary }]}>
        Subscribe to unlock premium features
      </Text>
    </View>
  )
}

/**
 * Main subscription status component
 */
export function SubscriptionStatus() {
  const {
    subscription,
    isTrial,
    isPremium,
    isLoading,
    daysUntilRenewal,
    theme,
    statusColor,
    statusText,
    handleCancelSubscription,
    handleReactivateSubscription,
    handleManageBilling,
  } = useSubscriptionStatusLogic()

  if (!isPremium) {
    return <NoSubscriptionView theme={theme} />
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.header}>
        <StatusBadge
          statusText={statusText}
          statusColor={statusColor}
          isTrial={isTrial}
          daysUntilRenewal={daysUntilRenewal}
          theme={theme}
        />

        <Text style={[styles.title, { color: theme.colors.text.primary }]}>
          Premium Subscription
        </Text>
      </View>

      <PlanDetails
        subscription={subscription}
        daysUntilRenewal={daysUntilRenewal}
        theme={theme}
      />

      <ActionButtons
        subscription={subscription}
        isLoading={isLoading}
        theme={theme}
        onManageBilling={handleManageBilling}
        onCancelSubscription={handleCancelSubscription}
        onReactivateSubscription={handleReactivateSubscription}
      />
    </View>
  )
}

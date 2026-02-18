/**
 * ActionButtons Component
 *
 * Renders subscription management action buttons
 */

import React from 'react'
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native'
import { styles } from '../styles'
import type { ActionButtonsProps } from '../types'

export function ActionButtons({
  subscription,
  isLoading,
  theme,
  onManageBilling,
  onCancelSubscription,
  onReactivateSubscription,
}: ActionButtonsProps) {
  const disabledOpacity = isLoading ? 0.5 : 1

  if (subscription?.cancelAt) {
    return (
      <View style={styles.actions}>
        <TouchableOpacity
          style={[
            styles.actionButton,
            { backgroundColor: theme.colors.primary, opacity: disabledOpacity },
          ]}
          onPress={onReactivateSubscription}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={theme.colors.text.inverse} />
          ) : (
            <Text style={[styles.actionButtonText, { color: theme.colors.text.inverse }]}>
              Reactivate Subscription
            </Text>
          )}
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.actions}>
      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.border,
            opacity: disabledOpacity,
          },
        ]}
        onPress={onManageBilling}
        disabled={isLoading}
      >
        <Text style={[styles.actionButtonText, { color: theme.colors.text.primary }]}>
          Manage Billing
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionButton,
          {
            backgroundColor: theme.colors.surface,
            borderWidth: 1,
            borderColor: theme.colors.error,
            opacity: disabledOpacity,
          },
        ]}
        onPress={onCancelSubscription}
        disabled={isLoading}
      >
        <Text style={[styles.actionButtonText, { color: theme.colors.error }]}>
          Cancel Subscription
        </Text>
      </TouchableOpacity>
    </View>
  )
}

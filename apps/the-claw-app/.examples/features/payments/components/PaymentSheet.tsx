/**
 * Payment Sheet Component
 *
 * Integrates Stripe Payment Sheet for collecting payment methods
 */

import React, { useState } from 'react'
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native'
import { useStripe as useStripeSDK } from '@stripe/stripe-react-native'
import { useTheme } from '@/theme'
import { useStripe } from '../stripe/StripeContext'
import { createPaymentIntent } from '../stripe/paymentService'

interface PaymentSheetProps {
  amount: number
  currency?: string
  description?: string
  onPaymentSuccess?: (paymentIntentId: string) => void
  onPaymentError?: (error: string) => void
}

export function PaymentSheet({
  amount,
  currency = 'usd',
  description,
  onPaymentSuccess,
  onPaymentError,
}: PaymentSheetProps) {
  const theme = useTheme()
  const { initPaymentSheet, presentPaymentSheet } = useStripeSDK()
  const { refreshPaymentMethods } = useStripe()
  const [isLoading, setIsLoading] = useState(false)

  const handlePayment = async () => {
    setIsLoading(true)

    try {
      // Create payment intent
      const { clientSecret, paymentIntentId } = await createPaymentIntent({
        amount,
        currency,
        metadata: {
          description: description || 'One-time payment',
        },
      })

      // Initialize payment sheet
      const { error: initError } = await initPaymentSheet({
        paymentIntentClientSecret: clientSecret,
        merchantDisplayName: 'Your App Name',
        defaultBillingDetails: {
          // Optional: pre-fill customer info
        },
        returnURL: 'your-app://stripe-redirect', // Deep link for return
      })

      if (initError) {
        throw new Error(initError.message)
      }

      // Present payment sheet
      const { error: presentError } = await presentPaymentSheet()

      if (presentError) {
        // User canceled or error occurred
        if (presentError.code === 'Canceled') {
          // User canceled
          return
        }
        throw new Error(presentError.message)
      }

      // Payment successful
      await refreshPaymentMethods()
      onPaymentSuccess?.(paymentIntentId)

      Alert.alert('Payment Successful', 'Your payment has been processed.')
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Payment failed'
      onPaymentError?.(errorMessage)
      Alert.alert('Payment Failed', errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.amountContainer}>
        <Text style={[styles.amountLabel, { color: theme.colors.text.secondary }]}>
          Amount to pay
        </Text>
        <Text style={[styles.amountValue, { color: theme.colors.text.primary }]}>
          ${(amount / 100).toFixed(2)}
        </Text>
      </View>

      {description && (
        <Text style={[styles.description, { color: theme.colors.text.secondary }]}>
          {description}
        </Text>
      )}

      <TouchableOpacity
        style={[
          styles.payButton,
          {
            backgroundColor: theme.colors.primary,
            opacity: isLoading ? 0.5 : 1,
          },
        ]}
        onPress={handlePayment}
        disabled={isLoading}
      >
        <Text style={[styles.payButtonText, { color: theme.colors.text.inverse }]}>
          {isLoading ? 'Processing...' : 'Pay Now'}
        </Text>
      </TouchableOpacity>

      <View style={styles.secureContainer}>
        <Text style={[styles.secureText, { color: theme.colors.text.tertiary }]}>
          🔒 Secure payment powered by Stripe
        </Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  amountLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  payButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },
  secureContainer: {
    alignItems: 'center',
  },
  secureText: {
    fontSize: 12,
  },
})

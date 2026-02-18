/**
 * Checkout Screen
 *
 * Complete checkout flow with card input and payment processing.
 * This is a thin component that composes OrderSummary and PaymentForm.
 */

import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useCheckout } from './hooks/useCheckout';
import { OrderSummary } from './components/OrderSummary';
import { PaymentForm } from './components/PaymentForm';
import { checkoutStyles as styles } from './styles';
import type { CheckoutScreenProps } from './types';

/**
 * Main checkout screen component
 *
 * @example
 * ```tsx
 * <CheckoutScreen
 *   amount={2999}
 *   currency="usd"
 *   description="Premium subscription"
 *   onSuccess={() => navigation.navigate('Success')}
 *   onCancel={() => navigation.goBack()}
 * />
 * ```
 */
export function CheckoutScreen({
  amount,
  currency = 'usd',
  description,
  onSuccess,
  onCancel,
}: CheckoutScreenProps) {
  const { loading, cardComplete, setCardComplete, handlePayment } = useCheckout(
    {
      amount,
      currency,
      description,
      onSuccess,
    }
  );

  return (
    <ScrollView style={styles.container}>
      <OrderSummary
        amount={amount}
        currency={currency}
        description={description}
      />

      <PaymentForm
        onCardChange={setCardComplete}
        onSubmit={handlePayment}
        onCancel={onCancel}
        loading={loading}
        cardComplete={cardComplete}
      />

      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Stripe</Text>
      </View>
    </ScrollView>
  );
}

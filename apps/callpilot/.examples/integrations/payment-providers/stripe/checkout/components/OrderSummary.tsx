/**
 * OrderSummary Component
 *
 * Displays the order amount and description in the checkout header.
 */

import React from 'react';
import { View, Text } from 'react-native';
import { formatCurrency } from '../../stripeClient';
import { orderSummaryStyles as styles } from '../styles';
import type { OrderSummaryProps } from '../types';

/**
 * Displays order summary with amount and optional description
 */
export function OrderSummary({
  amount,
  currency,
  description,
}: OrderSummaryProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.title}>Checkout</Text>
      <Text style={styles.amount}>{formatCurrency(amount, currency)}</Text>
      {description && <Text style={styles.description}>{description}</Text>}
    </View>
  );
}

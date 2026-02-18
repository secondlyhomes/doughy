/**
 * PaymentForm Component
 *
 * Card input field with security info and action buttons.
 */

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { CardField } from '@stripe/stripe-react-native';
import { paymentFormStyles as styles } from '../styles';
import type { PaymentFormProps } from '../types';

/**
 * Payment form with card input and submit/cancel buttons
 */
export function PaymentForm({
  onCardChange,
  onSubmit,
  onCancel,
  loading,
  cardComplete,
}: PaymentFormProps) {
  const isDisabled = !cardComplete || loading;

  return (
    <>
      <View style={styles.cardSection}>
        <Text style={styles.sectionTitle}>Payment Details</Text>
        <CardField
          postalCodeEnabled={true}
          placeholders={{
            number: '4242 4242 4242 4242',
          }}
          cardStyle={styles.card}
          style={styles.cardField}
          onCardChange={(cardDetails) => {
            onCardChange(cardDetails.complete);
          }}
        />
      </View>

      <View style={styles.securityInfo}>
        <Text style={styles.securityText}>
          Your payment is secure and encrypted
        </Text>
      </View>

      <View style={styles.actions}>
        <Pressable
          style={[styles.button, styles.cancelButton]}
          onPress={onCancel}
          disabled={loading}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </Pressable>

        <Pressable
          style={[
            styles.button,
            styles.payButton,
            isDisabled && styles.buttonDisabled,
          ]}
          onPress={onSubmit}
          disabled={isDisabled}
        >
          <Text style={styles.payButtonText}>
            {loading ? 'Processing...' : 'Pay Now'}
          </Text>
        </Pressable>
      </View>
    </>
  );
}

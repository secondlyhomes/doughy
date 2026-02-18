/**
 * useCheckout Hook
 *
 * Manages checkout state and payment processing logic.
 */

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useConfirmPayment } from '@stripe/stripe-react-native';
import { createPaymentIntent } from '../../paymentService';
import type { UseCheckoutReturn, PaymentIntentParams } from '../types';

interface UseCheckoutOptions {
  amount: number;
  currency: string;
  description?: string;
  onSuccess?: () => void;
}

/**
 * Hook for managing checkout flow state and payment processing
 */
export function useCheckout({
  amount,
  currency,
  description,
  onSuccess,
}: UseCheckoutOptions): UseCheckoutReturn {
  const [loading, setLoading] = useState(false);
  const [cardComplete, setCardComplete] = useState(false);
  const { confirmPayment } = useConfirmPayment();

  const handlePayment = useCallback(async () => {
    if (!cardComplete) {
      Alert.alert('Error', 'Please enter complete card details');
      return;
    }

    setLoading(true);

    try {
      // 1. Create payment intent on server
      const paymentIntent = await createPaymentIntent({
        amount,
        currency,
        description,
      });

      // 2. Confirm payment with card details
      const { error, paymentIntent: confirmedPayment } = await confirmPayment(
        paymentIntent.client_secret!,
        {
          paymentMethodType: 'Card',
        }
      );

      if (error) {
        Alert.alert('Payment Failed', error.message);
        return;
      }

      if (confirmedPayment?.status === 'Succeeded') {
        Alert.alert(
          'Payment Successful',
          'Your payment has been processed successfully.',
          [
            {
              text: 'OK',
              onPress: onSuccess,
            },
          ]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Payment failed'
      );
    } finally {
      setLoading(false);
    }
  }, [amount, currency, description, cardComplete, confirmPayment, onSuccess]);

  return {
    loading,
    cardComplete,
    setCardComplete,
    handlePayment,
  };
}

/**
 * Payment Service
 *
 * Handles one-time payments with Stripe.
 * Uses Payment Intents API for secure payment processing.
 */

import { supabase } from '@/services/supabase';
import type { PaymentIntent, CreatePaymentIntentParams, ConfirmPaymentParams } from './types';

/**
 * Create a payment intent
 * This is called from the client and processed via Edge Function
 */
export async function createPaymentIntent(
  params: CreatePaymentIntentParams
): Promise<PaymentIntent> {
  try {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      throw new Error('Not authenticated');
    }

    // Call Edge Function to create payment intent
    const { data, error } = await supabase.functions.invoke('stripe-payment', {
      body: {
        action: 'create_payment_intent',
        amount: params.amount,
        currency: params.currency || 'usd',
        description: params.description,
        metadata: params.metadata,
      },
    });

    if (error) {
      throw error;
    }

    return data as PaymentIntent;
  } catch (error) {
    console.error('Failed to create payment intent:', error);
    throw new Error(
      error instanceof Error ? error.message : 'Failed to create payment intent'
    );
  }
}

/**
 * Confirm payment with payment method
 */
export async function confirmPayment(
  params: ConfirmPaymentParams
): Promise<{ success: boolean; error?: string }> {
  try {
    const { confirmPayment } = await import('@stripe/stripe-react-native');

    const { error, paymentIntent } = await confirmPayment(
      params.clientSecret,
      {
        paymentMethodType: params.paymentMethodType || 'Card',
        paymentMethodData: params.paymentMethodData,
      }
    );

    if (error) {
      console.error('Payment confirmation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    if (paymentIntent?.status === 'Succeeded') {
      return { success: true };
    }

    return {
      success: false,
      error: 'Payment not completed',
    };
  } catch (error) {
    console.error('Payment confirmation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get payment intent details
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<PaymentIntent | null> {
  try {
    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('stripe_payment_intent_id', paymentIntentId)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to get payment intent:', error);
    return null;
  }
}

/**
 * List user's payment history
 */
export async function listPayments(params?: {
  limit?: number;
  offset?: number;
  status?: string;
}): Promise<PaymentIntent[]> {
  try {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      throw new Error('Not authenticated');
    }

    let query = supabase
      .from('payments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (params?.status) {
      query = query.eq('status', params.status);
    }

    if (params?.limit) {
      query = query.limit(params.limit);
    }

    if (params?.offset) {
      query = query.range(params.offset, params.offset + (params.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Failed to list payments:', error);
    return [];
  }
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-payment', {
      body: {
        action: 'cancel_payment_intent',
        paymentIntentId,
      },
    });

    if (error) {
      throw error;
    }

    return data.success;
  } catch (error) {
    console.error('Failed to cancel payment intent:', error);
    return false;
  }
}

/**
 * Refund a payment
 */
export async function refundPayment(
  paymentIntentId: string,
  amount?: number,
  reason?: string
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  try {
    const { data, error } = await supabase.functions.invoke('stripe-payment', {
      body: {
        action: 'refund_payment',
        paymentIntentId,
        amount,
        reason,
      },
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to refund payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Refund failed',
    };
  }
}

/**
 * Check if Apple Pay is available
 */
export async function isApplePaySupported(): Promise<boolean> {
  try {
    const { isApplePaySupported } = await import('@stripe/stripe-react-native');
    return await isApplePaySupported();
  } catch (error) {
    return false;
  }
}

/**
 * Check if Google Pay is available
 */
export async function isGooglePaySupported(): Promise<boolean> {
  try {
    const { isGooglePaySupported } = await import('@stripe/stripe-react-native');
    return await isGooglePaySupported();
  } catch (error) {
    return false;
  }
}

/**
 * Process Apple Pay payment
 */
export async function processApplePayPayment(params: {
  amount: number;
  currency?: string;
  description?: string;
  merchantIdentifier: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { presentApplePay, confirmApplePayPayment } = await import(
      '@stripe/stripe-react-native'
    );

    // Create payment intent first
    const paymentIntent = await createPaymentIntent({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
    });

    // Present Apple Pay sheet
    const { error: presentError } = await presentApplePay({
      cartItems: [
        {
          label: params.description || 'Payment',
          amount: (params.amount / 100).toFixed(2),
          paymentType: 'Immediate',
        },
      ],
      country: 'US',
      currency: params.currency || 'USD',
      requiredBillingContactFields: ['emailAddress', 'name'],
    });

    if (presentError) {
      return { success: false, error: presentError.message };
    }

    // Confirm payment
    const { error: confirmError } = await confirmApplePayPayment(
      paymentIntent.client_secret
    );

    if (confirmError) {
      return { success: false, error: confirmError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Apple Pay payment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Apple Pay failed',
    };
  }
}

/**
 * Process Google Pay payment
 */
export async function processGooglePayPayment(params: {
  amount: number;
  currency?: string;
  description?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { initGooglePay, presentGooglePay, createGooglePayPaymentMethod } = await import(
      '@stripe/stripe-react-native'
    );

    // Initialize Google Pay
    const { error: initError } = await initGooglePay({
      testEnv: __DEV__,
      merchantName: 'Your App Name',
      countryCode: 'US',
      billingAddressConfig: {
        format: 'FULL',
        isRequired: true,
      },
    });

    if (initError) {
      return { success: false, error: initError.message };
    }

    // Create payment intent
    const paymentIntent = await createPaymentIntent({
      amount: params.amount,
      currency: params.currency,
      description: params.description,
    });

    // Present Google Pay
    const { error: presentError } = await presentGooglePay({
      clientSecret: paymentIntent.client_secret,
      forSetupIntent: false,
    });

    if (presentError) {
      return { success: false, error: presentError.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Google Pay payment failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Google Pay failed',
    };
  }
}

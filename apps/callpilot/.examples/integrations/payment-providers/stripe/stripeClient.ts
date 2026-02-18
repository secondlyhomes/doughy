/**
 * Stripe Client Configuration
 *
 * Initializes and configures Stripe SDK for React Native.
 * Handles both test and production modes.
 */

import { initStripe, useStripe, useConfirmPayment } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';

const PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY;

if (!PUBLISHABLE_KEY) {
  throw new Error('Missing EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY environment variable');
}

const IS_TEST_MODE = PUBLISHABLE_KEY.startsWith('pk_test_');

/**
 * Initialize Stripe SDK
 * Call this early in app startup
 */
export async function initializeStripe() {
  try {
    await initStripe({
      publishableKey: PUBLISHABLE_KEY,
      merchantIdentifier: 'merchant.com.yourapp', // Required for Apple Pay
      urlScheme: 'yourapp', // Required for some payment methods
      setReturnUrlSchemeOnAndroid: true,
    });

    if (IS_TEST_MODE && __DEV__) {
      console.warn('⚠️ Stripe running in TEST mode');
    }

    return true;
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
    return false;
  }
}

/**
 * Stripe configuration constants
 */
export const STRIPE_CONFIG = {
  isTestMode: IS_TEST_MODE,
  publishableKey: PUBLISHABLE_KEY,

  // Supported payment methods
  paymentMethods: {
    card: true,
    applePay: Platform.OS === 'ios',
    googlePay: Platform.OS === 'android',
  },

  // Test cards (only in test mode)
  testCards: IS_TEST_MODE ? {
    success: '4242424242424242',
    declined: '4000000000000002',
    requiresAuth: '4000002500003155',
    insufficientFunds: '4000000000009995',
    expiredCard: '4000000000000069',
    processingError: '4000000000000119',
  } : undefined,
} as const;

/**
 * Hook for accessing Stripe SDK
 * Must be used within StripeProvider
 */
export function useStripeClient() {
  const stripe = useStripe();
  const { confirmPayment, loading } = useConfirmPayment();

  return {
    stripe,
    confirmPayment,
    loading,
    isReady: stripe !== null,
  };
}

/**
 * Validate card number using Stripe's algorithm (Luhn)
 */
export function validateCardNumber(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\s/g, '');

  if (!/^\d+$/.test(sanitized)) {
    return false;
  }

  let sum = 0;
  let isEven = false;

  for (let i = sanitized.length - 1; i >= 0; i--) {
    let digit = parseInt(sanitized[i], 10);

    if (isEven) {
      digit *= 2;
      if (digit > 9) {
        digit -= 9;
      }
    }

    sum += digit;
    isEven = !isEven;
  }

  return sum % 10 === 0;
}

/**
 * Format card number with spaces
 */
export function formatCardNumber(cardNumber: string): string {
  const sanitized = cardNumber.replace(/\s/g, '');
  const groups = sanitized.match(/.{1,4}/g) || [];
  return groups.join(' ');
}

/**
 * Validate expiry date (MM/YY format)
 */
export function validateExpiryDate(expiry: string): boolean {
  const [month, year] = expiry.split('/');

  if (!month || !year) {
    return false;
  }

  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(`20${year}`, 10);

  if (monthNum < 1 || monthNum > 12) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (yearNum < currentYear) {
    return false;
  }

  if (yearNum === currentYear && monthNum < currentMonth) {
    return false;
  }

  return true;
}

/**
 * Validate CVC/CVV
 */
export function validateCVC(cvc: string, cardBrand?: string): boolean {
  const length = cardBrand === 'amex' ? 4 : 3;
  return /^\d+$/.test(cvc) && cvc.length === length;
}

/**
 * Get card brand from number
 */
export function getCardBrand(cardNumber: string): string {
  const sanitized = cardNumber.replace(/\s/g, '');

  if (/^4/.test(sanitized)) {
    return 'visa';
  }
  if (/^5[1-5]/.test(sanitized)) {
    return 'mastercard';
  }
  if (/^3[47]/.test(sanitized)) {
    return 'amex';
  }
  if (/^6(?:011|5)/.test(sanitized)) {
    return 'discover';
  }
  if (/^(?:2131|1800|35)/.test(sanitized)) {
    return 'jcb';
  }
  if (/^3(?:0[0-5]|[68])/.test(sanitized)) {
    return 'dinersclub';
  }

  return 'unknown';
}

/**
 * Format currency amount
 */
export function formatCurrency(
  amount: number,
  currency: string = 'usd'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100); // Convert from cents
}

/**
 * Convert dollars to cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Convert cents to dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

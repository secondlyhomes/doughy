/**
 * Checkout Types
 *
 * TypeScript interfaces for the checkout flow.
 */

import type { CardFieldInput } from '@stripe/stripe-react-native';

/**
 * Props for the main CheckoutScreen component
 */
export interface CheckoutScreenProps {
  /** Amount in smallest currency unit (e.g., cents for USD) */
  amount: number;
  /** ISO 4217 currency code (default: 'usd') */
  currency?: string;
  /** Description shown to user */
  description?: string;
  /** Callback on successful payment */
  onSuccess?: () => void;
  /** Callback on cancel */
  onCancel?: () => void;
}

/**
 * Props for the OrderSummary component
 */
export interface OrderSummaryProps {
  amount: number;
  currency: string;
  description?: string;
}

/**
 * Props for the PaymentForm component
 */
export interface PaymentFormProps {
  onCardChange: (complete: boolean) => void;
  onSubmit: () => void;
  onCancel?: () => void;
  loading: boolean;
  cardComplete: boolean;
}

/**
 * Return type for useCheckout hook
 */
export interface UseCheckoutReturn {
  loading: boolean;
  cardComplete: boolean;
  setCardComplete: (complete: boolean) => void;
  handlePayment: () => Promise<void>;
}

/**
 * Payment intent creation params
 */
export interface PaymentIntentParams {
  amount: number;
  currency: string;
  description?: string;
}

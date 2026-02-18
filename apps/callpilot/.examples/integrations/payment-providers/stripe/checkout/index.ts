/**
 * Checkout Module
 *
 * Clean re-exports for the checkout flow.
 */

// Main screen component
export { CheckoutScreen } from './CheckoutScreen';

// Sub-components (for customization)
export { OrderSummary } from './components/OrderSummary';
export { PaymentForm } from './components/PaymentForm';

// Hook (for custom implementations)
export { useCheckout } from './hooks/useCheckout';

// Types
export type {
  CheckoutScreenProps,
  OrderSummaryProps,
  PaymentFormProps,
  UseCheckoutReturn,
  PaymentIntentParams,
} from './types';

// Styles (for extending)
export { checkoutStyles, orderSummaryStyles, paymentFormStyles } from './styles';

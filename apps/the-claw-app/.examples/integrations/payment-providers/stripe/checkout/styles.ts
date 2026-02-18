/**
 * Checkout Styles
 *
 * StyleSheet definitions for the checkout flow.
 */

import { StyleSheet } from 'react-native';

/**
 * Main checkout screen styles
 */
export const checkoutStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
  },
});

/**
 * Order summary component styles
 */
export const orderSummaryStyles = StyleSheet.create({
  header: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  amount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#0066ff',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
});

/**
 * Payment form component styles
 */
export const paymentFormStyles = StyleSheet.create({
  cardSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardField: {
    height: 50,
    marginVertical: 12,
  },
  card: {
    backgroundColor: '#f8f8f8',
    borderRadius: 8,
  },
  securityInfo: {
    padding: 20,
    backgroundColor: '#f0f9ff',
    marginHorizontal: 20,
    borderRadius: 8,
  },
  securityText: {
    fontSize: 14,
    color: '#0066ff',
    textAlign: 'center',
  },
  actions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  payButton: {
    backgroundColor: '#0066ff',
  },
  payButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
});

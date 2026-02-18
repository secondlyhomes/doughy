/**
 * StyleSheet definitions for Subscription Plans components
 */

import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
    padding: 16,
  },

  // Header styles
  header: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },

  // Plans list styles
  plans: {
    gap: 16,
    marginBottom: 24,
  },

  // Plan card styles
  planCard: {
    borderRadius: 12,
    padding: 20,
    position: 'relative',
  },
  recommendedBadge: {
    position: 'absolute',
    top: -10,
    right: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recommendedText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  savingsBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  savingsText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    marginBottom: 16,
  },
  selectedIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },

  // Price styles
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  priceAmount: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  priceInterval: {
    fontSize: 18,
    marginLeft: 4,
  },

  // Feature list styles
  features: {
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkmark: {
    fontSize: 16,
    color: '#10b981',
  },
  featureText: {
    fontSize: 14,
    flex: 1,
  },

  // Subscribe button styles
  subscribeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  subscribeButtonText: {
    fontSize: 18,
    fontWeight: '600',
  },

  // Disclaimer styles
  disclaimer: {
    textAlign: 'center',
    fontSize: 12,
    paddingHorizontal: 20,
  },
})

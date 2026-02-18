/**
 * StyleSheet definitions for Subscription Status components
 */

import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  // Container styles
  container: {
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },

  // Header styles
  header: {
    marginBottom: 20,
  },

  // Status row styles
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  trialText: {
    fontSize: 12,
  },

  // Title styles
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },

  // Detail section styles
  details: {
    gap: 12,
    marginBottom: 24,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Action button styles
  actions: {
    gap: 12,
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})

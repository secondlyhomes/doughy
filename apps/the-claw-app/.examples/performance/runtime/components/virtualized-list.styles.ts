/**
 * Styles for VirtualizedList components
 */

import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  // Simple item styles
  simpleItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  simpleTitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '500',
  },

  // Detailed item styles
  detailedItem: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5E5',
  },
  detailedTitle: {
    fontSize: 16,
    color: '#000000',
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },

  // Header item styles
  headerItem: {
    paddingVertical: 8,
    paddingHorizontal: 20,
    backgroundColor: '#F5F5F5',
  },
  headerTitle: {
    fontSize: 14,
    color: '#666666',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Shared styles
  itemPressed: {
    backgroundColor: '#F0F0F0',
  },

  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 16,
    color: '#999999',
    textAlign: 'center',
  },

  // Loading styles
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
  },
})

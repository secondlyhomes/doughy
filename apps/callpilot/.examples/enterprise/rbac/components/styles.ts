/**
 * styles.ts
 *
 * Shared styles for permission guard components.
 */

import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  unauthorized: {
    padding: 16,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  unauthorizedText: {
    color: '#991B1B',
    fontSize: 14,
    textAlign: 'center',
  },
})

/**
 * Shared Styles for Conditional Components
 */

import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  // Basic button styles
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Header styles
  header: {
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
  },
  iOSTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  androidTitle: {
    fontSize: 20,
    fontWeight: '500',
    color: '#000000',
  },

  // iOS button styles
  iOSButton: {
    backgroundColor: '#007AFF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  iOSButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },

  // Android button styles
  androidButton: {
    backgroundColor: '#0066CC',
    borderRadius: 4,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  androidButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },

  // Themed button
  themedButton: {
    backgroundColor: '#007AFF',
  },

  // Error styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
    color: '#000000',
  },
  errorMessage: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
})

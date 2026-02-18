/**
 * styles.ts
 *
 * StyleSheet definitions for Handoff components
 *
 * Note: The original Handoff.tsx used HTML elements (div, h1, p) which don't
 * require React Native StyleSheet. These styles are provided for proper
 * React Native implementation using View and Text components.
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
});

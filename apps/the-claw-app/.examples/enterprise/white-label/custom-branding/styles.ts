/**
 * Shared styles for Custom Branding components
 */

import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  // Button styles
  button: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontWeight: '600',
  },

  // Splash screen styles
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashImage: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  tagline: {
    fontSize: 16,
  },

  // Header styles
  header: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Container styles
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  contentOverlay: {
    flex: 1,
  },

  // Card styles
  card: {
    overflow: 'hidden',
  },

  // Input styles
  input: {
    borderWidth: 1,
  },
})

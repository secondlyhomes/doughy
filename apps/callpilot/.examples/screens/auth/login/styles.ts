/**
 * Login Screen Styles
 */

import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  // Container styles
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 48,
  },

  // Header styles
  header: {
    marginBottom: 40,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    marginTop: 8,
  },

  // Form styles
  form: {
    gap: 16,
  },
  errorContainer: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  loginButton: {
    marginTop: 8,
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 8,
  },

  // Footer styles
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 32,
  },
})

/**
 * styles.ts
 *
 * Shared styles for App Clip components
 */

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    padding: 20,
  },
  loadingText: {
    fontSize: 18,
    textAlign: 'center',
    marginTop: 100,
  },
  errorText: {
    fontSize: 18,
    color: '#FF3B30',
    textAlign: 'center',
    marginTop: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginTop: 40,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 17,
    color: '#6C6C70',
    marginTop: 8,
    marginBottom: 32,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  contentTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 17,
    color: '#6C6C70',
    marginBottom: 16,
  },
  actionList: {
    gap: 12,
  },
  upgradeSection: {
    padding: 20,
    backgroundColor: '#F2F2F7',
    borderRadius: 12,
    marginTop: 'auto',
  },
  upgradeText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 12,
  },
});

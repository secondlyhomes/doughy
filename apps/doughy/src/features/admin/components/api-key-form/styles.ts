// src/features/admin/components/api-key-form/styles.ts
// Styles for API key form components

import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  description: {
    fontSize: 12,
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 14,
  },
  eyeButton: {
    padding: 4,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    gap: 4,
    height: 40,
  },
  saveButton: {
    minWidth: 80,
  },
  editButton: {
    borderWidth: 1,
    minWidth: 90,
  },
  testButton: {
    borderWidth: 1,
    minWidth: 70,
  },
  replaceButton: {
    minWidth: 90,
  },
  replaceContainer: {
    gap: 8,
  },
  currentKeyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    gap: 8,
  },
  currentKeyLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  currentKeyValue: {
    fontSize: 12,
    fontFamily: 'monospace',
    flex: 1,
  },
  activeIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    borderWidth: 1,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '500',
  },
  statusInfo: {
    marginTop: 8,
  },
  latencyText: {
    fontSize: 11,
  },
});

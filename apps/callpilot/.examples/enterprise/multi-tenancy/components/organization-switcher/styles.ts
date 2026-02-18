/**
 * styles.ts
 *
 * StyleSheet definitions for the OrganizationSwitcher component.
 */

import { StyleSheet } from 'react-native'

export const styles = StyleSheet.create({
  // Container styles
  container: {
    marginVertical: 8,
  },

  // Current org trigger button
  currentOrg: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  orgInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  orgDetails: {
    marginLeft: 12,
    flex: 1,
  },
  orgName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  orgRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  chevron: {
    fontSize: 12,
    color: '#6B7280',
  },

  // Logo styles
  logo: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  logoPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemLogo: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
  itemLogoPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemLogoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    fontSize: 24,
    color: '#6B7280',
  },

  // Org list item styles
  orgItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  orgItemActive: {
    backgroundColor: '#EFF6FF',
  },
  itemDetails: {
    marginLeft: 12,
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111827',
  },
  itemRole: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
  checkmark: {
    fontSize: 20,
    color: '#3B82F6',
    fontWeight: 'bold',
  },

  // Create button styles
  createButton: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    alignItems: 'center',
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3B82F6',
  },
})

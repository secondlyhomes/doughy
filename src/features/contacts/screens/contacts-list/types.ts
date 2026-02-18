// src/features/contacts/screens/contacts-list/types.ts
// Type definitions for contacts list components

import type { ContactFilters, CrmContactType, CrmContactStatus, CrmContactSource } from '../../types';

export interface ContactsFiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  activeTypeFilter: CrmContactType | 'all';
  advancedFilters: ContactFilters;
  onTypeFilterChange: (type: CrmContactType | 'all') => void;
  onAdvancedFiltersChange: (filters: ContactFilters) => void;
  onClearAll: () => void;
}

export interface AddContactSheetProps {
  visible: boolean;
  onClose: () => void;
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  onFirstNameChange: (text: string) => void;
  onLastNameChange: (text: string) => void;
  onPhoneChange: (text: string) => void;
  onEmailChange: (text: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}

export interface FilterChipProps {
  label: string;
  isActive: boolean;
  onPress: () => void;
  accessibilityLabel: string;
}

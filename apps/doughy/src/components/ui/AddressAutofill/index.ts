// src/components/ui/AddressAutofill/index.ts
// Export AddressAutofill component and types

export { AddressAutofill } from './AddressAutofill';
export { AddressSuggestionItem } from './AddressSuggestionItem';
export type {
  AddressAutofillProps,
  AddressValue,
  AddressSource,
  AddressSuggestion,
} from './types';

// Re-export hooks for advanced usage
export { useAddressAutofill, useVerifiedAddressSearch, useOpenStreetMapSearch } from './hooks';

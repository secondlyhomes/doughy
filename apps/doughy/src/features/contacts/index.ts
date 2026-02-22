// src/features/contacts/index.ts
// Contacts Feature - Barrel Export
// Landlord platform CRM contacts management

// Screens
export { ContactsListScreen } from './screens/ContactsListScreen';
export { ContactDetailScreen } from './screens/ContactDetailScreen';

// Components
export { ContactCard } from './components/ContactCard';

// Hooks
export {
  useContacts,
  useContactsPaginated,
  useContact,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
} from './hooks/useContacts';

// Types
export * from './types';

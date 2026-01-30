// src/features/settings/services/seeders/index.ts
// Landlord seeder module - re-exports for backward compatibility

// Types
export type {
  SeedScenario,
  ClearDataResult,
  ClearDataError,
  PropertySeedData,
  ContactSeedData,
  BookingSeedData,
  ConversationSeedData,
  MessageSeedData,
} from './types';

// Common utilities
export {
  RENTAL_PROPERTY_IMAGES,
  getPropertyImage,
  getRandomPropertyImage,
  getUserId,
  ensureUserHasWorkspace,
  getRelativeDate,
  formatDateForDB,
  getRelativeDateString,
  getDateRange,
  getRelativeTimestamp,
} from './common';

// Entity seeders
export {
  createProperty,
  createProperties,
  deleteUserProperties,
  type CreatedProperty,
  createContact,
  createContacts,
  deleteLandlordContacts,
  type CreatedContact,
  createBookings,
  deleteUserBookings,
  type CreatedBooking,
  createConversations,
  createMessages,
  createMessagesForConversations,
  createPendingAIResponse,
  deleteUserConversations,
  type CreatedConversation,
} from './entities';

// Clear data
export { clearAllLandlordData } from './clearData';

// Scenarios will be imported separately to keep this file small
// The main landlordSeeder.ts file will compose scenarios from entities

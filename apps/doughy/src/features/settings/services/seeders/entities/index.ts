// src/features/settings/services/seeders/entities/index.ts
// Entity seeders for landlord platform

export {
  createProperty,
  createProperties,
  deleteUserProperties,
  type CreatedProperty,
} from './propertySeeder';

export {
  createContact,
  createContacts,
  deleteLandlordContacts,
  type CreatedContact,
} from './contactSeeder';

export {
  createBookings,
  deleteUserBookings,
  type CreatedBooking,
} from './bookingSeeder';

export {
  createConversations,
  createMessages,
  createMessagesForConversations,
  createPendingAIResponse,
  deleteUserConversations,
  type CreatedConversation,
} from './conversationSeeder';

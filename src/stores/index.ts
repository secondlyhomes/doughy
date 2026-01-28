// src/stores/index.ts
// Export all Zustand stores for the Landlord platform
// Part of Zone 3: UI scaffolding for the Doughy architecture refactor

// Rental Properties Store
export {
  useRentalPropertiesStore,
  selectProperties,
  selectActiveProperties,
  selectSelectedProperty,
  selectPropertyById,
} from './rental-properties-store';
export type {
  RentalProperty,
  PropertyType,
  RentalType,
  RateType,
  PropertyStatus,
  RentalPropertiesState,
} from './rental-properties-store';

// Rental Rooms Store
export {
  useRentalRoomsStore,
  selectRooms,
  selectRoomsByProperty,
  selectAvailableRooms,
  selectRoomById,
} from './rental-rooms-store';
export type {
  Room,
  RoomStatus,
  RentalRoomsState,
} from './rental-rooms-store';

// Rental Bookings Store
export {
  useRentalBookingsStore,
  selectBookings,
  selectBookingsWithRelations,
  selectSelectedBooking,
  selectBookingById,
  selectUpcomingBookings,
  selectActiveBookings,
} from './rental-bookings-store';
export type {
  Booking,
  BookingWithRelations,
  BookingType,
  BookingStatus,
  RentalBookingsState,
} from './rental-bookings-store';

// Rental Conversations Store
export {
  useRentalConversationsStore,
  selectConversations,
  selectConversationsWithRelations,
  selectSelectedConversation,
  selectMessages,
  selectPendingResponses,
  selectPendingCount,
  selectNeedsReviewConversations,
} from './rental-conversations-store';
export type {
  Conversation,
  ConversationWithRelations,
  Message,
  AIResponseQueueItem,
  Channel,
  ConversationStatus,
  MessageDirection,
  ContentType,
  SentBy,
  AIQueueStatus,
  RentalConversationsState,
} from './rental-conversations-store';

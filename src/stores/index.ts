// src/stores/index.ts
// Export all Zustand stores
// Consolidates stores from legacy /src/store/ and landlord platform stores

// App Store (global app state)
export { useAppStore } from './app-store';
export type { AppState } from './app-store';

// Google Store (re-export from integrations)
export { useGoogleStore } from './google-store';
export type { GoogleState, GoogleEvent } from './google-store';

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
  // New canonical names (use these)
  LandlordConversation,
  LandlordMessage,
  // Backward-compatible aliases (deprecated)
  Conversation,
  Message,
  // Other types
  ConversationWithRelations,
  AIResponseQueueItem,
  Channel,
  ConversationStatus,
  MessageDirection,
  ContentType,
  SentBy,
  AIQueueStatus,
  RentalConversationsState,
  EditSeverity,
  ApprovalMetadata,
} from './rental-conversations-store';

// Landlord Settings Store
export {
  useLandlordSettingsStore,
  selectAIMode,
  selectConfidenceThreshold,
  selectAlwaysReviewTopics,
  selectResponseStyle,
  selectNotificationPreferences,
  selectAIPersonality,
  selectLeadSettings,
  selectIsLandlordEnabled,
  selectActivePlatform,
  selectHasCompletedOnboarding,
  selectEffectiveThreshold,
  selectTopicRequiresReview,
} from './landlord-settings-store';
export type {
  AIMode,
  ResponseStyle,
  NotificationPreferences,
  AIPersonality,
  LeadSettings,
  LearningSettings,
  TemplateSettings,
  LandlordSettings,
  UserPlatformSettings,
  LandlordSettingsState,
} from './landlord-settings-store';

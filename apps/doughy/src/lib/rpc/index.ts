// src/lib/rpc/index.ts
// Centralized exports for RPC functions and mappers

// Investor domain
export {
  getDealsWithLead,
  getDealById,
  getPropertyDeals,
  getNudgeDeals,
  getPropertiesWithLead,
  getConversationsWithLead,
  getConversationById,
  getMailHistory,
  getMailHistoryStats,
  type GetDealsParams,
  type GetMailHistoryParams,
} from './investor';

// Landlord domain
export {
  getBookingsWithContact,
  getBookingById,
  getUpcomingBookings,
  getConversationsWithContact,
  getLandlordConversationById,
  type GetBookingsParams,
} from './landlord';

// CRM domain
export {
  getSkipTraceResults,
  getSkipTraceResultById,
  type GetSkipTraceResultsParams,
} from './crm';

// Integrations domain
export {
  getAccessCodesWithBooking,
  getAccessCodesByProperty,
} from './integrations';

// Public domain
export {
  getRecentCalls,
} from './public';

// Mappers
export {
  mapDealRPC,
  mapPropertyDealRPC,
  mapNudgeDealRPC,
  mapPropertyWithLeadRPC,
  mapInvestorConversationRPC,
  mapMailHistoryRPC,
  mapBookingRPC,
  mapLandlordConversationRPC,
  mapSkipTraceResultRPC,
  mapAccessCodeRPC,
  mapCallRPC,
} from './mappers';

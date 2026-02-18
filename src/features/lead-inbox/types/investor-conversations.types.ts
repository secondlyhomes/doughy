// src/features/lead-inbox/types/investor-conversations.types.ts
// Shared types for investor conversations - single source of truth
// Used by both the store and test factories

// Channel and status types matching database enums
export type InvestorChannel = 'sms' | 'email' | 'whatsapp' | 'phone';
export type InvestorConversationStatus = 'active' | 'resolved' | 'escalated' | 'archived';
export type MessageDirection = 'inbound' | 'outbound';
export type ContentType = 'text' | 'image' | 'file' | 'voice' | 'video';
export type InvestorSender = 'lead' | 'ai' | 'user';
export type AIQueueStatus = 'pending' | 'approved' | 'edited' | 'rejected' | 'expired' | 'sent';

// Edit severity for adaptive learning
export type EditSeverity = 'none' | 'minor' | 'major';

// AI Outcome types
export type AIOutcome = 'approved' | 'edited_minor' | 'edited_major' | 'rejected' | 'thumbs_up' | 'thumbs_down';

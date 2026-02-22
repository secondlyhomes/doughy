// src/integrations/supabase/types/constants.ts

// Status and state types
export type LeadStatus = 'active' | 'inactive' | 'new' | 'closed' | 'won' | 'lost';
export type MessageChannel = 'sms' | 'email';
export type MessageDirection = 'incoming' | 'outgoing';
export type MessageStatus = 'sent' | 'delivered' | 'failed' | 'pending';
export type PlanTier = 'free' | 'starter' | 'personal' | 'professional' | 'enterprise';
export type SmsOptStatus = 'opted_in' | 'opted_out' | 'pending' | 'new' | 'inactive';
export type UserRole = 'user' | 'admin';

// Address types (matches database ENUM address_source)
export type AddressSource = 'openstreetmap' | 'manual';

// src/features/settings/services/seeders/types.ts
// Type definitions for seeder scenarios

export interface SeedScenario {
  id: string;
  name: string;
  description: string;
  seed: (userId: string) => Promise<void>;
}

export interface ClearDataResult {
  success: boolean;
  errors: ClearDataError[];
}

export interface ClearDataError {
  table: string;
  message: string;
}

// Property creation data
export interface PropertySeedData {
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  property_type: 'single_family' | 'condo' | 'apartment' | 'townhouse' | 'multi_family';
  rental_type: 'str' | 'mtr' | 'ltr';
  bedrooms: number;
  bathrooms: number;
  square_feet?: number;
  base_rate: number;
  rate_type: 'nightly' | 'monthly';
  cleaning_fee?: number;
  security_deposit?: number;
  status?: 'active' | 'inactive' | 'maintenance';
  amenities?: string[];
  imageIndex?: number;
}

// Contact creation data
export interface ContactSeedData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  types: ('guest' | 'tenant' | 'lead')[];
  source: string;
  status: string;
  score: number;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

// Booking creation data
export interface BookingSeedData {
  propertyIndex: number;
  contactIndex: number;
  booking_type: 'reservation' | 'lease';
  status: 'pending' | 'confirmed' | 'active' | 'completed' | 'cancelled';
  startOffset: number; // days from today
  endOffset: number; // days from today
  rate: number;
  rate_type: 'nightly' | 'monthly';
  total_amount: number;
  source: string;
  notes?: string;
  deposit?: number;
  deposit_status?: 'pending' | 'received' | 'returned' | 'forfeited';
}

// Conversation creation data
export interface ConversationSeedData {
  contactIndex: number;
  propertyIndex: number;
  channel: 'email' | 'sms' | 'whatsapp' | 'phone';
  status: 'active' | 'resolved' | 'escalated' | 'archived';
  is_ai_enabled: boolean;
}

// Message creation data
export interface MessageSeedData {
  direction: 'inbound' | 'outbound';
  content: string;
  sent_by: 'contact' | 'ai' | 'user';
  ai_confidence?: number;
}

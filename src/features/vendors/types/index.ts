// src/features/vendors/types/index.ts
// TypeScript types for vendors feature

export type VendorCategory =
  | 'plumber'
  | 'electrician'
  | 'hvac'
  | 'cleaner'
  | 'handyman'
  | 'locksmith'
  | 'pest_control'
  | 'landscaper'
  | 'appliance_repair'
  | 'pool_service'
  | 'other';

export interface Vendor {
  id: string;
  user_id: string;
  property_id: string | null; // null = global vendor

  // Vendor details
  category: VendorCategory;
  name: string;
  company_name: string | null;

  // Contact info
  phone: string | null;
  email: string | null;
  address: string | null;

  // Preferences
  is_primary: boolean;
  preferred_contact_method: 'phone' | 'email' | 'sms';
  availability_notes: string | null;

  // Rates
  hourly_rate: number | null;
  service_fee: number | null;
  payment_terms: string | null;

  // Performance tracking
  rating: number | null; // 1-5
  total_jobs: number;
  last_used_at: string | null;

  // License/Insurance
  license_number: string | null;
  license_expires: string | null;
  insurance_verified: boolean;
  insurance_expires: string | null;

  // Notes
  notes: string | null;

  // Status
  is_active: boolean;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface VendorMessage {
  id: string;
  user_id: string;
  vendor_id: string;
  property_id: string | null;
  maintenance_id: string | null;
  turnover_id: string | null;

  // Message details
  channel: 'sms' | 'email' | 'phone';
  subject: string | null;
  body: string;

  // AI composition
  ai_composed: boolean;
  ai_prompt: string | null;

  // Status
  status: 'draft' | 'sent' | 'delivered' | 'read' | 'responded' | 'failed';
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;

  // Response
  response_received: boolean;
  response_body: string | null;
  response_received_at: string | null;

  // Error
  error_message: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateVendorInput {
  property_id?: string;
  category: VendorCategory;
  name: string;
  company_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_primary?: boolean;
  preferred_contact_method?: 'phone' | 'email' | 'sms';
  availability_notes?: string;
  hourly_rate?: number;
  service_fee?: number;
  payment_terms?: string;
  license_number?: string;
  license_expires?: string;
  insurance_verified?: boolean;
  insurance_expires?: string;
  notes?: string;
}

export interface UpdateVendorInput {
  category?: VendorCategory;
  name?: string;
  company_name?: string;
  phone?: string;
  email?: string;
  address?: string;
  is_primary?: boolean;
  preferred_contact_method?: 'phone' | 'email' | 'sms';
  availability_notes?: string;
  hourly_rate?: number;
  service_fee?: number;
  payment_terms?: string;
  rating?: number;
  license_number?: string;
  license_expires?: string;
  insurance_verified?: boolean;
  insurance_expires?: string;
  notes?: string;
  is_active?: boolean;
}

// Category display labels and icons
export const VENDOR_CATEGORY_CONFIG: Record<
  VendorCategory,
  { label: string; emoji: string }
> = {
  plumber: { label: 'Plumber', emoji: '🔧' },
  electrician: { label: 'Electrician', emoji: '⚡' },
  hvac: { label: 'HVAC', emoji: '❄️' },
  cleaner: { label: 'Cleaner', emoji: '🧹' },
  handyman: { label: 'Handyman', emoji: '🛠️' },
  locksmith: { label: 'Locksmith', emoji: '🔐' },
  pest_control: { label: 'Pest Control', emoji: '🐛' },
  landscaper: { label: 'Landscaper', emoji: '🌿' },
  appliance_repair: { label: 'Appliance Repair', emoji: '🔌' },
  pool_service: { label: 'Pool Service', emoji: '🏊' },
  other: { label: 'Other', emoji: '📋' },
};

// Rating display helper
export function getRatingStars(rating: number | null): string {
  if (!rating) return '-';
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return '★'.repeat(fullStars) + (hasHalf ? '½' : '') + '☆'.repeat(5 - Math.ceil(rating));
}

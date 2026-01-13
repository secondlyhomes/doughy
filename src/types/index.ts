// Shared types for Doughy AI Mobile
// All zones should import types from this file

// ============================================
// Navigation Types (re-exported from routes/types.ts)
// ============================================
export type {
  AuthStackParamList,
  MainTabParamList,
  PropertiesStackParamList,
  LeadsStackParamList,
  ConversationsStackParamList,
  SettingsStackParamList,
  AdminStackParamList,
  RootStackParamList,
} from '@/routes/types';

// ============================================
// User & Auth Types
// ============================================
export interface User {
  id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
  expires_at?: number;
}

// ============================================
// Property Types
// ============================================
export interface Property {
  id: string;
  user_id: string;
  workspace_id?: string;

  // Basic Info
  address: string;
  city?: string;
  state?: string;
  zip_code?: string;
  country?: string;

  // Property Details
  property_type?: 'single_family' | 'multi_family' | 'condo' | 'townhouse' | 'land' | 'commercial' | 'other';
  status?: 'active' | 'pending' | 'sold' | 'off_market';
  price?: number;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  lot_size?: number;
  year_built?: number;

  // Location
  latitude?: number;
  longitude?: number;

  // Media
  images?: string[];
  primary_image_url?: string;

  // Description
  description?: string;
  features?: string[];

  // Metadata
  created_at: string;
  updated_at?: string;
}

export type PropertyFormData = Omit<Property, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ============================================
// Lead Types
// ============================================
export interface Lead {
  id: string;
  user_id: string;
  workspace_id?: string;

  // Contact Info
  first_name: string;
  last_name?: string;
  email?: string;
  phone?: string;

  // Lead Details
  source?: 'website' | 'referral' | 'social' | 'cold_call' | 'email' | 'other';
  status?: 'new' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  priority?: 'low' | 'medium' | 'high';

  // Property Interest
  property_id?: string;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;

  // Notes
  notes?: string;
  tags?: string[];

  // Metadata
  created_at: string;
  updated_at?: string;
  last_contacted_at?: string;
}

export type LeadFormData = Omit<Lead, 'id' | 'user_id' | 'created_at' | 'updated_at'>;

// ============================================
// Conversation/Message Types
// ============================================
export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  created_at: string;
  metadata?: Record<string, unknown>;
}

export interface Conversation {
  id: string;
  user_id: string;
  title?: string;
  messages: Message[];
  created_at: string;
  updated_at?: string;
}

// ============================================
// Dashboard Types
// ============================================
export interface DashboardStats {
  totalLeads: number;
  totalProperties: number;
  monthlyLeads: number;
  conversionRate: number;
  recentActivity: Activity[];
}

export interface Activity {
  id: string;
  type: 'lead_created' | 'property_added' | 'lead_updated' | 'message_received';
  description: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

// ============================================
// API Response Types
// ============================================
export interface ApiResponse<T> {
  data: T | null;
  error: ApiError | null;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, unknown>;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// ============================================
// Form Types
// ============================================
export interface SelectOption {
  label: string;
  value: string;
}

// ============================================
// Theme Types
// ============================================
export type ColorScheme = 'light' | 'dark' | 'system';

export interface ThemeColors {
  background: string;
  foreground: string;
  card: string;
  cardForeground: string;
  primary: string;
  primaryForeground: string;
  secondary: string;
  secondaryForeground: string;
  muted: string;
  mutedForeground: string;
  accent: string;
  accentForeground: string;
  destructive: string;
  destructiveForeground: string;
  border: string;
  input: string;
  ring: string;
}

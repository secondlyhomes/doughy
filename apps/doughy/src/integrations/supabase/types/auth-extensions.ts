// src/integrations/types/auth-extensions.ts
import { Database } from '../types';

// Define type for User Plan data
export interface UserPlan {
  user_id: string;
  tier?: Database['public']['Enums']['plan_tier'] | string;
  monthly_token_cap?: number;
}

// Define type for API Key data
export interface ApiKey {
  id?: string;
  service: string;
  key_ciphertext: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Define error response type
export interface ErrorResponse {
  error: string;
}
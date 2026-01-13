// src/features/auth/types/index.ts
// Auth-related types for the mobile app

import { Session, User } from '@supabase/supabase-js';

// Must match Database["public"]["Enums"]["user_role"]
export type UserRole = 'admin' | 'standard' | 'user' | 'support';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  workspace_id?: string | null;
  email_verified?: boolean;
  onboarding_complete?: boolean;
  full_name?: string;
  avatar_url?: string;
}

export interface AuthState {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  refetchProfile: () => Promise<void>;
}

export interface LoginFormData {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface SignUpFormData {
  email: string;
  password: string;
  confirmPassword: string;
  fullName?: string;
}

export interface ResetPasswordFormData {
  email: string;
}

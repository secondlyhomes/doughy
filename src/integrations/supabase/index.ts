// src/integrations/supabase/index.ts
// Export Supabase client and types

// Re-export from lib for convenience
export { supabase, SUPABASE_URL } from '@/lib/supabase';

// Export types
export type { Database } from './types';
export * from './types/index';

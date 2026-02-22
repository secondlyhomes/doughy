/**
 * Database Types
 *
 * Auto-generated from Supabase schema
 * Run: npm run gen:types
 *
 * This placeholder prevents import errors before Supabase is configured
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // Tables will be generated here
      // Example:
      // users: {
      //   Row: { id: string; email: string; created_at: string }
      //   Insert: { id?: string; email: string; created_at?: string }
      //   Update: { id?: string; email?: string; created_at?: string }
      // }
    }
    Views: {
      // Views will be generated here
    }
    Functions: {
      // Functions will be generated here
    }
    Enums: {
      // Enums will be generated here
    }
  }
}

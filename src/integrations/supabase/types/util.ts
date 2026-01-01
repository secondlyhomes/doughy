import type { Database } from './base';

// Simpler utility types that still provide type safety
export type Table<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];

export type TableInsert<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];

export type TableUpdate<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

export type Enum<T extends keyof Database['public']['Enums']> = 
  Database['public']['Enums'][T];

export type CompositeType<T extends keyof Database['public']['CompositeTypes']> = 
  Database['public']['CompositeTypes'][T];

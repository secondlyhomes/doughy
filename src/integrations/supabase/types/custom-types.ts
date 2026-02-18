
import { Database } from '../types';

// Re-export the Database type for convenience
export type { Database };

// Define any additional custom types here
export type CustomDatabaseTypes = {
  // Add any custom types here that you need
};

// Create utility type helpers for easier access to tables
export type Tables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Row'];
  
export type InsertTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Insert'];
  
export type UpdateTables<T extends keyof Database['public']['Tables']> = 
  Database['public']['Tables'][T]['Update'];

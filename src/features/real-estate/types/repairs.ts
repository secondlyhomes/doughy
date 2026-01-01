// src/features/real-estate/types/repairs.ts
export type RepairCategory = "interior" | "exterior" | "structural" | "electrical" | "plumbing" | "hvac" | "systems" | "other";

export interface RepairItemInput {
  id?: string;
  category: RepairCategory;
  item_description: string;
  cost: number;
  notes?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
}

// Add the RepairEstimate interface
export interface RepairEstimate {
  id: string;
  property_id: string;
  category: RepairCategory;
  description: string; // This matches what's in the database
  estimate: number;    // This matches what's in the database
  notes?: string;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_by?: string;
  created_at?: string;
  updated_at?: string;
  workspace_id?: string;
}

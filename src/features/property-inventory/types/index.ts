// src/features/property-inventory/types/index.ts
// TypeScript types for property inventory feature

export type InventoryCategory =
  | 'appliance'
  | 'hvac'
  | 'structure'
  | 'plumbing'
  | 'furniture'
  | 'electronics'
  | 'other';

export type InventoryCondition =
  | 'excellent'
  | 'good'
  | 'fair'
  | 'poor'
  | 'needs_replacement';

export interface InventoryPhoto {
  url: string;
  caption?: string;
  uploaded_at?: string;
}

export interface InventoryItem {
  id: string;
  user_id: string;
  property_id: string;

  // Item identification
  name: string;
  category: InventoryCategory;
  location: string | null;

  // Product details
  brand: string | null;
  model: string | null;
  serial_number: string | null;

  // Dates
  purchase_date: string | null;
  install_date: string | null;
  warranty_expires: string | null;

  // Condition tracking
  condition: InventoryCondition;
  last_inspected_at: string | null;
  inspection_notes: string | null;

  // Financial
  purchase_price: number | null;
  replacement_cost: number | null;

  // Photos
  photos: InventoryPhoto[];

  // Notes
  notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateInventoryItemInput {
  property_id: string;
  name: string;
  category: InventoryCategory;
  location?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  install_date?: string;
  warranty_expires?: string;
  condition?: InventoryCondition;
  purchase_price?: number;
  replacement_cost?: number;
  photos?: InventoryPhoto[];
  notes?: string;
}

export interface UpdateInventoryItemInput {
  name?: string;
  category?: InventoryCategory;
  location?: string;
  brand?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string;
  install_date?: string;
  warranty_expires?: string;
  condition?: InventoryCondition;
  last_inspected_at?: string;
  inspection_notes?: string;
  purchase_price?: number;
  replacement_cost?: number;
  photos?: InventoryPhoto[];
  notes?: string;
}

// Category display labels
export const INVENTORY_CATEGORY_LABELS: Record<InventoryCategory, string> = {
  appliance: 'Appliances',
  hvac: 'HVAC',
  structure: 'Structure',
  plumbing: 'Plumbing',
  furniture: 'Furniture',
  electronics: 'Electronics',
  other: 'Other',
};

// Condition display labels and colors
export const INVENTORY_CONDITION_CONFIG: Record<
  InventoryCondition,
  { label: string; variant: 'success' | 'info' | 'warning' | 'danger' | 'secondary' }
> = {
  excellent: { label: 'Excellent', variant: 'success' },
  good: { label: 'Good', variant: 'info' },
  fair: { label: 'Fair', variant: 'warning' },
  poor: { label: 'Poor', variant: 'danger' },
  needs_replacement: { label: 'Needs Replacement', variant: 'danger' },
};

// Common locations for quick selection
export const COMMON_LOCATIONS = [
  'Kitchen',
  'Living Room',
  'Master Bedroom',
  'Bedroom 2',
  'Bedroom 3',
  'Bathroom 1',
  'Bathroom 2',
  'Garage',
  'Laundry Room',
  'Backyard',
  'Front Porch',
  'Basement',
  'Attic',
  'Office',
  'Dining Room',
] as const;

// src/features/property-maintenance/types/index.ts
// TypeScript types for property maintenance feature

export type MaintenanceStatus =
  | 'reported'
  | 'scheduled'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

export type MaintenancePriority = 'emergency' | 'high' | 'medium' | 'low';

export type MaintenanceCategory =
  | 'plumbing'
  | 'electrical'
  | 'hvac'
  | 'appliance'
  | 'structural'
  | 'pest_control'
  | 'landscaping'
  | 'cleaning'
  | 'general'
  | 'other';

export type MaintenanceChargeTo = 'owner' | 'guest' | 'warranty' | 'insurance';

export interface MaintenancePhoto {
  url: string;
  type: 'before' | 'after' | 'receipt';
  caption?: string;
  uploaded_at?: string;
}

export interface MaintenanceWorkOrder {
  id: string;
  user_id: string;
  property_id: string;

  // Work order identification
  work_order_number: string;

  // Issue details
  title: string;
  description: string | null;
  category: MaintenanceCategory;
  location: string | null;

  // Status and priority
  status: MaintenanceStatus;
  priority: MaintenancePriority;

  // Scheduling
  reported_at: string;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;

  // Vendor assignment
  vendor_id: string | null;
  vendor_name: string | null;
  vendor_phone: string | null;

  // Financial
  estimated_cost: number | null;
  actual_cost: number | null;
  charge_to: MaintenanceChargeTo;

  // Guest charge tracking
  is_guest_chargeable: boolean;
  guest_charge_amount: number | null;
  guest_charge_approved: boolean | null;
  guest_charge_approved_at: string | null;

  // Links
  booking_id: string | null;
  inventory_item_id: string | null;

  // Photos
  photos: MaintenancePhoto[];

  // Receipt
  receipt_url: string | null;
  receipt_amount: number | null;

  // Notes
  notes: string | null;
  resolution_notes: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenanceInput {
  property_id: string;
  title: string;
  description?: string;
  category: MaintenanceCategory;
  location?: string;
  priority?: MaintenancePriority;
  estimated_cost?: number;
  charge_to?: MaintenanceChargeTo;
  booking_id?: string;
  inventory_item_id?: string;
  photos?: MaintenancePhoto[];
  notes?: string;
}

export interface UpdateMaintenanceInput {
  title?: string;
  description?: string;
  category?: MaintenanceCategory;
  location?: string;
  status?: MaintenanceStatus;
  priority?: MaintenancePriority;
  scheduled_at?: string;
  started_at?: string;
  completed_at?: string;
  vendor_id?: string;
  vendor_name?: string;
  vendor_phone?: string;
  estimated_cost?: number;
  actual_cost?: number;
  charge_to?: MaintenanceChargeTo;
  is_guest_chargeable?: boolean;
  guest_charge_amount?: number;
  guest_charge_approved?: boolean;
  photos?: MaintenancePhoto[];
  receipt_url?: string;
  receipt_amount?: number;
  notes?: string;
  resolution_notes?: string;
}

// Status display configuration
export const MAINTENANCE_STATUS_CONFIG: Record<
  MaintenanceStatus,
  { label: string; variant: 'default' | 'info' | 'warning' | 'success' | 'secondary' }
> = {
  reported: { label: 'Reported', variant: 'warning' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  in_progress: { label: 'In Progress', variant: 'default' },
  completed: { label: 'Completed', variant: 'success' },
  cancelled: { label: 'Cancelled', variant: 'secondary' },
};

// Priority display configuration
export const MAINTENANCE_PRIORITY_CONFIG: Record<
  MaintenancePriority,
  { label: string; variant: 'danger' | 'warning' | 'info' | 'secondary'; color: string }
> = {
  emergency: { label: 'Emergency', variant: 'danger', color: '#EF4444' },
  high: { label: 'High', variant: 'warning', color: '#F59E0B' },
  medium: { label: 'Medium', variant: 'info', color: '#3B82F6' },
  low: { label: 'Low', variant: 'secondary', color: '#6B7280' },
};

// Category display labels
export const MAINTENANCE_CATEGORY_LABELS: Record<MaintenanceCategory, string> = {
  plumbing: 'Plumbing',
  electrical: 'Electrical',
  hvac: 'HVAC',
  appliance: 'Appliance',
  structural: 'Structural',
  pest_control: 'Pest Control',
  landscaping: 'Landscaping',
  cleaning: 'Cleaning',
  general: 'General',
  other: 'Other',
};

// Charge to display labels
export const CHARGE_TO_LABELS: Record<MaintenanceChargeTo, string> = {
  owner: 'Property Owner',
  guest: 'Guest',
  warranty: 'Warranty',
  insurance: 'Insurance',
};

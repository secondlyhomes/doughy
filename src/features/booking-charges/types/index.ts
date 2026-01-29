// src/features/booking-charges/types/index.ts
// Type definitions for booking charges and deposit settlement

/** Booking charge status */
export type BookingChargeStatus = 'pending' | 'approved' | 'disputed' | 'deducted';

/** Booking charge type */
export type BookingChargeType = 'damage' | 'cleaning' | 'missing_item' | 'late_checkout' | 'other';

/** Charge type configuration */
export interface ChargeTypeConfig {
  label: string;
  emoji: string;
  description: string;
}

export const CHARGE_TYPE_CONFIG: Record<BookingChargeType, ChargeTypeConfig> = {
  damage: {
    label: 'Damage',
    emoji: '🔨',
    description: 'Property damage requiring repair',
  },
  cleaning: {
    label: 'Extra Cleaning',
    emoji: '🧹',
    description: 'Additional cleaning required beyond normal',
  },
  missing_item: {
    label: 'Missing Item',
    emoji: '❓',
    description: 'Item missing from property',
  },
  late_checkout: {
    label: 'Late Checkout',
    emoji: '⏰',
    description: 'Guest checked out after scheduled time',
  },
  other: {
    label: 'Other',
    emoji: '📝',
    description: 'Other charges',
  },
};

/** Status configuration */
export interface ChargeStatusConfig {
  label: string;
  variant: 'warning' | 'success' | 'destructive' | 'default';
}

export const CHARGE_STATUS_CONFIG: Record<BookingChargeStatus, ChargeStatusConfig> = {
  pending: { label: 'Pending', variant: 'warning' },
  approved: { label: 'Approved', variant: 'success' },
  disputed: { label: 'Disputed', variant: 'destructive' },
  deducted: { label: 'Deducted', variant: 'default' },
};

/** Photo attached to a charge */
export interface ChargePhoto {
  url: string;
  caption?: string;
}

/** Booking charge record */
export interface BookingCharge {
  id: string;
  user_id: string;
  booking_id: string;
  maintenance_id?: string | null;
  type: BookingChargeType;
  description: string;
  amount: number;
  status: BookingChargeStatus;
  photos?: ChargePhoto[] | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/** Booking charge with relations */
export interface BookingChargeWithRelations extends BookingCharge {
  maintenance?: {
    id: string;
    title: string;
    work_order_number: string;
    actual_cost?: number | null;
  } | null;
}

/** Deposit settlement status */
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'disputed';

/** Deposit settlement record */
export interface DepositSettlement {
  id: string;
  user_id: string;
  booking_id: string;
  deposit_held: number;
  total_deductions: number;
  amount_returned: number;
  status: SettlementStatus;
  settled_at?: string | null;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

/** Settlement with charges */
export interface SettlementWithCharges extends DepositSettlement {
  charges: BookingChargeWithRelations[];
}

/** Input for creating a charge */
export interface CreateChargeInput {
  booking_id: string;
  maintenance_id?: string;
  type: BookingChargeType;
  description: string;
  amount: number;
  photos?: ChargePhoto[];
  notes?: string;
}

/** Input for updating a charge */
export interface UpdateChargeInput {
  type?: BookingChargeType;
  description?: string;
  amount?: number;
  status?: BookingChargeStatus;
  photos?: ChargePhoto[];
  notes?: string;
}

/** Summary of charges for a booking */
export interface BookingChargesSummary {
  totalCharges: number;
  pendingCharges: number;
  approvedCharges: number;
  depositHeld: number;
  amountToReturn: number;
  chargeCount: number;
}

// src/stores/booking-charges-store.ts
// Zustand store for booking charges and deposit settlement

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  BookingCharge,
  BookingChargeWithRelations,
  DepositSettlement,
  SettlementWithCharges,
  CreateChargeInput,
  UpdateChargeInput,
  BookingChargesSummary,
  BookingChargeStatus,
  SettlementStatus,
} from '@/features/booking-charges/types';

interface BookingChargesState {
  // State
  charges: BookingChargeWithRelations[];
  settlements: SettlementWithCharges[];
  isLoading: boolean;
  error: string | null;

  // Actions - Charges
  fetchChargesByBooking: (bookingId: string) => Promise<BookingChargeWithRelations[]>;
  fetchChargeById: (chargeId: string) => Promise<BookingChargeWithRelations | null>;
  createCharge: (input: CreateChargeInput) => Promise<BookingCharge>;
  updateCharge: (chargeId: string, input: UpdateChargeInput) => Promise<BookingCharge>;
  deleteCharge: (chargeId: string) => Promise<void>;
  updateChargeStatus: (chargeId: string, status: BookingChargeStatus) => Promise<BookingCharge>;

  // Actions - Settlements
  fetchSettlementByBooking: (bookingId: string) => Promise<SettlementWithCharges | null>;
  createSettlement: (bookingId: string, depositHeld: number) => Promise<DepositSettlement>;
  updateSettlementStatus: (settlementId: string, status: SettlementStatus) => Promise<DepositSettlement>;
  settleDeposit: (settlementId: string, notes?: string) => Promise<DepositSettlement>;

  // Helpers
  calculateSummary: (bookingId: string, depositHeld: number) => Promise<BookingChargesSummary>;
  clearError: () => void;
  reset: () => void;
}

export const useBookingChargesStore = create<BookingChargesState>((set, get) => ({
  charges: [],
  settlements: [],
  isLoading: false,
  error: null,

  fetchChargesByBooking: async (bookingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('landlord')
        .from('booking_charges')
        .select(`
          *,
          maintenance:maintenance_records(
            id,
            title,
            work_order_number,
            actual_cost
          )
        `)
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const charges = (data || []) as BookingChargeWithRelations[];
      set({ charges, isLoading: false });
      return charges;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch charges';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchChargeById: async (chargeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('landlord')
        .from('booking_charges')
        .select(`
          *,
          maintenance:maintenance_records(
            id,
            title,
            work_order_number,
            actual_cost
          )
        `)
        .eq('id', chargeId)
        .single();

      if (error) throw error;

      set({ isLoading: false });
      return data as BookingChargeWithRelations;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch charge';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  createCharge: async (input: CreateChargeInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .schema('landlord')
        .from('booking_charges')
        .insert({
          user_id: userData.user.id,
          booking_id: input.booking_id,
          maintenance_id: input.maintenance_id || null,
          type: input.type,
          description: input.description,
          amount: input.amount,
          status: 'pending',
          photos: input.photos || null,
          notes: input.notes || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Refresh charges list
      await get().fetchChargesByBooking(input.booking_id);

      set({ isLoading: false });
      return data as BookingCharge;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create charge';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateCharge: async (chargeId: string, input: UpdateChargeInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('landlord')
        .from('booking_charges')
        .update({
          ...input,
          updated_at: new Date().toISOString(),
        })
        .eq('id', chargeId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => ({
        charges: state.charges.map((c) =>
          c.id === chargeId ? { ...c, ...data } : c
        ),
        isLoading: false,
      }));

      return data as BookingCharge;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update charge';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteCharge: async (chargeId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .schema('landlord')
        .from('booking_charges')
        .delete()
        .eq('id', chargeId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        charges: state.charges.filter((c) => c.id !== chargeId),
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete charge';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateChargeStatus: async (chargeId: string, status: BookingChargeStatus) => {
    return get().updateCharge(chargeId, { status });
  },

  fetchSettlementByBooking: async (bookingId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .schema('landlord')
        .from('deposit_settlements')
        .select('*')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        set({ isLoading: false });
        return null;
      }

      // Fetch associated charges
      const charges = await get().fetchChargesByBooking(bookingId);

      const settlement: SettlementWithCharges = {
        ...data,
        charges,
      };

      set((state) => ({
        settlements: [
          ...state.settlements.filter((s) => s.id !== settlement.id),
          settlement,
        ],
        isLoading: false,
      }));

      return settlement;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch settlement';
      set({ error: message, isLoading: false });
      return null;
    }
  },

  createSettlement: async (bookingId: string, depositHeld: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Calculate deductions from approved charges
      const charges = get().charges.filter(
        (c) => c.booking_id === bookingId && c.status === 'approved'
      );
      const totalDeductions = charges.reduce((sum, c) => sum + c.amount, 0);
      const amountReturned = Math.max(0, depositHeld - totalDeductions);

      const { data, error } = await supabase
        .schema('landlord')
        .from('deposit_settlements')
        .insert({
          user_id: userData.user.id,
          booking_id: bookingId,
          deposit_held: depositHeld,
          total_deductions: totalDeductions,
          amount_returned: amountReturned,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      set({ isLoading: false });
      return data as DepositSettlement;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create settlement';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  updateSettlementStatus: async (settlementId: string, status: SettlementStatus) => {
    set({ isLoading: true, error: null });
    try {
      const updateData: Partial<DepositSettlement> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'completed') {
        updateData.settled_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .schema('landlord')
        .from('deposit_settlements')
        .update(updateData)
        .eq('id', settlementId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => ({
        settlements: state.settlements.map((s) =>
          s.id === settlementId ? { ...s, ...data } : s
        ),
        isLoading: false,
      }));

      return data as DepositSettlement;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update settlement';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  settleDeposit: async (settlementId: string, notes?: string) => {
    set({ isLoading: true, error: null });
    try {
      // First, mark all approved charges as deducted
      const settlement = get().settlements.find((s) => s.id === settlementId);
      if (settlement) {
        const approvedCharges = settlement.charges.filter((c) => c.status === 'approved');
        for (const charge of approvedCharges) {
          await get().updateChargeStatus(charge.id, 'deducted');
        }
      }

      // Then complete the settlement
      const updateData: Partial<DepositSettlement> = {
        status: 'completed',
        settled_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (notes) {
        updateData.notes = notes;
      }

      const { data, error } = await supabase
        .schema('landlord')
        .from('deposit_settlements')
        .update(updateData)
        .eq('id', settlementId)
        .select()
        .single();

      if (error) throw error;

      set({ isLoading: false });
      return data as DepositSettlement;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to settle deposit';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  calculateSummary: async (bookingId: string, depositHeld: number) => {
    const charges = get().charges.filter((c) => c.booking_id === bookingId);

    const totalCharges = charges.reduce((sum, c) => sum + c.amount, 0);
    const pendingCharges = charges
      .filter((c) => c.status === 'pending')
      .reduce((sum, c) => sum + c.amount, 0);
    const approvedCharges = charges
      .filter((c) => c.status === 'approved' || c.status === 'deducted')
      .reduce((sum, c) => sum + c.amount, 0);

    return {
      totalCharges,
      pendingCharges,
      approvedCharges,
      depositHeld,
      amountToReturn: Math.max(0, depositHeld - approvedCharges),
      chargeCount: charges.length,
    };
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      charges: [],
      settlements: [],
      isLoading: false,
      error: null,
    }),
}));

// Selectors
export const selectChargesByBooking = (bookingId: string) => (state: BookingChargesState) =>
  state.charges.filter((c) => c.booking_id === bookingId);

export const selectPendingCharges = (bookingId: string) => (state: BookingChargesState) =>
  state.charges.filter((c) => c.booking_id === bookingId && c.status === 'pending');

export const selectApprovedCharges = (bookingId: string) => (state: BookingChargesState) =>
  state.charges.filter(
    (c) => c.booking_id === bookingId && (c.status === 'approved' || c.status === 'deducted')
  );

export const selectSettlementByBooking = (bookingId: string) => (state: BookingChargesState) =>
  state.settlements.find((s) => s.booking_id === bookingId);

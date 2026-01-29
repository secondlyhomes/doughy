// src/stores/turnovers-store.ts
// Zustand store for turnovers state management

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import {
  Turnover,
  TurnoverWithRelations,
  CreateTurnoverInput,
  UpdateTurnoverInput,
  TurnoverStatus,
} from '@/features/turnovers/types';

interface TurnoversState {
  turnovers: TurnoverWithRelations[];
  isLoading: boolean;
  error: Error | null;

  // Actions
  fetchTurnovers: (propertyId?: string) => Promise<TurnoverWithRelations[]>;
  fetchTurnoverById: (id: string) => Promise<TurnoverWithRelations | null>;
  fetchUpcomingTurnovers: (propertyId?: string, limit?: number) => Promise<TurnoverWithRelations[]>;
  createTurnover: (input: CreateTurnoverInput) => Promise<Turnover>;
  updateTurnover: (id: string, input: UpdateTurnoverInput) => Promise<Turnover>;
  updateTurnoverStatus: (id: string, status: TurnoverStatus) => Promise<Turnover>;
  deleteTurnover: (id: string) => Promise<void>;
  scheduleCleaning: (id: string, vendorId: string, scheduledAt: string) => Promise<Turnover>;
  markCleaningDone: (id: string) => Promise<Turnover>;
  markInspected: (id: string, notes?: string) => Promise<Turnover>;
  markReady: (id: string) => Promise<Turnover>;
  clearError: () => void;
}

export const useTurnoversStore = create<TurnoversState>((set, get) => ({
  turnovers: [],
  isLoading: false,
  error: null,

  fetchTurnovers: async (propertyId?: string) => {
    set({ isLoading: true, error: null });
    try {
      let query = supabase
        .from('landlord_turnovers')
        .select(`
          *,
          property:landlord_properties(id, name, address),
          cleaner:landlord_vendors!cleaner_vendor_id(id, name, phone, email),
          booking:landlord_bookings(
            id,
            contact:contacts(first_name, last_name)
          )
        `)
        .order('checkout_at', { ascending: false });

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const turnovers = (data || []) as TurnoverWithRelations[];
      set({ turnovers, isLoading: false });
      return turnovers;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  fetchTurnoverById: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('landlord_turnovers')
        .select(`
          *,
          property:landlord_properties(id, name, address),
          cleaner:landlord_vendors!cleaner_vendor_id(id, name, phone, email),
          booking:landlord_bookings(
            id,
            contact:contacts(first_name, last_name)
          )
        `)
        .eq('id', id)
        .single();

      if (error) throw error;

      set({ isLoading: false });
      return data as TurnoverWithRelations;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      return null;
    }
  },

  fetchUpcomingTurnovers: async (propertyId?: string, limit = 5) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      let query = supabase
        .from('landlord_turnovers')
        .select(`
          *,
          property:landlord_properties(id, name, address),
          cleaner:landlord_vendors!cleaner_vendor_id(id, name, phone, email)
        `)
        .gte('checkout_at', now)
        .neq('status', 'ready')
        .order('checkout_at', { ascending: true })
        .limit(limit);

      if (propertyId) {
        query = query.eq('property_id', propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({ isLoading: false });
      return (data || []) as TurnoverWithRelations[];
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  createTurnover: async (input: CreateTurnoverInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data: user } = await supabase.auth.getUser();
      if (!user.user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('landlord_turnovers')
        .insert({
          ...input,
          user_id: user.user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        turnovers: [data as TurnoverWithRelations, ...state.turnovers],
        isLoading: false,
      }));

      return data as Turnover;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateTurnover: async (id: string, input: UpdateTurnoverInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('landlord_turnovers')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        turnovers: state.turnovers.map((t) =>
          t.id === id ? { ...t, ...data } : t
        ),
        isLoading: false,
      }));

      return data as Turnover;
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  updateTurnoverStatus: async (id: string, status: TurnoverStatus) => {
    return get().updateTurnover(id, { status });
  },

  deleteTurnover: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('landlord_turnovers')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        turnovers: state.turnovers.filter((t) => t.id !== id),
        isLoading: false,
      }));
    } catch (error) {
      set({ error: error as Error, isLoading: false });
      throw error;
    }
  },

  scheduleCleaning: async (id: string, vendorId: string, scheduledAt: string) => {
    return get().updateTurnover(id, {
      cleaner_vendor_id: vendorId,
      cleaning_scheduled_at: scheduledAt,
      status: 'cleaning_scheduled',
    });
  },

  markCleaningDone: async (id: string) => {
    return get().updateTurnover(id, {
      cleaning_completed_at: new Date().toISOString(),
      status: 'cleaning_done',
    });
  },

  markInspected: async (id: string, notes?: string) => {
    return get().updateTurnover(id, {
      inspection_completed_at: new Date().toISOString(),
      inspection_notes: notes,
      status: 'inspected',
    });
  },

  markReady: async (id: string) => {
    return get().updateTurnover(id, {
      status: 'ready',
    });
  },

  clearError: () => set({ error: null }),
}));

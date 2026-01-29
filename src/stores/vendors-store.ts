// src/stores/vendors-store.ts
// Zustand store for vendor management

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  Vendor,
  VendorCategory,
  CreateVendorInput,
  UpdateVendorInput,
} from '@/features/vendors/types';

// ============================================
// State Interface
// ============================================

export interface VendorsState {
  // Data
  vendors: Vendor[];
  selectedVendorId: string | null;

  // Filters
  filterCategory: VendorCategory | 'all';
  filterPropertyId: string | null; // null = global vendors only

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchVendors: (propertyId?: string) => Promise<void>;
  fetchVendorById: (id: string) => Promise<Vendor | null>;
  createVendor: (data: CreateVendorInput) => Promise<Vendor | null>;
  updateVendor: (id: string, data: UpdateVendorInput) => Promise<Vendor | null>;
  deleteVendor: (id: string) => Promise<boolean>;
  setSelectedVendorId: (id: string | null) => void;
  setFilterCategory: (category: VendorCategory | 'all') => void;
  setFilterPropertyId: (propertyId: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  vendors: [],
  selectedVendorId: null,
  filterCategory: 'all' as const,
  filterPropertyId: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

// ============================================
// Store
// ============================================

export const useVendorsStore = create<VendorsState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchVendors: async (propertyId?: string) => {
        set({ isLoading: true, error: null, filterPropertyId: propertyId || null });
        try {
          let query = supabase
            .from('property_vendors')
            .select('*')
            .eq('is_active', true)
            .order('is_primary', { ascending: false })
            .order('category', { ascending: true })
            .order('name', { ascending: true });

          // If propertyId provided, get property-specific + global vendors
          // If not, get all user's vendors
          if (propertyId) {
            query = query.or(`property_id.eq.${propertyId},property_id.is.null`);
          }

          const { data, error } = await query;

          if (error) throw error;

          set({
            vendors: (data || []) as Vendor[],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch vendors';
          set({ error: message, isLoading: false });
        }
      },

      fetchVendorById: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('property_vendors')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          const vendor = data as Vendor;

          // Update in local state
          set((state) => ({
            vendors: state.vendors.map((v) => (v.id === id ? vendor : v)),
          }));

          return vendor;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch vendor';
          set({ error: message });
          return null;
        }
      },

      createVendor: async (data: CreateVendorInput) => {
        set({ isSaving: true, error: null });
        try {
          const { data: newVendor, error } = await supabase
            .from('property_vendors')
            .insert({
              ...data,
              is_active: true,
              total_jobs: 0,
            })
            .select()
            .single();

          if (error) throw error;

          const vendor = newVendor as Vendor;
          set((state) => ({
            vendors: [vendor, ...state.vendors],
            isSaving: false,
          }));

          return vendor;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create vendor';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      updateVendor: async (id: string, data: UpdateVendorInput) => {
        set({ isSaving: true, error: null });
        try {
          const { data: updated, error } = await supabase
            .from('property_vendors')
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const vendor = updated as Vendor;
          set((state) => ({
            vendors: state.vendors.map((v) => (v.id === id ? vendor : v)),
            isSaving: false,
          }));

          return vendor;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update vendor';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      deleteVendor: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          // Soft delete by setting is_active to false
          const { error } = await supabase
            .from('property_vendors')
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            vendors: state.vendors.filter((v) => v.id !== id),
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete vendor';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      setSelectedVendorId: (id: string | null) => set({ selectedVendorId: id }),

      setFilterCategory: (category: VendorCategory | 'all') =>
        set({ filterCategory: category }),

      setFilterPropertyId: (propertyId: string | null) =>
        set({ filterPropertyId: propertyId }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'vendors-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        filterCategory: state.filterCategory,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectAllVendors = (state: VendorsState) => state.vendors;

export const selectActiveVendors = (state: VendorsState) =>
  state.vendors.filter((v) => v.is_active);

export const selectPrimaryVendors = (state: VendorsState) =>
  state.vendors.filter((v) => v.is_primary);

export const selectVendorsByCategory = (state: VendorsState) => {
  const grouped: Record<VendorCategory, Vendor[]> = {
    plumber: [],
    electrician: [],
    hvac: [],
    cleaner: [],
    handyman: [],
    locksmith: [],
    pest_control: [],
    landscaper: [],
    appliance_repair: [],
    pool_service: [],
    other: [],
  };

  state.vendors.forEach((vendor) => {
    grouped[vendor.category].push(vendor);
  });

  return grouped;
};

export const selectVendorById = (id: string) => (state: VendorsState) =>
  state.vendors.find((v) => v.id === id);

export const selectVendorCount = (state: VendorsState) => state.vendors.length;

export const selectPrimaryVendorByCategory =
  (category: VendorCategory) => (state: VendorsState) =>
    state.vendors.find((v) => v.category === category && v.is_primary);

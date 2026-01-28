// src/stores/rental-properties-store.ts
// Zustand store for Landlord platform rental properties
// Part of Zone 3: UI scaffolding for the Doughy architecture refactor

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';

// Types based on Contract A from architecture doc
export type PropertyType = 'single_family' | 'multi_family' | 'condo' | 'apartment' | 'townhouse' | 'room';
export type RentalType = 'str' | 'mtr' | 'ltr';
export type RateType = 'nightly' | 'weekly' | 'monthly' | 'yearly';
export type PropertyStatus = 'active' | 'inactive' | 'maintenance';

export interface RentalProperty {
  id: string;
  user_id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string | null;
  property_type: PropertyType;
  rental_type: RentalType;
  bedrooms: number;
  bathrooms: number;
  sqft: number | null;
  base_rate: number;
  rate_type: RateType;
  cleaning_fee: number | null;
  security_deposit: number | null;
  room_by_room_enabled: boolean;
  amenities: string[];
  house_rules: Record<string, unknown>;
  check_in_instructions: Record<string, unknown>;
  listing_urls: {
    furnishedfinder?: string;
    airbnb?: string;
    turbotenant?: string;
  };
  status: PropertyStatus;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface RentalPropertiesState {
  // Data
  properties: RentalProperty[];
  selectedPropertyId: string | null;

  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchProperties: () => Promise<void>;
  fetchPropertyById: (id: string) => Promise<RentalProperty | null>;
  createProperty: (data: Partial<RentalProperty>) => Promise<RentalProperty | null>;
  updateProperty: (id: string, data: Partial<RentalProperty>) => Promise<RentalProperty | null>;
  deleteProperty: (id: string) => Promise<boolean>;
  setSelectedPropertyId: (id: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  properties: [],
  selectedPropertyId: null,
  isLoading: false,
  isRefreshing: false,
  isSaving: false,
  error: null,
};

export const useRentalPropertiesStore = create<RentalPropertiesState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchProperties: async () => {
        set({ isLoading: true, error: null });
        try {
          const { data, error } = await supabase
            .from('rental_properties')
            .select('*')
            .order('created_at', { ascending: false });

          if (error) throw error;

          set({
            properties: (data || []) as RentalProperty[],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch properties';
          set({ error: message, isLoading: false });
        }
      },

      fetchPropertyById: async (id: string) => {
        try {
          const { data, error } = await supabase
            .from('rental_properties')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          // Update the property in local state
          const property = data as RentalProperty;
          set((state) => ({
            properties: state.properties.map((p) =>
              p.id === id ? property : p
            ),
          }));

          return property;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch property';
          set({ error: message });
          return null;
        }
      },

      createProperty: async (data: Partial<RentalProperty>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: newProperty, error } = await supabase
            .from('rental_properties')
            .insert(data)
            .select()
            .single();

          if (error) throw error;

          const property = newProperty as RentalProperty;
          set((state) => ({
            properties: [property, ...state.properties],
            isSaving: false,
          }));

          return property;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create property';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      updateProperty: async (id: string, data: Partial<RentalProperty>) => {
        set({ isSaving: true, error: null });
        try {
          const { data: updatedProperty, error } = await supabase
            .from('rental_properties')
            .update(data)
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const property = updatedProperty as RentalProperty;
          set((state) => ({
            properties: state.properties.map((p) =>
              p.id === id ? property : p
            ),
            isSaving: false,
          }));

          return property;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update property';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      deleteProperty: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { error } = await supabase
            .from('rental_properties')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            properties: state.properties.filter((p) => p.id !== id),
            selectedPropertyId:
              state.selectedPropertyId === id ? null : state.selectedPropertyId,
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete property';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      setSelectedPropertyId: (id: string | null) => {
        set({ selectedPropertyId: id });
      },

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'rental-properties-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        properties: state.properties,
        selectedPropertyId: state.selectedPropertyId,
      }),
    }
  )
);

// Selectors
export const selectProperties = (state: RentalPropertiesState) => state.properties;
export const selectActiveProperties = (state: RentalPropertiesState) =>
  state.properties.filter((p) => p.status === 'active');
export const selectSelectedProperty = (state: RentalPropertiesState) =>
  state.properties.find((p) => p.id === state.selectedPropertyId);
export const selectPropertyById = (id: string) => (state: RentalPropertiesState) =>
  state.properties.find((p) => p.id === id);

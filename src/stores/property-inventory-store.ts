// src/stores/property-inventory-store.ts
// Zustand store for property inventory management

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  InventoryItem,
  InventoryCategory,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
} from '@/features/property-inventory/types';

// ============================================
// State Interface
// ============================================

export interface PropertyInventoryState {
  // Data
  items: InventoryItem[];
  selectedItemId: string | null;

  // Filters
  filterCategory: InventoryCategory | 'all';
  filterPropertyId: string | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchInventory: (propertyId: string) => Promise<void>;
  fetchItemById: (id: string) => Promise<InventoryItem | null>;
  createItem: (data: CreateInventoryItemInput) => Promise<InventoryItem | null>;
  updateItem: (id: string, data: UpdateInventoryItemInput) => Promise<InventoryItem | null>;
  deleteItem: (id: string) => Promise<boolean>;
  setSelectedItemId: (id: string | null) => void;
  setFilterCategory: (category: InventoryCategory | 'all') => void;
  setFilterPropertyId: (propertyId: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  items: [],
  selectedItemId: null,
  filterCategory: 'all' as const,
  filterPropertyId: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

// ============================================
// Store
// ============================================

export const usePropertyInventoryStore = create<PropertyInventoryState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchInventory: async (propertyId: string) => {
        set({ isLoading: true, error: null, filterPropertyId: propertyId });
        try {
          const { data, error } = await supabase
            .schema('landlord')
            .from('inventory_items')
            .select('*')
            .eq('property_id', propertyId)
            .order('category', { ascending: true })
            .order('name', { ascending: true });

          if (error) throw error;

          set({
            items: (data || []) as InventoryItem[],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch inventory';
          set({ error: message, isLoading: false });
        }
      },

      fetchItemById: async (id: string) => {
        try {
          const { data, error } = await supabase
            .schema('landlord')
            .from('inventory_items')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          const item = data as InventoryItem;

          // Update the item in local state
          set((state) => ({
            items: state.items.map((i) => (i.id === id ? item : i)),
          }));

          return item;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch item';
          set({ error: message });
          return null;
        }
      },

      createItem: async (data: CreateInventoryItemInput) => {
        set({ isSaving: true, error: null });
        try {
          const { data: newItem, error } = await supabase
            .schema('landlord')
            .from('inventory_items')
            .insert({
              ...data,
              photos: data.photos || [],
            })
            .select()
            .single();

          if (error) throw error;

          const item = newItem as InventoryItem;
          set((state) => ({
            items: [...state.items, item].sort((a, b) => {
              if (a.category !== b.category) {
                return a.category.localeCompare(b.category);
              }
              return a.name.localeCompare(b.name);
            }),
            isSaving: false,
          }));

          return item;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create item';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      updateItem: async (id: string, data: UpdateInventoryItemInput) => {
        set({ isSaving: true, error: null });
        try {
          const { data: updated, error } = await supabase
            .schema('landlord')
            .from('inventory_items')
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const item = updated as InventoryItem;
          set((state) => ({
            items: state.items.map((i) => (i.id === id ? item : i)),
            isSaving: false,
          }));

          return item;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update item';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      deleteItem: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { error } = await supabase
            .schema('landlord')
            .from('inventory_items')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            items: state.items.filter((i) => i.id !== id),
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete item';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      setSelectedItemId: (id: string | null) => set({ selectedItemId: id }),

      setFilterCategory: (category: InventoryCategory | 'all') =>
        set({ filterCategory: category }),

      setFilterPropertyId: (propertyId: string | null) =>
        set({ filterPropertyId: propertyId }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'property-inventory-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        // Only persist filters, not data
        filterCategory: state.filterCategory,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectAllItems = (state: PropertyInventoryState) => state.items;

export const selectFilteredItems = (state: PropertyInventoryState) => {
  if (state.filterCategory === 'all') {
    return state.items;
  }
  return state.items.filter((item) => item.category === state.filterCategory);
};

export const selectItemsByCategory = (state: PropertyInventoryState) => {
  const grouped: Record<InventoryCategory, InventoryItem[]> = {
    appliance: [],
    hvac: [],
    structure: [],
    plumbing: [],
    furniture: [],
    electronics: [],
    other: [],
  };

  state.items.forEach((item) => {
    grouped[item.category].push(item);
  });

  return grouped;
};

export const selectItemById = (id: string) => (state: PropertyInventoryState) =>
  state.items.find((item) => item.id === id);

export const selectItemCount = (state: PropertyInventoryState) => state.items.length;

export const selectItemCountByCategory = (state: PropertyInventoryState) => {
  const counts: Record<InventoryCategory, number> = {
    appliance: 0,
    hvac: 0,
    structure: 0,
    plumbing: 0,
    furniture: 0,
    electronics: 0,
    other: 0,
  };

  state.items.forEach((item) => {
    counts[item.category]++;
  });

  return counts;
};

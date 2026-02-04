// src/stores/property-maintenance-store.ts
// Zustand store for property maintenance work orders

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import {
  MaintenanceWorkOrder,
  MaintenanceStatus,
  MaintenancePriority,
  CreateMaintenanceInput,
  UpdateMaintenanceInput,
} from '@/features/property-maintenance/types';

// ============================================
// State Interface
// ============================================

export interface PropertyMaintenanceState {
  // Data
  workOrders: MaintenanceWorkOrder[];
  selectedWorkOrderId: string | null;

  // Filters
  filterStatus: MaintenanceStatus | 'all' | 'open';
  filterPriority: MaintenancePriority | 'all';
  filterPropertyId: string | null;

  // Loading states
  isLoading: boolean;
  isSaving: boolean;

  // Error state
  error: string | null;

  // Actions
  fetchWorkOrders: (propertyId: string) => Promise<void>;
  fetchWorkOrderById: (id: string) => Promise<MaintenanceWorkOrder | null>;
  createWorkOrder: (data: CreateMaintenanceInput) => Promise<MaintenanceWorkOrder | null>;
  updateWorkOrder: (id: string, data: UpdateMaintenanceInput) => Promise<MaintenanceWorkOrder | null>;
  deleteWorkOrder: (id: string) => Promise<boolean>;
  setSelectedWorkOrderId: (id: string | null) => void;
  setFilterStatus: (status: MaintenanceStatus | 'all' | 'open') => void;
  setFilterPriority: (priority: MaintenancePriority | 'all') => void;
  setFilterPropertyId: (propertyId: string | null) => void;
  clearError: () => void;
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const initialState = {
  workOrders: [],
  selectedWorkOrderId: null,
  filterStatus: 'open' as const,
  filterPriority: 'all' as const,
  filterPropertyId: null,
  isLoading: false,
  isSaving: false,
  error: null,
};

// ============================================
// Store
// ============================================

export const usePropertyMaintenanceStore = create<PropertyMaintenanceState>()(
  persist(
    (set, get) => ({
      ...initialState,

      fetchWorkOrders: async (propertyId: string) => {
        set({ isLoading: true, error: null, filterPropertyId: propertyId });
        try {
          const { data, error } = await supabase
            .schema('landlord')
            .from('maintenance_records')
            .select('*')
            .eq('property_id', propertyId)
            .order('reported_at', { ascending: false });

          if (error) throw error;

          set({
            workOrders: (data || []) as MaintenanceWorkOrder[],
            isLoading: false,
          });
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch work orders';
          set({ error: message, isLoading: false });
        }
      },

      fetchWorkOrderById: async (id: string) => {
        try {
          const { data, error } = await supabase
            .schema('landlord')
            .from('maintenance_records')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          const workOrder = data as MaintenanceWorkOrder;

          // Update in local state
          set((state) => ({
            workOrders: state.workOrders.map((wo) =>
              wo.id === id ? workOrder : wo
            ),
          }));

          return workOrder;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to fetch work order';
          set({ error: message });
          return null;
        }
      },

      createWorkOrder: async (data: CreateMaintenanceInput) => {
        set({ isSaving: true, error: null });
        try {
          const { data: newWorkOrder, error } = await supabase
            .schema('landlord')
            .from('maintenance_records')
            .insert({
              ...data,
              photos: data.photos || [],
              status: 'reported',
              priority: data.priority || 'medium',
              charge_to: data.charge_to || 'owner',
            })
            .select()
            .single();

          if (error) throw error;

          const workOrder = newWorkOrder as MaintenanceWorkOrder;
          set((state) => ({
            workOrders: [workOrder, ...state.workOrders],
            isSaving: false,
          }));

          return workOrder;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to create work order';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      updateWorkOrder: async (id: string, data: UpdateMaintenanceInput) => {
        set({ isSaving: true, error: null });
        try {
          const { data: updated, error } = await supabase
            .schema('landlord')
            .from('maintenance_records')
            .update({
              ...data,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .single();

          if (error) throw error;

          const workOrder = updated as MaintenanceWorkOrder;
          set((state) => ({
            workOrders: state.workOrders.map((wo) =>
              wo.id === id ? workOrder : wo
            ),
            isSaving: false,
          }));

          return workOrder;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to update work order';
          set({ error: message, isSaving: false });
          return null;
        }
      },

      deleteWorkOrder: async (id: string) => {
        set({ isSaving: true, error: null });
        try {
          const { error } = await supabase
            .schema('landlord')
            .from('maintenance_records')
            .delete()
            .eq('id', id);

          if (error) throw error;

          set((state) => ({
            workOrders: state.workOrders.filter((wo) => wo.id !== id),
            isSaving: false,
          }));

          return true;
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Failed to delete work order';
          set({ error: message, isSaving: false });
          return false;
        }
      },

      setSelectedWorkOrderId: (id: string | null) =>
        set({ selectedWorkOrderId: id }),

      setFilterStatus: (status: MaintenanceStatus | 'all' | 'open') =>
        set({ filterStatus: status }),

      setFilterPriority: (priority: MaintenancePriority | 'all') =>
        set({ filterPriority: priority }),

      setFilterPropertyId: (propertyId: string | null) =>
        set({ filterPropertyId: propertyId }),

      clearError: () => set({ error: null }),

      reset: () => set(initialState),
    }),
    {
      name: 'property-maintenance-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        filterStatus: state.filterStatus,
        filterPriority: state.filterPriority,
      }),
    }
  )
);

// ============================================
// Selectors
// ============================================

export const selectAllWorkOrders = (state: PropertyMaintenanceState) =>
  state.workOrders;

export const selectOpenWorkOrders = (state: PropertyMaintenanceState) =>
  state.workOrders.filter(
    (wo) => !['completed', 'cancelled'].includes(wo.status)
  );

export const selectFilteredWorkOrders = (state: PropertyMaintenanceState) => {
  let filtered = state.workOrders;

  // Apply status filter
  if (state.filterStatus === 'open') {
    filtered = filtered.filter(
      (wo) => !['completed', 'cancelled'].includes(wo.status)
    );
  } else if (state.filterStatus !== 'all') {
    filtered = filtered.filter((wo) => wo.status === state.filterStatus);
  }

  // Apply priority filter
  if (state.filterPriority !== 'all') {
    filtered = filtered.filter((wo) => wo.priority === state.filterPriority);
  }

  return filtered;
};

export const selectWorkOrderById = (id: string) => (state: PropertyMaintenanceState) =>
  state.workOrders.find((wo) => wo.id === id);

export const selectOpenCount = (state: PropertyMaintenanceState) =>
  state.workOrders.filter(
    (wo) => !['completed', 'cancelled'].includes(wo.status)
  ).length;

export const selectEmergencyCount = (state: PropertyMaintenanceState) =>
  state.workOrders.filter(
    (wo) =>
      wo.priority === 'emergency' &&
      !['completed', 'cancelled'].includes(wo.status)
  ).length;

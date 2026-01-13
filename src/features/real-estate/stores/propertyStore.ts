// src/features/real-estate/stores/propertyStore.ts
// Mobile-adapted property store with React Native compatible patterns

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { SimpleEventEmitter, DebouncedFunctionsManager } from '@/utils';
import { IPropertyBasicInfo, IProperty, IBuyingCriteria, KeyPropertyValues, PROPERTY_EVENTS } from '../types';
import { calculateKeyPropertyValues } from '../utils/propertyValues';
import { mapDbToBasicInfo, mapBasicInfoToDbUpdate } from '../utils/propertyMapper';

// Create singleton instances
export const propertyEvents = new SimpleEventEmitter();
const debouncedManager = new DebouncedFunctionsManager();

interface PropertyStore {
  // State
  selectedPropertyId: string | null;
  propertyData: IProperty | null;
  loading: boolean;
  error: Error | null;
  loadingBasicInfo: boolean;
  loadingRepairs: boolean;
  loadingDebt: boolean;
  loadingFinancials: boolean;
  buyingCriteria: IBuyingCriteria | null;

  // Actions
  setSelectedPropertyId: (id: string | null) => void;
  fetchProperty: (id: string) => Promise<IProperty | null>;
  updateBasicInfo: (data: Partial<IPropertyBasicInfo>) => void;
  updateBasicInfoImmediate: (data: Partial<IPropertyBasicInfo>) => Promise<unknown>;
  reset: () => void;
  refetchAll: () => Promise<void>;
  getKeyPropertyValues: () => KeyPropertyValues;
  notifyValueChange: (key: keyof KeyPropertyValues, newValue: unknown) => void;
}

export const usePropertyStore = create<PropertyStore>()(
  persist(
    (set, get) => ({
      selectedPropertyId: null,
      propertyData: null,
      loading: false,
      error: null,
      loadingBasicInfo: false,
      loadingRepairs: false,
      loadingDebt: false,
      loadingFinancials: false,
      buyingCriteria: null,

      setSelectedPropertyId: (id: string | null) => {
        set({ selectedPropertyId: id });
        if (id) get().fetchProperty(id);
        else get().reset();
      },

      reset: () => {
        debouncedManager.clear();
        set({
          propertyData: null,
          loading: false,
          error: null,
          loadingBasicInfo: false,
          loadingRepairs: false,
          loadingDebt: false,
          loadingFinancials: false,
        });
      },

      fetchProperty: async (id: string) => {
        set({ selectedPropertyId: id, loading: true, error: null, loadingBasicInfo: true });

        try {
          const { data, error } = await supabase
            .from('re_properties')
            .select('*')
            .eq('id', id)
            .single();

          if (error) throw error;

          const basicInfo = mapDbToBasicInfo(data as Record<string, unknown>);
          set({ propertyData: basicInfo, loadingBasicInfo: false, loading: false });

          propertyEvents.emit(PROPERTY_EVENTS.DATA_REFRESHED, {
            propertyId: id,
            property: basicInfo,
            timestamp: Date.now()
          });

          return basicInfo;
        } catch (error: unknown) {
          console.error("Error fetching property data:", error instanceof Error ? error.message : 'Unknown error');
          set({
            error: error instanceof Error ? error : new Error('Failed to fetch property data'),
            loading: false,
            loadingBasicInfo: false,
          });
          return null;
        }
      },

      updateBasicInfo: (data: Partial<IPropertyBasicInfo>) => {
        const debouncedFn = debouncedManager.getDebounced(
          'updateBasicInfo',
          get().updateBasicInfoImmediate,
          500
        );
        debouncedFn(data);
      },

      updateBasicInfoImmediate: async (data: Partial<IPropertyBasicInfo>) => {
        const { selectedPropertyId, propertyData } = get();
        if (!selectedPropertyId || !propertyData) {
          console.error("No property selected or no property data available");
          return null;
        }

        try {
          const dbData = mapBasicInfoToDbUpdate(data);
          const { data: updatedData, error } = await supabase
            .from('re_properties')
            .update(dbData)
            .eq('id', selectedPropertyId)
            .select()
            .single();

          if (error) throw error;

          set(state => ({
            propertyData: {
              ...state.propertyData!,
              ...data,
              address: updatedData.address_line_1,
              address_line_1: updatedData.address_line_1,
              address_line_2: updatedData.address_line_2,
              propertyType: updatedData.property_type,
              property_type: updatedData.property_type,
            }
          }));

          propertyEvents.emit(PROPERTY_EVENTS.DATA_UPDATED, {
            propertyId: selectedPropertyId,
            property: get().propertyData,
            timestamp: Date.now()
          });

          return updatedData;
        } catch (error) {
          console.error("Error updating property basic info:", error);
          set({ error: error instanceof Error ? error : new Error('Failed to update property basic info') });
          return null;
        }
      },

      refetchAll: async () => {
        const { selectedPropertyId } = get();
        if (!selectedPropertyId) {
          console.error("No property selected");
          return;
        }
        await get().fetchProperty(selectedPropertyId);
      },

      getKeyPropertyValues: () => calculateKeyPropertyValues(get().propertyData),

      notifyValueChange: (key: keyof KeyPropertyValues, newValue: unknown) => {
        const { selectedPropertyId } = get();
        if (!selectedPropertyId) {
          console.error("No property selected, cannot notify value change");
          return;
        }
        propertyEvents.emit(PROPERTY_EVENTS.VALUE_CHANGED, {
          propertyId: selectedPropertyId,
          key,
          value: newValue,
          timestamp: Date.now()
        });
      }
    }),
    {
      name: 'property-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        selectedPropertyId: state.selectedPropertyId,
        buyingCriteria: state.buyingCriteria,
      })
    }
  )
);

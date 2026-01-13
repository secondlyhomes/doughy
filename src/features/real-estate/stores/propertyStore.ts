// src/features/real-estate/stores/propertyStore.ts
// Mobile-adapted property store with React Native compatible patterns

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/lib/supabase';
import { debounce } from 'lodash';
import { Property, DBProperty, dbToFeatureProperty, featureToDbProperty } from '../types';

// Simple EventEmitter for React Native (replaces Node's events module)
type EventCallback = (...args: any[]) => void;

class SimpleEventEmitter {
  private events: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set());
    }
    this.events.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.events.get(event)?.delete(callback);
  }

  emit(event: string, ...args: any[]): void {
    this.events.get(event)?.forEach(callback => {
      try {
        callback(...args);
      } catch (error) {
        console.error(`Error in event handler for ${event}:`, error);
      }
    });
  }

  removeAllListeners(event?: string): void {
    if (event) {
      this.events.delete(event);
    } else {
      this.events.clear();
    }
  }
}

export const propertyEvents = new SimpleEventEmitter();

// Property event types
export const PROPERTY_EVENTS = {
  DATA_REFRESHED: 'property-data-refreshed',
  DATA_UPDATED: 'property-data-updated',
  VALUE_CHANGED: 'property-value-changed',
  VALUES_SYNC: 'property-values-sync',
  SAVE_COMPLETE: 'property-save-complete',
} as const;

// Define the interfaces for different property sections
export interface IPropertyBasicInfo {
  id: string;
  address: string;
  address_line_1?: string | null;
  address_line_2?: string | null;
  city: string;
  state: string;
  zip: string;
  county?: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  square_feet: number | null;
  sqft?: number | null;
  lot_size?: number | null;
  year_built?: number | null;
  propertyType: string | null;
  property_type?: string | null;
  owner_occupied?: boolean | null;
  notes?: string | null;
  geo_point?: any;
  arv?: number | null;
  purchase_price?: number | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface IPropertyRepairItem {
  id: string;
  property_id: string;
  category: string;
  item_name: string;
  description?: string;
  cost: number;
  status: 'needed' | 'completed' | 'not_needed';
  notes?: string;
  is_custom: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface IPropertyDebtItem {
  id: string;
  property_id: string;
  debt_type: 'mortgage' | 'heloc' | 'line_of_credit' | 'other';
  lender: string;
  original_amount: number;
  current_balance: number;
  interest_rate: number;
  monthly_payment: number;
  term_months: number;
  is_primary: boolean;
  start_date?: string;
  maturity_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface IPropertyFinancials {
  id?: string;
  property_id: string;
  purchase_price?: number | null;
  arv?: number | null;
  monthly_rent?: number | null;
  vacancy_rate?: number | null;
  property_tax?: number | null;
  insurance?: number | null;
  property_management?: number | null;
  maintenance?: number | null;
  utilities?: number | null;
  hoa?: number | null;
  other_expenses?: number | null;
  capex_reserve?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface IBuyingCriteria {
  id?: string;
  user_id: string;
  yourProfitPct: number;
  sellingCommissionPct: number;
  buyerCreditPct: number;
  closingExpensesPct: number;
  holdingMonths: number;
  buyersProfitPct: number;
  maxInterestRate: number;
  monthlyHoldingCost: number;
  miscContingencyPct: number;
  minCapRatePct: number;
  minCoCPct: number;
  maxLTVPct: number;
}

export interface IProperty extends IPropertyBasicInfo {
  repairs?: IPropertyRepairItem[];
  debt?: IPropertyDebtItem[];
  financials?: IPropertyFinancials;
  status?: string;
  mortgage_balance?: number;
}

// Key property data interface for centralized access
export interface KeyPropertyValues {
  propertyValue: number;
  purchasePrice: number;
  repairsTotal: number;
  monthlyRent: number;
  expenses: {
    propertyTax: number;
    insurance: number;
    maintenance: number;
    utilities: number;
    management: number;
    vacancy: number;
    capex: number;
    hoa: number;
  };
  debt: {
    loanAmount: number;
    interestRate: number;
    termYears: number;
    monthlyPayment: number;
  };
  [key: string]: any;
}

interface PropertyStore {
  // State
  selectedPropertyId: string | null;
  propertyData: IProperty | null;
  loading: boolean;
  error: Error | null;

  // Section loading states
  loadingBasicInfo: boolean;
  loadingRepairs: boolean;
  loadingDebt: boolean;
  loadingFinancials: boolean;

  // Buying criteria
  buyingCriteria: IBuyingCriteria | null;

  // Actions
  setSelectedPropertyId: (id: string | null) => void;
  fetchProperty: (id: string) => Promise<IProperty | null>;
  updateBasicInfo: (data: Partial<IPropertyBasicInfo>) => Promise<void>;
  updateBasicInfoImmediate: (data: Partial<IPropertyBasicInfo>) => Promise<any>;

  // Helper methods
  reset: () => void;
  refetchAll: () => Promise<void>;

  // Centralized property value methods
  getKeyPropertyValues: () => KeyPropertyValues;
  notifyValueChange: (key: keyof KeyPropertyValues, newValue: any) => void;
}

// Debounced functions manager
class DebouncedFunctionsManager {
  private functions: Map<string, any> = new Map();

  getDebounced<T extends (...args: any[]) => any>(
    key: string,
    fn: T,
    wait: number = 500
  ): T {
    if (!this.functions.has(key)) {
      this.functions.set(key, debounce(fn, wait));
    }
    return this.functions.get(key);
  }

  clear(): void {
    this.functions.forEach(fn => {
      if (fn.cancel) {
        fn.cancel();
      }
    });
    this.functions.clear();
  }
}

const debouncedManager = new DebouncedFunctionsManager();

// Create the store with AsyncStorage for React Native
export const usePropertyStore = create<PropertyStore>()(
  persist(
    (set, get) => ({
      // Initial state
      selectedPropertyId: null,
      propertyData: null,
      loading: false,
      error: null,

      // Section loading states
      loadingBasicInfo: false,
      loadingRepairs: false,
      loadingDebt: false,
      loadingFinancials: false,

      // Buying criteria
      buyingCriteria: null,

      // Set selected property ID
      setSelectedPropertyId: (id: string | null) => {
        set({ selectedPropertyId: id });
        if (id) {
          get().fetchProperty(id);
        } else {
          get().reset();
        }
      },

      // Reset state
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

      // Fetch property and related data
      fetchProperty: async (id: string) => {
        set({ selectedPropertyId: id, loading: true, error: null });

        try {
          // Fetch basic property info
          set({ loadingBasicInfo: true });
          const { data: propertyData, error: propertyError } = await supabase
            .from('re_properties')
            .select('*')
            .eq('id', id)
            .single();

          if (propertyError) throw propertyError;

          // Map DB format to frontend format
          // Use type assertion to handle optional DB fields
          const dbRecord = propertyData as Record<string, any>;
          const basicInfo: IPropertyBasicInfo = {
            id: propertyData.id,
            address: propertyData.address_line_1,
            address_line_1: propertyData.address_line_1,
            address_line_2: propertyData.address_line_2,
            city: propertyData.city,
            state: propertyData.state,
            zip: propertyData.zip,
            county: dbRecord.county ?? null,
            bedrooms: propertyData.bedrooms,
            bathrooms: propertyData.bathrooms,
            square_feet: propertyData.square_feet,
            sqft: propertyData.square_feet,
            lot_size: propertyData.lot_size,
            year_built: propertyData.year_built,
            propertyType: propertyData.property_type || 'other',
            property_type: propertyData.property_type,
            owner_occupied: dbRecord.owner_occupied ?? null,
            notes: propertyData.notes,
            geo_point: propertyData.geo_point,
            arv: propertyData.arv,
            purchase_price: propertyData.purchase_price,
            created_at: propertyData.created_at,
            updated_at: propertyData.updated_at
          };

          set({
            propertyData: basicInfo,
            loadingBasicInfo: false,
            loading: false
          });

          // Emit event for property data refreshed
          propertyEvents.emit(PROPERTY_EVENTS.DATA_REFRESHED, {
            propertyId: id,
            property: basicInfo,
            timestamp: Date.now()
          });

          return basicInfo;
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          console.error("Error fetching property data:", errorMessage);
          set({
            error: error instanceof Error ? error : new Error('Failed to fetch property data'),
            loading: false,
            loadingBasicInfo: false,
          });
          return null;
        }
      },

      // Update basic property info (debounced)
      updateBasicInfo: async (data: Partial<IPropertyBasicInfo>) => {
        const debouncedFn = debouncedManager.getDebounced(
          'updateBasicInfo',
          get().updateBasicInfoImmediate,
          500
        );
        return debouncedFn(data);
      },

      // Immediate update (non-debounced)
      updateBasicInfoImmediate: async (data: Partial<IPropertyBasicInfo>) => {
        const { selectedPropertyId, propertyData } = get();

        if (!selectedPropertyId || !propertyData) {
          console.error("No property selected or no property data available");
          return null;
        }

        try {
          // Map frontend properties to database properties
          // Using a typed interface for database updates
          const dbData: Record<string, unknown> = {};

          // Copy over allowed database fields
          if (data.address_line_1 !== undefined || data.address !== undefined) {
            dbData.address_line_1 = data.address || data.address_line_1;
          }
          if (data.address_line_2 !== undefined) dbData.address_line_2 = data.address_line_2;
          if (data.city !== undefined) dbData.city = data.city;
          if (data.state !== undefined) dbData.state = data.state;
          if (data.zip !== undefined) dbData.zip = data.zip;
          if (data.county !== undefined) dbData.county = data.county;
          if (data.bedrooms !== undefined) dbData.bedrooms = data.bedrooms;
          if (data.bathrooms !== undefined) dbData.bathrooms = data.bathrooms;
          if (data.square_feet !== undefined) dbData.square_feet = data.square_feet;
          if (data.lot_size !== undefined) dbData.lot_size = data.lot_size;
          if (data.year_built !== undefined) dbData.year_built = data.year_built;
          if (data.propertyType !== undefined || data.property_type !== undefined) {
            dbData.property_type = data.propertyType || data.property_type;
          }
          if (data.owner_occupied !== undefined) dbData.owner_occupied = data.owner_occupied;
          if (data.notes !== undefined) dbData.notes = data.notes;
          if (data.geo_point !== undefined) dbData.geo_point = data.geo_point;
          if (data.arv !== undefined) dbData.arv = data.arv;
          if (data.purchase_price !== undefined) dbData.purchase_price = data.purchase_price;

          // Update in database
          const { data: updatedData, error } = await supabase
            .from('re_properties')
            .update(dbData)
            .eq('id', selectedPropertyId)
            .select()
            .single();

          if (error) throw error;

          // Update in state
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

          // Emit update event
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

      // Refetch all data
      refetchAll: async () => {
        const { selectedPropertyId } = get();

        if (!selectedPropertyId) {
          console.error("No property selected");
          return;
        }

        await get().fetchProperty(selectedPropertyId);
      },

      // Get all key property values
      getKeyPropertyValues: () => {
        const { propertyData } = get();

        if (!propertyData) {
          return {
            propertyValue: 0,
            purchasePrice: 0,
            repairsTotal: 0,
            monthlyRent: 0,
            expenses: {
              propertyTax: 0,
              insurance: 0,
              maintenance: 0,
              utilities: 0,
              management: 8,
              vacancy: 5,
              capex: 0,
              hoa: 0
            },
            debt: {
              loanAmount: 0,
              interestRate: 6.5,
              termYears: 30,
              monthlyPayment: 0
            }
          };
        }

        const repairsTotal = propertyData.repairs?.reduce((sum, item) =>
          sum + (item.cost || 0), 0) || 0;

        const primaryDebt = Array.isArray(propertyData.debt)
          ? propertyData.debt.find(d => d.is_primary) || propertyData.debt[0]
          : propertyData.debt;

        return {
          propertyValue: propertyData.arv || 0,
          purchasePrice: propertyData.purchase_price || 0,
          repairsTotal,
          monthlyRent: propertyData.financials?.monthly_rent || 0,
          expenses: {
            propertyTax: propertyData.financials?.property_tax || 0,
            insurance: propertyData.financials?.insurance || 0,
            maintenance: propertyData.financials?.maintenance || 0,
            utilities: propertyData.financials?.utilities || 0,
            management: propertyData.financials?.property_management || 8,
            vacancy: propertyData.financials?.vacancy_rate || 5,
            capex: propertyData.financials?.capex_reserve || 0,
            hoa: propertyData.financials?.hoa || 0
          },
          debt: {
            loanAmount: primaryDebt?.current_balance || 0,
            interestRate: primaryDebt?.interest_rate || 6.5,
            termYears: primaryDebt ? Math.ceil((primaryDebt.term_months || 360) / 12) : 30,
            monthlyPayment: primaryDebt?.monthly_payment || 0
          }
        };
      },

      // Notify components about value changes
      notifyValueChange: (key: keyof KeyPropertyValues, newValue: any) => {
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

// src/stores/skip-tracing-store.ts
// Zustand store for skip tracing / Tracerfy integration

import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  SkipTraceResult,
  SkipTraceResultWithRelations,
  SkipTraceInput,
  SkipTraceSummary,
  SkipTraceStatus,
} from '@/features/skip-tracing/types';

interface SkipTracingState {
  // State
  results: SkipTraceResultWithRelations[];
  currentResult: SkipTraceResultWithRelations | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchResults: (options?: { contactId?: string; leadId?: string; propertyId?: string }) => Promise<SkipTraceResultWithRelations[]>;
  fetchResultById: (resultId: string) => Promise<SkipTraceResultWithRelations>;
  runSkipTrace: (input: SkipTraceInput) => Promise<SkipTraceResult>;
  matchToProperty: (resultId: string, propertyId: string) => Promise<void>;
  deleteResult: (resultId: string) => Promise<void>;

  // Auto-trace for new leads
  autoTraceNewLead: (leadId: string) => Promise<SkipTraceResult | null>;

  // Helpers
  getSummary: () => SkipTraceSummary;
  clearError: () => void;
  reset: () => void;
}

export const useSkipTracingStore = create<SkipTracingState>((set, get) => ({
  results: [],
  currentResult: null,
  isLoading: false,
  error: null,

  fetchResults: async (options) => {
    set({ isLoading: true, error: null });
    try {
      // Note: Table name is crm_skip_trace_results per DBA conventions
      // Type assertions used until migration is applied and types regenerated
      let query = (supabase as any)
        .from('crm_skip_trace_results')
        .select(`
          *,
          contact:crm_contacts!crm_skip_trace_results_contact_id_fkey(id, first_name, last_name),
          lead:crm_leads!crm_skip_trace_results_lead_id_fkey(id, name),
          property:rental_properties!crm_skip_trace_results_property_id_fkey(id, address, city, state),
          matched_property:rental_properties!crm_skip_trace_results_matched_property_id_fkey(id, address, city, state)
        `)
        .order('created_at', { ascending: false });

      if (options?.contactId) {
        query = query.eq('contact_id', options.contactId);
      }
      if (options?.leadId) {
        query = query.eq('lead_id', options.leadId);
      }
      if (options?.propertyId) {
        query = query.eq('property_id', options.propertyId);
      }

      const { data, error } = await query;

      if (error) throw error;

      const results = (data || []) as SkipTraceResultWithRelations[];
      set({ results, isLoading: false });
      return results;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch skip trace results';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  fetchResultById: async (resultId: string) => {
    set({ isLoading: true, error: null });
    try {
      // Note: Table name is crm_skip_trace_results per DBA conventions
      const { data, error } = await (supabase as any)
        .from('crm_skip_trace_results')
        .select(`
          *,
          contact:crm_contacts!crm_skip_trace_results_contact_id_fkey(id, first_name, last_name),
          lead:crm_leads!crm_skip_trace_results_lead_id_fkey(id, name),
          property:rental_properties!crm_skip_trace_results_property_id_fkey(id, address, city, state),
          matched_property:rental_properties!crm_skip_trace_results_matched_property_id_fkey(id, address, city, state)
        `)
        .eq('id', resultId)
        .single();

      if (error) throw error;

      const result = data as SkipTraceResultWithRelations;
      set({ currentResult: result, isLoading: false });
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch skip trace result';
      set({ error: message, isLoading: false });
      throw error; // Propagate error instead of returning null
    }
  },

  runSkipTrace: async (input: SkipTraceInput) => {
    set({ isLoading: true, error: null });
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('Not authenticated');

      // Create pending record (crm_skip_trace_results per DBA conventions)
      const { data: record, error: insertError } = await (supabase as any)
        .from('crm_skip_trace_results')
        .insert({
          user_id: userData.user.id,
          contact_id: input.contact_id || null,
          lead_id: input.lead_id || null,
          property_id: input.property_id || null,
          input_first_name: input.first_name || null,
          input_last_name: input.last_name || null,
          input_address: input.address || null,
          input_city: input.city || null,
          input_state: input.state || null,
          input_zip: input.zip || null,
          status: 'pending',
          phones: [],
          emails: [],
          addresses: [],
          properties_owned: [],
          data_points: [],
          credits_used: 0,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Call edge function to run skip trace via Tracerfy
      const { data: traceResult, error: traceError } = await supabase.functions.invoke(
        'tracerfy-skip-trace',
        {
          body: {
            resultId: record.id,
            input: {
              firstName: input.first_name,
              lastName: input.last_name,
              address: input.address,
              city: input.city,
              state: input.state,
              zip: input.zip,
            },
          },
        }
      );

      if (traceError) {
        // Update record with error
        await (supabase as any)
          .from('crm_skip_trace_results')
          .update({
            status: 'failed',
            error_message: traceError.message,
          })
          .eq('id', record.id);
        throw traceError;
      }

      // Refresh the result - non-critical, trace was already created
      let result: SkipTraceResultWithRelations | null = null;
      try {
        const fetchedResult = await get().fetchResultById(record.id);
        result = fetchedResult;
        // Capture in local const for closure type narrowing
        const newResult = fetchedResult;
        set((state) => ({
          results: [newResult, ...state.results.filter((r) => r.id !== newResult.id)],
          isLoading: false,
        }));
      } catch (refreshError) {
        // Trace was created successfully, just couldn't refresh - log but don't throw
        console.error('Failed to refresh skip trace result after creation:', refreshError);
      }

      set({ isLoading: false });
      return result || (record as SkipTraceResult);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to run skip trace';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  matchToProperty: async (resultId: string, propertyId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await (supabase as any)
        .from('crm_skip_trace_results')
        .update({
          matched_property_id: propertyId,
          match_confidence: 100, // Manual match = 100% confidence
          updated_at: new Date().toISOString(),
        })
        .eq('id', resultId);

      if (error) throw error;

      // Update local state
      set((state) => ({
        results: state.results.map((r) =>
          r.id === resultId
            ? { ...r, matched_property_id: propertyId, match_confidence: 100 }
            : r
        ),
        currentResult:
          state.currentResult?.id === resultId
            ? { ...state.currentResult, matched_property_id: propertyId, match_confidence: 100 }
            : state.currentResult,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to match to property';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  deleteResult: async (resultId: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await (supabase as any)
        .from('crm_skip_trace_results')
        .delete()
        .eq('id', resultId);

      if (error) throw error;

      set((state) => ({
        results: state.results.filter((r) => r.id !== resultId),
        currentResult: state.currentResult?.id === resultId ? null : state.currentResult,
        isLoading: false,
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete result';
      set({ error: message, isLoading: false });
      throw error;
    }
  },

  autoTraceNewLead: async (leadId: string) => {
    try {
      // Get lead details including existing contact info in single query
      // Note: crm_leads uses 'name' (full name) and 'address_line_1' (not first/last name or street_address)
      const { data: lead, error: leadError } = await supabase
        .from('crm_leads')
        .select('id, name, address_line_1, city, state, zip, phone, email')
        .eq('id', leadId)
        .single();

      if (leadError) {
        // Log error for debugging - lead may not exist or permission denied
        const errorMessage = `Auto-trace: Failed to fetch lead ${leadId}: ${leadError.message}`;
        set({ error: errorMessage });
        throw new Error(errorMessage);
      }

      if (!lead) {
        const errorMessage = `Auto-trace: Lead ${leadId} not found`;
        set({ error: errorMessage });
        throw new Error(errorMessage);
      }

      // Check if lead already has contact info - skip auto-trace if so
      if (lead.phone || lead.email) {
        // Lead already has contact info, skip auto-trace (not an error)
        return null;
      }

      // Parse the full name into first and last names
      const nameParts = (lead.name || '').trim().split(/\s+/);
      const firstName = nameParts[0] || undefined;
      const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : undefined;

      // Run skip trace
      return await get().runSkipTrace({
        lead_id: leadId,
        first_name: firstName,
        last_name: lastName,
        address: lead.address_line_1 || undefined,
        city: lead.city || undefined,
        state: lead.state || undefined,
        zip: lead.zip || undefined,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : `Auto-trace failed for lead ${leadId}`;
      set({ error: message });
      throw error; // Propagate error to caller
    }
  },

  getSummary: () => {
    const results = get().results;

    const phoneCounts = results.reduce((sum, r) => sum + (r.phones?.length || 0), 0);
    const emailCounts = results.reduce((sum, r) => sum + (r.emails?.length || 0), 0);
    const matchedCount = results.filter((r) => r.matched_property_id).length;

    return {
      totalTraces: results.length,
      completedTraces: results.filter((r) => r.status === 'completed').length,
      pendingTraces: results.filter((r) => r.status === 'pending' || r.status === 'processing').length,
      failedTraces: results.filter((r) => r.status === 'failed').length,
      totalPhones: phoneCounts,
      totalEmails: emailCounts,
      propertiesMatched: matchedCount,
    };
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      results: [],
      currentResult: null,
      isLoading: false,
      error: null,
    }),
}));

// Selectors
export const selectCompletedResults = (state: SkipTracingState) =>
  state.results.filter((r) => r.status === 'completed');

export const selectPendingResults = (state: SkipTracingState) =>
  state.results.filter((r) => r.status === 'pending' || r.status === 'processing');

export const selectResultsByContact = (contactId: string) => (state: SkipTracingState) =>
  state.results.filter((r) => r.contact_id === contactId);

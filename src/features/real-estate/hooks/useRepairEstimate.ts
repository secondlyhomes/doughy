// src/features/real-estate/hooks/useRepairEstimate.ts
// Hook for managing repair estimates for a property

import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { RepairEstimate, RepairCategory } from '../types';

interface UseRepairEstimateOptions {
  propertyId: string | null;
}

export interface RepairCategorySummary {
  category: RepairCategory;
  label: string;
  items: RepairEstimate[];
  totalEstimate: number;
  completedCount: number;
}

interface UseRepairEstimateReturn {
  repairs: RepairEstimate[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  totalEstimate: number;
  totalCompleted: number;
  categorySummaries: RepairCategorySummary[];
}

// Category labels for display
export const REPAIR_CATEGORY_LABELS: Record<RepairCategory, string> = {
  interior: 'Interior',
  exterior: 'Exterior',
  structural: 'Structural',
  electrical: 'Electrical',
  plumbing: 'Plumbing',
  hvac: 'HVAC',
  systems: 'Systems',
  other: 'Other',
};

// Valid repair categories for type checking
const VALID_CATEGORIES: RepairCategory[] = ['interior', 'exterior', 'structural', 'electrical', 'plumbing', 'hvac', 'systems', 'other'];

/**
 * Safely convert a string to RepairCategory, defaulting to 'other'
 */
function toRepairCategory(value: string | null | undefined): RepairCategory {
  if (value && VALID_CATEGORIES.includes(value as RepairCategory)) {
    return value as RepairCategory;
  }
  return 'other';
}

// Extended category list for UI
export const REPAIR_CATEGORIES: { id: RepairCategory; label: string }[] = [
  { id: 'interior', label: 'Interior' },
  { id: 'exterior', label: 'Exterior' },
  { id: 'structural', label: 'Structural' },
  { id: 'electrical', label: 'Electrical' },
  { id: 'plumbing', label: 'Plumbing' },
  { id: 'hvac', label: 'HVAC' },
  { id: 'systems', label: 'Systems' },
  { id: 'other', label: 'Other' },
];

/**
 * Hook for fetching repair estimates for a property
 */
export function useRepairEstimate({ propertyId }: UseRepairEstimateOptions): UseRepairEstimateReturn {
  const [repairs, setRepairs] = useState<RepairEstimate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchRepairs = useCallback(async () => {
    if (!propertyId) {
      setRepairs([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: queryError } = await supabase
        .schema('investor').from('repair_estimates')
        .select('*')
        .eq('property_id', propertyId)
        .order('category', { ascending: true })
        .order('created_at', { ascending: false });

      if (queryError) {
        throw queryError;
      }

      // Convert database records to typed RepairEstimate
      const typedRepairs: RepairEstimate[] = (data || []).map(record => ({
        ...record,
        category: toRepairCategory(record.category),
        completed: record.is_completed ?? false,
        priority: (record.priority as RepairEstimate['priority']) || 'medium',
      }));
      setRepairs(typedRepairs);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error fetching repair estimates:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
    } finally {
      setIsLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    fetchRepairs();
  }, [fetchRepairs]);

  // Calculate totals and summaries
  const { totalEstimate, totalCompleted, categorySummaries } = useMemo(() => {
    let total = 0;
    let completed = 0;
    const categoryMap = new Map<RepairCategory, RepairEstimate[]>();

    // Initialize all categories
    REPAIR_CATEGORIES.forEach(cat => {
      categoryMap.set(cat.id, []);
    });

    // Group repairs by category
    repairs.forEach(repair => {
      total += repair.estimate || 0;
      if (repair.completed) {
        completed += repair.estimate || 0;
      }
      const existing = categoryMap.get(repair.category) || [];
      existing.push(repair);
      categoryMap.set(repair.category, existing);
    });

    // Build category summaries
    const summaries: RepairCategorySummary[] = REPAIR_CATEGORIES.map(cat => {
      const items = categoryMap.get(cat.id) || [];
      return {
        category: cat.id,
        label: cat.label,
        items,
        totalEstimate: items.reduce((sum, r) => sum + (r.estimate || 0), 0),
        completedCount: items.filter(r => r.completed).length,
      };
    }).filter(s => s.items.length > 0); // Only return categories with items

    return {
      totalEstimate: total,
      totalCompleted: completed,
      categorySummaries: summaries,
    };
  }, [repairs]);

  return {
    repairs,
    isLoading,
    error,
    refetch: fetchRepairs,
    totalEstimate,
    totalCompleted,
    categorySummaries,
  };
}

/**
 * Hook for repair estimate mutations (create, update, delete)
 */
export function useRepairEstimateMutations() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const createRepair = useCallback(async (
    propertyId: string,
    repairData: Partial<RepairEstimate>
  ): Promise<RepairEstimate | null> => {
    try {
      setIsLoading(true);
      setError(null);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const insertData = {
        property_id: propertyId,
        created_by: user.id,
        category: repairData.category || 'other',
        description: repairData.description || '',
        estimate: repairData.estimate || 0,
        notes: repairData.notes || null,
        is_completed: repairData.completed || false,
        priority: repairData.priority || 'medium',
      };

      const { data, error: insertError } = await supabase
        .schema('investor').from('repair_estimates')
        .insert(insertData)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Convert to typed RepairEstimate
      return {
        ...data,
        category: toRepairCategory(data.category),
        completed: data.is_completed ?? false,
        priority: (data.priority as RepairEstimate['priority']) || 'medium',
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error creating repair estimate:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateRepair = useCallback(async (
    repairId: string,
    updates: Partial<RepairEstimate>
  ): Promise<RepairEstimate | null> => {
    try {
      setIsLoading(true);
      setError(null);

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (updates.category !== undefined) updateData.category = updates.category;
      if (updates.description !== undefined) updateData.description = updates.description;
      if (updates.estimate !== undefined) updateData.estimate = updates.estimate;
      if (updates.notes !== undefined) updateData.notes = updates.notes;
      if (updates.completed !== undefined) updateData.is_completed = updates.completed;
      if (updates.priority !== undefined) updateData.priority = updates.priority;

      const { data, error: updateError } = await supabase
        .schema('investor').from('repair_estimates')
        .update(updateData as any)
        .eq('id', repairId)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      // Convert to typed RepairEstimate
      return {
        ...data,
        category: toRepairCategory(data.category),
        completed: data.is_completed ?? false,
        priority: (data.priority as RepairEstimate['priority']) || 'medium',
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error updating repair estimate:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRepair = useCallback(async (repairId: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setError(null);

      const { error: deleteError } = await supabase
        .schema('investor').from('repair_estimates')
        .delete()
        .eq('id', repairId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      console.error('Error deleting repair estimate:', errorMessage);
      setError(err instanceof Error ? err : new Error(errorMessage));
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleCompleted = useCallback(async (
    repairId: string,
    completed: boolean
  ): Promise<boolean> => {
    const result = await updateRepair(repairId, { completed });
    return result !== null;
  }, [updateRepair]);

  return {
    createRepair,
    updateRepair,
    deleteRepair,
    toggleCompleted,
    isLoading,
    error,
  };
}

// src/features/rental-properties/hooks/useLandlordAttention.ts
// Hook to fetch urgent items that need landlord attention
// Checks: open maintenance requests, upcoming turnovers, vacant units

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import type { AttentionItem } from '../components/LandlordNeedsAttention';

export function useLandlordAttention() {
  const router = useRouter();

  // Fetch open maintenance requests (reported or in_progress)
  const { data: maintenance, isLoading: maintenanceLoading } = useQuery({
    queryKey: ['landlord-attention', 'maintenance'],
    queryFn: async () => {
      const { data, error } = await supabase
        .schema('landlord')
        .from('maintenance_records')
        .select('id, title, priority, status, property_id, reported_at')
        .in('status', ['reported', 'scheduled', 'in_progress'])
        .order('reported_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  // Fetch upcoming turnovers (pending or checkout_complete, within next 7 days)
  const { data: turnovers, isLoading: turnoversLoading } = useQuery({
    queryKey: ['landlord-attention', 'turnovers'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase
        .schema('landlord')
        .from('turnovers')
        .select('id, property_id, checkout_at, checkin_at, status')
        .in('status', ['pending', 'checkout_complete', 'cleaning_scheduled'])
        .lte('checkout_at', weekFromNow)
        .order('checkout_at', { ascending: true })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    staleTime: 60_000,
  });

  const isLoading = maintenanceLoading || turnoversLoading;

  const items = useMemo<AttentionItem[]>(() => {
    const result: AttentionItem[] = [];

    // Map maintenance requests
    if (maintenance) {
      for (const m of maintenance) {
        const isEmergency = m.priority === 'emergency' || m.priority === 'high';
        result.push({
          id: `maint-${m.id}`,
          type: 'maintenance',
          title: m.title || 'Maintenance request',
          subtitle: `${m.status === 'reported' ? 'New' : m.status} ${isEmergency ? '- URGENT' : ''}`,
          urgency: isEmergency ? 'high' : m.status === 'reported' ? 'medium' : 'low',
          propertyId: m.property_id,
          onPress: () => {
            if (m.property_id) {
              router.push(`/(tabs)/rental-properties/${m.property_id}/maintenance/${m.id}` as never);
            }
          },
        });
      }
    }

    // Map turnovers
    if (turnovers) {
      for (const t of turnovers) {
        const checkoutDate = new Date(t.checkout_at);
        const now = new Date();
        const hoursUntil = (checkoutDate.getTime() - now.getTime()) / (1000 * 60 * 60);
        const isUrgent = hoursUntil < 24;

        result.push({
          id: `turn-${t.id}`,
          type: 'turnover',
          title: `Turnover ${t.status === 'pending' ? 'upcoming' : 'in progress'}`,
          subtitle: `Checkout ${isUrgent ? 'today' : checkoutDate.toLocaleDateString()}`,
          urgency: isUrgent ? 'high' : 'medium',
          propertyId: t.property_id,
          onPress: () => {
            if (t.property_id) {
              router.push(`/(tabs)/rental-properties/${t.property_id}/turnovers/${t.id}` as never);
            }
          },
        });
      }
    }

    // Sort by urgency: high first, then medium, then low
    const urgencyOrder = { high: 0, medium: 1, low: 2 };
    result.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency]);

    return result;
  }, [maintenance, turnovers]);

  return { items, isLoading };
}

// app/(tabs)/deals/new.tsx
// Create new deal route - handles deal creation and redirects to the new deal
// This file must exist to prevent "/deals/new" from being caught by [dealId] route

import React, { useEffect, useRef } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner } from '@/components/ui';
import { useCreateDeal } from '@/features/deals/hooks/useDeals';

export default function NewDealRoute() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colors = useThemeColors();
  const createDeal = useCreateDeal();
  const hasCreated = useRef(false);
  const mountedRef = useRef(true);

  // Get pre-filled params from navigation (support both camelCase and snake_case)
  // Normalize empty strings to undefined
  const rawPropertyId = (params.propertyId || params.property_id) as string | undefined;
  const rawLeadId = (params.leadId || params.lead_id) as string | undefined;
  const propertyId = rawPropertyId && rawPropertyId.trim() ? rawPropertyId : undefined;
  const leadId = rawLeadId && rawLeadId.trim() ? rawLeadId : undefined;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    // Prevent double creation in strict mode
    if (hasCreated.current) return;
    hasCreated.current = true;

    // Create the deal immediately with provided params
    createDeal.mutate(
      {
        property_id: propertyId,
        lead_id: leadId,
        stage: 'new',
      },
      {
        onSuccess: (newDeal) => {
          // Only navigate if component is still mounted
          if (!mountedRef.current) return;
          // Replace current route with the new deal's cockpit
          router.replace(`/(tabs)/deals/${newDeal.id}`);
        },
        onError: (error) => {
          // Only show alert if component is still mounted
          if (!mountedRef.current) return;
          Alert.alert(
            'Error',
            'Failed to create deal. Please try again.',
            [
              {
                text: 'OK',
                onPress: () => router.back(),
              },
            ]
          );
          console.error('Failed to create deal:', error);
        },
      }
    );
  }, [createDeal, propertyId, leadId, router]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <View className="flex-1 items-center justify-center">
        <LoadingSpinner text="Creating deal..." />
      </View>
    </ThemedSafeAreaView>
  );
}

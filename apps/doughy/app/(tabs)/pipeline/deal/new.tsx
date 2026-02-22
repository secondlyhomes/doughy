// app/(tabs)/pipeline/deal/new.tsx
// Create new deal screen within the Pipeline tab
import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ThemedSafeAreaView } from '@/components';
import { BottomSheetSection, Button, Input, Select } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useCreateDeal, CreateDealInput } from '@/features/deals/hooks/useDeals';
import { useLeads } from '@/features/leads/hooks/useLeads';
import { useProperties } from '@/features/real-estate/hooks/useProperties';
import type { DealStrategy } from '@/features/deals/types';

export default function NewDealScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams<{ lead_id?: string; property_id?: string }>();

  // Form state
  const [selectedLeadId, setSelectedLeadId] = useState(params.lead_id || '');
  const [selectedPropertyId, setSelectedPropertyId] = useState(params.property_id || '');
  const [selectedStrategy, setSelectedStrategy] = useState<DealStrategy>('wholesale');
  const [nextAction, setNextAction] = useState('');

  // Data hooks
  const { leads } = useLeads();
  const { properties } = useProperties();
  const createDeal = useCreateDeal();

  const handleCreate = useCallback(() => {
    const dealData: CreateDealInput = {
      lead_id: selectedLeadId || undefined,
      property_id: selectedPropertyId || undefined,
      stage: 'new',
      strategy: selectedStrategy,
      next_action: nextAction || undefined,
    };

    createDeal.mutate(dealData, {
      onSuccess: (newDeal) => {
        router.replace(`/(tabs)/pipeline/deal/${newDeal.id}`);
      },
      onError: (error) => {
        console.error('Failed to create deal:', error);
        Alert.alert('Error', 'Failed to create deal. Please try again.');
      },
    });
  }, [selectedLeadId, selectedPropertyId, selectedStrategy, nextAction, createDeal, router]);

  return (
    <ThemedSafeAreaView className="flex-1">
      <View className="px-4 py-6 flex-1">
        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.foreground, marginBottom: 24 }}>
          Create New Deal
        </Text>

        <BottomSheetSection title="Deal Information">
          <Select
            label="Lead (Optional)"
            placeholder="Select a lead"
            value={selectedLeadId}
            onValueChange={setSelectedLeadId}
            options={[
              { label: 'None', value: '' },
              ...leads.map(lead => ({
                label: lead.name,
                value: lead.id,
              })),
            ]}
            className="mb-4"
          />

          <Select
            label="Property (Optional)"
            placeholder="Select a property"
            value={selectedPropertyId}
            onValueChange={setSelectedPropertyId}
            options={[
              { label: 'None', value: '' },
              ...properties.map(property => ({
                label: `${property.address}, ${property.city}`,
                value: property.id,
              })),
            ]}
            className="mb-4"
          />

          <Select
            label="Investment Strategy"
            value={selectedStrategy}
            onValueChange={(val) => setSelectedStrategy(val as DealStrategy)}
            options={[
              { label: 'Wholesale', value: 'wholesale' },
              { label: 'Fix & Flip', value: 'fix_and_flip' },
              { label: 'BRRRR', value: 'brrrr' },
              { label: 'Buy & Hold', value: 'buy_and_hold' },
              { label: 'Seller Finance', value: 'seller_finance' },
            ]}
            className="mb-4"
          />

          <Input
            label="Next Action (Optional)"
            placeholder="e.g., Schedule property walkthrough"
            value={nextAction}
            onChangeText={setNextAction}
            multiline
            style={{ color: colors.foreground, backgroundColor: colors.input }}
          />
        </BottomSheetSection>

        <View className="flex-row gap-3 mt-auto pb-6">
          <Button variant="outline" onPress={() => router.back()} className="flex-1">
            Cancel
          </Button>
          <Button onPress={handleCreate} className="flex-1" disabled={createDeal.isPending}>
            {createDeal.isPending ? 'Creating...' : 'Create Deal'}
          </Button>
        </View>
      </View>
    </ThemedSafeAreaView>
  );
}

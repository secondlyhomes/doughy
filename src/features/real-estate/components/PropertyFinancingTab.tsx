// src/features/real-estate/components/PropertyFinancingTab.tsx
// Financing scenarios tab content for property detail

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { CreditCard, Plus, Calculator, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Button, LoadingSpinner } from '@/components/ui';
import { Property, FinancingScenario } from '../types';
import { useFinancingScenarios, useFinancingScenarioMutations, LoanType } from '../hooks/useFinancingScenarios';
import { AddFinancingSheet } from './AddFinancingSheet';
import { FinancingScenarioCard } from './FinancingScenarioCard';
import { FinancingComparisonTable } from './FinancingComparisonTable';

interface PropertyFinancingTabProps {
  property: Property;
}

export function PropertyFinancingTab({ property }: PropertyFinancingTabProps) {
  const colors = useThemeColors();
  const { scenarios, isLoading, error, refetch } = useFinancingScenarios({ propertyId: property.id });
  const { createScenario, updateScenario, deleteScenario, isLoading: isMutating } =
    useFinancingScenarioMutations();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingScenario, setEditingScenario] = useState<FinancingScenario | null>(null);
  const [selectedScenarios, setSelectedScenarios] = useState<Set<string>>(new Set());

  const hasScenarios = scenarios.length > 0;
  const purchasePrice = property.purchase_price || 0;

  const handleAddScenario = useCallback(async (data: {
    name: string;
    scenarioType: LoanType;
    purchasePrice: number;
    downPayment: number;
    loanAmount: number;
    interestRate: number;
    loanTerm: number;
    closingCosts?: number;
    notes?: string;
  }) => {
    if (editingScenario) {
      const result = await updateScenario(editingScenario.id, data);
      if (result) {
        setShowAddSheet(false);
        setEditingScenario(null);
        refetch();
      }
    } else {
      const result = await createScenario(property.id, data);
      if (result) {
        setShowAddSheet(false);
        refetch();
      }
    }
  }, [editingScenario, createScenario, updateScenario, property.id, refetch]);

  const handleEditScenario = useCallback((scenario: FinancingScenario) => {
    setEditingScenario(scenario);
    setShowAddSheet(true);
  }, []);

  const handleDeleteScenario = useCallback((scenario: FinancingScenario) => {
    Alert.alert(
      'Delete Scenario',
      `Are you sure you want to delete "${scenario.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteScenario(scenario.id);
            if (success) refetch();
          },
        },
      ]
    );
  }, [deleteScenario, refetch]);

  const handleCloseSheet = useCallback(() => {
    setShowAddSheet(false);
    setEditingScenario(null);
  }, []);

  const toggleScenarioSelection = useCallback((scenarioId: string) => {
    setSelectedScenarios(prev => {
      const next = new Set(prev);
      if (next.has(scenarioId)) {
        next.delete(scenarioId);
      } else if (next.size < 3) {
        next.add(scenarioId);
      }
      return next;
    });
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 py-12">
        <LoadingSpinner fullScreen text="Loading scenarios..." />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="mb-4" style={{ color: colors.destructive }}>Failed to load scenarios</Text>
        <Button variant="secondary" onPress={refetch}>
          <RefreshCw size={16} color={colors.foreground} />
          Try Again
        </Button>
      </View>
    );
  }

  const comparisonScenarios = scenarios.filter(s => selectedScenarios.has(s.id));

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View className="gap-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Financing Scenarios</Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <Button onPress={() => setShowAddSheet(true)} size="sm">
            <Plus size={16} color={colors.primaryForeground} />
            Add
          </Button>
        </View>

        {/* Comparison Panel */}
        <FinancingComparisonTable scenarios={comparisonScenarios} />

        {/* Empty State */}
        {!hasScenarios && (
          <View className="items-center justify-center py-12 rounded-xl" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="rounded-full p-4 mb-4" style={{ backgroundColor: colors.muted }}>
              <CreditCard size={32} color={colors.mutedForeground} />
            </View>
            <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>No Financing Scenarios</Text>
            <Text className="text-center px-8 mb-4" style={{ color: colors.mutedForeground }}>
              Create financing scenarios to compare different loan options and calculate monthly payments.
            </Text>
            <Button variant="secondary" onPress={() => setShowAddSheet(true)}>
              <Plus size={16} color={colors.foreground} />
              Create First Scenario
            </Button>
          </View>
        )}

        {/* Scenarios List */}
        {hasScenarios && (
          <View className="gap-3">
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Tap to select scenarios for comparison (max 3)
            </Text>
            {scenarios.map((scenario) => (
              <FinancingScenarioCard
                key={scenario.id}
                scenario={scenario}
                isSelected={selectedScenarios.has(scenario.id)}
                onSelect={() => toggleScenarioSelection(scenario.id)}
                onEdit={() => handleEditScenario(scenario)}
                onDelete={() => handleDeleteScenario(scenario)}
              />
            ))}
          </View>
        )}

        {/* Tips */}
        <View className="rounded-xl p-4" style={{ backgroundColor: colors.muted }}>
          <View className="flex-row items-center mb-2">
            <Calculator size={16} color={colors.mutedForeground} />
            <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>Tips</Text>
          </View>
          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
            Create multiple scenarios with different loan types, down payments, and terms to find the best financing option for your deal.
          </Text>
        </View>
      </View>

      {/* Add/Edit Financing Sheet */}
      <AddFinancingSheet
        visible={showAddSheet}
        onClose={handleCloseSheet}
        onSubmit={handleAddScenario}
        isLoading={isMutating}
        editScenario={editingScenario}
        defaultPurchasePrice={purchasePrice}
      />
    </ScrollView>
  );
}

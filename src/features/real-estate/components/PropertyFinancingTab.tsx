// src/features/real-estate/components/PropertyFinancingTab.tsx
// Financing scenarios tab content for property detail

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  CreditCard,
  Plus,
  Calculator,
  Percent,
  RefreshCw,
  Edit2,
  Trash2,
  TrendingUp,
  DollarSign,
} from 'lucide-react-native';
import { Property, FinancingScenario } from '../types';
import {
  useFinancingScenarios,
  useFinancingScenarioMutations,
  LOAN_TYPES,
  LoanType,
  FinancingScenarioWithCalcs,
} from '../hooks/useFinancingScenarios';
import { AddFinancingSheet } from './AddFinancingSheet';
import { formatCurrency, formatPercentage } from '../utils/formatters';

interface PropertyFinancingTabProps {
  property: Property;
}

export function PropertyFinancingTab({ property }: PropertyFinancingTabProps) {
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
            if (success) {
              refetch();
            }
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
        // Limit comparison to 3 scenarios
        next.add(scenarioId);
      }
      return next;
    });
  }, []);

  const getLoanTypeLabel = (type: string): string => {
    return LOAN_TYPES.find(t => t.id === type)?.label || type;
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-2">Loading scenarios...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-destructive mb-4">Failed to load scenarios</Text>
        <TouchableOpacity
          onPress={refetch}
          className="flex-row items-center bg-muted px-4 py-2 rounded-lg"
        >
          <RefreshCw size={16} className="text-foreground" />
          <Text className="text-foreground font-medium ml-2">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Get selected scenarios for comparison
  const comparisonScenarios = scenarios.filter(s => selectedScenarios.has(s.id));

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 20 }}
    >
      <View className="gap-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-semibold text-foreground">Financing Scenarios</Text>
            <Text className="text-xs text-muted-foreground">
              {scenarios.length} scenario{scenarios.length !== 1 ? 's' : ''}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddSheet(true)}
            className="flex-row items-center bg-primary px-3 py-2 rounded-lg"
          >
            <Plus size={16} color="white" />
            <Text className="text-primary-foreground font-medium ml-1">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Comparison Panel */}
        {comparisonScenarios.length > 1 && (
          <View className="bg-card rounded-xl border border-border overflow-hidden">
            <View className="px-4 py-3 bg-primary/5 border-b border-border">
              <Text className="text-sm font-semibold text-foreground">Comparison</Text>
              <Text className="text-xs text-muted-foreground">
                Comparing {comparisonScenarios.length} scenarios
              </Text>
            </View>

            {/* Comparison Header */}
            <View className="flex-row border-b border-border">
              <View className="flex-1 p-3 border-r border-border">
                <Text className="text-xs text-muted-foreground text-center">Metric</Text>
              </View>
              {comparisonScenarios.map((scenario, index) => (
                <View key={scenario.id} className={`flex-1 p-3 ${index < comparisonScenarios.length - 1 ? 'border-r border-border' : ''}`}>
                  <Text className="text-xs text-foreground text-center font-medium" numberOfLines={1}>
                    {scenario.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Monthly Payment Row */}
            <View className="flex-row border-b border-border">
              <View className="flex-1 p-3 border-r border-border bg-muted/30">
                <Text className="text-xs text-muted-foreground">Monthly</Text>
              </View>
              {comparisonScenarios.map((scenario, index) => (
                <View key={scenario.id} className={`flex-1 p-3 ${index < comparisonScenarios.length - 1 ? 'border-r border-border' : ''}`}>
                  <Text className="text-xs text-foreground text-center font-medium">
                    {formatCurrency(scenario.calculatedPayment)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Total Interest Row */}
            <View className="flex-row border-b border-border">
              <View className="flex-1 p-3 border-r border-border bg-muted/30">
                <Text className="text-xs text-muted-foreground">Total Interest</Text>
              </View>
              {comparisonScenarios.map((scenario, index) => (
                <View key={scenario.id} className={`flex-1 p-3 ${index < comparisonScenarios.length - 1 ? 'border-r border-border' : ''}`}>
                  <Text className="text-xs text-foreground text-center font-medium">
                    {formatCurrency(scenario.totalInterest)}
                  </Text>
                </View>
              ))}
            </View>

            {/* Cash Required Row */}
            <View className="flex-row">
              <View className="flex-1 p-3 border-r border-border bg-muted/30">
                <Text className="text-xs text-muted-foreground">Cash Needed</Text>
              </View>
              {comparisonScenarios.map((scenario, index) => (
                <View key={scenario.id} className={`flex-1 p-3 ${index < comparisonScenarios.length - 1 ? 'border-r border-border' : ''}`}>
                  <Text className="text-xs text-foreground text-center font-medium">
                    {formatCurrency(scenario.cashRequired)}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty State */}
        {!hasScenarios && (
          <View className="items-center justify-center py-12 bg-card rounded-xl border border-border">
            <View className="bg-muted rounded-full p-4 mb-4">
              <CreditCard size={32} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-semibold text-foreground mb-2">No Financing Scenarios</Text>
            <Text className="text-muted-foreground text-center px-8 mb-4">
              Create financing scenarios to compare different loan options and calculate monthly payments.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddSheet(true)}
              className="flex-row items-center bg-muted px-4 py-2 rounded-lg"
            >
              <Plus size={16} className="text-foreground" />
              <Text className="text-foreground font-medium ml-2">Create First Scenario</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Scenarios List */}
        {hasScenarios && (
          <View className="gap-3">
            <Text className="text-xs text-muted-foreground">
              Tap to select scenarios for comparison (max 3)
            </Text>

            {scenarios.map((scenario) => {
              const input = scenario.input_json || {};
              const isSelected = selectedScenarios.has(scenario.id);

              return (
                <TouchableOpacity
                  key={scenario.id}
                  onPress={() => toggleScenarioSelection(scenario.id)}
                  className={`bg-card rounded-xl border overflow-hidden ${
                    isSelected ? 'border-primary border-2' : 'border-border'
                  }`}
                >
                  {/* Header */}
                  <View className="flex-row items-center justify-between p-4 border-b border-border">
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-foreground font-semibold">{scenario.name}</Text>
                        {isSelected && (
                          <View className="ml-2 bg-primary px-2 py-0.5 rounded">
                            <Text className="text-xs text-primary-foreground">Selected</Text>
                          </View>
                        )}
                      </View>
                      <Text className="text-xs text-muted-foreground">
                        {getLoanTypeLabel(scenario.scenario_type)} • {input.loanTerm || 30} years
                      </Text>
                    </View>

                    <View className="flex-row gap-1">
                      <TouchableOpacity
                        onPress={() => handleEditScenario(scenario)}
                        className="p-2 bg-muted rounded-lg"
                      >
                        <Edit2 size={14} className="text-muted-foreground" />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDeleteScenario(scenario)}
                        className="p-2 bg-destructive/10 rounded-lg"
                      >
                        <Trash2 size={14} className="text-destructive" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Payment Highlight */}
                  <View className="p-4 bg-primary/5">
                    <View className="flex-row justify-between items-center">
                      <View>
                        <Text className="text-xs text-muted-foreground">Monthly Payment</Text>
                        <Text className="text-2xl font-bold text-primary">
                          {formatCurrency(scenario.calculatedPayment)}
                        </Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-xs text-muted-foreground">Interest Rate</Text>
                        <Text className="text-lg font-semibold text-foreground">
                          {formatPercentage(input.interestRate || 0)}
                        </Text>
                      </View>
                    </View>
                  </View>

                  {/* Details */}
                  <View className="p-4">
                    <View className="flex-row flex-wrap gap-x-4 gap-y-2">
                      <View className="min-w-[45%]">
                        <Text className="text-xs text-muted-foreground">Loan Amount</Text>
                        <Text className="text-sm text-foreground font-medium">
                          {formatCurrency(input.loanAmount || 0)}
                        </Text>
                      </View>
                      <View className="min-w-[45%]">
                        <Text className="text-xs text-muted-foreground">Down Payment</Text>
                        <Text className="text-sm text-foreground font-medium">
                          {formatCurrency(input.downPayment || 0)}
                        </Text>
                      </View>
                      <View className="min-w-[45%]">
                        <Text className="text-xs text-muted-foreground">Total Interest</Text>
                        <Text className="text-sm text-foreground font-medium">
                          {formatCurrency(scenario.totalInterest)}
                        </Text>
                      </View>
                      <View className="min-w-[45%]">
                        <Text className="text-xs text-muted-foreground">Cash Required</Text>
                        <Text className="text-sm text-foreground font-medium">
                          {formatCurrency(scenario.cashRequired)}
                        </Text>
                      </View>
                    </View>

                    {/* Notes */}
                    {scenario.description && (
                      <Text className="text-xs text-muted-foreground mt-3">
                        {scenario.description}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Quick Calculator Info */}
        <View className="bg-muted rounded-xl p-4">
          <View className="flex-row items-center mb-2">
            <Calculator size={16} className="text-muted-foreground" />
            <Text className="text-sm font-medium text-foreground ml-2">Tips</Text>
          </View>
          <Text className="text-xs text-muted-foreground">
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

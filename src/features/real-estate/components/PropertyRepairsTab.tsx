// src/features/real-estate/components/PropertyRepairsTab.tsx
// Repair estimates tab content for property detail

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { Wrench, Plus, RefreshCw } from 'lucide-react-native';
import { Property, RepairEstimate, RepairCategory } from '../types';
import { useRepairEstimate, useRepairEstimateMutations, REPAIR_CATEGORIES } from '../hooks/useRepairEstimate';
import { usePropertyMutations } from '../hooks/useProperties';
import { AddRepairSheet } from './AddRepairSheet';
import { RepairSummaryCard } from './RepairSummaryCard';
import { RepairCategorySection } from './RepairCategorySection';
import { formatCurrency } from '../utils/formatters';

interface PropertyRepairsTabProps {
  property: Property;
  onPropertyUpdate?: () => void;
}

export function PropertyRepairsTab({ property, onPropertyUpdate }: PropertyRepairsTabProps) {
  const { repairs, isLoading, error, refetch, totalEstimate, totalCompleted, categorySummaries } =
    useRepairEstimate({ propertyId: property.id });
  const { createRepair, updateRepair, deleteRepair, toggleCompleted, isLoading: isMutating } =
    useRepairEstimateMutations();
  const { updateProperty } = usePropertyMutations();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingRepair, setEditingRepair] = useState<RepairEstimate | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<RepairCategory | undefined>();
  const [expandedCategories, setExpandedCategories] = useState<Set<RepairCategory>>(new Set());

  const hasRepairs = repairs.length > 0;
  const propertyRepairCost = property.repair_cost || 0;

  const handleAddRepair = useCallback(async (data: Partial<RepairEstimate>) => {
    if (editingRepair) {
      const result = await updateRepair(editingRepair.id, data);
      if (result) {
        setShowAddSheet(false);
        setEditingRepair(null);
        refetch();
      }
    } else {
      const result = await createRepair(property.id, data);
      if (result) {
        setShowAddSheet(false);
        setPreselectedCategory(undefined);
        refetch();
      }
    }
  }, [editingRepair, createRepair, updateRepair, property.id, refetch]);

  const handleEditRepair = useCallback((repair: RepairEstimate) => {
    setEditingRepair(repair);
    setShowAddSheet(true);
  }, []);

  const handleDeleteRepair = useCallback((repair: RepairEstimate) => {
    Alert.alert(
      'Delete Repair',
      `Are you sure you want to delete "${repair.description}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteRepair(repair.id);
            if (success) refetch();
          },
        },
      ]
    );
  }, [deleteRepair, refetch]);

  const handleToggleCompleted = useCallback(async (repair: RepairEstimate) => {
    const success = await toggleCompleted(repair.id, !repair.completed);
    if (success) refetch();
  }, [toggleCompleted, refetch]);

  const handleAddToCategory = useCallback((category: RepairCategory) => {
    setPreselectedCategory(category);
    setShowAddSheet(true);
  }, []);

  const toggleCategory = useCallback((category: RepairCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  }, []);

  const handleUpdatePropertyRepairCost = useCallback(() => {
    if (totalEstimate === propertyRepairCost) return;
    Alert.alert(
      'Update Repair Cost',
      `Update property repair cost to ${formatCurrency(totalEstimate)}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            const result = await updateProperty(property.id, { repair_cost: totalEstimate });
            if (result && onPropertyUpdate) onPropertyUpdate();
          },
        },
      ]
    );
  }, [totalEstimate, propertyRepairCost, updateProperty, property.id, onPropertyUpdate]);

  const handleCloseSheet = useCallback(() => {
    setShowAddSheet(false);
    setEditingRepair(null);
    setPreselectedCategory(undefined);
  }, []);

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-2">Loading repairs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-destructive mb-4">Failed to load repairs</Text>
        <TouchableOpacity onPress={refetch} className="flex-row items-center bg-muted px-4 py-2 rounded-lg">
          <RefreshCw size={16} className="text-foreground" />
          <Text className="text-foreground font-medium ml-2">Try Again</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View className="gap-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-lg font-semibold text-foreground">Repair Estimates</Text>
            <Text className="text-xs text-muted-foreground">
              {repairs.length} item{repairs.length !== 1 ? 's' : ''} • {formatCurrency(totalEstimate)} total
            </Text>
          </View>
          <TouchableOpacity onPress={() => setShowAddSheet(true)} className="flex-row items-center bg-primary px-3 py-2 rounded-lg">
            <Plus size={16} color="white" />
            <Text className="text-primary-foreground font-medium ml-1">Add</Text>
          </TouchableOpacity>
        </View>

        {/* Total Summary Card */}
        <RepairSummaryCard
          totalEstimate={totalEstimate}
          totalCompleted={totalCompleted}
          propertyRepairCost={propertyRepairCost}
          onSyncRepairCost={handleUpdatePropertyRepairCost}
        />

        {/* Empty State */}
        {!hasRepairs && (
          <>
            <View className="items-center justify-center py-12 bg-card rounded-xl border border-border">
              <View className="bg-muted rounded-full p-4 mb-4">
                <Wrench size={32} className="text-muted-foreground" />
              </View>
              <Text className="text-lg font-semibold text-foreground mb-2">No Repair Estimates</Text>
              <Text className="text-muted-foreground text-center px-8 mb-4">
                Add repair estimates by category to track renovation costs.
              </Text>
            </View>

            {/* Quick Add Categories */}
            <View className="bg-card rounded-xl p-4 border border-border">
              <Text className="text-sm font-medium text-foreground mb-3">Quick Add by Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {REPAIR_CATEGORIES.map(category => (
                  <TouchableOpacity
                    key={category.id}
                    onPress={() => handleAddToCategory(category.id)}
                    className="flex-row items-center bg-muted px-3 py-2 rounded-lg"
                  >
                    <Plus size={12} className="text-muted-foreground" />
                    <Text className="text-foreground text-sm ml-1">{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </>
        )}

        {/* Category List */}
        {hasRepairs && (
          <View className="gap-3">
            {categorySummaries.map(summary => (
              <RepairCategorySection
                key={summary.category}
                summary={summary}
                isExpanded={expandedCategories.has(summary.category)}
                onToggle={() => toggleCategory(summary.category)}
                onAddToCategory={() => handleAddToCategory(summary.category)}
                onEditRepair={handleEditRepair}
                onDeleteRepair={handleDeleteRepair}
                onToggleCompleted={handleToggleCompleted}
              />
            ))}
          </View>
        )}
      </View>

      {/* Add/Edit Repair Sheet */}
      <AddRepairSheet
        visible={showAddSheet}
        onClose={handleCloseSheet}
        onSubmit={handleAddRepair}
        isLoading={isMutating}
        editRepair={editingRepair}
        preselectedCategory={preselectedCategory}
      />
    </ScrollView>
  );
}

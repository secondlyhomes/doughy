// src/features/real-estate/components/PropertyRepairsTab.tsx
// Repair estimates tab content for property detail

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { Wrench, Plus, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { Button, LoadingSpinner } from '@/components/ui';
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
  const colors = useThemeColors();
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
      <View className="flex-1 py-12">
        <LoadingSpinner fullScreen text="Loading repairs..." />
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text style={{ color: colors.destructive }} className="mb-4">Failed to load repairs</Text>
        <Button variant="secondary" onPress={refetch}>
          <RefreshCw size={16} color={colors.foreground} />
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
      <View className="gap-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text style={{ color: colors.foreground }} className="text-lg font-semibold">Repair Estimates</Text>
            <Text style={{ color: colors.mutedForeground }} className="text-xs">
              {repairs.length} item{repairs.length !== 1 ? 's' : ''} • {formatCurrency(totalEstimate)} total
            </Text>
          </View>
          <Button onPress={() => setShowAddSheet(true)} size="sm">
            <Plus size={16} color={colors.primaryForeground} />
            Add
          </Button>
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
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="items-center justify-center py-12 rounded-xl border">
              <View style={{ backgroundColor: colors.muted }} className="rounded-full p-4 mb-4">
                <Wrench size={32} color={colors.mutedForeground} />
              </View>
              <Text style={{ color: colors.foreground }} className="text-lg font-semibold mb-2">No Repair Estimates</Text>
              <Text style={{ color: colors.mutedForeground }} className="text-center px-8 mb-4">
                Add repair estimates by category to track renovation costs.
              </Text>
            </View>

            {/* Quick Add Categories */}
            <View style={{ backgroundColor: colors.card, borderColor: colors.border }} className="rounded-xl p-4 border">
              <Text style={{ color: colors.foreground }} className="text-sm font-medium mb-3">Quick Add by Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {REPAIR_CATEGORIES.map(category => (
                  <Button
                    key={category.id}
                    variant="secondary"
                    size="sm"
                    onPress={() => handleAddToCategory(category.id)}
                  >
                    <Plus size={12} color={colors.mutedForeground} />
                    {category.label}
                  </Button>
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

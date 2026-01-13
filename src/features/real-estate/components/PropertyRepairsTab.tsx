// src/features/real-estate/components/PropertyRepairsTab.tsx
// Repair estimates tab content for property detail

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import {
  Wrench,
  Plus,
  RefreshCw,
  Check,
  ChevronDown,
  ChevronRight,
  Trash2,
  Edit2,
  AlertCircle,
} from 'lucide-react-native';
import { Property, RepairEstimate, RepairCategory } from '../types';
import { useRepairEstimate, useRepairEstimateMutations, REPAIR_CATEGORIES } from '../hooks/useRepairEstimate';
import { usePropertyMutations } from '../hooks/useProperties';
import { AddRepairSheet } from './AddRepairSheet';
import { formatCurrency } from '../utils/formatters';

interface PropertyRepairsTabProps {
  property: Property;
  onPropertyUpdate?: () => void;
}

const PRIORITY_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
};

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
            if (success) {
              refetch();
            }
          },
        },
      ]
    );
  }, [deleteRepair, refetch]);

  const handleToggleCompleted = useCallback(async (repair: RepairEstimate) => {
    const success = await toggleCompleted(repair.id, !repair.completed);
    if (success) {
      refetch();
    }
  }, [toggleCompleted, refetch]);

  const handleAddToCategory = useCallback((category: RepairCategory) => {
    setPreselectedCategory(category);
    setShowAddSheet(true);
  }, []);

  const toggleCategory = useCallback((category: RepairCategory) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleUpdatePropertyRepairCost = useCallback(async () => {
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
            if (result && onPropertyUpdate) {
              onPropertyUpdate();
            }
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
            <Text className="text-lg font-semibold text-foreground">Repair Estimates</Text>
            <Text className="text-xs text-muted-foreground">
              {repairs.length} item{repairs.length !== 1 ? 's' : ''} • {formatCurrency(totalEstimate)} total
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

        {/* Total Summary Card */}
        <View className="bg-card rounded-xl border border-border overflow-hidden">
          <View className="p-4 bg-primary/5">
            <View className="flex-row justify-between items-center">
              <View>
                <Text className="text-xs text-muted-foreground">Total Estimated</Text>
                <Text className="text-2xl font-bold text-primary">{formatCurrency(totalEstimate)}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs text-muted-foreground">Completed</Text>
                <Text className="text-lg font-semibold text-green-600">{formatCurrency(totalCompleted)}</Text>
              </View>
            </View>

            {/* Progress bar */}
            {totalEstimate > 0 && (
              <View className="mt-3">
                <View className="h-2 bg-muted rounded-full overflow-hidden">
                  <View
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${Math.min((totalCompleted / totalEstimate) * 100, 100)}%` }}
                  />
                </View>
                <Text className="text-xs text-muted-foreground mt-1">
                  {Math.round((totalCompleted / totalEstimate) * 100)}% completed
                </Text>
              </View>
            )}
          </View>

          {/* Sync with property */}
          {totalEstimate !== propertyRepairCost && totalEstimate > 0 && (
            <TouchableOpacity
              onPress={handleUpdatePropertyRepairCost}
              className="flex-row items-center justify-center py-3 border-t border-border bg-yellow-50"
            >
              <AlertCircle size={14} className="text-yellow-600" />
              <Text className="text-sm text-yellow-700 font-medium ml-2">
                Update property repair cost to {formatCurrency(totalEstimate)}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Empty State */}
        {!hasRepairs && (
          <View className="items-center justify-center py-12 bg-card rounded-xl border border-border">
            <View className="bg-muted rounded-full p-4 mb-4">
              <Wrench size={32} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-semibold text-foreground mb-2">No Repair Estimates</Text>
            <Text className="text-muted-foreground text-center px-8 mb-4">
              Add repair estimates by category to track renovation costs.
            </Text>
          </View>
        )}

        {/* Quick Add Categories (when empty) */}
        {!hasRepairs && (
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
        )}

        {/* Category List */}
        {hasRepairs && (
          <View className="gap-3">
            {categorySummaries.map(summary => {
              const isExpanded = expandedCategories.has(summary.category);

              return (
                <View
                  key={summary.category}
                  className="bg-card rounded-xl border border-border overflow-hidden"
                >
                  {/* Category Header */}
                  <TouchableOpacity
                    onPress={() => toggleCategory(summary.category)}
                    className="flex-row items-center justify-between p-4"
                  >
                    <View className="flex-row items-center flex-1">
                      <View className="bg-primary/10 p-2 rounded-lg">
                        <Wrench size={16} className="text-primary" />
                      </View>
                      <View className="ml-3 flex-1">
                        <Text className="text-foreground font-semibold">{summary.label}</Text>
                        <Text className="text-xs text-muted-foreground">
                          {summary.items.length} item{summary.items.length !== 1 ? 's' : ''} •{' '}
                          {summary.completedCount} completed
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center">
                      <Text className="text-foreground font-semibold mr-2">
                        {formatCurrency(summary.totalEstimate)}
                      </Text>
                      {isExpanded ? (
                        <ChevronDown size={20} className="text-muted-foreground" />
                      ) : (
                        <ChevronRight size={20} className="text-muted-foreground" />
                      )}
                    </View>
                  </TouchableOpacity>

                  {/* Category Items */}
                  {isExpanded && (
                    <View className="border-t border-border">
                      {summary.items.map((repair, index) => (
                        <View
                          key={repair.id}
                          className={`p-4 ${index > 0 ? 'border-t border-border' : ''}`}
                        >
                          <View className="flex-row items-start">
                            {/* Completed checkbox */}
                            <TouchableOpacity
                              onPress={() => handleToggleCompleted(repair)}
                              className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${
                                repair.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-muted-foreground'
                              }`}
                            >
                              {repair.completed && <Check size={14} color="white" />}
                            </TouchableOpacity>

                            {/* Content */}
                            <View className="flex-1">
                              <View className="flex-row items-center justify-between">
                                <Text
                                  className={`text-foreground font-medium flex-1 ${
                                    repair.completed ? 'line-through opacity-60' : ''
                                  }`}
                                >
                                  {repair.description}
                                </Text>
                                <Text className="text-foreground font-semibold ml-2">
                                  {formatCurrency(repair.estimate)}
                                </Text>
                              </View>

                              {/* Priority badge */}
                              <View className="flex-row items-center mt-1">
                                <View
                                  className={`px-2 py-0.5 rounded ${
                                    PRIORITY_COLORS[repair.priority]
                                  }`}
                                >
                                  <Text className="text-xs capitalize">{repair.priority}</Text>
                                </View>
                              </View>

                              {/* Notes */}
                              {repair.notes && (
                                <Text className="text-xs text-muted-foreground mt-2">
                                  {repair.notes}
                                </Text>
                              )}
                            </View>

                            {/* Actions */}
                            <View className="flex-row gap-1 ml-2">
                              <TouchableOpacity
                                onPress={() => handleEditRepair(repair)}
                                className="p-1.5 bg-muted rounded-lg"
                              >
                                <Edit2 size={14} className="text-muted-foreground" />
                              </TouchableOpacity>
                              <TouchableOpacity
                                onPress={() => handleDeleteRepair(repair)}
                                className="p-1.5 bg-destructive/10 rounded-lg"
                              >
                                <Trash2 size={14} className="text-destructive" />
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      ))}

                      {/* Add to category */}
                      <TouchableOpacity
                        onPress={() => handleAddToCategory(summary.category)}
                        className="flex-row items-center justify-center py-3 bg-muted/50 border-t border-border"
                      >
                        <Plus size={14} className="text-primary" />
                        <Text className="text-primary font-medium ml-1">Add to {summary.label}</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })}
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

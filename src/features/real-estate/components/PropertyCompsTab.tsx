// src/features/real-estate/components/PropertyCompsTab.tsx
// Comparable properties tab content for property detail

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { MapPin, Plus, RefreshCw } from 'lucide-react-native';
import { Property, PropertyComp } from '../types';
import { useComps, useCompMutations } from '../hooks/useComps';
import { usePropertyMutations } from '../hooks/useProperties';
import { CompCard } from './CompCard';
import { AddCompSheet } from './AddCompSheet';
import { ARVCalculator } from './ARVCalculator';

interface PropertyCompsTabProps {
  property: Property;
  onPropertyUpdate?: () => void;
}

export function PropertyCompsTab({ property, onPropertyUpdate }: PropertyCompsTabProps) {
  const { comps, isLoading, error, refetch } = useComps({ propertyId: property.id });
  const { createComp, updateComp, deleteComp, isLoading: isMutating } = useCompMutations();
  const { updateProperty } = usePropertyMutations();

  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingComp, setEditingComp] = useState<PropertyComp | null>(null);

  const handleAddComp = useCallback(async (data: Partial<PropertyComp>) => {
    if (editingComp) {
      const result = await updateComp(editingComp.id, data);
      if (result) {
        setShowAddSheet(false);
        setEditingComp(null);
        refetch();
      }
    } else {
      const result = await createComp(property.id, data);
      if (result) {
        setShowAddSheet(false);
        refetch();
      }
    }
  }, [editingComp, createComp, updateComp, property.id, refetch]);

  const handleEditComp = useCallback((comp: PropertyComp) => {
    setEditingComp(comp);
    setShowAddSheet(true);
  }, []);

  const handleDeleteComp = useCallback((comp: PropertyComp) => {
    Alert.alert(
      'Delete Comparable',
      `Are you sure you want to delete the comp at ${comp.address}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteComp(comp.id);
            if (success) {
              refetch();
            }
          },
        },
      ]
    );
  }, [deleteComp, refetch]);

  const handleUpdateARV = useCallback(async (newARV: number) => {
    Alert.alert(
      'Update ARV',
      `Update property ARV to $${newARV.toLocaleString()}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: async () => {
            const result = await updateProperty(property.id, { arv: newARV });
            if (result && onPropertyUpdate) {
              onPropertyUpdate();
            }
          },
        },
      ]
    );
  }, [updateProperty, property.id, onPropertyUpdate]);

  const handleCloseSheet = useCallback(() => {
    setShowAddSheet(false);
    setEditingComp(null);
  }, []);

  const hasComps = comps.length > 0;
  const subjectSqft = property.square_feet || property.sqft;

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <ActivityIndicator size="large" className="text-primary" />
        <Text className="text-muted-foreground mt-2">Loading comparables...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 items-center justify-center py-12">
        <Text className="text-destructive mb-4">Failed to load comparables</Text>
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
            <Text className="text-lg font-semibold text-foreground">Comparable Properties</Text>
            <Text className="text-xs text-muted-foreground">
              {comps.length} comp{comps.length !== 1 ? 's' : ''} added
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => setShowAddSheet(true)}
            className="flex-row items-center bg-primary px-3 py-2 rounded-lg"
          >
            <Plus size={16} color="white" />
            <Text className="text-primary-foreground font-medium ml-1">Add Comp</Text>
          </TouchableOpacity>
        </View>

        {/* ARV Calculator */}
        <ARVCalculator
          comps={comps}
          property={property}
          onUpdateARV={handleUpdateARV}
        />

        {/* Empty State */}
        {!hasComps && (
          <View className="items-center justify-center py-12 bg-card rounded-xl border border-border">
            <View className="bg-muted rounded-full p-4 mb-4">
              <MapPin size={32} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-semibold text-foreground mb-2">No Comparable Properties</Text>
            <Text className="text-muted-foreground text-center px-8 mb-4">
              Add recently sold properties similar to yours to calculate an accurate ARV.
            </Text>
            <TouchableOpacity
              onPress={() => setShowAddSheet(true)}
              className="flex-row items-center bg-muted px-4 py-2 rounded-lg"
            >
              <Plus size={16} className="text-foreground" />
              <Text className="text-foreground font-medium ml-2">Add First Comp</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Comps List */}
        {hasComps && (
          <View className="gap-3">
            <Text className="text-sm font-medium text-muted-foreground">
              Comparable Properties
            </Text>
            {comps.map((comp) => (
              <CompCard
                key={comp.id}
                comp={comp}
                subjectSqft={subjectSqft}
                onEdit={handleEditComp}
                onDelete={handleDeleteComp}
              />
            ))}
          </View>
        )}
      </View>

      {/* Add/Edit Comp Sheet */}
      <AddCompSheet
        visible={showAddSheet}
        onClose={handleCloseSheet}
        onSubmit={handleAddComp}
        isLoading={isMutating}
        editComp={editingComp}
      />
    </ScrollView>
  );
}

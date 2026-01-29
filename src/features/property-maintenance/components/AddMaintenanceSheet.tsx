// src/features/property-maintenance/components/AddMaintenanceSheet.tsx
// Bottom sheet for reporting a new maintenance issue with voice input

import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, Alert } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
  Input,
  Select,
  FormField,
  PhotoGallery,
} from '@/components/ui';
import { VoiceRecordButton } from '@/components/ui/VoiceRecordButton';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import {
  MaintenanceCategory,
  MaintenancePriority,
  MaintenanceChargeTo,
  CreateMaintenanceInput,
  MaintenancePhoto,
  MAINTENANCE_CATEGORY_LABELS,
  MAINTENANCE_PRIORITY_CONFIG,
  CHARGE_TO_LABELS,
} from '../types';
import { COMMON_LOCATIONS } from '@/features/property-inventory/types';
import { useMaintenanceMutations } from '../hooks/usePropertyMaintenance';

export interface AddMaintenanceSheetProps {
  visible: boolean;
  onClose: () => void;
  propertyId: string;
  onSuccess?: () => void;
  /** Pre-fill with inventory item info */
  initialInventoryItemId?: string;
  initialInventoryItemName?: string;
  /** Pre-fill with booking info */
  initialBookingId?: string;
}

export function AddMaintenanceSheet({
  visible,
  onClose,
  propertyId,
  onSuccess,
  initialInventoryItemId,
  initialInventoryItemName,
  initialBookingId,
}: AddMaintenanceSheetProps) {
  const colors = useThemeColors();
  const { createWorkOrder, isCreating } = useMaintenanceMutations(propertyId);

  // Form state
  const [title, setTitle] = useState(
    initialInventoryItemName ? `${initialInventoryItemName} Issue` : ''
  );
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<MaintenanceCategory>('general');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<MaintenancePriority>('medium');
  const [chargeTo, setChargeTo] = useState<MaintenanceChargeTo>('owner');
  const [estimatedCost, setEstimatedCost] = useState('');
  const [photos, setPhotos] = useState<MaintenancePhoto[]>([]);

  // Reset form
  const resetForm = useCallback(() => {
    setTitle('');
    setDescription('');
    setCategory('general');
    setLocation('');
    setPriority('medium');
    setChargeTo('owner');
    setEstimatedCost('');
    setPhotos([]);
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Required Field', 'Please enter a title for the issue');
      return;
    }

    try {
      const input: CreateMaintenanceInput = {
        property_id: propertyId,
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        location: location.trim() || undefined,
        priority,
        charge_to: chargeTo,
        estimated_cost: estimatedCost ? parseFloat(estimatedCost) : undefined,
        inventory_item_id: initialInventoryItemId,
        booking_id: initialBookingId,
        photos,
      };

      await createWorkOrder(input);
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to report issue'
      );
    }
  };

  // Handle voice input for description
  const handleVoiceResult = (text: string) => {
    setDescription((prev) => (prev ? `${prev} ${text}` : text));
  };

  // Handle voice input for title
  const handleVoiceTitleResult = (text: string) => {
    setTitle(text);
  };

  // Handle photo add
  const handleAddPhoto = () => {
    Alert.alert('Add Photo', 'Camera integration coming soon');
  };

  // Handle photo remove
  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.url !== photoId));
  };

  // Category options
  const categoryOptions = Object.entries(MAINTENANCE_CATEGORY_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  // Priority options
  const priorityOptions = Object.entries(MAINTENANCE_PRIORITY_CONFIG).map(
    ([value, config]) => ({ value, label: config.label })
  );

  // Charge to options
  const chargeToOptions = Object.entries(CHARGE_TO_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  // Location options
  const locationOptions = [
    { value: '', label: 'Select location...' },
    ...COMMON_LOCATIONS.map((loc) => ({ value: loc, label: loc })),
  ];

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Report Issue"
      height="90%"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Photos Section */}
        <BottomSheetSection title="Photos">
          <PhotoGallery
            photos={photos.map((p, i) => ({
              id: p.url,
              url: p.url,
              caption: p.caption,
              type: p.type,
            }))}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
            editable
            maxPhotos={5}
            size="medium"
            emptyText="Add photos of the issue"
          />
        </BottomSheetSection>

        {/* Issue Details */}
        <BottomSheetSection title="Issue Details">
          <FormField label="Title" required>
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <Input
                  value={title}
                  onChangeText={setTitle}
                  placeholder="e.g., Leaking faucet in kitchen"
                  autoCapitalize="sentences"
                />
              </View>
              <VoiceRecordButton
                onTranscription={handleVoiceTitleResult}
                size="sm"
              />
            </View>
          </FormField>

          <FormField label="Description" className="mt-3">
            <View className="flex-row items-end gap-2">
              <View className="flex-1">
                <Input
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe the issue in detail..."
                  multiline
                  numberOfLines={4}
                  style={{ minHeight: 100 }}
                />
              </View>
              <VoiceRecordButton
                onTranscription={handleVoiceResult}
                size="md"
              />
            </View>
          </FormField>

          <FormField label="Category" className="mt-3">
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as MaintenanceCategory)}
              options={categoryOptions}
            />
          </FormField>

          <FormField label="Location" className="mt-3">
            <Select
              value={location}
              onValueChange={setLocation}
              options={locationOptions}
              placeholder="Select location..."
            />
          </FormField>
        </BottomSheetSection>

        {/* Priority & Charge */}
        <BottomSheetSection title="Priority & Billing">
          <FormField label="Priority">
            <Select
              value={priority}
              onValueChange={(v) => setPriority(v as MaintenancePriority)}
              options={priorityOptions}
            />
          </FormField>

          <FormField label="Charge To" className="mt-3">
            <Select
              value={chargeTo}
              onValueChange={(v) => setChargeTo(v as MaintenanceChargeTo)}
              options={chargeToOptions}
            />
          </FormField>

          <FormField label="Estimated Cost" className="mt-3">
            <Input
              value={estimatedCost}
              onChangeText={setEstimatedCost}
              placeholder="0.00"
              keyboardType="decimal-pad"
              leftIcon={
                <Text style={{ color: colors.mutedForeground }}>$</Text>
              }
            />
          </FormField>
        </BottomSheetSection>

        {/* Context Info */}
        {(initialInventoryItemName || initialBookingId) && (
          <BottomSheetSection title="Linked To">
            {initialInventoryItemName && (
              <View
                className="p-3 rounded-lg mb-2"
                style={{ backgroundColor: colors.muted }}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
                  Inventory Item
                </Text>
                <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm, fontWeight: '500' }}>
                  {initialInventoryItemName}
                </Text>
              </View>
            )}
            {initialBookingId && (
              <View
                className="p-3 rounded-lg"
                style={{ backgroundColor: colors.muted }}
              >
                <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
                  Booking
                </Text>
                <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm, fontWeight: '500' }}>
                  Linked to current booking
                </Text>
              </View>
            )}
          </BottomSheetSection>
        )}
      </ScrollView>

      {/* Footer Actions */}
      <View
        className="flex-row gap-3 pt-4 pb-6 px-4"
        style={{ borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <Button
          variant="outline"
          onPress={onClose}
          className="flex-1"
          disabled={isCreating}
        >
          Cancel
        </Button>
        <Button
          onPress={handleSubmit}
          className="flex-1"
          disabled={isCreating || !title.trim()}
        >
          {isCreating ? 'Reporting...' : 'Report Issue'}
        </Button>
      </View>
    </BottomSheet>
  );
}

export default AddMaintenanceSheet;

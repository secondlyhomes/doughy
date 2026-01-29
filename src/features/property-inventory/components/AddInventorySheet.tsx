// src/features/property-inventory/components/AddInventorySheet.tsx
// Bottom sheet for adding a new inventory item

import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { useThemeColors } from '@/context/ThemeContext';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
  Input,
  Select,
  FormField,
  DatePicker,
  PhotoGallery,
} from '@/components/ui';
import { VoiceRecordButton } from '@/components/ui/VoiceRecordButton';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import {
  InventoryCategory,
  InventoryCondition,
  CreateInventoryItemInput,
  InventoryPhoto,
  INVENTORY_CATEGORY_LABELS,
  INVENTORY_CONDITION_CONFIG,
  COMMON_LOCATIONS,
} from '../types';
import { useInventoryMutations } from '../hooks/usePropertyInventory';

export interface AddInventorySheetProps {
  visible: boolean;
  onClose: () => void;
  propertyId: string;
  onSuccess?: () => void;
  /** Pre-fill with camera-captured photos */
  initialPhotos?: InventoryPhoto[];
}

export function AddInventorySheet({
  visible,
  onClose,
  propertyId,
  onSuccess,
  initialPhotos = [],
}: AddInventorySheetProps) {
  const colors = useThemeColors();
  const { createItem, isCreating } = useInventoryMutations(propertyId);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('appliance');
  const [location, setLocation] = useState('');
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [serialNumber, setSerialNumber] = useState('');
  const [condition, setCondition] = useState<InventoryCondition>('good');
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>();
  const [warrantyExpires, setWarrantyExpires] = useState<Date | undefined>();
  const [purchasePrice, setPurchasePrice] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<InventoryPhoto[]>(initialPhotos);

  // Reset form
  const resetForm = useCallback(() => {
    setName('');
    setCategory('appliance');
    setLocation('');
    setBrand('');
    setModel('');
    setSerialNumber('');
    setCondition('good');
    setPurchaseDate(undefined);
    setWarrantyExpires(undefined);
    setPurchasePrice('');
    setNotes('');
    setPhotos([]);
  }, []);

  // Handle submit
  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter an item name');
      return;
    }

    try {
      const input: CreateInventoryItemInput = {
        property_id: propertyId,
        name: name.trim(),
        category,
        location: location.trim() || undefined,
        brand: brand.trim() || undefined,
        model: model.trim() || undefined,
        serial_number: serialNumber.trim() || undefined,
        condition,
        purchase_date: purchaseDate?.toISOString().split('T')[0],
        warranty_expires: warrantyExpires?.toISOString().split('T')[0],
        purchase_price: purchasePrice ? parseFloat(purchasePrice) : undefined,
        notes: notes.trim() || undefined,
        photos,
      };

      await createItem(input);
      resetForm();
      onClose();
      onSuccess?.();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to add item'
      );
    }
  };

  // Handle voice input for notes
  const handleVoiceResult = (text: string) => {
    setNotes((prev) => (prev ? `${prev} ${text}` : text));
  };

  // Handle photo add (placeholder - would integrate with camera)
  const handleAddPhoto = () => {
    // This would open camera/gallery picker
    // For now, show an alert
    Alert.alert('Add Photo', 'Camera integration coming soon');
  };

  // Handle photo remove
  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((p) => p.url !== photoId));
  };

  // Category options for Select
  const categoryOptions = Object.entries(INVENTORY_CATEGORY_LABELS).map(
    ([value, label]) => ({ value, label })
  );

  // Condition options for Select
  const conditionOptions = Object.entries(INVENTORY_CONDITION_CONFIG).map(
    ([value, config]) => ({ value, label: config.label })
  );

  // Location options for Select
  const locationOptions = COMMON_LOCATIONS.map((loc) => ({
    value: loc,
    label: loc,
  }));

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Add Inventory Item"
      snapPoints={['90%']}
    >
      {/* Photos Section */}
        <BottomSheetSection title="Photos">
          <PhotoGallery
            photos={photos.map((p, i) => ({
              id: p.url,
              url: p.url,
              caption: p.caption,
            }))}
            onAddPhoto={handleAddPhoto}
            onRemovePhoto={handleRemovePhoto}
            editable
            maxPhotos={5}
            size="medium"
            emptyText="Add photos of the item"
          />
        </BottomSheetSection>

        {/* Basic Info */}
        <BottomSheetSection title="Basic Information">
          <FormField label="Item Name" required>
            <Input
              value={name}
              onChangeText={setName}
              placeholder="e.g., Samsung Refrigerator"
              autoCapitalize="words"
            />
          </FormField>

          <FormField label="Category" required className="mt-3">
            <Select
              value={category}
              onValueChange={(v) => setCategory(v as InventoryCategory)}
              options={categoryOptions}
            />
          </FormField>

          <FormField label="Location" className="mt-3">
            <Select
              value={location}
              onValueChange={setLocation}
              options={[{ value: '', label: 'Select location...' }, ...locationOptions]}
              placeholder="Select location..."
            />
          </FormField>

          <FormField label="Condition" required className="mt-3">
            <Select
              value={condition}
              onValueChange={(v) => setCondition(v as InventoryCondition)}
              options={conditionOptions}
            />
          </FormField>
        </BottomSheetSection>

        {/* Product Details */}
        <BottomSheetSection title="Product Details">
          <FormField label="Brand">
            <Input
              value={brand}
              onChangeText={setBrand}
              placeholder="e.g., Samsung"
              autoCapitalize="words"
            />
          </FormField>

          <FormField label="Model" className="mt-3">
            <Input
              value={model}
              onChangeText={setModel}
              placeholder="e.g., RF28R7351SR"
            />
          </FormField>

          <FormField label="Serial Number" className="mt-3">
            <Input
              value={serialNumber}
              onChangeText={setSerialNumber}
              placeholder="e.g., ABC123456"
              autoCapitalize="characters"
            />
          </FormField>
        </BottomSheetSection>

        {/* Dates and Financial */}
        <BottomSheetSection title="Purchase & Warranty">
          <FormField label="Purchase Date">
            <DatePicker
              value={purchaseDate}
              onChange={setPurchaseDate}
              placeholder="Select date..."
            />
          </FormField>

          <FormField label="Warranty Expires" className="mt-3">
            <DatePicker
              value={warrantyExpires}
              onChange={setWarrantyExpires}
              placeholder="Select date..."
            />
          </FormField>

          <FormField label="Purchase Price" className="mt-3">
            <Input
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
              leftIcon={
                <Text style={{ color: colors.mutedForeground }}>$</Text>
              }
            />
          </FormField>
        </BottomSheetSection>

      {/* Notes */}
      <BottomSheetSection title="Notes">
        <View className="flex-row items-end gap-2">
          <FormField label="" className="flex-1">
            <Input
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes..."
              multiline
              numberOfLines={3}
              style={{ minHeight: 80 }}
            />
          </FormField>
          <VoiceRecordButton
            onTranscription={handleVoiceResult}
            size="md"
          />
        </View>
      </BottomSheetSection>

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
          disabled={isCreating || !name.trim()}
        >
          {isCreating ? 'Adding...' : 'Add Item'}
        </Button>
      </View>
    </BottomSheet>
  );
}

export default AddInventorySheet;

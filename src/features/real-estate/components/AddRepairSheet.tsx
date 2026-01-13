// src/features/real-estate/components/AddRepairSheet.tsx
// Bottom sheet for adding/editing repair estimates

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { X, Wrench, DollarSign, FileText, AlertCircle } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { RepairEstimate, RepairCategory } from '../types';
import { REPAIR_CATEGORIES } from '../hooks/useRepairEstimate';

interface AddRepairSheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<RepairEstimate>) => Promise<void>;
  isLoading?: boolean;
  editRepair?: RepairEstimate | null;
  preselectedCategory?: RepairCategory;
}

interface FormData {
  category: RepairCategory;
  description: string;
  estimate: string;
  notes: string;
  priority: 'low' | 'medium' | 'high';
}

const initialFormData: FormData = {
  category: 'interior',
  description: '',
  estimate: '',
  notes: '',
  priority: 'medium',
};

const PRIORITY_OPTIONS: { value: 'low' | 'medium' | 'high'; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'text-green-600' },
  { value: 'medium', label: 'Medium', color: 'text-yellow-600' },
  { value: 'high', label: 'High', color: 'text-red-600' },
];

export function AddRepairSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  editRepair,
  preselectedCategory,
}: AddRepairSheetProps) {
  const [formData, setFormData] = useState<FormData>(() => {
    if (editRepair) {
      return {
        category: editRepair.category,
        description: editRepair.description || '',
        estimate: editRepair.estimate?.toString() || '',
        notes: editRepair.notes || '',
        priority: editRepair.priority || 'medium',
      };
    }
    return {
      ...initialFormData,
      category: preselectedCategory || 'interior',
    };
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }, [errors]);

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    if (!formData.estimate.trim()) {
      newErrors.estimate = 'Estimate is required';
    } else if (isNaN(Number(formData.estimate))) {
      newErrors.estimate = 'Invalid amount';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    const repairData: Partial<RepairEstimate> = {
      category: formData.category,
      description: formData.description.trim(),
      estimate: Number(formData.estimate),
      notes: formData.notes.trim() || undefined,
      priority: formData.priority,
    };

    await onSubmit(repairData);
    setFormData({
      ...initialFormData,
      category: preselectedCategory || 'interior',
    });
  }, [formData, validate, onSubmit, preselectedCategory]);

  const handleClose = useCallback(() => {
    setFormData({
      ...initialFormData,
      category: preselectedCategory || 'interior',
    });
    setErrors({});
    onClose();
  }, [onClose, preselectedCategory]);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={['85%']}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <View>
            <Text className="text-lg font-semibold text-foreground">
              {editRepair ? 'Edit Repair' : 'Add Repair'}
            </Text>
            <Text className="text-xs text-muted-foreground">
              Enter repair details
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 bg-muted rounded-full"
          >
            <X size={20} className="text-foreground" />
          </TouchableOpacity>
        </View>

        {/* Form */}
        <ScrollView
          className="flex-1 px-4 pt-4"
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Category Selection */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {REPAIR_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => updateField('category', category.id)}
                  className={`px-3 py-2 rounded-lg border ${
                    formData.category === category.id
                      ? 'bg-primary border-primary'
                      : 'bg-muted border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      formData.category === category.id
                        ? 'text-primary-foreground'
                        : 'text-foreground'
                    }`}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1.5">Description *</Text>
            <View className="flex-row items-center bg-muted rounded-lg px-3">
              <FileText size={16} className="text-muted-foreground" />
              <TextInput
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="e.g., Replace kitchen cabinets"
                placeholderTextColor="#9CA3AF"
                className="flex-1 py-3 ml-2 text-foreground"
              />
            </View>
            {errors.description && (
              <Text className="text-xs text-destructive mt-1">{errors.description}</Text>
            )}
          </View>

          {/* Estimate */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-1.5">Estimated Cost *</Text>
            <View className="flex-row items-center bg-muted rounded-lg px-3">
              <DollarSign size={16} className="text-muted-foreground" />
              <TextInput
                value={formData.estimate}
                onChangeText={(value) => updateField('estimate', value)}
                placeholder="0"
                placeholderTextColor="#9CA3AF"
                keyboardType="numeric"
                className="flex-1 py-3 text-foreground text-lg font-semibold"
              />
            </View>
            {errors.estimate && (
              <Text className="text-xs text-destructive mt-1">{errors.estimate}</Text>
            )}
          </View>

          {/* Priority */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Priority</Text>
            <View className="flex-row gap-2">
              {PRIORITY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => updateField('priority', option.value)}
                  className={`flex-1 py-2.5 rounded-lg border items-center ${
                    formData.priority === option.value
                      ? 'bg-primary border-primary'
                      : 'bg-muted border-border'
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      formData.priority === option.value
                        ? 'text-primary-foreground'
                        : option.color
                    }`}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-sm font-medium text-foreground mb-1.5">Notes (Optional)</Text>
            <TextInput
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              placeholder="Additional details, contractor info, etc."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="bg-muted rounded-lg px-3 py-3 text-foreground min-h-[80]"
            />
          </View>

          <View className="h-4" />
        </ScrollView>

        {/* Submit Button */}
        <View className="p-4 border-t border-border">
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="bg-primary py-3.5 rounded-xl flex-row items-center justify-center"
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Wrench size={18} color="white" />
                <Text className="text-primary-foreground font-semibold ml-2">
                  {editRepair ? 'Save Changes' : 'Add Repair'}
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </BottomSheet>
  );
}

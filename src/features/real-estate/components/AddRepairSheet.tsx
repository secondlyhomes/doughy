// src/features/real-estate/components/AddRepairSheet.tsx
// Bottom sheet for adding/editing repair estimates

import React, { useState, useCallback, useEffect } from 'react';
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
import { useThemeColors } from '@/context/ThemeContext';
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
  { value: 'low', label: 'Low', color: 'text-success' },
  { value: 'medium', label: 'Medium', color: 'text-warning' },
  { value: 'high', label: 'High', color: 'text-destructive' },
];

export function AddRepairSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  editRepair,
  preselectedCategory,
}: AddRepairSheetProps) {
  const colors = useThemeColors();
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

  // Reset form when editRepair prop changes (switching between different repairs)
  useEffect(() => {
    if (editRepair) {
      setFormData({
        category: editRepair.category,
        description: editRepair.description || '',
        estimate: editRepair.estimate?.toString() || '',
        notes: editRepair.notes || '',
        priority: editRepair.priority || 'medium',
      });
    } else {
      setFormData({
        ...initialFormData,
        category: preselectedCategory || 'interior',
      });
    }
    setErrors({});
  }, [editRepair, preselectedCategory]);

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
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderColor: colors.border }}>
          <View>
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              {editRepair ? 'Edit Repair' : 'Add Repair'}
            </Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Enter repair details
            </Text>
          </View>
          <TouchableOpacity
            onPress={handleClose}
            className="p-2 rounded-full"
            style={{ backgroundColor: colors.muted }}
          >
            <X size={20} color={colors.foreground} />
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
            <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Category</Text>
            <View className="flex-row flex-wrap gap-2">
              {REPAIR_CATEGORIES.map(category => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => updateField('category', category.id)}
                  className="px-3 py-2 rounded-lg border"
                  style={{
                    backgroundColor: formData.category === category.id ? colors.primary : colors.muted,
                    borderColor: formData.category === category.id ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: formData.category === category.id ? colors.primaryForeground : colors.foreground,
                    }}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Description *</Text>
            <View className="flex-row items-center rounded-lg px-3" style={{ backgroundColor: colors.muted }}>
              <FileText size={16} color={colors.mutedForeground} />
              <TextInput
                value={formData.description}
                onChangeText={(value) => updateField('description', value)}
                placeholder="e.g., Replace kitchen cabinets"
                placeholderTextColor={colors.mutedForeground}
                className="flex-1 py-3 ml-2"
                style={{ color: colors.foreground }}
              />
            </View>
            {errors.description && (
              <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.description}</Text>
            )}
          </View>

          {/* Estimate */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Estimated Cost *</Text>
            <View className="flex-row items-center rounded-lg px-3" style={{ backgroundColor: colors.muted }}>
              <DollarSign size={16} color={colors.mutedForeground} />
              <TextInput
                value={formData.estimate}
                onChangeText={(value) => updateField('estimate', value)}
                placeholder="0"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="numeric"
                className="flex-1 py-3 text-lg font-semibold"
                style={{ color: colors.foreground }}
              />
            </View>
            {errors.estimate && (
              <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{errors.estimate}</Text>
            )}
          </View>

          {/* Priority */}
          <View className="mb-4">
            <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Priority</Text>
            <View className="flex-row gap-2">
              {PRIORITY_OPTIONS.map(option => (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => updateField('priority', option.value)}
                  className="flex-1 py-2.5 rounded-lg border items-center"
                  style={{
                    backgroundColor: formData.priority === option.value ? colors.primary : colors.muted,
                    borderColor: formData.priority === option.value ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: formData.priority === option.value
                        ? colors.primaryForeground
                        : option.value === 'low'
                          ? colors.success
                          : option.value === 'medium'
                            ? colors.warning
                            : colors.destructive,
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View className="mb-6">
            <Text className="text-sm font-medium mb-1.5" style={{ color: colors.foreground }}>Notes (Optional)</Text>
            <TextInput
              value={formData.notes}
              onChangeText={(value) => updateField('notes', value)}
              placeholder="Additional details, contractor info, etc."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              className="rounded-lg px-3 py-3 min-h-[80]"
              style={{ backgroundColor: colors.muted, color: colors.foreground }}
            />
          </View>

          <View className="h-4" />
        </ScrollView>

        {/* Submit Button */}
        <View className="p-4 border-t" style={{ borderColor: colors.border }}>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            className="py-3.5 rounded-xl flex-row items-center justify-center"
            style={{ backgroundColor: colors.primary }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} />
            ) : (
              <>
                <Wrench size={18} color={colors.primaryForeground} />
                <Text className="font-semibold ml-2" style={{ color: colors.primaryForeground }}>
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

// src/features/real-estate/components/AddRepairSheet.tsx
// Bottom sheet for adding/editing repair estimates
// Refactored to use FormField + useForm (Phase 2 Migration)

import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { X, Wrench, DollarSign, FileText, AlertCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet, FormField } from '@/components/ui';
import { useForm } from '@/hooks/useForm';
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

const buildFormDataFromRepair = (
  repair: RepairEstimate | null | undefined,
  preselectedCategory?: RepairCategory
): FormData => {
  if (repair) {
    return {
      category: repair.category,
      description: repair.description || '',
      estimate: repair.estimate?.toString() || '',
      notes: repair.notes || '',
      priority: repair.priority || 'medium',
    };
  }
  return {
    ...initialFormData,
    category: preselectedCategory || 'interior',
  };
};

export function AddRepairSheet({
  visible,
  onClose,
  onSubmit,
  isLoading = false,
  editRepair,
  preselectedCategory,
}: AddRepairSheetProps) {
  const colors = useThemeColors();

  // Use the new useForm hook for state management and validation
  const { values, errors, updateField, handleSubmit, reset, setValues } = useForm({
    initialValues: buildFormDataFromRepair(editRepair, preselectedCategory),
    validate: (vals) => {
      const errs: Record<string, string> = {};

      if (!vals.description.trim()) errs.description = 'Description is required';
      if (!vals.estimate.trim()) {
        errs.estimate = 'Estimate is required';
      } else if (isNaN(Number(vals.estimate))) {
        errs.estimate = 'Invalid amount';
      }

      return errs;
    },
    onSubmit: async (vals) => {
      const repairData: Partial<RepairEstimate> = {
        category: vals.category,
        description: vals.description.trim(),
        estimate: Number(vals.estimate),
        notes: vals.notes.trim() || undefined,
        priority: vals.priority,
      };

      await onSubmit(repairData);
      reset();
    },
  });

  // Reset form when editRepair or preselectedCategory changes
  useEffect(() => {
    setValues(buildFormDataFromRepair(editRepair, preselectedCategory));
  }, [editRepair, preselectedCategory, setValues]);

  const handleClose = useCallback(() => {
    reset();
    onClose();
  }, [onClose, reset]);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      snapPoints={['85%']}
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
                    backgroundColor: values.category === category.id ? colors.primary : colors.muted,
                    borderColor: values.category === category.id ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: values.category === category.id ? colors.primaryForeground : colors.foreground,
                    }}
                  >
                    {category.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Description */}
          <FormField
            label="Description"
            value={values.description}
            onChangeText={(text) => updateField('description', text)}
            error={errors.description}
            placeholder="e.g., Replace kitchen cabinets"
            required
            icon={FileText}
          />

          {/* Estimate */}
          <FormField
            label="Estimated Cost"
            value={values.estimate}
            onChangeText={(text) => updateField('estimate', text)}
            error={errors.estimate}
            placeholder="0"
            keyboardType="numeric"
            icon={DollarSign}
            required
          />

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
                    backgroundColor: values.priority === option.value ? colors.primary : colors.muted,
                    borderColor: values.priority === option.value ? colors.primary : colors.border,
                  }}
                >
                  <Text
                    className="text-sm font-medium"
                    style={{
                      color: values.priority === option.value
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
          <FormField
            label="Notes"
            value={values.notes}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Additional details, contractor info, etc."
            multiline
            numberOfLines={3}
            helperText="Optional"
          />

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
    </BottomSheet>
  );
}

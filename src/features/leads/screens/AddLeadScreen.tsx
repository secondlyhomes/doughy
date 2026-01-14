// Add Lead Screen - React Native
// Zone D: Create new lead form
// Refactored to use FormField + useForm (Phase 2 Migration)

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedSafeAreaView } from '@/components';
import { useRouter } from 'expo-router';
import { X, User, Mail, Phone, Building2, Tag, FileText, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { FormField } from '@/components/ui';
import { useForm } from '@/hooks/useForm';

import { useCreateLead } from '../hooks/useLeads';
import { LeadFormData, LeadStatus } from '../types';

const STATUS_OPTIONS: { label: string; value: LeadStatus }[] = [
  { label: 'New', value: 'new' },
  { label: 'Active', value: 'active' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Closed', value: 'closed' },
  { label: 'Inactive', value: 'inactive' },
];

export function AddLeadScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const createLead = useCreateLead();

  // Use the new useForm hook for state management and validation
  const { values, errors, updateField, handleSubmit, reset } = useForm<LeadFormData>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      company: '',
      status: 'new',
      tags: [],
      notes: '',
    },
    validate: (vals) => {
      const errs: Partial<Record<keyof LeadFormData, string>> = {};

      if (!vals.name.trim()) {
        errs.name = 'Name is required';
      }
      if (vals.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(vals.email)) {
        errs.email = 'Please enter a valid email address';
      }

      return errs;
    },
    onSubmit: async (vals) => {
      try {
        await createLead.mutateAsync(vals);
        router.back();
      } catch (error) {
        Alert.alert('Error', 'Failed to create lead. Please try again.');
        throw error; // Re-throw to prevent form reset
      }
    },
  });

  const [tagInput, setTagInput] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const handleAddTag = () => {
    if (tagInput.trim() && !values.tags?.includes(tagInput.trim())) {
      updateField('tags', [...(values.tags || []), tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    updateField('tags', values.tags?.filter(t => t !== tag) || []);
  };

  const handleStatusSelect = (status: LeadStatus) => {
    updateField('status', status);
    setShowStatusPicker(false);
  };

  const getStatusLabel = (status: LeadStatus | undefined) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.label || 'Select Status';
  };

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Name */}
        <FormField
          label="Name"
          value={values.name}
          onChangeText={(text) => updateField('name', text)}
          error={errors.name}
          placeholder="Enter lead name"
          required
          icon={User}
          autoCapitalize="words"
        />

        {/* Email */}
        <FormField
          label="Email"
          value={values.email}
          onChangeText={(text) => updateField('email', text)}
          error={errors.email}
          placeholder="email@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          icon={Mail}
        />

        {/* Phone */}
        <FormField
          label="Phone"
          value={values.phone}
          onChangeText={(text) => updateField('phone', text)}
          placeholder="(555) 123-4567"
          keyboardType="phone-pad"
          icon={Phone}
        />

        {/* Company */}
        <FormField
          label="Company"
          value={values.company}
          onChangeText={(text) => updateField('company', text)}
          placeholder="Company name"
          autoCapitalize="words"
          icon={Building2}
        />

        {/* Status */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Status</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg px-3 py-3"
            style={{ backgroundColor: colors.muted }}
            onPress={() => setShowStatusPicker(!showStatusPicker)}
          >
            <Text className="text-base" style={{ color: colors.foreground }}>
              {getStatusLabel(values.status)}
            </Text>
            <ChevronDown size={18} color={colors.mutedForeground} />
          </TouchableOpacity>

          {showStatusPicker && (
            <View className="rounded-lg mt-2 overflow-hidden" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className="px-4 py-3"
                  style={{
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    backgroundColor: values.status === option.value ? withOpacity(colors.primary, 'muted') : 'transparent'
                  }}
                  onPress={() => handleStatusSelect(option.value)}
                >
                  <Text
                    className="text-base"
                    style={{
                      color: values.status === option.value ? colors.primary : colors.foreground,
                      fontWeight: values.status === option.value ? '500' : 'normal'
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Tags */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Tags</Text>
          <View className="flex-row items-center rounded-lg px-3 py-2" style={{ backgroundColor: colors.muted }}>
            <Tag size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.foreground }}
              placeholder="Add a tag"
              placeholderTextColor={colors.mutedForeground}
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              className="px-3 py-1.5 rounded-md"
              style={{ backgroundColor: colors.primary }}
              onPress={handleAddTag}
            >
              <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>Add</Text>
            </TouchableOpacity>
          </View>

          {values.tags && values.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {values.tags.map((tag, index) => (
                <View
                  key={index}
                  className="flex-row items-center px-3 py-1.5 rounded-full"
                  style={{ backgroundColor: colors.secondary }}
                >
                  <Text className="text-sm" style={{ color: colors.mutedForeground }}>{tag}</Text>
                  <TouchableOpacity
                    className="ml-2"
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <X size={14} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <FormField
          label="Notes"
          value={values.notes}
          onChangeText={(text) => updateField('notes', text)}
          placeholder="Add notes about this lead..."
          multiline
          numberOfLines={4}
          icon={FileText}
        />

        {/* Submit Button */}
        <TouchableOpacity
          className="rounded-lg py-4 items-center"
          style={{ backgroundColor: createLead.isPending ? withOpacity(colors.primary, 'opaque') : colors.primary }}
          onPress={handleSubmit}
          disabled={createLead.isPending}
        >
          {createLead.isPending ? (
            <ActivityIndicator color={colors.primaryForeground} />
          ) : (
            <Text className="font-semibold text-base" style={{ color: colors.primaryForeground }}>
              Create Lead
            </Text>
          )}
        </TouchableOpacity>

          {/* Cancel Button */}
          <TouchableOpacity
            className="rounded-lg py-4 items-center mt-3"
            onPress={() => router.back()}
          >
            <Text className="font-medium text-base" style={{ color: colors.mutedForeground }}>Cancel</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

export default AddLeadScreen;

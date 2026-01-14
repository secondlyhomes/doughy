// Edit Lead Screen - React Native
// Zone D: Edit existing lead form

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, User, Mail, Phone, Building2, Tag, FileText, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, Button } from '@/components/ui';

import { useLead, useUpdateLead } from '../hooks/useLeads';
import { Lead, LeadStatus } from '../types';

const STATUS_OPTIONS: { label: string; value: LeadStatus }[] = [
  { label: 'New', value: 'new' },
  { label: 'Active', value: 'active' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Closed', value: 'closed' },
  { label: 'Inactive', value: 'inactive' },
];

interface FormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  tags: string[];
  notes: string;
}

const VALID_STATUSES: LeadStatus[] = ['new', 'active', 'won', 'lost', 'closed', 'inactive'];

function isValidStatus(status: unknown): status is LeadStatus {
  return typeof status === 'string' && VALID_STATUSES.includes(status as LeadStatus);
}

export function EditLeadScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const params = useLocalSearchParams();

  // Validate route param
  const leadId = typeof params.leadId === 'string' && params.leadId.length > 0
    ? params.leadId
    : '';

  const { lead, isLoading: isLoadingLead } = useLead(leadId);
  const updateLead = useUpdateLead();

  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
    company: '',
    status: 'new',
    tags: [],
    notes: '',
  });
  const [tagInput, setTagInput] = useState('');
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  // Populate form when lead data loads
  useEffect(() => {
    if (lead) {
      setFormData({
        name: lead.name || '',
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        status: isValidStatus(lead.status) ? lead.status : 'new',
        tags: lead.tags || [],
        notes: lead.notes?.[0]?.content || '',
      });
    }
  }, [lead]);

  const handleChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()],
      }));
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag),
    }));
  };

  const handleStatusSelect = (status: LeadStatus) => {
    setFormData(prev => ({ ...prev, status }));
    setShowStatusPicker(false);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      Alert.alert('Validation Error', 'Name is required');
      return false;
    }
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      Alert.alert('Validation Error', 'Please enter a valid email address');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      await updateLead.mutateAsync({
        id: leadId,
        data: {
          name: formData.name,
          email: formData.email || undefined,
          phone: formData.phone || undefined,
          company: formData.company || undefined,
          status: formData.status,
          tags: formData.tags,
        },
      });
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Failed to update lead. Please try again.');
    }
  };

  const getStatusLabel = (status: LeadStatus) => {
    const option = STATUS_OPTIONS.find(o => o.value === status);
    return option?.label || 'Select Status';
  };

  if (isLoadingLead) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading lead..." />
      </ThemedSafeAreaView>
    );
  }

  if (!lead) {
    return (
      <ThemedSafeAreaView className="flex-1 items-center justify-center" edges={['top']}>
        <Text className="mb-4" style={{ color: colors.mutedForeground }}>Lead not found</Text>
        <Button onPress={() => router.back()}>Go Back</Button>
      </ThemedSafeAreaView>
    );
  }

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Name */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
            Name <Text style={{ color: colors.destructive }}>*</Text>
          </Text>
          <View className="flex-row items-center rounded-lg px-3 py-3" style={{ backgroundColor: colors.muted }}>
            <User size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.foreground }}
              placeholder="Enter lead name"
              placeholderTextColor={colors.mutedForeground}
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Email</Text>
          <View className="flex-row items-center rounded-lg px-3 py-3" style={{ backgroundColor: colors.muted }}>
            <Mail size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.foreground }}
              placeholder="email@example.com"
              placeholderTextColor={colors.mutedForeground}
              value={formData.email}
              onChangeText={(text) => handleChange('email', text)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        {/* Phone */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Phone</Text>
          <View className="flex-row items-center rounded-lg px-3 py-3" style={{ backgroundColor: colors.muted }}>
            <Phone size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.foreground }}
              placeholder="(555) 123-4567"
              placeholderTextColor={colors.mutedForeground}
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Company */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Company</Text>
          <View className="flex-row items-center rounded-lg px-3 py-3" style={{ backgroundColor: colors.muted }}>
            <Building2 size={18} color={colors.mutedForeground} />
            <TextInput
              className="flex-1 ml-3 text-base"
              style={{ color: colors.foreground }}
              placeholder="Company name"
              placeholderTextColor={colors.mutedForeground}
              value={formData.company}
              onChangeText={(text) => handleChange('company', text)}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Status */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Status</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between rounded-lg px-3 py-3"
            style={{ backgroundColor: colors.muted }}
            onPress={() => setShowStatusPicker(!showStatusPicker)}
          >
            <Text className="text-base" style={{ color: colors.foreground }}>
              {getStatusLabel(formData.status)}
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
                    backgroundColor: formData.status === option.value ? `${colors.primary}15` : 'transparent'
                  }}
                  onPress={() => handleStatusSelect(option.value)}
                >
                  <Text
                    className="text-base"
                    style={{
                      color: formData.status === option.value ? colors.primary : colors.foreground,
                      fontWeight: formData.status === option.value ? '500' : 'normal'
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

          {formData.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
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
        <View className="mb-6">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Notes</Text>
          <View className="rounded-lg px-3 py-3" style={{ backgroundColor: colors.muted }}>
            <View className="flex-row items-start">
              <FileText size={18} color={colors.mutedForeground} className="mt-0.5" />
              <TextInput
                className="flex-1 ml-3 text-base min-h-[100px]"
                style={{ color: colors.foreground }}
                placeholder="Add notes about this lead..."
                placeholderTextColor={colors.mutedForeground}
                value={formData.notes}
                onChangeText={(text) => handleChange('notes', text)}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <Button
          onPress={handleSubmit}
          disabled={updateLead.isPending}
          loading={updateLead.isPending}
          size="lg"
          className="w-full"
        >
          Save Changes
        </Button>

        {/* Cancel Button */}
        <Button
          variant="ghost"
          onPress={() => router.back()}
          size="lg"
          className="w-full mt-3"
        >
          Cancel
        </Button>
      </ScrollView>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

export default EditLeadScreen;

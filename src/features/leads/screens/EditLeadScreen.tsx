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
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, User, Mail, Phone, Building2, Tag, FileText, ChevronDown } from 'lucide-react-native';

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

export function EditLeadScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const leadId = params.leadId as string;

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
        status: (lead.status as LeadStatus) || 'new',
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text className="text-muted-foreground mt-4">Loading lead...</Text>
      </View>
    );
  }

  if (!lead) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-muted-foreground">Lead not found</Text>
        <TouchableOpacity
          className="mt-4 bg-primary px-4 py-2 rounded-lg"
          onPress={() => router.back()}
        >
          <Text className="text-primary-foreground">Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView className="flex-1" contentContainerStyle={{ padding: 16 }}>
        {/* Name */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">
            Name <Text className="text-destructive">*</Text>
          </Text>
          <View className="flex-row items-center bg-muted rounded-lg px-3 py-3">
            <User size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-foreground text-base"
              placeholder="Enter lead name"
              placeholderTextColor="#9ca3af"
              value={formData.name}
              onChangeText={(text) => handleChange('name', text)}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Email */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
          <View className="flex-row items-center bg-muted rounded-lg px-3 py-3">
            <Mail size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-foreground text-base"
              placeholder="email@example.com"
              placeholderTextColor="#9ca3af"
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
          <Text className="text-sm font-medium text-foreground mb-2">Phone</Text>
          <View className="flex-row items-center bg-muted rounded-lg px-3 py-3">
            <Phone size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-foreground text-base"
              placeholder="(555) 123-4567"
              placeholderTextColor="#9ca3af"
              value={formData.phone}
              onChangeText={(text) => handleChange('phone', text)}
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Company */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">Company</Text>
          <View className="flex-row items-center bg-muted rounded-lg px-3 py-3">
            <Building2 size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-foreground text-base"
              placeholder="Company name"
              placeholderTextColor="#9ca3af"
              value={formData.company}
              onChangeText={(text) => handleChange('company', text)}
              autoCapitalize="words"
            />
          </View>
        </View>

        {/* Status */}
        <View className="mb-4">
          <Text className="text-sm font-medium text-foreground mb-2">Status</Text>
          <TouchableOpacity
            className="flex-row items-center justify-between bg-muted rounded-lg px-3 py-3"
            onPress={() => setShowStatusPicker(!showStatusPicker)}
          >
            <Text className="text-foreground text-base">
              {getStatusLabel(formData.status)}
            </Text>
            <ChevronDown size={18} color="#6b7280" />
          </TouchableOpacity>

          {showStatusPicker && (
            <View className="bg-card border border-border rounded-lg mt-2 overflow-hidden">
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  className={`px-4 py-3 border-b border-border ${
                    formData.status === option.value ? 'bg-primary/10' : ''
                  }`}
                  onPress={() => handleStatusSelect(option.value)}
                >
                  <Text
                    className={`text-base ${
                      formData.status === option.value
                        ? 'text-primary font-medium'
                        : 'text-foreground'
                    }`}
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
          <Text className="text-sm font-medium text-foreground mb-2">Tags</Text>
          <View className="flex-row items-center bg-muted rounded-lg px-3 py-2">
            <Tag size={18} color="#6b7280" />
            <TextInput
              className="flex-1 ml-3 text-foreground text-base"
              placeholder="Add a tag"
              placeholderTextColor="#9ca3af"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={handleAddTag}
              returnKeyType="done"
            />
            <TouchableOpacity
              className="bg-primary px-3 py-1.5 rounded-md"
              onPress={handleAddTag}
            >
              <Text className="text-primary-foreground text-sm font-medium">Add</Text>
            </TouchableOpacity>
          </View>

          {formData.tags.length > 0 && (
            <View className="flex-row flex-wrap gap-2 mt-2">
              {formData.tags.map((tag, index) => (
                <View
                  key={index}
                  className="flex-row items-center bg-secondary px-3 py-1.5 rounded-full"
                >
                  <Text className="text-secondary-foreground text-sm">{tag}</Text>
                  <TouchableOpacity
                    className="ml-2"
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <X size={14} color="#6b7280" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View className="mb-6">
          <Text className="text-sm font-medium text-foreground mb-2">Notes</Text>
          <View className="bg-muted rounded-lg px-3 py-3">
            <View className="flex-row items-start">
              <FileText size={18} color="#6b7280" className="mt-0.5" />
              <TextInput
                className="flex-1 ml-3 text-foreground text-base min-h-[100px]"
                placeholder="Add notes about this lead..."
                placeholderTextColor="#9ca3af"
                value={formData.notes}
                onChangeText={(text) => handleChange('notes', text)}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          className={`rounded-lg py-4 items-center ${
            updateLead.isPending ? 'bg-primary/50' : 'bg-primary'
          }`}
          onPress={handleSubmit}
          disabled={updateLead.isPending}
        >
          {updateLead.isPending ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-primary-foreground font-semibold text-base">
              Save Changes
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button */}
        <TouchableOpacity
          className="rounded-lg py-4 items-center mt-3"
          onPress={() => router.back()}
        >
          <Text className="text-muted-foreground font-medium text-base">Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default EditLeadScreen;

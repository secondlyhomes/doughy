// Leads Filters Sheet Component - React Native
// Zone D: Bottom sheet for advanced lead filtering

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Pressable,
} from 'react-native';
import { X, Check, ChevronDown, RotateCcw } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LeadStatus } from '../types';
import { LeadFilters } from '../screens/LeadsListScreen';

interface LeadsFiltersSheetProps {
  visible: boolean;
  filters: LeadFilters;
  onClose: () => void;
  onApply: (filters: LeadFilters) => void;
  onReset: () => void;
}

const STATUS_OPTIONS: { label: string; value: LeadStatus | 'all' }[] = [
  { label: 'All Statuses', value: 'all' },
  { label: 'New', value: 'new' },
  { label: 'Active', value: 'active' },
  { label: 'Won', value: 'won' },
  { label: 'Lost', value: 'lost' },
  { label: 'Closed', value: 'closed' },
  { label: 'Inactive', value: 'inactive' },
];

const SOURCE_OPTIONS: { label: string; value: string }[] = [
  { label: 'All Sources', value: 'all' },
  { label: 'Website', value: 'website' },
  { label: 'Referral', value: 'referral' },
  { label: 'Social Media', value: 'social_media' },
  { label: 'Cold Call', value: 'cold_call' },
  { label: 'Direct Mail', value: 'direct_mail' },
  { label: 'Paid Ad', value: 'paid_ad' },
  { label: 'Other', value: 'other' },
];

const STARRED_OPTIONS: { label: string; value: boolean | null }[] = [
  { label: 'All Leads', value: null },
  { label: 'Starred Only', value: true },
  { label: 'Not Starred', value: false },
];

const SORT_OPTIONS: { label: string; value: 'name' | 'created_at' | 'score' }[] = [
  { label: 'Date Added', value: 'created_at' },
  { label: 'Name', value: 'name' },
  { label: 'Lead Score', value: 'score' },
];

interface FilterSectionProps {
  title: string;
  children: React.ReactNode;
}

function FilterSection({ title, children }: FilterSectionProps) {
  return (
    <View className="mb-6">
      <Text className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
        {title}
      </Text>
      {children}
    </View>
  );
}

interface OptionButtonProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

function OptionButton({ label, selected, onPress }: OptionButtonProps) {
  return (
    <TouchableOpacity
      className={`flex-row items-center justify-between px-4 py-3 rounded-lg mb-2 ${
        selected ? 'bg-primary/10 border border-primary' : 'bg-muted'
      }`}
      onPress={onPress}
    >
      <Text
        className={`text-base ${
          selected ? 'text-primary font-medium' : 'text-foreground'
        }`}
      >
        {label}
      </Text>
      {selected && <Check size={18} color="#3b82f6" />}
    </TouchableOpacity>
  );
}

export function LeadsFiltersSheet({
  visible,
  filters,
  onClose,
  onApply,
  onReset,
}: LeadsFiltersSheetProps) {
  const [localFilters, setLocalFilters] = useState<LeadFilters>(filters);

  // Reset local filters when sheet opens
  useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const handleApply = () => {
    onApply(localFilters);
  };

  const handleReset = () => {
    const defaultFilters: LeadFilters = {
      status: 'all',
      source: 'all',
      starred: null,
      sortBy: 'created_at',
      sortOrder: 'desc',
    };
    setLocalFilters(defaultFilters);
    onReset();
  };

  const updateFilter = <K extends keyof LeadFilters>(key: K, value: LeadFilters[K]) => {
    setLocalFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
          <TouchableOpacity onPress={onClose} className="p-1">
            <X size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text className="text-lg font-semibold text-foreground">Filters</Text>
          <TouchableOpacity onPress={handleReset} className="flex-row items-center">
            <RotateCcw size={16} color="#3b82f6" />
            <Text className="text-primary ml-1">Reset</Text>
          </TouchableOpacity>
        </View>

        {/* Filters Content */}
        <ScrollView className="flex-1 px-4 pt-4">
          {/* Status Filter */}
          <FilterSection title="Status">
            {STATUS_OPTIONS.map(option => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={localFilters.status === option.value}
                onPress={() => updateFilter('status', option.value)}
              />
            ))}
          </FilterSection>

          {/* Source Filter */}
          <FilterSection title="Source">
            {SOURCE_OPTIONS.map(option => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={localFilters.source === option.value}
                onPress={() => updateFilter('source', option.value)}
              />
            ))}
          </FilterSection>

          {/* Starred Filter */}
          <FilterSection title="Starred">
            {STARRED_OPTIONS.map((option, index) => (
              <OptionButton
                key={index}
                label={option.label}
                selected={localFilters.starred === option.value}
                onPress={() => updateFilter('starred', option.value)}
              />
            ))}
          </FilterSection>

          {/* Sort By */}
          <FilterSection title="Sort By">
            {SORT_OPTIONS.map(option => (
              <OptionButton
                key={option.value}
                label={option.label}
                selected={localFilters.sortBy === option.value}
                onPress={() => updateFilter('sortBy', option.value)}
              />
            ))}
          </FilterSection>

          {/* Sort Order */}
          <FilterSection title="Sort Order">
            <View className="flex-row gap-3">
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg items-center ${
                  localFilters.sortOrder === 'desc'
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
                onPress={() => updateFilter('sortOrder', 'desc')}
              >
                <Text
                  className={`font-medium ${
                    localFilters.sortOrder === 'desc'
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  Newest First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className={`flex-1 py-3 rounded-lg items-center ${
                  localFilters.sortOrder === 'asc'
                    ? 'bg-primary'
                    : 'bg-muted'
                }`}
                onPress={() => updateFilter('sortOrder', 'asc')}
              >
                <Text
                  className={`font-medium ${
                    localFilters.sortOrder === 'asc'
                      ? 'text-primary-foreground'
                      : 'text-foreground'
                  }`}
                >
                  Oldest First
                </Text>
              </TouchableOpacity>
            </View>
          </FilterSection>

          {/* Bottom padding */}
          <View className="h-24" />
        </ScrollView>

        {/* Apply Button */}
        <View className="px-4 pb-4 pt-2 border-t border-border">
          <TouchableOpacity
            className="bg-primary py-4 rounded-lg items-center"
            onPress={handleApply}
          >
            <Text className="text-primary-foreground font-semibold text-base">
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

export default LeadsFiltersSheet;

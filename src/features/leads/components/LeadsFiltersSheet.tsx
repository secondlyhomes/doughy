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
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ThemedSafeAreaView } from '@/components';
import { Button } from '@/components/ui';

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
  const colors = useThemeColors();
  return (
    <View className="mb-6">
      <Text className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: colors.mutedForeground }}>
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
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      className="flex-row items-center justify-between px-4 py-3 rounded-lg mb-2"
      style={{
        backgroundColor: selected ? withOpacity(colors.primary, 'muted') : colors.muted,
        borderWidth: selected ? 1 : 0,
        borderColor: selected ? colors.primary : 'transparent',
      }}
      onPress={onPress}
    >
      <Text
        className="text-base"
        style={{
          color: selected ? colors.primary : colors.foreground,
          fontWeight: selected ? '500' : 'normal',
        }}
      >
        {label}
      </Text>
      {selected && <Check size={18} color={colors.info} />}
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
  const colors = useThemeColors();
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
      <ThemedSafeAreaView className="flex-1" edges={['top', 'bottom']}>
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={onClose} className="p-1">
            <X size={24} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Filters</Text>
          <TouchableOpacity onPress={handleReset} className="flex-row items-center">
            <RotateCcw size={16} color={colors.info} />
            <Text className="ml-1" style={{ color: colors.primary }}>Reset</Text>
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
            {STARRED_OPTIONS.map((option) => (
              <OptionButton
                key={String(option.value)}
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
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor: localFilters.sortOrder === 'desc' ? colors.primary : colors.muted,
                }}
                onPress={() => updateFilter('sortOrder', 'desc')}
              >
                <Text
                  className="font-medium"
                  style={{
                    color: localFilters.sortOrder === 'desc' ? colors.primaryForeground : colors.foreground,
                  }}
                >
                  Newest First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 py-3 rounded-lg items-center"
                style={{
                  backgroundColor: localFilters.sortOrder === 'asc' ? colors.primary : colors.muted,
                }}
                onPress={() => updateFilter('sortOrder', 'asc')}
              >
                <Text
                  className="font-medium"
                  style={{
                    color: localFilters.sortOrder === 'asc' ? colors.primaryForeground : colors.foreground,
                  }}
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
        <View className="px-4 pb-4 pt-2" style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
          <Button onPress={handleApply} size="lg" className="w-full">
            Apply Filters
          </Button>
        </View>
      </ThemedSafeAreaView>
    </Modal>
  );
}

export default LeadsFiltersSheet;

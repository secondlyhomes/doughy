// src/features/capture/components/PushToLeadSheet.tsx
// Sheet for assigning a capture item to a lead/property/deal

import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { BottomSheet, Button, SearchBar, Badge } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import {
  User,
  Home,
  Plus,
  Check,
  Sparkles,
  ChevronRight,
} from 'lucide-react-native';

import { CaptureItem } from '../types';
import { useAssignCaptureItem } from '../hooks/useCaptureItems';
import { useLeads } from '@/features/leads/hooks/useLeads';
import { Lead } from '@/features/leads/types';

interface PushToLeadSheetProps {
  visible: boolean;
  item: CaptureItem;
  onClose: () => void;
  onComplete: () => void;
}

export function PushToLeadSheet({ visible, item, onClose, onComplete }: PushToLeadSheetProps) {
  const colors = useThemeColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(
    item.suggested_lead_id || null
  );

  const { leads, isLoading: leadsLoading } = useLeads();
  const { mutateAsync: assignItem, isPending } = useAssignCaptureItem();

  // Filter leads by search
  const filteredLeads = useMemo(() => {
    if (!searchQuery) return leads;
    const query = searchQuery.toLowerCase();
    return leads.filter(lead =>
      lead.name?.toLowerCase().includes(query) ||
      lead.email?.toLowerCase().includes(query) ||
      lead.phone?.includes(query)
    );
  }, [leads, searchQuery]);

  // Check if selected lead matches AI suggestion
  const isSuggested = (lead: Lead) => lead.id === item.suggested_lead_id;

  const handleAssign = async () => {
    if (!selectedLeadId) {
      Alert.alert('Select a Lead', 'Please select a lead to assign this item to.');
      return;
    }

    try {
      await assignItem({
        id: item.id,
        assignment: { lead_id: selectedLeadId },
      });
      onComplete();
    } catch {
      Alert.alert('Error', 'Failed to assign item. Please try again.');
    }
  };

  const renderLeadItem = ({ item: lead }: { item: Lead }) => {
    const isSelected = selectedLeadId === lead.id;
    const suggested = isSuggested(lead);

    return (
      <TouchableOpacity
        onPress={() => setSelectedLeadId(lead.id)}
        activeOpacity={0.7}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
          backgroundColor: isSelected ? withOpacity(colors.primary, 'light') : colors.card,
          borderRadius: BORDER_RADIUS.lg,
          borderWidth: isSelected ? 2 : 1,
          borderColor: isSelected ? colors.primary : colors.border,
          marginBottom: SPACING.sm,
        }}
      >
        {/* Avatar */}
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: withOpacity(colors.primary, 'light'),
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: SPACING.md,
          }}
        >
          <User size={20} color={colors.primary} />
        </View>

        {/* Info */}
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
            <Text
              style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}
              numberOfLines={1}
            >
              {lead.name || 'Unnamed Lead'}
            </Text>
            {suggested && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Sparkles size={12} color={colors.warning} />
                <Text style={{ fontSize: 11, color: colors.warning }}>Suggested</Text>
              </View>
            )}
          </View>
          {(lead.email || lead.phone) && (
            <Text
              style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 2 }}
              numberOfLines={1}
            >
              {lead.email || lead.phone}
            </Text>
          )}
        </View>

        {/* Selection Indicator */}
        {isSelected && (
          <View
            style={{
              width: 24,
              height: 24,
              borderRadius: 12,
              backgroundColor: colors.primary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Check size={16} color={colors.primaryForeground} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Push to Lead"
      snapPoints={['70%']}
    >
      <View style={{ flex: 1, paddingHorizontal: SPACING.md }}>
        {/* AI Suggestion Banner */}
        {item.suggested_lead_id && item.ai_confidence && item.ai_confidence > 0.5 && (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: SPACING.md,
              backgroundColor: withOpacity(colors.warning, 'light'),
              borderRadius: BORDER_RADIUS.lg,
              marginBottom: SPACING.md,
              gap: SPACING.sm,
            }}
          >
            <Sparkles size={18} color={colors.warning} />
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', color: colors.warning }}>
                AI Suggestion
              </Text>
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                Based on the content, this item may belong to the suggested lead below.
              </Text>
            </View>
          </View>
        )}

        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search leads..."
          size="md"
          style={{ marginBottom: SPACING.md }}
        />

        {/* Leads List */}
        <FlatList
          data={filteredLeads}
          renderItem={renderLeadItem}
          keyExtractor={(lead) => lead.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: SPACING.xl }}
          ListEmptyComponent={
            <View style={{ alignItems: 'center', paddingVertical: SPACING.xl }}>
              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
                {leadsLoading ? 'Loading leads...' : 'No leads found'}
              </Text>
            </View>
          }
        />

        {/* Action Buttons */}
        <View
          style={{
            flexDirection: 'row',
            gap: SPACING.md,
            paddingTop: SPACING.md,
            paddingBottom: SPACING.lg,
            borderTopWidth: 1,
            borderTopColor: colors.border,
          }}
        >
          <Button
            variant="outline"
            onPress={onClose}
            style={{ flex: 1 }}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            onPress={handleAssign}
            loading={isPending}
            disabled={!selectedLeadId || isPending}
            style={{ flex: 1 }}
          >
            Assign to Lead
          </Button>
        </View>
      </View>
    </BottomSheet>
  );
}

export default PushToLeadSheet;

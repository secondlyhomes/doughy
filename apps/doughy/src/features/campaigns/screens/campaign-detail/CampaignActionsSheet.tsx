// src/features/campaigns/screens/campaign-detail/CampaignActionsSheet.tsx
// Actions bottom sheet for campaign detail screen

import React from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { Edit, UserPlus, Trash2, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheet } from '@/components/ui';

interface CampaignActionsSheetProps {
  visible: boolean;
  onClose: () => void;
  onEdit: () => void;
  onAddContacts: () => void;
  onDelete: () => void;
}

export function CampaignActionsSheet({
  visible,
  onClose,
  onEdit,
  onAddContacts,
  onDelete,
}: CampaignActionsSheetProps) {
  const colors = useThemeColors();

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Campaign Actions">
      <TouchableOpacity
        className="flex-row items-center py-4"
        onPress={() => {
          onClose();
          onEdit();
        }}
      >
        <Edit size={20} color={colors.foreground} />
        <Text className="ml-3 text-base" style={{ color: colors.foreground }}>
          Edit Campaign
        </Text>
        <ChevronRight
          size={20}
          color={colors.mutedForeground}
          className="ml-auto"
        />
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center py-4"
        onPress={() => {
          onClose();
          onAddContacts();
        }}
      >
        <UserPlus size={20} color={colors.foreground} />
        <Text className="ml-3 text-base" style={{ color: colors.foreground }}>
          Add Contacts
        </Text>
        <ChevronRight
          size={20}
          color={colors.mutedForeground}
          className="ml-auto"
        />
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center py-4"
        onPress={() => {
          onClose();
          onDelete();
        }}
      >
        <Trash2 size={20} color={colors.destructive} />
        <Text className="ml-3 text-base" style={{ color: colors.destructive }}>
          Delete Campaign
        </Text>
      </TouchableOpacity>
    </BottomSheet>
  );
}

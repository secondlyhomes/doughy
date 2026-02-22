// src/features/deals/components/DealActionsSheet.tsx
// Bottom sheet with deal actions menu (Focus Mode, Call, Edit, Delete)

import React, { useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import {
  Focus,
  Layers,
  Phone,
  Share2,
  Edit2,
  Trash2,
  Check,
} from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useFocusMode } from '@/contexts/FocusModeContext';
import { withOpacity } from '@/lib/design-utils';
import { Deal } from '../types';

interface DealActionsSheetProps {
  deal: Deal;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onShare?: () => void;
}

export function DealActionsSheet({
  deal,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onShare,
}: DealActionsSheetProps) {
  const colors = useThemeColors();
  const { focusMode, toggleFocusMode } = useFocusMode();

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  const handleFocusModeToggle = useCallback(() => {
    toggleFocusMode();
    // Don't close sheet - let user see the state change
  }, [toggleFocusMode]);

  const handleCallSeller = useCallback(async () => {
    const phoneNumber = deal.lead?.phone;
    if (!phoneNumber) {
      Alert.alert('No Phone', 'No phone number available for this lead.', [{ text: 'OK' }]);
      return;
    }

    const phoneUrl = `tel:${phoneNumber.replace(/\D/g, '')}`;
    const canOpen = await Linking.canOpenURL(phoneUrl);

    if (canOpen) {
      await Linking.openURL(phoneUrl);
      handleClose();
    } else {
      Alert.alert('Unable to Call', `Cannot open phone dialer for: ${phoneNumber}`, [{ text: 'OK' }]);
    }
  }, [deal.lead?.phone, handleClose]);

  const handleShare = useCallback(() => {
    handleClose();
    onShare?.();
  }, [handleClose, onShare]);

  const handleEdit = useCallback(() => {
    handleClose();
    onEdit?.();
  }, [handleClose, onEdit]);

  const handleDelete = useCallback(() => {
    handleClose();
    onDelete?.();
  }, [handleClose, onDelete]);

  // Render action button
  const renderActionButton = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    options?: {
      destructive?: boolean;
      showCheck?: boolean;
      subtitle?: string;
    }
  ) => {
    const textColor = options?.destructive ? colors.destructive : colors.foreground;

    return (
      <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-between py-4 px-2 border-b"
        style={{ borderColor: colors.border }}
      >
        <View className="flex-row items-center flex-1">
          {icon}
          <View className="ml-3">
            <Text className="font-medium" style={{ color: textColor }}>{label}</Text>
            {options?.subtitle && (
              <Text className="text-xs mt-0.5" style={{ color: colors.mutedForeground }}>
                {options.subtitle}
              </Text>
            )}
          </View>
        </View>
        {options?.showCheck && (
          <Check size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <BottomSheet visible={isOpen} onClose={handleClose} title="Deal Actions">
      <View className="pb-4">
        {/* Focus Mode Toggle */}
        {renderActionButton(
          focusMode ? (
            <Layers size={20} color={colors.primary} />
          ) : (
            <Focus size={20} color={colors.foreground} />
          ),
          focusMode ? 'Focus Mode (On)' : 'Focus Mode',
          handleFocusModeToggle,
          {
            showCheck: focusMode,
            subtitle: focusMode ? 'Showing essential info only' : 'Hide distractions, show essentials',
          }
        )}

        {/* Call Seller */}
        {deal.lead?.phone &&
          renderActionButton(
            <Phone size={20} color={colors.primary} />,
            'Call Seller',
            handleCallSeller,
            { subtitle: deal.lead.phone }
          )}

        {/* Share Deal */}
        {onShare &&
          renderActionButton(
            <Share2 size={20} color={colors.foreground} />,
            'Share Deal',
            handleShare
          )}

        {/* Divider */}
        <View className="h-2" />

        {/* Edit Deal */}
        {onEdit &&
          renderActionButton(
            <Edit2 size={20} color={colors.foreground} />,
            'Edit Deal',
            handleEdit
          )}

        {/* Delete Deal */}
        {onDelete &&
          renderActionButton(
            <Trash2 size={20} color={colors.destructive} />,
            'Delete Deal',
            handleDelete,
            { destructive: true }
          )}
      </View>
    </BottomSheet>
  );
}

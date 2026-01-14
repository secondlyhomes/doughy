// src/features/real-estate/components/PropertyActionsSheet.tsx
// Bottom sheet with property actions menu

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {
  Share2,
  Copy,
  FileDown,
  CircleDot,
  Check,
  Edit2,
  Trash2,
  ChevronRight,
} from 'lucide-react-native';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Property } from '../types';
import { PropertyStatus, PropertyConstants } from '../types/constants';
import { usePropertyActions } from '../hooks/usePropertyActions';

interface PropertyActionsSheetProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: () => void;
}

type ActionView = 'main' | 'share' | 'status';

export function PropertyActionsSheet({
  property,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: PropertyActionsSheetProps) {
  const colors = useThemeColors();
  const { shareProperty, exportPropertySummary, copyPropertyLink, updatePropertyStatus, isLoading } =
    usePropertyActions();

  const [currentView, setCurrentView] = useState<ActionView>('main');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  // Status colors using theme
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: withOpacity(colors.success, 'muted'), text: colors.success, solid: colors.success };
      case 'Pending':
        return { bg: withOpacity(colors.warning, 'muted'), text: colors.warning, solid: colors.warning };
      case 'Sold':
        return { bg: withOpacity(colors.info, 'muted'), text: colors.info, solid: colors.info };
      case 'Withdrawn':
        return { bg: colors.muted, text: colors.mutedForeground, solid: colors.mutedForeground };
      case 'Expired':
        return { bg: withOpacity(colors.destructive, 'muted'), text: colors.destructive, solid: colors.destructive };
      case 'Off Market':
        return { bg: withOpacity(colors.primary, 'muted'), text: colors.primary, solid: colors.primary };
      default:
        return { bg: colors.muted, text: colors.foreground, solid: colors.foreground };
    }
  };

  const handleClose = useCallback(() => {
    setCurrentView('main');
    setProcessingAction(null);
    onClose();
  }, [onClose]);

  const handleShare = useCallback(
    async (type: 'link' | 'text' | 'full') => {
      setProcessingAction(`share-${type}`);
      const success = await shareProperty(property, type);
      setProcessingAction(null);
      if (success) {
        handleClose();
      }
    },
    [shareProperty, property, handleClose]
  );

  const handleCopy = useCallback(async () => {
    setProcessingAction('copy');
    const success = await copyPropertyLink(property);
    setProcessingAction(null);
    if (success) {
      Alert.alert('Copied!', 'Property details copied to clipboard');
      handleClose();
    } else {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  }, [copyPropertyLink, property, handleClose]);

  const handleExport = useCallback(async () => {
    setProcessingAction('export');
    const result = await exportPropertySummary(property);
    setProcessingAction(null);
    if (result) {
      handleClose();
    } else {
      Alert.alert('Error', 'Failed to export property summary');
    }
  }, [exportPropertySummary, property, handleClose]);

  const handleStatusChange = useCallback(
    async (status: PropertyStatus) => {
      if (property.status === status) {
        setCurrentView('main');
        return;
      }

      setProcessingAction(`status-${status}`);
      const success = await updatePropertyStatus(property.id, status);
      setProcessingAction(null);

      if (success) {
        onStatusChange?.();
        handleClose();
      } else {
        Alert.alert('Error', 'Failed to update property status');
      }
    },
    [updatePropertyStatus, property.id, property.status, onStatusChange, handleClose]
  );

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
      showArrow?: boolean;
      disabled?: boolean;
      processingKey?: string;
    }
  ) => {
    const isProcessing = processingAction === options?.processingKey;
    const textColor = options?.destructive ? colors.destructive : colors.foreground;

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading || options?.disabled}
        className={`flex-row items-center justify-between py-4 px-2 border-b ${
          options?.disabled ? 'opacity-50' : ''
        }`}
        style={{ borderColor: colors.border }}
      >
        <View className="flex-row items-center flex-1">
          {icon}
          <Text className="font-medium ml-3" style={{ color: textColor }}>{label}</Text>
        </View>
        {isProcessing ? (
          <ActivityIndicator size="small" />
        ) : options?.showArrow ? (
          <ChevronRight size={20} color={colors.mutedForeground} />
        ) : null}
      </TouchableOpacity>
    );
  };

  // Main actions view
  const renderMainView = () => (
    <View>
      {/* Share Options */}
      {renderActionButton(
        <Share2 size={20} color={colors.primary} />,
        'Share Property',
        () => setCurrentView('share'),
        { showArrow: true }
      )}

      {/* Copy to Clipboard */}
      {renderActionButton(
        <Copy size={20} color={colors.primary} />,
        'Copy Details',
        handleCopy,
        { processingKey: 'copy' }
      )}

      {/* Export Summary */}
      {renderActionButton(
        <FileDown size={20} color={colors.primary} />,
        'Export Summary',
        handleExport,
        { processingKey: 'export' }
      )}

      {/* Change Status */}
      {renderActionButton(
        <CircleDot size={20} color={colors.primary} />,
        'Change Status',
        () => setCurrentView('status'),
        { showArrow: true }
      )}

      {/* Divider */}
      <View className="h-2" />

      {/* Edit Property */}
      {onEdit &&
        renderActionButton(<Edit2 size={20} color={colors.foreground} />, 'Edit Property', handleEdit)}

      {/* Delete Property */}
      {onDelete &&
        renderActionButton(
          <Trash2 size={20} color={colors.destructive} />,
          'Delete Property',
          handleDelete,
          { destructive: true }
        )}
    </View>
  );

  // Share options view
  const renderShareView = () => (
    <View>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => setCurrentView('main')}
        className="flex-row items-center py-2 mb-2"
      >
        <ChevronRight size={20} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
        <Text className="ml-1" style={{ color: colors.mutedForeground }}>Back</Text>
      </TouchableOpacity>

      <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Share Property</Text>

      {renderActionButton(
        <Share2 size={20} color={colors.primary} />,
        'Quick Share (Basic Info)',
        () => handleShare('text'),
        { processingKey: 'share-text' }
      )}

      {renderActionButton(
        <Share2 size={20} color={colors.primary} />,
        'Full Details',
        () => handleShare('full'),
        { processingKey: 'share-full' }
      )}

      {renderActionButton(
        <Copy size={20} color={colors.primary} />,
        'Copy to Clipboard',
        handleCopy,
        { processingKey: 'copy' }
      )}
    </View>
  );

  // Status change view
  const renderStatusView = () => {
    const currentStatus = property.status || 'Active';

    return (
      <View>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => setCurrentView('main')}
          className="flex-row items-center py-2 mb-2"
        >
          <ChevronRight size={20} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text className="ml-1" style={{ color: colors.mutedForeground }}>Back</Text>
        </TouchableOpacity>

        <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>Change Status</Text>
        <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
          Current: <Text className="font-medium" style={{ color: colors.foreground }}>{currentStatus}</Text>
        </Text>

        <View className="gap-2">
          {PropertyConstants.STATUS_OPTIONS.map((option) => {
            const isSelected = currentStatus === option.value;
            const statusColors = getStatusColors(option.value);
            const isProcessing = processingAction === `status-${option.value}`;

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleStatusChange(option.value as PropertyStatus)}
                disabled={isLoading}
                className="flex-row items-center justify-between p-4 rounded-xl border"
                style={{
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? withOpacity(colors.primary, 'subtle') : colors.card,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: statusColors.solid }} />
                  <Text
                    className="font-medium"
                    style={{ color: isSelected ? colors.primary : colors.foreground }}
                  >
                    {option.label}
                  </Text>
                </View>
                {isProcessing ? (
                  <ActivityIndicator size="small" />
                ) : isSelected ? (
                  <Check size={20} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const getTitle = () => {
    switch (currentView) {
      case 'share':
        return 'Share Options';
      case 'status':
        return 'Property Status';
      default:
        return 'Property Actions';
    }
  };

  return (
    <BottomSheet visible={isOpen} onClose={handleClose} title={getTitle()}>
      <View className="pb-4">
        {currentView === 'main' && renderMainView()}
        {currentView === 'share' && renderShareView()}
        {currentView === 'status' && renderStatusView()}
      </View>
    </BottomSheet>
  );
}

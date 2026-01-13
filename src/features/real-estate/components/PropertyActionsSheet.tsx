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

// Status badge colors
const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  Active: { bg: 'bg-success/10', text: 'text-success' },
  Pending: { bg: 'bg-warning/10', text: 'text-warning' },
  Sold: { bg: 'bg-info/10', text: 'text-info' },
  Withdrawn: { bg: 'bg-muted', text: 'text-muted-foreground' },
  Expired: { bg: 'bg-destructive/10', text: 'text-destructive' },
  'Off Market': { bg: 'bg-primary/10', text: 'text-primary' },
};

export function PropertyActionsSheet({
  property,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
}: PropertyActionsSheetProps) {
  const { shareProperty, exportPropertySummary, copyPropertyLink, updatePropertyStatus, isLoading } =
    usePropertyActions();

  const [currentView, setCurrentView] = useState<ActionView>('main');
  const [processingAction, setProcessingAction] = useState<string | null>(null);

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
    const textColor = options?.destructive ? 'text-destructive' : 'text-foreground';

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading || options?.disabled}
        className={`flex-row items-center justify-between py-4 px-2 border-b border-border ${
          options?.disabled ? 'opacity-50' : ''
        }`}
      >
        <View className="flex-row items-center flex-1">
          {icon}
          <Text className={`${textColor} font-medium ml-3`}>{label}</Text>
        </View>
        {isProcessing ? (
          <ActivityIndicator size="small" />
        ) : options?.showArrow ? (
          <ChevronRight size={20} className="text-muted-foreground" />
        ) : null}
      </TouchableOpacity>
    );
  };

  // Main actions view
  const renderMainView = () => (
    <View>
      {/* Share Options */}
      {renderActionButton(
        <Share2 size={20} className="text-primary" />,
        'Share Property',
        () => setCurrentView('share'),
        { showArrow: true }
      )}

      {/* Copy to Clipboard */}
      {renderActionButton(
        <Copy size={20} className="text-primary" />,
        'Copy Details',
        handleCopy,
        { processingKey: 'copy' }
      )}

      {/* Export Summary */}
      {renderActionButton(
        <FileDown size={20} className="text-primary" />,
        'Export Summary',
        handleExport,
        { processingKey: 'export' }
      )}

      {/* Change Status */}
      {renderActionButton(
        <CircleDot size={20} className="text-primary" />,
        'Change Status',
        () => setCurrentView('status'),
        { showArrow: true }
      )}

      {/* Divider */}
      <View className="h-2" />

      {/* Edit Property */}
      {onEdit &&
        renderActionButton(<Edit2 size={20} className="text-foreground" />, 'Edit Property', handleEdit)}

      {/* Delete Property */}
      {onDelete &&
        renderActionButton(
          <Trash2 size={20} className="text-destructive" />,
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
        <ChevronRight size={20} className="text-muted-foreground rotate-180" />
        <Text className="text-muted-foreground ml-1">Back</Text>
      </TouchableOpacity>

      <Text className="text-lg font-semibold text-foreground mb-4">Share Property</Text>

      {renderActionButton(
        <Share2 size={20} className="text-primary" />,
        'Quick Share (Basic Info)',
        () => handleShare('text'),
        { processingKey: 'share-text' }
      )}

      {renderActionButton(
        <Share2 size={20} className="text-primary" />,
        'Full Details',
        () => handleShare('full'),
        { processingKey: 'share-full' }
      )}

      {renderActionButton(
        <Copy size={20} className="text-primary" />,
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
          <ChevronRight size={20} className="text-muted-foreground rotate-180" />
          <Text className="text-muted-foreground ml-1">Back</Text>
        </TouchableOpacity>

        <Text className="text-lg font-semibold text-foreground mb-2">Change Status</Text>
        <Text className="text-sm text-muted-foreground mb-4">
          Current: <Text className="font-medium text-foreground">{currentStatus}</Text>
        </Text>

        <View className="gap-2">
          {PropertyConstants.STATUS_OPTIONS.map((option) => {
            const isSelected = currentStatus === option.value;
            const colors = STATUS_COLORS[option.value] || { bg: 'bg-muted', text: 'text-foreground' };
            const isProcessing = processingAction === `status-${option.value}`;

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleStatusChange(option.value as PropertyStatus)}
                disabled={isLoading}
                className={`flex-row items-center justify-between p-4 rounded-xl border ${
                  isSelected ? 'border-primary bg-primary/5' : 'border-border bg-card'
                }`}
              >
                <View className="flex-row items-center">
                  <View className={`w-3 h-3 rounded-full mr-3 ${colors.bg.replace('/10', '')}`} />
                  <Text
                    className={`font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}
                  >
                    {option.label}
                  </Text>
                </View>
                {isProcessing ? (
                  <ActivityIndicator size="small" />
                ) : isSelected ? (
                  <Check size={20} className="text-primary" />
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

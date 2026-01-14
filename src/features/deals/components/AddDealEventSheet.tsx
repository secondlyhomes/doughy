// src/features/deals/components/AddDealEventSheet.tsx
// Zone B: Task B4 - Bottom sheet for adding deal notes/events
// Allows users to manually log notes and activities on a deal

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  FileText,
  Phone,
  Mail,
  Calendar,
  Check,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { Button } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { logDealEvent } from '../hooks/useDealEvents';
import type { DealEventType } from '../types/events';

// ============================================
// Types
// ============================================

type SimpleEventType = 'note' | 'call' | 'email' | 'meeting';

interface EventTypeConfig {
  type: SimpleEventType;
  label: string;
  IconComponent: typeof FileText;
  colorKey: 'mutedForeground' | 'info' | 'success' | 'warning';
  bgClass: string;
}

const EVENT_TYPE_OPTIONS: EventTypeConfig[] = [
  {
    type: 'note',
    label: 'Note',
    IconComponent: FileText,
    colorKey: 'mutedForeground',
    bgClass: 'bg-muted',
  },
  {
    type: 'call',
    label: 'Call',
    IconComponent: Phone,
    colorKey: 'info',
    bgClass: 'bg-info/20',
  },
  {
    type: 'email',
    label: 'Email',
    IconComponent: Mail,
    colorKey: 'success',
    bgClass: 'bg-success/20',
  },
  {
    type: 'meeting',
    label: 'Meeting',
    IconComponent: Calendar,
    colorKey: 'warning',
    bgClass: 'bg-warning/20',
  },
];

// ============================================
// Component
// ============================================

interface AddDealEventSheetProps {
  visible: boolean;
  dealId: string;
  dealAddress?: string;
  onClose: () => void;
  onSaved?: () => void;
}

// Map simple types to DealEventType (note is the catch-all)
const TYPE_TO_EVENT_TYPE: Record<SimpleEventType, DealEventType> = {
  note: 'note',
  call: 'note', // Using 'note' with metadata.activity_type for calls
  email: 'note',
  meeting: 'note',
};

const TYPE_LABELS: Record<SimpleEventType, string> = {
  note: 'Note added',
  call: 'Call logged',
  email: 'Email logged',
  meeting: 'Meeting logged',
};

export function AddDealEventSheet({
  visible,
  dealId,
  dealAddress,
  onClose,
  onSaved,
}: AddDealEventSheetProps) {
  const colors = useThemeColors();

  const [selectedType, setSelectedType] = useState<SimpleEventType>('note');
  const [description, setDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const resetForm = () => {
    setSelectedType('note');
    setDescription('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = async () => {
    if (!description.trim()) return;

    setIsSaving(true);
    try {
      // Log the event with proper type and metadata
      await logDealEvent({
        deal_id: dealId,
        event_type: TYPE_TO_EVENT_TYPE[selectedType],
        title: TYPE_LABELS[selectedType],
        description: description.trim(),
        source: 'user',
        metadata: selectedType !== 'note' ? { activity_type: selectedType } : undefined,
      });

      resetForm();
      onClose();
      onSaved?.();
    } catch (error) {
      console.error('Failed to save activity:', error);
      Alert.alert(
        'Save Failed',
        'Could not save your activity. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSaving(false);
    }
  };

  const getPlaceholder = () => {
    switch (selectedType) {
      case 'call':
        return 'What was discussed on the call? Any commitments made?';
      case 'email':
        return 'Summarize the email exchange...';
      case 'meeting':
        return 'What happened in the meeting? Any decisions made?';
      default:
        return 'Add a note about this deal...';
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <ThemedSafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4" style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={handleClose} className="p-1">
              <X size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Add Note</Text>
              {dealAddress && (
                <Text className="text-sm" style={{ color: colors.mutedForeground }} numberOfLines={1}>
                  {dealAddress}
                </Text>
              )}
            </View>
            <Button
              onPress={handleSave}
              disabled={!description.trim() || isSaving}
              size="sm"
            >
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          </View>

          <View className="flex-1 px-4 pt-4">
            {/* Event Type Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: colors.mutedForeground }}>
                Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {EVENT_TYPE_OPTIONS.map((option) => {
                  const { IconComponent } = option;
                  const iconColor = colors[option.colorKey];
                  const isSelected = selectedType === option.type;

                  // Get icon background color based on colorKey
                  const getIconBgColor = () => {
                    switch (option.colorKey) {
                      case 'info': return withOpacity(colors.info, 'medium');
                      case 'success': return withOpacity(colors.success, 'medium');
                      case 'warning': return withOpacity(colors.warning, 'medium');
                      default: return colors.muted;
                    }
                  };

                  return (
                    <TouchableOpacity
                      key={option.type}
                      className="flex-row items-center px-4 py-3 rounded-lg"
                      style={{
                        backgroundColor: isSelected ? withOpacity(colors.primary, 'muted') : colors.muted,
                        borderWidth: isSelected ? 1 : 0,
                        borderColor: isSelected ? colors.primary : 'transparent',
                      }}
                      onPress={() => setSelectedType(option.type)}
                    >
                      <View className="p-1.5 rounded-full mr-2" style={{ backgroundColor: getIconBgColor() }}>
                        <IconComponent size={18} color={iconColor} />
                      </View>
                      <Text
                        className="text-sm"
                        style={{ color: isSelected ? colors.primary : colors.foreground, fontWeight: isSelected ? '500' : '400' }}
                      >
                        {option.label}
                      </Text>
                      {isSelected && (
                        <Check size={16} color={colors.primary} style={{ marginLeft: 8 }} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description Input */}
            <View className="flex-1">
              <Text className="text-sm font-medium mb-3 uppercase tracking-wide" style={{ color: colors.mutedForeground }}>
                Details
              </Text>
              <TextInput
                className="rounded-lg px-4 py-3 flex-1"
                placeholder={getPlaceholder()}
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                style={{ minHeight: 120, backgroundColor: colors.muted, color: colors.foreground }}
              />
            </View>

            {/* Bottom padding */}
            <View className="h-8" />
          </View>
        </KeyboardAvoidingView>
      </ThemedSafeAreaView>
    </Modal>
  );
}

export default AddDealEventSheet;

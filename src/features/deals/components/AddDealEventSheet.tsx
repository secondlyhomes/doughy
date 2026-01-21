// src/features/deals/components/AddDealEventSheet.tsx
// Zone B: Task B4 - Bottom sheet for adding deal notes/events
// Allows users to manually log notes and activities on a deal

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import {
  FileText,
  Phone,
  Mail,
  Calendar,
  Check,
} from 'lucide-react-native';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
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
}

const EVENT_TYPE_OPTIONS: EventTypeConfig[] = [
  {
    type: 'note',
    label: 'Note',
    IconComponent: FileText,
    colorKey: 'mutedForeground',
  },
  {
    type: 'call',
    label: 'Call',
    IconComponent: Phone,
    colorKey: 'info',
  },
  {
    type: 'email',
    label: 'Email',
    IconComponent: Mail,
    colorKey: 'success',
  },
  {
    type: 'meeting',
    label: 'Meeting',
    IconComponent: Calendar,
    colorKey: 'warning',
  },
];

function getIconBgColor(colorKey: string, colors: ReturnType<typeof useThemeColors>) {
  switch (colorKey) {
    case 'info': return withOpacity(colors.info, 'medium');
    case 'success': return withOpacity(colors.success, 'medium');
    case 'warning': return withOpacity(colors.warning, 'medium');
    case 'mutedForeground': return colors.muted;
    default: return colors.muted;
  }
}

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
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="Add Note"
      subtitle={dealAddress}
      snapPoints={['85%']}
    >
      {/* Event Type Selection */}
      <BottomSheetSection title="Type">
        <View className="flex-row flex-wrap gap-2">
          {EVENT_TYPE_OPTIONS.map((option) => {
            const { IconComponent } = option;
            const iconColor = colors[option.colorKey];
            const isSelected = selectedType === option.type;

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
                <View className="p-1.5 rounded-full mr-2" style={{ backgroundColor: getIconBgColor(option.colorKey, colors) }}>
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
      </BottomSheetSection>

      {/* Description Input */}
      <BottomSheetSection title="Details">
        <TextInput
          className="rounded-lg px-4 py-3 min-h-[120px]"
          placeholder={getPlaceholder()}
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
          style={{ backgroundColor: colors.muted, color: colors.foreground }}
        />
      </BottomSheetSection>

      {/* Save Button */}
      <View className="pt-4">
        <Button
          onPress={handleSave}
          disabled={!description.trim() || isSaving}
          className="w-full"
        >
          {isSaving ? 'Saving...' : 'Save Note'}
        </Button>
      </View>
    </BottomSheet>
  );
}

export default AddDealEventSheet;

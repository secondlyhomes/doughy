// Add Activity Sheet Component - React Native
// Zone D: Bottom sheet for logging lead activities

import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
} from 'react-native';
import {
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Home,
  Check,
} from 'lucide-react-native';
import { BottomSheet, BottomSheetSection, Button } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import { ActivityType } from './LeadTimeline';

interface AddActivitySheetProps {
  visible: boolean;
  leadId: string;
  leadName: string;
  onClose: () => void;
  onSave: (activity: {
    type: ActivityType;
    description: string;
    metadata?: Record<string, unknown>;
  }) => void;
}

// Activity types configuration - icons will be colored dynamically
interface ActivityTypeConfig {
  type: ActivityType;
  label: string;
  iconComponent: typeof Phone;
  colorKey: 'info' | 'success' | 'primary' | 'warning' | 'mutedForeground';
}

const ACTIVITY_TYPE_CONFIG: ActivityTypeConfig[] = [
  { type: 'call', label: 'Phone Call', iconComponent: Phone, colorKey: 'info' },
  { type: 'email', label: 'Email', iconComponent: Mail, colorKey: 'success' },
  { type: 'text', label: 'Text Message', iconComponent: MessageSquare, colorKey: 'primary' },
  { type: 'meeting', label: 'Meeting', iconComponent: Calendar, colorKey: 'warning' },
  { type: 'note', label: 'Note', iconComponent: FileText, colorKey: 'mutedForeground' },
  { type: 'property_shown', label: 'Property Shown', iconComponent: Home, colorKey: 'info' },
];

function getActivityBgColor(colorKey: string, colors: ReturnType<typeof useThemeColors>) {
  switch (colorKey) {
    case 'info': return withOpacity(colors.info, 'medium');
    case 'success': return withOpacity(colors.success, 'medium');
    case 'primary': return withOpacity(colors.primary, 'medium');
    case 'warning': return withOpacity(colors.warning, 'medium');
    case 'mutedForeground': return colors.muted;
    default: return colors.muted;
  }
}

const DURATION_OPTIONS = ['5 min', '10 min', '15 min', '30 min', '45 min', '1 hour', '2+ hours'];

const OUTCOME_OPTIONS = [
  { value: 'positive', label: 'Positive' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'negative', label: 'Negative' },
  { value: 'no_answer', label: 'No Answer' },
  { value: 'left_voicemail', label: 'Left Voicemail' },
];

export function AddActivitySheet({
  visible,
  leadId,
  leadName,
  onClose,
  onSave,
}: AddActivitySheetProps) {
  const colors = useThemeColors();
  const [selectedType, setSelectedType] = useState<ActivityType>('call');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<string | null>(null);

  const resetForm = () => {
    setSelectedType('call');
    setDescription('');
    setDuration(null);
    setOutcome(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleSave = () => {
    if (!description.trim()) return;

    const metadata: Record<string, unknown> = {};
    if (duration) metadata.duration = duration;
    if (outcome) metadata.outcome = outcome;

    onSave({
      type: selectedType,
      description: description.trim(),
      metadata: Object.keys(metadata).length > 0 ? metadata : undefined,
    });

    resetForm();
    onClose();
  };

  const showDurationPicker = ['call', 'meeting', 'property_shown'].includes(selectedType);
  const showOutcomePicker = ['call', 'meeting'].includes(selectedType);

  return (
    <BottomSheet
      visible={visible}
      onClose={handleClose}
      title="Log Activity"
      snapPoints={['85%']}
    >
      {/* Lead Name Subtitle */}
      <View className="px-0 -mt-2 mb-2">
        <Text className="text-sm text-center" style={{ color: colors.mutedForeground }}>
          {leadName}
        </Text>
      </View>

      {/* Activity Type Selection */}
      <BottomSheetSection title="Activity Type">
        <View className="flex-row flex-wrap gap-2">
          {ACTIVITY_TYPE_CONFIG.map((activity) => {
            const IconComponent = activity.iconComponent;
            const iconColor = colors[activity.colorKey];
            const isSelected = selectedType === activity.type;
            return (
              <TouchableOpacity
                key={activity.type}
                className="flex-row items-center px-4 py-3 rounded-lg"
                style={{
                  backgroundColor: isSelected ? withOpacity(colors.primary, 'muted') : colors.muted,
                  borderWidth: isSelected ? 1 : 0,
                  borderColor: isSelected ? colors.primary : 'transparent',
                }}
                onPress={() => setSelectedType(activity.type)}
              >
                <View className="p-1.5 rounded-full mr-2" style={{ backgroundColor: getActivityBgColor(activity.colorKey, colors) }}>
                  <IconComponent size={20} color={iconColor} />
                </View>
                <Text
                  className="text-sm"
                  style={{
                    color: isSelected ? colors.primary : colors.foreground,
                    fontWeight: isSelected ? '500' : 'normal',
                  }}
                >
                  {activity.label}
                </Text>
                {isSelected && (
                  <Check size={16} color={colors.primary} className="ml-2" />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </BottomSheetSection>

      {/* Description */}
      <BottomSheetSection title="Description">
        <TextInput
          className="rounded-lg px-4 py-3 min-h-[100px]"
          style={{ backgroundColor: colors.muted, color: colors.foreground }}
          placeholder="What happened? Add details about the interaction..."
          placeholderTextColor={colors.mutedForeground}
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />
      </BottomSheetSection>

      {/* Duration Picker */}
      {showDurationPicker && (
        <BottomSheetSection title="Duration">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row gap-2">
              {DURATION_OPTIONS.map((opt) => {
                const isSelected = duration === opt;
                return (
                  <TouchableOpacity
                    key={opt}
                    className="px-4 py-2 rounded-lg"
                    style={{ backgroundColor: isSelected ? colors.primary : colors.muted }}
                    onPress={() => setDuration(isSelected ? null : opt)}
                  >
                    <Text
                      className="text-sm"
                      style={{
                        color: isSelected ? colors.primaryForeground : colors.foreground,
                        fontWeight: isSelected ? '500' : 'normal',
                      }}
                    >
                      {opt}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>
        </BottomSheetSection>
      )}

      {/* Outcome Picker */}
      {showOutcomePicker && (
        <BottomSheetSection title="Outcome">
          <View className="flex-row flex-wrap gap-2">
            {OUTCOME_OPTIONS.map((opt) => {
              const isSelected = outcome === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  className="px-4 py-2 rounded-lg"
                  style={{ backgroundColor: isSelected ? colors.primary : colors.muted }}
                  onPress={() => setOutcome(isSelected ? null : opt.value)}
                >
                  <Text
                    className="text-sm"
                    style={{
                      color: isSelected ? colors.primaryForeground : colors.foreground,
                      fontWeight: isSelected ? '500' : 'normal',
                    }}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetSection>
      )}

      {/* Save Button */}
      <View className="pt-4">
        <Button
          onPress={handleSave}
          disabled={!description.trim()}
          className="w-full"
        >
          Save Activity
        </Button>
      </View>
    </BottomSheet>
  );
}

export default AddActivitySheet;

// Add Activity Sheet Component - React Native
// Zone D: Bottom sheet for logging lead activities

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {
  X,
  Phone,
  Mail,
  MessageSquare,
  Calendar,
  FileText,
  Home,
  Check,
} from 'lucide-react-native';
import { ThemedSafeAreaView } from '@/components';
import { Button } from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';

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
  bgClass: string;
}

const ACTIVITY_TYPE_CONFIG: ActivityTypeConfig[] = [
  { type: 'call', label: 'Phone Call', iconComponent: Phone, colorKey: 'info', bgClass: 'bg-info/20' },
  { type: 'email', label: 'Email', iconComponent: Mail, colorKey: 'success', bgClass: 'bg-success/20' },
  { type: 'text', label: 'Text Message', iconComponent: MessageSquare, colorKey: 'primary', bgClass: 'bg-primary/20' },
  { type: 'meeting', label: 'Meeting', iconComponent: Calendar, colorKey: 'warning', bgClass: 'bg-warning/20' },
  { type: 'note', label: 'Note', iconComponent: FileText, colorKey: 'mutedForeground', bgClass: 'bg-muted' },
  { type: 'property_shown', label: 'Property Shown', iconComponent: Home, colorKey: 'info', bgClass: 'bg-info/20' },
];

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
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <TouchableOpacity onPress={handleClose} className="p-1">
              <X size={24} color={colors.mutedForeground} />
            </TouchableOpacity>
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold text-foreground">Log Activity</Text>
              <Text className="text-sm text-muted-foreground">{leadName}</Text>
            </View>
            <Button
              onPress={handleSave}
              disabled={!description.trim()}
              size="sm"
            >
              Save
            </Button>
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            {/* Activity Type Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Activity Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ACTIVITY_TYPE_CONFIG.map((activity) => {
                  const IconComponent = activity.iconComponent;
                  const iconColor = colors[activity.colorKey];
                  return (
                    <TouchableOpacity
                      key={activity.type}
                      className={`flex-row items-center px-4 py-3 rounded-lg ${
                        selectedType === activity.type
                          ? 'bg-primary/10 border border-primary'
                          : 'bg-muted'
                      }`}
                      onPress={() => setSelectedType(activity.type)}
                    >
                      <View className={`${activity.bgClass} p-1.5 rounded-full mr-2`}>
                        <IconComponent size={20} color={iconColor} />
                      </View>
                      <Text
                        className={`text-sm ${
                          selectedType === activity.type
                            ? 'text-primary font-medium'
                            : 'text-foreground'
                        }`}
                      >
                        {activity.label}
                      </Text>
                      {selectedType === activity.type && (
                        <Check size={16} color={colors.primary} className="ml-2" />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Description */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Description
              </Text>
              <TextInput
                className="bg-muted rounded-lg px-4 py-3 text-foreground min-h-[100px]"
                placeholder="What happened? Add details about the interaction..."
                placeholderTextColor={colors.mutedForeground}
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
              />
            </View>

            {/* Duration Picker */}
            {showDurationPicker && (
              <View className="mb-6">
                <Text className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Duration
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View className="flex-row gap-2">
                    {DURATION_OPTIONS.map((opt) => (
                      <TouchableOpacity
                        key={opt}
                        className={`px-4 py-2 rounded-lg ${
                          duration === opt
                            ? 'bg-primary'
                            : 'bg-muted'
                        }`}
                        onPress={() => setDuration(duration === opt ? null : opt)}
                      >
                        <Text
                          className={`text-sm ${
                            duration === opt
                              ? 'text-primary-foreground font-medium'
                              : 'text-foreground'
                          }`}
                        >
                          {opt}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>
            )}

            {/* Outcome Picker */}
            {showOutcomePicker && (
              <View className="mb-6">
                <Text className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                  Outcome
                </Text>
                <View className="flex-row flex-wrap gap-2">
                  {OUTCOME_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      className={`px-4 py-2 rounded-lg ${
                        outcome === opt.value
                          ? 'bg-primary'
                          : 'bg-muted'
                      }`}
                      onPress={() => setOutcome(outcome === opt.value ? null : opt.value)}
                    >
                      <Text
                        className={`text-sm ${
                          outcome === opt.value
                            ? 'text-primary-foreground font-medium'
                            : 'text-foreground'
                        }`}
                      >
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Bottom padding */}
            <View className="h-8" />
          </ScrollView>
        </KeyboardAvoidingView>
      </ThemedSafeAreaView>
    </Modal>
  );
}

export default AddActivitySheet;

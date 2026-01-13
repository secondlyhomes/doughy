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
import { SafeAreaView } from 'react-native-safe-area-context';

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

const ACTIVITY_TYPES: { type: ActivityType; label: string; icon: React.ReactNode; color: string }[] = [
  { type: 'call', label: 'Phone Call', icon: <Phone size={20} color="#3b82f6" />, color: 'bg-blue-100' },
  { type: 'email', label: 'Email', icon: <Mail size={20} color="#22c55e" />, color: 'bg-green-100' },
  { type: 'text', label: 'Text Message', icon: <MessageSquare size={20} color="#8b5cf6" />, color: 'bg-purple-100' },
  { type: 'meeting', label: 'Meeting', icon: <Calendar size={20} color="#f59e0b" />, color: 'bg-amber-100' },
  { type: 'note', label: 'Note', icon: <FileText size={20} color="#6b7280" />, color: 'bg-gray-100' },
  { type: 'property_shown', label: 'Property Shown', icon: <Home size={20} color="#06b6d4" />, color: 'bg-cyan-100' },
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
      <SafeAreaView className="flex-1 bg-background" edges={['top', 'bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
        >
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
            <TouchableOpacity onPress={handleClose} className="p-1">
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
            <View className="flex-1 items-center">
              <Text className="text-lg font-semibold text-foreground">Log Activity</Text>
              <Text className="text-sm text-muted-foreground">{leadName}</Text>
            </View>
            <TouchableOpacity
              onPress={handleSave}
              disabled={!description.trim()}
              className={`px-4 py-2 rounded-lg ${description.trim() ? 'bg-primary' : 'bg-muted'}`}
            >
              <Text className={`font-medium ${description.trim() ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                Save
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView className="flex-1 px-4 pt-4">
            {/* Activity Type Selection */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-muted-foreground mb-3 uppercase tracking-wide">
                Activity Type
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {ACTIVITY_TYPES.map((activity) => (
                  <TouchableOpacity
                    key={activity.type}
                    className={`flex-row items-center px-4 py-3 rounded-lg ${
                      selectedType === activity.type
                        ? 'bg-primary/10 border border-primary'
                        : 'bg-muted'
                    }`}
                    onPress={() => setSelectedType(activity.type)}
                  >
                    <View className={`${activity.color} p-1.5 rounded-full mr-2`}>
                      {activity.icon}
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
                      <Check size={16} color="#3b82f6" className="ml-2" />
                    )}
                  </TouchableOpacity>
                ))}
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
                placeholderTextColor="#9ca3af"
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
      </SafeAreaView>
    </Modal>
  );
}

export default AddActivitySheet;

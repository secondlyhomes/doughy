// src/features/campaigns/screens/CampaignBuilderScreen.tsx
// Campaign Builder Screen - Wizard for creating drip campaigns

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedSafeAreaView, ThemedView } from '@/components';
import {
  Input,
  Select,
  Button,
  TAB_BAR_SAFE_PADDING,
} from '@/components/ui';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  Trash2,
  MessageSquare,
  Mail,
  Phone,
  Send,
  Instagram,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

import {
  useCreateCampaign,
  useCreateCampaignStep,
  useUpdateCampaign,
} from '../hooks/useCampaigns';
import type { DripLeadType, DripChannel, MailPieceType } from '../types';
import { LEAD_TYPE_CONFIG, CHANNEL_CONFIG, MAIL_PIECE_CONFIG } from '../types';

// =============================================================================
// Types
// =============================================================================

interface StepConfig {
  id: string;
  delay_days: number;
  channel: DripChannel;
  subject?: string;
  message_body?: string;
  mail_piece_type?: MailPieceType;
  talking_points?: string[];
}

// =============================================================================
// Step Configuration Component
// =============================================================================

interface StepEditorProps {
  step: StepConfig;
  stepNumber: number;
  onUpdate: (updates: Partial<StepConfig>) => void;
  onDelete: () => void;
  isFirst: boolean;
}

function StepEditor({ step, stepNumber, onUpdate, onDelete, isFirst }: StepEditorProps) {
  const colors = useThemeColors();
  const channelConfig = CHANNEL_CONFIG[step.channel];

  const getChannelIcon = (channel: DripChannel) => {
    switch (channel) {
      case 'sms':
        return MessageSquare;
      case 'email':
        return Mail;
      case 'phone_reminder':
        return Phone;
      case 'direct_mail':
        return Send;
      case 'meta_dm':
        return Instagram;
      default:
        return MessageSquare;
    }
  };

  const ChannelIcon = getChannelIcon(step.channel);

  return (
    <View
      className="rounded-xl p-4 mb-3"
      style={{ backgroundColor: colors.card, borderLeftWidth: 4, borderLeftColor: channelConfig.color }}
    >
      {/* Step Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View
            className="w-8 h-8 rounded-full items-center justify-center mr-2"
            style={{ backgroundColor: withOpacity(channelConfig.color, 'light') }}
          >
            <ChannelIcon size={16} color={channelConfig.color} />
          </View>
          <Text className="font-semibold" style={{ color: colors.foreground }}>
            Step {stepNumber}
          </Text>
        </View>
        {!isFirst && (
          <TouchableOpacity onPress={onDelete} className="p-2">
            <Trash2 size={18} color={colors.destructive} />
          </TouchableOpacity>
        )}
      </View>

      {/* Delay */}
      <View className="flex-row items-center mb-3">
        <Text className="text-sm mr-2" style={{ color: colors.mutedForeground }}>
          Send after
        </Text>
        <View className="flex-1 max-w-20">
          <Input
            value={step.delay_days.toString()}
            onChangeText={(text) => onUpdate({ delay_days: parseInt(text) || 0 })}
            keyboardType="numeric"
            style={{ textAlign: 'center' }}
          />
        </View>
        <Text className="text-sm ml-2" style={{ color: colors.mutedForeground }}>
          day{step.delay_days !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Channel Select */}
      <Select
        label="Channel"
        value={step.channel}
        onValueChange={(val) => onUpdate({ channel: val as DripChannel })}
        options={[
          { label: 'SMS Text', value: 'sms' },
          { label: 'Email', value: 'email' },
          { label: 'Direct Mail', value: 'direct_mail' },
          { label: 'Facebook/Instagram', value: 'meta_dm' },
          { label: 'Call Reminder', value: 'phone_reminder' },
        ]}
        className="mb-3"
      />

      {/* Channel-specific fields */}
      {(step.channel === 'sms' || step.channel === 'meta_dm') && (
        <Input
          label="Message"
          value={step.message_body || ''}
          onChangeText={(text) => onUpdate({ message_body: text })}
          placeholder="Hi {first_name}, I wanted to follow up about..."
          multiline
          numberOfLines={3}
          style={{ minHeight: 80, textAlignVertical: 'top' }}
        />
      )}

      {step.channel === 'email' && (
        <>
          <Input
            label="Subject"
            value={step.subject || ''}
            onChangeText={(text) => onUpdate({ subject: text })}
            placeholder="Following up about your property"
            className="mb-2"
          />
          <Input
            label="Body"
            value={step.message_body || ''}
            onChangeText={(text) => onUpdate({ message_body: text })}
            placeholder="Hi {first_name},\n\nI wanted to reach out about..."
            multiline
            numberOfLines={5}
            style={{ minHeight: 120, textAlignVertical: 'top' }}
          />
        </>
      )}

      {step.channel === 'direct_mail' && (
        <>
          <Select
            label="Mail Piece Type"
            value={step.mail_piece_type || 'postcard_4x6'}
            onValueChange={(val) => onUpdate({ mail_piece_type: val as MailPieceType })}
            options={Object.entries(MAIL_PIECE_CONFIG).map(([key, config]) => ({
              label: `${config.label} ($${config.price.toFixed(2)})`,
              value: key,
            }))}
            className="mb-2"
          />
          <Input
            label="Message"
            value={step.message_body || ''}
            onChangeText={(text) => onUpdate({ message_body: text })}
            placeholder="We'd like to make you a cash offer on your property at {property_address}..."
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />
        </>
      )}

      {step.channel === 'phone_reminder' && (
        <Input
          label="Talking Points"
          value={step.message_body || ''}
          onChangeText={(text) => onUpdate({ message_body: text })}
          placeholder="- Check if they received your mail\n- Ask about their timeline\n- Discuss their concerns"
          multiline
          numberOfLines={4}
          style={{ minHeight: 100, textAlignVertical: 'top' }}
        />
      )}
    </View>
  );
}

// =============================================================================
// Main Screen
// =============================================================================

export function CampaignBuilderScreen() {
  const router = useRouter();
  const colors = useThemeColors();

  const createCampaign = useCreateCampaign();
  const createStep = useCreateCampaignStep();
  const updateCampaign = useUpdateCampaign();

  // Wizard step
  const [wizardStep, setWizardStep] = useState(1);

  // Campaign basics
  const [name, setName] = useState('');
  const [leadType, setLeadType] = useState<DripLeadType>('general');
  const [targetMotivation, setTargetMotivation] = useState<'hot' | 'warm' | 'cold' | 'not_motivated'>('warm');

  // Settings
  const [quietHoursStart, setQuietHoursStart] = useState('21:00');
  const [quietHoursEnd, setQuietHoursEnd] = useState('09:00');
  const [respectWeekends, setRespectWeekends] = useState(true);

  // Steps
  const [steps, setSteps] = useState<StepConfig[]>([
    { id: '1', delay_days: 0, channel: 'sms', message_body: '' },
    { id: '2', delay_days: 3, channel: 'email', subject: '', message_body: '' },
    { id: '3', delay_days: 7, channel: 'sms', message_body: '' },
  ]);

  // Initialize steps from lead type
  const handleLeadTypeChange = useCallback((type: DripLeadType) => {
    setLeadType(type);
    const config = LEAD_TYPE_CONFIG[type];
    if (config) {
      // Create steps from default cadence
      const newSteps: StepConfig[] = config.defaultCadence.map((delay, index) => ({
        id: `${index + 1}`,
        delay_days: delay,
        channel: index % 2 === 0 ? 'sms' : 'email' as DripChannel,
        message_body: '',
      }));
      setSteps(newSteps);
    }
  }, []);

  const handleAddStep = useCallback(() => {
    const lastStep = steps[steps.length - 1];
    const newStep: StepConfig = {
      id: `${Date.now()}`,
      delay_days: (lastStep?.delay_days || 0) + 7,
      channel: 'sms',
      message_body: '',
    };
    setSteps([...steps, newStep]);
  }, [steps]);

  const handleUpdateStep = useCallback((index: number, updates: Partial<StepConfig>) => {
    setSteps((current) => {
      const updated = [...current];
      updated[index] = { ...updated[index], ...updates };
      return updated;
    });
  }, []);

  const handleDeleteStep = useCallback((index: number) => {
    setSteps((current) => current.filter((_, i) => i !== index));
  }, []);

  const handleSave = useCallback(async (activate = false) => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter a campaign name');
      return;
    }

    if (steps.length === 0) {
      Alert.alert('Error', 'Please add at least one step');
      return;
    }

    try {
      // Create campaign
      const campaign = await createCampaign.mutateAsync({
        name: name.trim(),
        campaign_type: 'drip',
        lead_type: leadType,
        target_motivation: targetMotivation,
        is_drip_campaign: true,
        quiet_hours_start: quietHoursStart,
        quiet_hours_end: quietHoursEnd,
        respect_weekends: respectWeekends,
      });

      // Create steps
      for (let i = 0; i < steps.length; i++) {
        const step = steps[i];
        await createStep.mutateAsync({
          campaign_id: campaign.id,
          step_number: i + 1,
          delay_days: step.delay_days,
          channel: step.channel,
          subject: step.subject,
          message_body: step.message_body,
          mail_piece_type: step.mail_piece_type,
        });
      }

      // Activate if requested
      if (activate) {
        await updateCampaign.mutateAsync({
          id: campaign.id,
          status: 'active',
        });
      }

      // Navigate to campaign detail
      router.replace(`/(tabs)/campaigns/${campaign.id}`);

    } catch (error) {
      console.error('Error creating campaign:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      Alert.alert('Create Failed', `Could not create campaign: ${errorMessage}`);
    }
  }, [name, leadType, targetMotivation, quietHoursStart, quietHoursEnd, respectWeekends, steps, createCampaign, createStep, updateCampaign, router]);

  const isLoading = createCampaign.isPending || createStep.isPending || updateCampaign.isPending;

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3 border-b" style={{ borderBottomColor: colors.border }}>
          <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
            <ArrowLeft size={24} color={colors.foreground} />
          </TouchableOpacity>
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
            {wizardStep === 1 ? 'Campaign Basics' : wizardStep === 2 ? 'Configure Steps' : 'Review & Launch'}
          </Text>
          <View className="w-10" />
        </View>

        {/* Progress indicator */}
        <View className="flex-row px-4 py-3 gap-2">
          {[1, 2, 3].map((step) => (
            <View
              key={step}
              className="flex-1 h-1 rounded-full"
              style={{
                backgroundColor: step <= wizardStep ? colors.primary : colors.muted,
              }}
            />
          ))}
        </View>

        <ScrollView
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step 1: Basics */}
          {wizardStep === 1 && (
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: colors.foreground }}>
                Campaign Details
              </Text>

              <Input
                label="Campaign Name"
                value={name}
                onChangeText={setName}
                placeholder="e.g., Foreclosure Follow-up"
                className="mb-4"
              />

              <Select
                label="Lead Type"
                value={leadType}
                onValueChange={(val) => handleLeadTypeChange(val as DripLeadType)}
                options={Object.entries(LEAD_TYPE_CONFIG).map(([key, config]) => ({
                  label: config.label,
                  value: key,
                }))}
                className="mb-2"
              />

              {leadType && (
                <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
                  {LEAD_TYPE_CONFIG[leadType].description}
                </Text>
              )}

              <Select
                label="Target Motivation Level"
                value={targetMotivation}
                onValueChange={(val) => setTargetMotivation(val as typeof targetMotivation)}
                options={[
                  { label: 'Hot (80+ score)', value: 'hot' },
                  { label: 'Warm (60-79 score)', value: 'warm' },
                  { label: 'Cold (40-59 score)', value: 'cold' },
                  { label: 'Not Motivated (<40)', value: 'not_motivated' },
                ]}
                className="mb-4"
              />

              <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>
                Quiet Hours
              </Text>

              <View className="flex-row gap-3 mb-4">
                <View className="flex-1">
                  <Input
                    label="Start"
                    value={quietHoursStart}
                    onChangeText={setQuietHoursStart}
                    placeholder="21:00"
                  />
                </View>
                <View className="flex-1">
                  <Input
                    label="End"
                    value={quietHoursEnd}
                    onChangeText={setQuietHoursEnd}
                    placeholder="09:00"
                  />
                </View>
              </View>

              <TouchableOpacity
                className="flex-row items-center justify-between py-3 mb-6"
                onPress={() => setRespectWeekends(!respectWeekends)}
              >
                <Text style={{ color: colors.foreground }}>Skip weekends</Text>
                <View
                  className="w-12 h-6 rounded-full justify-center px-1"
                  style={{ backgroundColor: respectWeekends ? colors.primary : colors.muted }}
                >
                  <View
                    className="w-4 h-4 rounded-full bg-white"
                    style={{
                      alignSelf: respectWeekends ? 'flex-end' : 'flex-start',
                    }}
                  />
                </View>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: Configure Steps */}
          {wizardStep === 2 && (
            <View>
              <Text className="text-xl font-bold mb-2" style={{ color: colors.foreground }}>
                Campaign Sequence
              </Text>
              <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
                Configure each touch in your campaign. Drag to reorder.
              </Text>

              {steps.map((step, index) => (
                <StepEditor
                  key={step.id}
                  step={step}
                  stepNumber={index + 1}
                  onUpdate={(updates) => handleUpdateStep(index, updates)}
                  onDelete={() => handleDeleteStep(index)}
                  isFirst={index === 0 && steps.length === 1}
                />
              ))}

              <TouchableOpacity
                className="flex-row items-center justify-center py-4 rounded-xl border border-dashed mb-4"
                style={{ borderColor: colors.border }}
                onPress={handleAddStep}
              >
                <Plus size={20} color={colors.primary} />
                <Text className="ml-2 font-medium" style={{ color: colors.primary }}>
                  Add Step
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Step 3: Review */}
          {wizardStep === 3 && (
            <View>
              <Text className="text-xl font-bold mb-4" style={{ color: colors.foreground }}>
                Review Campaign
              </Text>

              {/* Summary Card */}
              <View className="rounded-xl p-4 mb-4" style={{ backgroundColor: colors.card }}>
                <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
                  {name || 'Untitled Campaign'}
                </Text>

                <View className="flex-row items-center mb-2">
                  <Text style={{ color: colors.mutedForeground }}>Lead Type: </Text>
                  <Text style={{ color: colors.foreground }}>
                    {LEAD_TYPE_CONFIG[leadType].label}
                  </Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <Text style={{ color: colors.mutedForeground }}>Target: </Text>
                  <Text className="capitalize" style={{ color: colors.foreground }}>
                    {targetMotivation.replace('_', ' ')} leads
                  </Text>
                </View>

                <View className="flex-row items-center mb-2">
                  <Text style={{ color: colors.mutedForeground }}>Quiet Hours: </Text>
                  <Text style={{ color: colors.foreground }}>
                    {quietHoursStart} - {quietHoursEnd}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <Text style={{ color: colors.mutedForeground }}>Steps: </Text>
                  <Text style={{ color: colors.foreground }}>
                    {steps.length} touches over {steps[steps.length - 1]?.delay_days || 0} days
                  </Text>
                </View>
              </View>

              {/* Steps Preview */}
              <Text className="text-lg font-semibold mb-3" style={{ color: colors.foreground }}>
                Sequence
              </Text>

              {steps.map((step, index) => {
                const channelConfig = CHANNEL_CONFIG[step.channel];
                const ChannelIcon = step.channel === 'sms' ? MessageSquare
                  : step.channel === 'email' ? Mail
                  : step.channel === 'phone_reminder' ? Phone
                  : step.channel === 'direct_mail' ? Send
                  : Instagram;

                return (
                  <View
                    key={step.id}
                    className="flex-row items-center p-3 rounded-lg mb-2"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <View
                      className="w-8 h-8 rounded-full items-center justify-center mr-3"
                      style={{ backgroundColor: withOpacity(channelConfig.color, 'light') }}
                    >
                      <ChannelIcon size={16} color={channelConfig.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="font-medium" style={{ color: colors.foreground }}>
                        Day {step.delay_days}: {channelConfig.label}
                      </Text>
                      {step.message_body && (
                        <Text
                          className="text-sm"
                          style={{ color: colors.mutedForeground }}
                          numberOfLines={1}
                        >
                          {step.message_body}
                        </Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </ScrollView>

        {/* Footer Buttons */}
        <View className="flex-row gap-3 px-4 py-4 border-t" style={{ borderTopColor: colors.border }}>
          {wizardStep > 1 && (
            <Button
              variant="outline"
              onPress={() => setWizardStep(wizardStep - 1)}
              className="flex-1"
            >
              <ArrowLeft size={18} color={colors.foreground} />
              <Text className="ml-2">Back</Text>
            </Button>
          )}

          {wizardStep < 3 ? (
            <Button
              onPress={() => setWizardStep(wizardStep + 1)}
              className="flex-1"
              disabled={wizardStep === 1 && !name.trim()}
            >
              <Text>Next</Text>
              <ArrowRight size={18} color={colors.primaryForeground} />
            </Button>
          ) : (
            <View className="flex-1 flex-row gap-2">
              <Button
                variant="outline"
                onPress={() => handleSave(false)}
                className="flex-1"
                disabled={isLoading}
              >
                Save Draft
              </Button>
              <Button
                onPress={() => handleSave(true)}
                className="flex-1"
                disabled={isLoading}
              >
                <Check size={18} color={colors.primaryForeground} />
                <Text className="ml-2">Activate</Text>
              </Button>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

export default CampaignBuilderScreen;

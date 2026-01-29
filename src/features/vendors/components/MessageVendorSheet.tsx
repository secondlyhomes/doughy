// src/features/vendors/components/MessageVendorSheet.tsx
// Bottom sheet for composing and sending messages to vendors (with AI assistance)

import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { Send, Sparkles, Phone, Mail, MessageSquare, RefreshCw } from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
  Input,
  Select,
  FormField,
  LoadingSpinner,
} from '@/components/ui';
import { SPACING, FONT_SIZES, BORDER_RADIUS } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import { Vendor } from '../types';

export interface MessageVendorSheetProps {
  visible: boolean;
  onClose: () => void;
  vendor: Vendor | null;
  /** Context for AI to compose message */
  context?: {
    type: 'maintenance' | 'turnover' | 'general';
    propertyAddress?: string;
    issueTitle?: string;
    issueDescription?: string;
    scheduledDate?: string;
    urgency?: 'emergency' | 'urgent' | 'normal';
  };
  onSend?: (message: {
    channel: 'sms' | 'email' | 'phone';
    subject?: string;
    body: string;
    aiComposed: boolean;
  }) => Promise<void>;
}

export function MessageVendorSheet({
  visible,
  onClose,
  vendor,
  context,
  onSend,
}: MessageVendorSheetProps) {
  const colors = useThemeColors();

  const [channel, setChannel] = useState<'sms' | 'email' | 'phone'>('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [aiComposed, setAiComposed] = useState(false);

  // Reset form when vendor changes
  useEffect(() => {
    if (vendor) {
      setChannel(vendor.preferred_contact_method || 'sms');
      setSubject('');
      setBody('');
      setAiComposed(false);
    }
  }, [vendor]);

  // Generate AI message
  const handleGenerateMessage = useCallback(async () => {
    if (!vendor || !context) return;

    setIsGenerating(true);

    // Simulate AI generation (in production, this would call an edge function)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    let generatedSubject = '';
    let generatedBody = '';

    if (context.type === 'maintenance') {
      generatedSubject = `Service Request: ${context.issueTitle || 'Repair Needed'}`;
      generatedBody = `Hi ${vendor.name},

I have a ${context.urgency === 'emergency' ? 'urgent ' : ''}repair needed at ${context.propertyAddress || 'my property'}.

Issue: ${context.issueTitle || 'Repair needed'}
${context.issueDescription ? `\nDetails: ${context.issueDescription}` : ''}

${context.urgency === 'emergency' ? 'This is an emergency situation. ' : ''}Could you please let me know your earliest availability?

Thank you,
Property Manager`;
    } else if (context.type === 'turnover') {
      generatedSubject = `Cleaning Request: ${context.propertyAddress || 'Property'}`;
      generatedBody = `Hi ${vendor.name},

I need to schedule a turnover cleaning at ${context.propertyAddress || 'my property'}.

${context.scheduledDate ? `Requested date: ${context.scheduledDate}` : 'Please let me know your earliest availability.'}

The property will be vacant and ready for cleaning. Please confirm if this time works for you.

Thank you,
Property Manager`;
    } else {
      generatedBody = `Hi ${vendor.name},

I wanted to reach out regarding services at ${context.propertyAddress || 'my property'}.

Please let me know your availability.

Thank you,
Property Manager`;
    }

    setSubject(generatedSubject);
    setBody(generatedBody);
    setAiComposed(true);
    setIsGenerating(false);
  }, [vendor, context]);

  // Handle send
  const handleSend = useCallback(async () => {
    if (!body.trim()) {
      Alert.alert('Required', 'Please enter a message');
      return;
    }

    if (channel === 'email' && !subject.trim()) {
      Alert.alert('Required', 'Please enter a subject for the email');
      return;
    }

    setIsSending(true);

    try {
      if (onSend) {
        await onSend({
          channel,
          subject: channel === 'email' ? subject : undefined,
          body: body.trim(),
          aiComposed,
        });
      }
      onClose();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send message'
      );
    } finally {
      setIsSending(false);
    }
  }, [channel, subject, body, aiComposed, onSend, onClose]);

  if (!vendor) return null;

  // Channel options
  const channelOptions = [
    { value: 'sms', label: 'Text/SMS', icon: MessageSquare, disabled: !vendor.phone },
    { value: 'email', label: 'Email', icon: Mail, disabled: !vendor.email },
    { value: 'phone', label: 'Phone (Script)', icon: Phone, disabled: !vendor.phone },
  ];

  const availableChannels = channelOptions.filter((c) => !c.disabled);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`Message ${vendor.name}`}
      height="90%"
    >
      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* AI Compose Button */}
        {context && (
          <View className="px-4 mb-4">
            <TouchableOpacity
              onPress={handleGenerateMessage}
              disabled={isGenerating}
              style={[
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: SPACING.md,
                  paddingHorizontal: SPACING.lg,
                  borderRadius: BORDER_RADIUS.lg,
                  backgroundColor: withOpacity(colors.primary, 'light'),
                  gap: SPACING.sm,
                },
              ]}
              activeOpacity={0.7}
            >
              {isGenerating ? (
                <LoadingSpinner size="small" />
              ) : (
                <Sparkles size={20} color={colors.primary} />
              )}
              <Text
                style={{
                  color: colors.primary,
                  fontSize: FONT_SIZES.base,
                  fontWeight: '600',
                }}
              >
                {isGenerating ? 'Composing...' : 'AI Compose Message'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Channel Selection */}
        <BottomSheetSection title="Send Via">
          <View className="flex-row gap-2">
            {availableChannels.map((option) => {
              const Icon = option.icon;
              const isSelected = channel === option.value;

              return (
                <TouchableOpacity
                  key={option.value}
                  onPress={() => setChannel(option.value as 'sms' | 'email' | 'phone')}
                  style={[
                    {
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingVertical: SPACING.md,
                      borderRadius: BORDER_RADIUS.md,
                      backgroundColor: isSelected
                        ? withOpacity(colors.primary, 'light')
                        : colors.muted,
                      borderWidth: isSelected ? 1 : 0,
                      borderColor: colors.primary,
                      gap: SPACING.xs,
                    },
                  ]}
                  activeOpacity={0.7}
                >
                  <Icon
                    size={18}
                    color={isSelected ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={{
                      color: isSelected ? colors.primary : colors.mutedForeground,
                      fontSize: FONT_SIZES.sm,
                      fontWeight: isSelected ? '600' : '400',
                    }}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </BottomSheetSection>

        {/* Message Content */}
        <BottomSheetSection title="Message">
          {channel === 'email' && (
            <FormField label="Subject" required className="mb-3">
              <Input
                value={subject}
                onChangeText={(text) => {
                  setSubject(text);
                  setAiComposed(false);
                }}
                placeholder="Enter subject..."
              />
            </FormField>
          )}

          <FormField label={channel === 'phone' ? 'Call Script' : 'Message'} required>
            <Input
              value={body}
              onChangeText={(text) => {
                setBody(text);
                setAiComposed(false);
              }}
              placeholder={
                channel === 'phone'
                  ? 'Script to read during call...'
                  : 'Type your message...'
              }
              multiline
              numberOfLines={8}
              style={{ minHeight: 180 }}
            />
          </FormField>

          {aiComposed && (
            <View
              className="flex-row items-center mt-2 px-2"
              style={{ opacity: 0.7 }}
            >
              <Sparkles size={12} color={colors.primary} />
              <Text
                style={{
                  color: colors.primary,
                  fontSize: FONT_SIZES.xs,
                  marginLeft: 4,
                }}
              >
                AI composed - feel free to edit
              </Text>
            </View>
          )}
        </BottomSheetSection>

        {/* Vendor Contact Info */}
        <BottomSheetSection title="Sending To">
          <View
            className="p-3 rounded-lg"
            style={{ backgroundColor: colors.muted }}
          >
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
                fontWeight: '500',
              }}
            >
              {vendor.name}
              {vendor.company_name && ` (${vendor.company_name})`}
            </Text>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.sm,
                marginTop: 4,
              }}
            >
              {channel === 'email'
                ? vendor.email
                : vendor.phone}
            </Text>
          </View>
        </BottomSheetSection>
      </ScrollView>

      {/* Footer Actions */}
      <View
        className="flex-row gap-3 pt-4 pb-6 px-4"
        style={{ borderTopWidth: 1, borderTopColor: colors.border }}
      >
        <Button
          variant="outline"
          onPress={onClose}
          className="flex-1"
          disabled={isSending}
        >
          Cancel
        </Button>
        <Button
          onPress={handleSend}
          className="flex-1 flex-row items-center justify-center gap-2"
          disabled={isSending || !body.trim()}
        >
          {isSending ? (
            <LoadingSpinner size="small" color="white" />
          ) : (
            <Send size={18} color="white" />
          )}
          <Text style={{ color: 'white', fontWeight: '600' }}>
            {isSending ? 'Sending...' : 'Send'}
          </Text>
        </Button>
      </View>
    </BottomSheet>
  );
}

export default MessageVendorSheet;

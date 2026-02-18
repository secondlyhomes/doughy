// src/features/guest-communication/components/GuestMessageSheet.tsx
// Bottom sheet for composing and sending messages to guests

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Alert, TouchableOpacity } from 'react-native';
import { Send, Mail, MessageSquare, FileText, ChevronDown } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
  Input,
  FormField,
  LoadingSpinner,
  Badge,
} from '@/components/ui';
import { SPACING, FONT_SIZES, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { withOpacity } from '@/lib/design-utils';
import {
  GuestMessageTemplate,
  MessageChannel,
  MessageContext,
  TEMPLATE_TYPE_CONFIG,
} from '../types';
import { useGuestTemplates, useMessageMutations } from '../hooks/useGuestCommunication';
import { renderTemplate, buildVariablesFromContext } from '../services/templateService';

export interface GuestMessageSheetProps {
  visible: boolean;
  onClose: () => void;
  bookingId: string;
  contactId: string;
  /** Contact info for sending */
  contact: {
    first_name?: string | null;
    last_name?: string | null;
    phone?: string | null;
    email?: string | null;
  };
  /** Context for variable substitution */
  context: MessageContext;
  /** Property ID for filtering templates */
  propertyId?: string;
  onSend?: () => void;
}

export function GuestMessageSheet({
  visible,
  onClose,
  bookingId,
  contactId,
  contact,
  context,
  propertyId,
  onSend,
}: GuestMessageSheetProps) {
  const colors = useThemeColors();

  const [selectedTemplate, setSelectedTemplate] = useState<GuestMessageTemplate | null>(null);
  const [channel, setChannel] = useState<MessageChannel>('sms');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [showTemplateList, setShowTemplateList] = useState(true);

  const { data: templates = [], isLoading: isLoadingTemplates } = useGuestTemplates(propertyId);
  const { sendMessage, isSending } = useMessageMutations();

  // Filter active templates
  const activeTemplates = useMemo(
    () => templates.filter((t) => t.is_active),
    [templates]
  );

  // Set default channel based on available contact info
  useEffect(() => {
    if (visible) {
      if (contact.phone) {
        setChannel('sms');
      } else if (contact.email) {
        setChannel('email');
      }
    }
  }, [visible, contact]);

  // Apply template when selected
  const handleSelectTemplate = useCallback(
    (template: GuestMessageTemplate) => {
      setSelectedTemplate(template);
      setChannel(template.channel);

      // Render template with context
      const renderedSubject = template.subject
        ? renderTemplate(template.subject, context)
        : '';
      const renderedBody = renderTemplate(template.body, context);

      setSubject(renderedSubject);
      setBody(renderedBody);
      setShowTemplateList(false);
    },
    [context]
  );

  // Reset form
  const handleReset = useCallback(() => {
    setSelectedTemplate(null);
    setSubject('');
    setBody('');
    setShowTemplateList(true);
  }, []);

  // Send message
  const handleSend = useCallback(async () => {
    if (!body.trim()) {
      Alert.alert('Required', 'Please enter a message');
      return;
    }

    if (channel === 'email' && !subject.trim()) {
      Alert.alert('Required', 'Please enter a subject for the email');
      return;
    }

    if (channel === 'sms' && !contact.phone) {
      Alert.alert('Error', 'No phone number available for this guest');
      return;
    }

    if (channel === 'email' && !contact.email) {
      Alert.alert('Error', 'No email address available for this guest');
      return;
    }

    try {
      await sendMessage({
        booking_id: bookingId,
        contact_id: contactId,
        template_id: selectedTemplate?.id,
        channel,
        subject: channel === 'email' ? subject : undefined,
        body: body.trim(),
        variables: buildVariablesFromContext(context),
      });

      Alert.alert('Success', 'Message sent successfully');
      onSend?.();
      onClose();
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to send message'
      );
    }
  }, [
    body,
    subject,
    channel,
    contact,
    bookingId,
    contactId,
    selectedTemplate,
    context,
    sendMessage,
    onSend,
    onClose,
  ]);

  const guestName = contact.first_name
    ? `${contact.first_name} ${contact.last_name || ''}`.trim()
    : 'Guest';

  const canSendSMS = !!contact.phone;
  const canSendEmail = !!contact.email;

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`Message ${guestName}`}
      snapPoints={['90%']}
      useGlass={false}
      useGlassBackdrop={false}
    >
      {/* Template Selection */}
        {showTemplateList ? (
          <BottomSheetSection title="Select Template">
            {isLoadingTemplates ? (
              <LoadingSpinner size="small" />
            ) : activeTemplates.length === 0 ? (
              <View
                className="py-6 items-center rounded-xl"
                style={{ backgroundColor: colors.muted }}
              >
                <FileText size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: FONT_SIZES.sm,
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  No templates yet.{'\n'}Create templates in Settings.
                </Text>
              </View>
            ) : (
              <View className="gap-2">
                {activeTemplates.map((template) => {
                  const config = TEMPLATE_TYPE_CONFIG[template.type];
                  return (
                    <TouchableOpacity
                      key={template.id}
                      onPress={() => handleSelectTemplate(template)}
                      className="p-3 rounded-xl flex-row items-center"
                      style={{ backgroundColor: colors.muted }}
                      activeOpacity={PRESS_OPACITY.DEFAULT}
                    >
                      <View
                        className="w-10 h-10 rounded-full items-center justify-center mr-3"
                        style={{ backgroundColor: colors.card }}
                      >
                        <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
                      </View>
                      <View className="flex-1">
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: FONT_SIZES.base,
                            fontWeight: '500',
                          }}
                        >
                          {template.name}
                        </Text>
                        <Text
                          style={{
                            color: colors.mutedForeground,
                            fontSize: FONT_SIZES.xs,
                          }}
                          numberOfLines={1}
                        >
                          {config.label} • {template.channel.toUpperCase()}
                        </Text>
                      </View>
                      <Badge
                        variant={template.channel === 'sms' ? 'default' : 'secondary'}
                        size="sm"
                      >
                        {template.channel === 'sms' ? (
                          <MessageSquare size={ICON_SIZES.xs} color={colors.primaryForeground} />
                        ) : (
                          <Mail size={ICON_SIZES.xs} color={colors.foreground} />
                        )}
                      </Badge>
                    </TouchableOpacity>
                  );
                })}

                {/* Custom message option */}
                <TouchableOpacity
                  onPress={() => setShowTemplateList(false)}
                  className="p-3 rounded-xl flex-row items-center"
                  style={{
                    backgroundColor: colors.muted,
                    borderWidth: 1,
                    borderColor: colors.border,
                    borderStyle: 'dashed',
                  }}
                  activeOpacity={PRESS_OPACITY.DEFAULT}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: colors.card }}
                  >
                    <Send size={ICON_SIZES.ml} color={colors.primary} />
                  </View>
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: FONT_SIZES.base,
                      fontWeight: '500',
                    }}
                  >
                    Write Custom Message
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </BottomSheetSection>
        ) : (
          <>
            {/* Selected template indicator */}
            {selectedTemplate && (
              <View className="px-4 mb-4">
                <TouchableOpacity
                  onPress={handleReset}
                  className="flex-row items-center justify-between p-3 rounded-lg"
                  style={{ backgroundColor: withOpacity(colors.primary, 'light') }}
                  activeOpacity={PRESS_OPACITY.DEFAULT}
                >
                  <View className="flex-row items-center gap-2">
                    <Text style={{ fontSize: 16 }}>
                      {TEMPLATE_TYPE_CONFIG[selectedTemplate.type].emoji}
                    </Text>
                    <Text
                      style={{
                        color: colors.primary,
                        fontSize: FONT_SIZES.sm,
                        fontWeight: '500',
                      }}
                    >
                      {selectedTemplate.name}
                    </Text>
                  </View>
                  <Text
                    style={{
                      color: colors.primary,
                      fontSize: FONT_SIZES.xs,
                    }}
                  >
                    Change
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Channel Selection */}
            <BottomSheetSection title="Send Via">
              <View className="flex-row gap-2">
                <TouchableOpacity
                  onPress={() => setChannel('sms')}
                  disabled={!canSendSMS}
                  className="flex-1 flex-row items-center justify-center p-3 rounded-xl gap-2"
                  style={{
                    backgroundColor:
                      channel === 'sms'
                        ? withOpacity(colors.primary, 'light')
                        : colors.muted,
                    borderWidth: channel === 'sms' ? 1 : 0,
                    borderColor: colors.primary,
                    opacity: canSendSMS ? 1 : 0.5,
                  }}
                  activeOpacity={PRESS_OPACITY.DEFAULT}
                >
                  <MessageSquare
                    size={ICON_SIZES.ml}
                    color={channel === 'sms' ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={{
                      color: channel === 'sms' ? colors.primary : colors.mutedForeground,
                      fontSize: FONT_SIZES.sm,
                      fontWeight: channel === 'sms' ? '600' : '400',
                    }}
                  >
                    SMS
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setChannel('email')}
                  disabled={!canSendEmail}
                  className="flex-1 flex-row items-center justify-center p-3 rounded-xl gap-2"
                  style={{
                    backgroundColor:
                      channel === 'email'
                        ? withOpacity(colors.primary, 'light')
                        : colors.muted,
                    borderWidth: channel === 'email' ? 1 : 0,
                    borderColor: colors.primary,
                    opacity: canSendEmail ? 1 : 0.5,
                  }}
                  activeOpacity={PRESS_OPACITY.DEFAULT}
                >
                  <Mail
                    size={ICON_SIZES.ml}
                    color={channel === 'email' ? colors.primary : colors.mutedForeground}
                  />
                  <Text
                    style={{
                      color: channel === 'email' ? colors.primary : colors.mutedForeground,
                      fontSize: FONT_SIZES.sm,
                      fontWeight: channel === 'email' ? '600' : '400',
                    }}
                  >
                    Email
                  </Text>
                </TouchableOpacity>
              </View>
            </BottomSheetSection>

            {/* Message Content */}
            <BottomSheetSection title="Message">
              {channel === 'email' && (
                <FormField label="Subject" required className="mb-3">
                  <Input
                    value={subject}
                    onChangeText={setSubject}
                    placeholder="Enter subject..."
                  />
                </FormField>
              )}

              <FormField label="Message" required>
                <Input
                  value={body}
                  onChangeText={setBody}
                  placeholder="Type your message..."
                  multiline
                  numberOfLines={10}
                  style={{ minHeight: 200 }}
                />
              </FormField>
            </BottomSheetSection>

          {/* Recipient Info */}
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
                {guestName}
              </Text>
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: FONT_SIZES.sm,
                  marginTop: 4,
                }}
              >
                {channel === 'sms' ? contact.phone : contact.email}
              </Text>
            </View>
          </BottomSheetSection>
        </>
      )}

      {/* Footer Actions */}
      {!showTemplateList && (
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
              <Send size={ICON_SIZES.ml} color="white" />
            )}
            <Text style={{ color: 'white', fontWeight: '600' }}>
              {isSending ? 'Sending...' : 'Send'}
            </Text>
          </Button>
        </View>
      )}
    </BottomSheet>
  );
}

export default GuestMessageSheet;

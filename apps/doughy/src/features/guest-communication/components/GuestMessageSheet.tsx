// src/features/guest-communication/components/GuestMessageSheet.tsx
// Bottom sheet for composing and sending messages to guests

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Alert } from 'react-native';
import { Send } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheet,
  BottomSheetSection,
  Button,
  Input,
  FormField,
  LoadingSpinner,
} from '@/components/ui';
import { ICON_SIZES } from '@/constants/design-tokens';
import {
  GuestMessageTemplate,
  MessageChannel,
} from '../types';
import { useGuestTemplates, useMessageMutations } from '../hooks/useGuestCommunication';
import { renderTemplate, buildVariablesFromContext } from '../services/templateService';
import { TemplateListView } from './TemplateListView';
import { ChannelPicker } from './ChannelPicker';
import { SelectedTemplateBanner } from './SelectedTemplateBanner';
import { RecipientInfo } from './RecipientInfo';
import type { GuestMessageSheetProps } from './guest-message-types';

export type { GuestMessageSheetProps } from './guest-message-types';

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
          <TemplateListView
            isLoading={isLoadingTemplates}
            templates={activeTemplates}
            onSelectTemplate={handleSelectTemplate}
            onWriteCustom={() => setShowTemplateList(false)}
          />
        ) : (
          <>
            {/* Selected template indicator */}
            {selectedTemplate && (
              <SelectedTemplateBanner
                template={selectedTemplate}
                onReset={handleReset}
              />
            )}

            {/* Channel Selection */}
            <ChannelPicker
              channel={channel}
              onChangeChannel={setChannel}
              canSendSMS={canSendSMS}
              canSendEmail={canSendEmail}
            />

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
          <RecipientInfo
            guestName={guestName}
            channel={channel}
            phone={contact.phone}
            email={contact.email}
          />
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

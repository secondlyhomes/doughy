// src/features/vendors/components/MessageVendorSheet.tsx
// Bottom sheet for composing and sending messages to vendors (with AI assistance)

import React, { useState, useCallback, useEffect } from 'react';
import { Alert } from 'react-native';
import { MessageSquare, Mail, Phone } from 'lucide-react-native';
import { BottomSheet } from '@/components/ui';
import { MessageVendorSheetProps, MessageChannel, ChannelOption } from './message-vendor-types';
import { generateMessageFromContext } from './message-vendor-helpers';
import { AIComposeButton } from './AIComposeButton';
import { ChannelSelector } from './ChannelSelector';
import { MessageContentSection } from './MessageContentSection';
import { VendorContactInfo } from './VendorContactInfo';
import { MessageSheetFooter } from './MessageSheetFooter';

export type { MessageVendorSheetProps } from './message-vendor-types';

export function MessageVendorSheet({
  visible,
  onClose,
  vendor,
  context,
  onSend,
}: MessageVendorSheetProps) {
  const [channel, setChannel] = useState<MessageChannel>('sms');
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

    const { subject: generatedSubject, body: generatedBody } =
      generateMessageFromContext(vendor.name, context);

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
  const channelOptions: ChannelOption[] = [
    { value: 'sms', label: 'Text/SMS', icon: MessageSquare, disabled: !vendor.phone },
    { value: 'email', label: 'Email', icon: Mail, disabled: !vendor.email },
    { value: 'phone', label: 'Phone (Script)', icon: Phone, disabled: !vendor.phone },
  ];

  const availableChannels = channelOptions.filter((c) => !c.disabled);

  const handleSubjectChange = useCallback((text: string) => {
    setSubject(text);
    setAiComposed(false);
  }, []);

  const handleBodyChange = useCallback((text: string) => {
    setBody(text);
    setAiComposed(false);
  }, []);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={`Message ${vendor.name}`}
      snapPoints={['90%']}
    >
      {context && (
        <AIComposeButton
          onPress={handleGenerateMessage}
          isGenerating={isGenerating}
        />
      )}

      <ChannelSelector
        channel={channel}
        onChannelChange={setChannel}
        availableChannels={availableChannels}
      />

      <MessageContentSection
        channel={channel}
        subject={subject}
        body={body}
        aiComposed={aiComposed}
        onSubjectChange={handleSubjectChange}
        onBodyChange={handleBodyChange}
      />

      <VendorContactInfo vendor={vendor} channel={channel} />

      <MessageSheetFooter
        onCancel={onClose}
        onSend={handleSend}
        isSending={isSending}
        sendDisabled={isSending || !body.trim()}
      />
    </BottomSheet>
  );
}

export default MessageVendorSheet;

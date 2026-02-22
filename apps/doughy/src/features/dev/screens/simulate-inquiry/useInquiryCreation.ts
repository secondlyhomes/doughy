// src/features/dev/screens/simulate-inquiry/useInquiryCreation.ts
// Hook for creating test inquiries

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { PLATFORM_CONFIGS } from './constants';
import { generatePlaceholderResponse } from './utils';
import type { Platform, PlatformConfig } from './types';

interface UseInquiryCreationOptions {
  userId: string | undefined;
  userEmail: string | undefined;
}

interface CreateInquiryParams {
  platform: Platform;
  platformConfig: PlatformConfig;
  contactName: string;
  contactEmail: string;
  messageContent: string;
  checkInDate: Date;
  checkOutDate: Date;
}

export function useInquiryCreation({ userId, userEmail }: UseInquiryCreationOptions) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedConversationId, setLastCreatedConversationId] = useState<string | null>(null);

  // Core function to create inquiry
  const createInquiry = useCallback(async (params: CreateInquiryParams): Promise<string | null> => {
    const { platform, platformConfig, contactName, contactEmail, messageContent, checkInDate, checkOutDate } = params;

    // Parse name into first/last
    const nameParts = contactName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // 1. Create or find contact
    const { data: existingContacts } = await supabase
      .schema('crm').from('contacts')
      .select('id')
      .eq('email', contactEmail.trim().toLowerCase())
      .limit(1);

    let contactId: string;

    if (existingContacts && existingContacts.length > 0) {
      contactId = existingContacts[0].id;
      await supabase
        .schema('crm').from('contacts')
        .update({
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq('id', contactId);
    } else {
      const { data: newContact, error: contactError } = await supabase
        .schema('crm').from('contacts')
        .insert({
          first_name: firstName,
          last_name: lastName,
          email: contactEmail.trim().toLowerCase(),
          contact_types: ['lead'],
          source: platform,
          status: 'new',
          metadata: {
            simulated: true,
            profession: platformConfig.sampleProfession,
          },
        })
        .select()
        .single();

      if (contactError) throw contactError;
      contactId = newContact.id;
    }

    // 2. Get a property to associate
    const { data: properties } = await supabase
      .schema('landlord').from('properties')
      .select('id, name')
      .limit(1);

    const propertyId = properties?.[0]?.id || null;

    // 3. Create conversation
    const { data: conversation, error: convError } = await supabase
      .schema('landlord').from('conversations')
      .insert({
        contact_id: contactId,
        property_id: propertyId,
        channel: 'email',
        platform: platform,
        status: 'active',
        is_ai_enabled: true,
        is_ai_auto_respond: false,
        subject: `${platformConfig.name} Inquiry - ${contactName}`,
        external_message_id: `simulated-${Date.now()}`,
        last_message_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (convError) throw convError;

    // 4. Create inbound message
    const { error: msgError } = await supabase
      .schema('landlord').from('messages')
      .insert({
        conversation_id: conversation.id,
        direction: 'inbound',
        content: messageContent.trim(),
        content_type: 'text',
        sent_by: 'contact',
        metadata: {
          simulated: true,
          platform: platform,
          check_in_date: checkInDate.toISOString().split('T')[0],
          check_out_date: checkOutDate.toISOString().split('T')[0],
          reply_method: platformConfig.replyMethod,
        },
      });

    if (msgError) throw msgError;

    // 5. Generate AI response and queue it
    const suggestedResponse = generatePlaceholderResponse(
      contactName,
      platformConfig.sampleProfession,
      checkInDate,
      checkOutDate
    );

    const { error: queueError } = await supabase
      .schema('landlord').from('ai_queue_items')
      .insert({
        conversation_id: conversation.id,
        suggested_response: suggestedResponse,
        confidence: 0.85 + Math.random() * 0.1,
        reasoning: 'Standard availability inquiry - high confidence template match',
        intent: 'availability_check',
        detected_topics: ['availability', 'dates', platform],
        status: 'pending',
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

    if (queueError) {
      console.warn('Failed to create AI queue item:', queueError);
    }

    return conversation.id;
  }, []);

  // Handle create inquiry from form
  const handleCreateInquiry = useCallback(async (params: CreateInquiryParams) => {
    const { contactName, contactEmail, messageContent, platformConfig } = params;

    if (!contactName.trim() || !contactEmail.trim() || !messageContent.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!userId) {
      Alert.alert('Error', 'You must be logged in to create test inquiries.');
      return;
    }

    setIsCreating(true);
    try {
      const conversationId = await createInquiry(params);
      if (conversationId) {
        setLastCreatedConversationId(conversationId);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Alert.alert(
          'Test Inquiry Created!',
          `Created a ${platformConfig.name} inquiry from ${contactName}.\n\nYou can now go to the Inbox to review and approve the AI response. Once approved, the response will be sent to ${contactEmail}.`,
          [
            { text: 'Stay Here', style: 'cancel' },
            {
              text: 'Go to Inbox',
              onPress: () => router.push(`/(tabs)/landlord-inbox/${conversationId}`),
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error creating test inquiry:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create test inquiry'
      );
    } finally {
      setIsCreating(false);
    }
  }, [userId, createInquiry, router]);

  // Handle quick test
  const handleQuickTest = useCallback(async (platform: Platform, checkInDate: Date, checkOutDate: Date) => {
    const config = PLATFORM_CONFIGS.find((p) => p.id === platform)!;
    const email = userEmail || 'test@example.com';

    setIsCreating(true);
    try {
      const conversationId = await createInquiry({
        platform,
        platformConfig: config,
        contactName: config.sampleName,
        contactEmail: email,
        messageContent: config.sampleMessage,
        checkInDate,
        checkOutDate,
      });

      if (conversationId) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

        Alert.alert(
          'Quick Test Created!',
          `${config.name} inquiry created.`,
          [
            { text: 'OK' },
            { text: 'View', onPress: () => router.push(`/(tabs)/landlord-inbox/${conversationId}`) },
          ]
        );
      }
    } catch (error) {
      console.error('Quick test error:', error);
      Alert.alert('Error', 'Failed to create quick test.');
    } finally {
      setIsCreating(false);
    }
  }, [userEmail, createInquiry, router]);

  return {
    isCreating,
    lastCreatedConversationId,
    handleCreateInquiry,
    handleQuickTest,
  };
}

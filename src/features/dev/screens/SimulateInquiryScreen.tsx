// src/features/dev/screens/SimulateInquiryScreen.tsx
// Mobile-friendly screen for testing the full MoltBot email flow
// Creates test inquiries that go through the real approval flow
//
// Use cases:
// 1. Test platform email parsing
// 2. Test AI response generation
// 3. Test approval flow
// 4. Test email sending (using YOUR email to receive the response)

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import {
  Play,
  Sparkles,
  Mail,
  Home,
  User,
  Calendar,
  MessageSquare,
  ChevronDown,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import {
  Button,
  TAB_BAR_SAFE_PADDING,
  BottomSheet,
  BottomSheetSection,
} from '@/components/ui';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity, getShadowStyle } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { supabase } from '@/lib/supabase';

// =============================================================================
// Types
// =============================================================================

type Platform = 'airbnb' | 'furnishedfinder' | 'turbotenant' | 'zillow' | 'craigslist' | 'direct';

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: string;
  sampleName: string;
  sampleProfession: string;
  sampleMessage: string;
  replyMethod: 'email_reply' | 'direct_email' | 'platform_only';
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    icon: '🏠',
    sampleName: 'Sarah Johnson',
    sampleProfession: 'Remote Worker',
    sampleMessage: "Hi! I'm interested in your listing for a 3-month stay. I work remotely as a software developer. Is this available from Feb 1 to Apr 30? I'm quiet and clean, and would love to know more about the WiFi speed.",
    replyMethod: 'email_reply',
  },
  {
    id: 'furnishedfinder',
    name: 'FurnishedFinder',
    icon: '🏥',
    sampleName: 'Emily Martinez',
    sampleProfession: 'Travel Nurse',
    sampleMessage: "Hello! I'm a travel nurse starting a 13-week assignment at Memorial Hospital on February 1st. Looking for furnished housing. I'm quiet, clean, and rarely home during day shifts. Do you accept travel nurse assignments?",
    replyMethod: 'platform_only',
  },
  {
    id: 'turbotenant',
    name: 'TurboTenant',
    icon: '🔑',
    sampleName: 'Michael Chen',
    sampleProfession: 'Corporate Relocator',
    sampleMessage: "I'm relocating to the area for a new job starting in February. Looking for a 6-month lease while I find a permanent home. Is this property pet-friendly? I have a small, well-trained dog.",
    replyMethod: 'direct_email',
  },
  {
    id: 'zillow',
    name: 'Zillow',
    icon: '🏡',
    sampleName: 'Jessica Williams',
    sampleProfession: 'Student',
    sampleMessage: "Hi, I saw your listing and I'm interested! I'm a graduate student at the university nearby. Looking for housing for the spring semester. What's the earliest available move-in date?",
    replyMethod: 'direct_email',
  },
  {
    id: 'craigslist',
    name: 'Craigslist',
    icon: '📋',
    sampleName: 'David Brown',
    sampleProfession: 'Contractor',
    sampleMessage: "Interested in your rental. I'm a contractor working on a project in the area for the next 3 months. Can I schedule a showing this week? What's included in the rent?",
    replyMethod: 'email_reply',
  },
  {
    id: 'direct',
    name: 'Direct Email',
    icon: '✉️',
    sampleName: 'Test Inquiry',
    sampleProfession: 'Other',
    sampleMessage: 'Hello, I found your listing and would like more information. Is this property still available? What are the monthly rates?',
    replyMethod: 'direct_email',
  },
];

// =============================================================================
// Preset Inquiry Button
// =============================================================================

interface PresetButtonProps {
  config: PlatformConfig;
  onPress: () => void;
  isSelected: boolean;
}

function PresetButton({ config, onPress, isSelected }: PresetButtonProps) {
  const colors = useThemeColors();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: isSelected ? withOpacity(colors.primary, 'light') : colors.card,
        borderWidth: isSelected ? 2 : 1,
        borderColor: isSelected ? colors.primary : colors.border,
        marginBottom: SPACING.sm,
        ...getShadowStyle(colors, { size: 'sm' }),
      }}
      accessibilityRole="button"
      accessibilityLabel={`Create ${config.name} test inquiry`}
    >
      <Text style={{ fontSize: 24, marginRight: SPACING.sm }}>{config.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
          {config.name}
        </Text>
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.xs }}>
          {config.sampleProfession} inquiry
        </Text>
      </View>
      {config.replyMethod === 'platform_only' && (
        <View
          style={{
            backgroundColor: withOpacity(colors.warning, 'light'),
            paddingHorizontal: 8,
            paddingVertical: 2,
            borderRadius: BORDER_RADIUS.full,
          }}
        >
          <Text style={{ color: colors.warning, fontSize: FONT_SIZES['2xs'], fontWeight: '600' }}>
            In-app only
          </Text>
        </View>
      )}
      <ArrowRight size={18} color={colors.mutedForeground} style={{ marginLeft: SPACING.sm }} />
    </TouchableOpacity>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function SimulateInquiryScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { user, profile } = useAuth();

  // Form state
  const [selectedPlatform, setSelectedPlatform] = useState<Platform>('airbnb');
  const [showPlatformSheet, setShowPlatformSheet] = useState(false);
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date>(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [checkOutDate, setCheckOutDate] = useState<Date>(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const [messageContent, setMessageContent] = useState('');
  const [showCheckInPicker, setShowCheckInPicker] = useState(false);
  const [showCheckOutPicker, setShowCheckOutPicker] = useState(false);

  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [lastCreatedConversationId, setLastCreatedConversationId] = useState<string | null>(null);

  // Get config for selected platform
  const platformConfig = PLATFORM_CONFIGS.find((p) => p.id === selectedPlatform)!;

  // Apply preset values
  const applyPreset = useCallback((platform: Platform) => {
    const config = PLATFORM_CONFIGS.find((p) => p.id === platform)!;
    setSelectedPlatform(platform);
    setContactName(config.sampleName);
    setMessageContent(config.sampleMessage);
    // Use user's email so they can receive the test response
    setContactEmail(user?.email || '');
    setShowPlatformSheet(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, [user?.email]);

  // Create test inquiry
  const handleCreateInquiry = useCallback(async () => {
    if (!contactName.trim() || !contactEmail.trim() || !messageContent.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to create test inquiries.');
      return;
    }

    setIsCreating(true);
    try {
      // Parse name into first/last
      const nameParts = contactName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      // 1. Create or find contact
      const { data: existingContacts, error: searchError } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('email', contactEmail.trim().toLowerCase())
        .limit(1);

      let contactId: string;

      if (existingContacts && existingContacts.length > 0) {
        contactId = existingContacts[0].id;
        // Update contact
        await supabase
          .from('crm_contacts')
          .update({
            first_name: firstName,
            last_name: lastName,
            updated_at: new Date().toISOString(),
          })
          .eq('id', contactId);
      } else {
        // Create new contact
        const { data: newContact, error: contactError } = await supabase
          .from('crm_contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: contactEmail.trim().toLowerCase(),
            contact_types: ['lead'],
            source: selectedPlatform,
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

      // 2. Get a property to associate (use first available)
      const { data: properties } = await supabase
        .from('landlord_properties')
        .select('id, name')
        .limit(1);

      const propertyId = properties?.[0]?.id || null;

      // 3. Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('landlord_conversations')
        .insert({
          contact_id: contactId,
          property_id: propertyId,
          channel: 'email',
          platform: selectedPlatform,
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
        .from('landlord_messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'inbound',
          content: messageContent.trim(),
          content_type: 'text',
          sent_by: 'contact',
          metadata: {
            simulated: true,
            platform: selectedPlatform,
            check_in_date: checkInDate.toISOString().split('T')[0],
            check_out_date: checkOutDate.toISOString().split('T')[0],
            reply_method: platformConfig.replyMethod,
          },
        });

      if (msgError) throw msgError;

      // 5. Generate AI response and queue it
      // For now, create a placeholder AI queue item
      // In production, this would call the AI generation function
      const suggestedResponse = generatePlaceholderResponse(
        contactName,
        platformConfig.sampleProfession,
        checkInDate,
        checkOutDate
      );

      const { error: queueError } = await supabase
        .from('landlord_ai_queue_items')
        .insert({
          conversation_id: conversation.id,
          suggested_response: suggestedResponse,
          confidence: 0.85 + Math.random() * 0.1, // 85-95%
          reasoning: 'Standard availability inquiry - high confidence template match',
          intent: 'availability_check',
          detected_topics: ['availability', 'dates', selectedPlatform],
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      if (queueError) {
        console.warn('Failed to create AI queue item:', queueError);
        // Non-fatal - conversation still created
      }

      setLastCreatedConversationId(conversation.id);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Test Inquiry Created!',
        `Created a ${platformConfig.name} inquiry from ${contactName}.\n\nYou can now go to the Inbox to review and approve the AI response. Once approved, the response will be sent to ${contactEmail}.`,
        [
          { text: 'Stay Here', style: 'cancel' },
          {
            text: 'Go to Inbox',
            onPress: () => router.push(`/(tabs)/landlord-inbox/${conversation.id}`),
          },
        ]
      );
    } catch (error) {
      console.error('Error creating test inquiry:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to create test inquiry'
      );
    } finally {
      setIsCreating(false);
    }
  }, [
    contactName,
    contactEmail,
    messageContent,
    selectedPlatform,
    platformConfig,
    checkInDate,
    checkOutDate,
    user?.id,
    router,
  ]);

  // Quick test button handler
  const handleQuickTest = useCallback(async (platform: Platform) => {
    const config = PLATFORM_CONFIGS.find((p) => p.id === platform)!;
    setSelectedPlatform(platform);
    setContactName(config.sampleName);
    setMessageContent(config.sampleMessage);
    setContactEmail(user?.email || '');

    // Create immediately with preset values
    setIsCreating(true);
    try {
      // Same logic as handleCreateInquiry but with preset values
      const nameParts = config.sampleName.trim().split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      const email = user?.email || 'test@example.com';

      // Create contact
      const { data: existingContacts } = await supabase
        .from('crm_contacts')
        .select('id')
        .eq('email', email.toLowerCase())
        .limit(1);

      let contactId: string;

      if (existingContacts && existingContacts.length > 0) {
        contactId = existingContacts[0].id;
      } else {
        const { data: newContact, error: contactError } = await supabase
          .from('crm_contacts')
          .insert({
            first_name: firstName,
            last_name: lastName,
            email: email.toLowerCase(),
            contact_types: ['lead'],
            source: platform,
            status: 'new',
          })
          .select()
          .single();

        if (contactError) throw contactError;
        contactId = newContact.id;
      }

      // Get property
      const { data: properties } = await supabase
        .from('landlord_properties')
        .select('id')
        .limit(1);

      // Create conversation
      const { data: conversation, error: convError } = await supabase
        .from('landlord_conversations')
        .insert({
          contact_id: contactId,
          property_id: properties?.[0]?.id || null,
          channel: 'email',
          platform: platform,
          status: 'active',
          is_ai_enabled: true,
          subject: `${config.name} Inquiry - ${config.sampleName}`,
          external_message_id: `simulated-${Date.now()}`,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (convError) throw convError;

      // Create message
      await supabase
        .from('landlord_messages')
        .insert({
          conversation_id: conversation.id,
          direction: 'inbound',
          content: config.sampleMessage,
          content_type: 'text',
          sent_by: 'contact',
          metadata: { simulated: true, platform },
        });

      // Create AI queue item
      const suggestedResponse = generatePlaceholderResponse(
        config.sampleName,
        config.sampleProfession,
        checkInDate,
        checkOutDate
      );

      await supabase
        .from('landlord_ai_queue_items')
        .insert({
          conversation_id: conversation.id,
          suggested_response: suggestedResponse,
          confidence: 0.88,
          reasoning: `Standard ${config.sampleProfession.toLowerCase()} inquiry`,
          intent: 'availability_check',
          detected_topics: ['availability', platform],
          status: 'pending',
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        'Quick Test Created!',
        `${config.name} inquiry created.`,
        [
          { text: 'OK' },
          { text: 'View', onPress: () => router.push(`/(tabs)/landlord-inbox/${conversation.id}`) },
        ]
      );
    } catch (error) {
      console.error('Quick test error:', error);
      Alert.alert('Error', 'Failed to create quick test.');
    } finally {
      setIsCreating(false);
    }
  }, [user?.email, checkInDate, checkOutDate, router]);

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            padding: SPACING.md,
            paddingBottom: TAB_BAR_SAFE_PADDING,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={{ marginBottom: SPACING.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
              <Sparkles size={24} color={colors.primary} />
              <Text style={{ color: colors.foreground, fontSize: FONT_SIZES['2xl'], fontWeight: 'bold' }}>
                Simulate Inquiry
              </Text>
            </View>
            <Text style={{ color: colors.mutedForeground, marginTop: SPACING.xs }}>
              Test the full MoltBot email flow without needing Gmail API setup
            </Text>
          </View>

          {/* Quick Test Section */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.md,
              marginBottom: SPACING.lg,
              ...getShadowStyle(colors, { size: 'sm' }),
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.lg, marginBottom: SPACING.sm }}>
              Quick Test
            </Text>
            <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.md }}>
              One tap to create a test inquiry with sample data
            </Text>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm }}>
              {PLATFORM_CONFIGS.slice(0, 4).map((config) => (
                <TouchableOpacity
                  key={config.id}
                  onPress={() => handleQuickTest(config.id)}
                  disabled={isCreating}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: SPACING.md,
                    paddingVertical: SPACING.sm,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: colors.muted,
                    gap: SPACING.xs,
                  }}
                >
                  <Text style={{ fontSize: 16 }}>{config.icon}</Text>
                  <Text style={{ color: colors.foreground, fontWeight: '500' }}>{config.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Custom Form Section */}
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: BORDER_RADIUS.lg,
              padding: SPACING.md,
              ...getShadowStyle(colors, { size: 'sm' }),
            }}
          >
            <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.lg, marginBottom: SPACING.md }}>
              Custom Inquiry
            </Text>

            {/* Platform Selector */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                Platform
              </Text>
              <TouchableOpacity
                onPress={() => setShowPlatformSheet(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Text style={{ fontSize: 20, marginRight: SPACING.sm }}>{platformConfig.icon}</Text>
                <Text style={{ flex: 1, color: colors.foreground }}>{platformConfig.name}</Text>
                <ChevronDown size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>

            {/* Contact Name */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                Contact Name *
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <User size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  value={contactName}
                  onChangeText={setContactName}
                  placeholder="e.g., Sarah Johnson"
                  placeholderTextColor={colors.mutedForeground}
                  style={{ flex: 1, color: colors.foreground }}
                />
              </View>
            </View>

            {/* Contact Email */}
            <View style={{ marginBottom: SPACING.md }}>
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                Contact Email *
              </Text>
              <Text style={{ color: colors.info, fontSize: FONT_SIZES['2xs'], marginBottom: 4 }}>
                Use YOUR email to receive the test response
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Mail size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.sm }} />
                <TextInput
                  value={contactEmail}
                  onChangeText={setContactEmail}
                  placeholder={user?.email || 'your-email@example.com'}
                  placeholderTextColor={colors.mutedForeground}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{ flex: 1, color: colors.foreground }}
                />
              </View>
            </View>

            {/* Check-in / Check-out Dates */}
            <View style={{ flexDirection: 'row', gap: SPACING.sm, marginBottom: SPACING.md }}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                  Check-in
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCheckInPicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: SPACING.md,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: colors.muted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.xs }} />
                  <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>
                    {checkInDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                  Check-out
                </Text>
                <TouchableOpacity
                  onPress={() => setShowCheckOutPicker(true)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    padding: SPACING.md,
                    borderRadius: BORDER_RADIUS.md,
                    backgroundColor: colors.muted,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Calendar size={18} color={colors.mutedForeground} style={{ marginRight: SPACING.xs }} />
                  <Text style={{ color: colors.foreground, fontSize: FONT_SIZES.sm }}>
                    {checkOutDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Message Content */}
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm, marginBottom: SPACING.xs }}>
                Message *
              </Text>
              <View
                style={{
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: colors.muted,
                  borderWidth: 1,
                  borderColor: colors.border,
                  minHeight: 120,
                }}
              >
                <TextInput
                  value={messageContent}
                  onChangeText={setMessageContent}
                  placeholder="The inquiry message from the prospective tenant..."
                  placeholderTextColor={colors.mutedForeground}
                  multiline
                  textAlignVertical="top"
                  style={{ flex: 1, color: colors.foreground }}
                />
              </View>
            </View>

            {/* Reply Method Info */}
            {platformConfig.replyMethod === 'platform_only' && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  padding: SPACING.md,
                  borderRadius: BORDER_RADIUS.md,
                  backgroundColor: withOpacity(colors.warning, 'light'),
                  marginBottom: SPACING.md,
                }}
              >
                <Text style={{ color: colors.warning, fontSize: FONT_SIZES.sm }}>
                  {platformConfig.name} requires in-platform messaging. The approved response will be shown for you to copy.
                </Text>
              </View>
            )}

            {/* Create Button */}
            <Button
              onPress={handleCreateInquiry}
              disabled={isCreating}
              className="w-full"
            >
              {isCreating ? (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Loader2 size={18} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Creating...</Text>
                </View>
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.sm }}>
                  <Play size={18} color={colors.primaryForeground} />
                  <Text style={{ color: colors.primaryForeground, fontWeight: '600' }}>Create Test Inquiry</Text>
                </View>
              )}
            </Button>
          </View>

          {/* Success Toast */}
          {lastCreatedConversationId && (
            <TouchableOpacity
              onPress={() => router.push(`/(tabs)/landlord-inbox/${lastCreatedConversationId}`)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                padding: SPACING.md,
                borderRadius: BORDER_RADIUS.lg,
                backgroundColor: withOpacity(colors.success, 'light'),
                marginTop: SPACING.md,
                gap: SPACING.sm,
              }}
            >
              <CheckCircle2 size={20} color={colors.success} />
              <Text style={{ flex: 1, color: colors.success, fontWeight: '500' }}>
                Last inquiry created! Tap to view.
              </Text>
              <ArrowRight size={18} color={colors.success} />
            </TouchableOpacity>
          )}
        </ScrollView>

        {/* Date Pickers (iOS shows modal, Android inline) */}
        {showCheckInPicker && (
          <DateTimePicker
            value={checkInDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowCheckInPicker(Platform.OS === 'ios');
              if (date) setCheckInDate(date);
            }}
            minimumDate={new Date()}
          />
        )}

        {showCheckOutPicker && (
          <DateTimePicker
            value={checkOutDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={(event, date) => {
              setShowCheckOutPicker(Platform.OS === 'ios');
              if (date) setCheckOutDate(date);
            }}
            minimumDate={checkInDate}
          />
        )}

        {/* Platform Selection Sheet */}
        <BottomSheet
          visible={showPlatformSheet}
          onClose={() => setShowPlatformSheet(false)}
          title="Select Platform"
        >
          <View style={{ paddingBottom: SPACING.xl }}>
            {PLATFORM_CONFIGS.map((config) => (
              <PresetButton
                key={config.id}
                config={config}
                isSelected={selectedPlatform === config.id}
                onPress={() => applyPreset(config.id)}
              />
            ))}
          </View>
        </BottomSheet>
      </KeyboardAvoidingView>
    </ThemedSafeAreaView>
  );
}

// =============================================================================
// Helper Functions
// =============================================================================

function generatePlaceholderResponse(
  name: string,
  profession: string,
  checkIn: Date,
  checkOut: Date
): string {
  const firstName = name.split(' ')[0] || 'there';
  const checkInStr = checkIn.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const checkOutStr = checkOut.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });

  const templates = [
    `Hi ${firstName}! Thank you for your interest in our property. Great news - we do have availability from ${checkInStr} to ${checkOutStr}!\n\nWe love hosting ${profession.toLowerCase()}s and have had wonderful experiences with guests in similar situations.\n\nThe property features high-speed WiFi, a dedicated workspace, and all the amenities you'll need for a comfortable stay.\n\nWould you like to schedule a virtual tour or do you have any specific questions about the property?\n\nBest regards`,

    `Hello ${firstName}! Thanks for reaching out about our listing.\n\nYes, we have availability for your requested dates (${checkInStr} - ${checkOutStr}). As a ${profession.toLowerCase()}, you'll appreciate our quiet neighborhood and reliable WiFi.\n\nA few highlights:\n- Fully furnished with everything you need\n- Dedicated parking\n- Close to local amenities\n\nLet me know if you'd like more details or photos!\n\nBest,`,

    `Hi ${firstName}, thanks for the inquiry!\n\nGood news - the property is available from ${checkInStr} through ${checkOutStr}. We've hosted many ${profession.toLowerCase()}s and the space works perfectly for longer stays.\n\nThe monthly rate includes all utilities, WiFi, and weekly cleaning. We're flexible on move-in times and can accommodate your schedule.\n\nFeel free to ask any questions - happy to help!\n\nWarm regards`,
  ];

  return templates[Math.floor(Math.random() * templates.length)];
}

export default SimulateInquiryScreen;

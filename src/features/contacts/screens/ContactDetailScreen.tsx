// src/features/contacts/screens/ContactDetailScreen.tsx
// Contact detail screen showing contact info with focused view (no tab bar)

import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, ScrollView, Linking, TouchableOpacity, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import type { NativeStackNavigationOptions } from '@react-navigation/native-stack';
import { Phone, Mail, Building2, MapPin, Star, Tag, Clock, ArrowLeft } from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { LoadingSpinner, ListEmptyState, Badge, Section, DetailRow } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';
import { haptic } from '@/lib/haptics';
import { formatDate } from '@/lib/formatters';

import { useContact } from '../hooks/useContacts';
import { getContactDisplayName, type Contact } from '../types';
import { useVoipCall } from '@/features/voip';

import {
  ProfileSection,
  QuickActions,
  formatSource,
  getScoreColor,
} from './contact-detail';

interface ContactDetailScreenProps {
  contactId: string;
}

export function ContactDetailScreen({ contactId }: ContactDetailScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { contact, isLoading, error, refetch } = useContact(contactId);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  }, [refetch]);
  const { startCall } = useVoipCall({ subscriptionTier: 'pro' });

  const handleCall = useCallback(() => {
    if (contact?.phone) {
      haptic.light();
      const displayName = getContactDisplayName(contact);
      startCall(contact.phone, contact.id, displayName);
    }
  }, [contact, startCall]);

  const handleEmail = () => {
    if (contact?.email) {
      haptic.light();
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  const handleSMS = () => {
    if (contact?.phone) {
      haptic.light();
      Linking.openURL(`sms:${contact.phone}`);
    }
  };

  const handleBack = useCallback(() => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/contacts');
  }, [router]);

  const headerOptions = useMemo(
    (): NativeStackNavigationOptions => ({
      headerShown: true,
      headerStyle: { backgroundColor: colors.background },
      headerShadowVisible: false,
      headerStatusBarHeight: insets.top,
      headerTitle: () => (
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.foreground, fontWeight: '600', fontSize: FONT_SIZES.base }}>
            Contact Details
          </Text>
        </View>
      ),
      headerLeft: () => (
        <TouchableOpacity onPress={handleBack} style={{ padding: SPACING.sm }}>
          <ArrowLeft size={24} color={colors.foreground} />
        </TouchableOpacity>
      ),
    }),
    [colors, insets.top, handleBack]
  );

  if (isLoading && !contact) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <LoadingSpinner fullScreen text="Loading contact..." />
        </ThemedSafeAreaView>
      </>
    );
  }

  if (!contact && !isLoading) {
    return (
      <>
        <Stack.Screen options={headerOptions} />
        <ThemedSafeAreaView className="flex-1" edges={[]}>
          <View style={styles.errorContainer}>
            <ListEmptyState
              state="error"
              title="Contact Not Found"
              description={error?.message || 'Unable to load contact.'}
              primaryAction={{ label: 'Go Back', onPress: handleBack }}
            />
          </View>
        </ThemedSafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={headerOptions} />
      <ThemedSafeAreaView className="flex-1" edges={[]}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + SPACING.xl }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          <ProfileSection contact={contact!} />

          <QuickActions
            phone={contact!.phone}
            email={contact!.email}
            onCall={handleCall}
            onEmail={handleEmail}
            onSMS={handleSMS}
          />

          <Section title="Contact Information">
            {contact!.email && (
              <DetailRow icon={Mail} label="Email" value={contact!.email} onPress={handleEmail} iconBackground />
            )}
            {contact!.phone && (
              <DetailRow icon={Phone} label="Phone" value={contact!.phone} onPress={handleCall} iconBackground />
            )}
            {contact!.company && (
              <DetailRow icon={Building2} label="Company" value={contact!.company} iconBackground />
            )}
            {(contact!.city || contact!.state || contact!.zip) && (
              <DetailRow
                icon={MapPin}
                label="Location"
                value={[contact!.city, contact!.state, contact!.zip].filter(Boolean).join(', ')}
                iconBackground
              />
            )}
          </Section>

          <Section title="Details">
            {contact!.source && (
              <DetailRow icon={Tag} label="Source" value={formatSource(contact!.source)} iconBackground />
            )}
            {contact!.score !== null && contact!.score !== undefined && (
              <DetailRow
                icon={Star}
                label="Score"
                value={`${contact!.score} pts`}
                valueColor={getScoreColor(contact!.score, colors)}
                iconBackground
              />
            )}
            {contact!.created_at && (
              <DetailRow icon={Clock} label="Added" value={formatDate(contact!.created_at)} iconBackground />
            )}
          </Section>

          {contact!.notes && (
            <Section title="Notes">
              <Text style={[styles.notes, { color: colors.foreground }]}>{contact!.notes}</Text>
            </Section>
          )}

          {contact!.tags && contact!.tags.length > 0 && (
            <Section title="Tags">
              <View style={styles.tags}>
                {contact!.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary" size="sm">
                    {tag}
                  </Badge>
                ))}
              </View>
            </Section>
          )}
        </ScrollView>
      </ThemedSafeAreaView>
    </>
  );
}

const styles = {
  scrollView: { flex: 1 },
  scrollContent: { paddingHorizontal: SPACING.md, paddingTop: SPACING.lg },
  errorContainer: { flex: 1, justifyContent: 'center' as const, paddingHorizontal: SPACING.lg },
  infoRow: { flexDirection: 'row' as const, alignItems: 'center' as const, marginBottom: SPACING.md },
  infoIcon: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center' as const, alignItems: 'center' as const, marginRight: SPACING.sm },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: FONT_SIZES.xs, marginBottom: 2 },
  infoValue: { fontSize: FONT_SIZES.base },
  notes: { fontSize: FONT_SIZES.base, lineHeight: FONT_SIZES.base * LINE_HEIGHTS.relaxed },
  tags: { flexDirection: 'row' as const, flexWrap: 'wrap' as const, gap: SPACING.xs },
};

export default ContactDetailScreen;

// src/features/contacts/screens/ContactDetailScreen.tsx
// Contact detail screen showing contact info with focused view (no tab bar)

import React from 'react';
import { View, Text, ScrollView, StyleSheet, Linking } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  ArrowLeft,
  Phone,
  Mail,
  Building2,
  MapPin,
  Star,
  Tag,
  Clock,
  User,
  MessageSquare,
} from 'lucide-react-native';

import { ThemedSafeAreaView } from '@/components';
import { GlassView, LoadingSpinner, ListEmptyState, Badge, Button } from '@/components/ui';
import { GlassButton } from '@/components/ui/GlassButton';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES, LINE_HEIGHTS } from '@/constants/design-tokens';
import { haptic } from '@/lib/haptics';

import { useContact } from '../hooks/useContacts';
import {
  Contact,
  getContactDisplayName,
  getContactInitials,
  CrmContactType,
  CrmContactStatus,
  CrmContactSource,
} from '../types';

interface ContactDetailScreenProps {
  contactId: string;
}

// Format contact type for display
const formatContactType = (type: CrmContactType): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Badge variant mapping for contact types
const getContactTypeBadgeVariant = (
  type: CrmContactType
): 'success' | 'info' | 'warning' | 'default' => {
  switch (type) {
    case 'lead':
      return 'info';
    case 'guest':
      return 'success';
    case 'tenant':
      return 'warning';
    case 'vendor':
      return 'default';
    default:
      return 'default';
  }
};

// Format status for display
const formatStatus = (status: CrmContactStatus | null): string => {
  if (!status) return 'Unknown';
  return status
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Format source for display
const formatSource = (source: CrmContactSource): string => {
  const sourceMap: Record<CrmContactSource, string> = {
    furnishedfinder: 'Furnished Finder',
    airbnb: 'Airbnb',
    turbotenant: 'TurboTenant',
    zillow: 'Zillow',
    facebook: 'Facebook',
    whatsapp: 'WhatsApp',
    direct: 'Direct',
    referral: 'Referral',
    craigslist: 'Craigslist',
    other: 'Other',
  };
  return sourceMap[source] || source.charAt(0).toUpperCase() + source.slice(1);
};

// Get score color based on value
const getScoreColor = (
  score: number | null,
  colors: ReturnType<typeof useThemeColors>
): string => {
  if (!score) return colors.mutedForeground;
  if (score >= 80) return colors.success;
  if (score >= 50) return colors.warning;
  return colors.destructive;
};

// Info row component
function InfoRow({
  icon: Icon,
  label,
  value,
  onPress,
  colors,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  value: string;
  onPress?: () => void;
  colors: ReturnType<typeof useThemeColors>;
}) {
  const content = (
    <View style={styles.infoRow}>
      <View
        style={[styles.infoIcon, { backgroundColor: withOpacity(colors.primary, 'light') }]}
      >
        <Icon size={16} color={colors.primary} />
      </View>
      <View style={styles.infoContent}>
        <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
        <Text
          style={[
            styles.infoValue,
            { color: onPress ? colors.primary : colors.foreground },
          ]}
        >
          {value}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <View style={styles.infoRowTouchable}>
        {content}
        <Button variant="outline" size="sm" onPress={onPress}>
          Open
        </Button>
      </View>
    );
  }

  return content;
}

export function ContactDetailScreen({ contactId }: ContactDetailScreenProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const { contact, isLoading, error } = useContact(contactId);

  // Handle phone call
  const handleCall = () => {
    if (contact?.phone) {
      haptic.light();
      Linking.openURL(`tel:${contact.phone}`);
    }
  };

  // Handle email
  const handleEmail = () => {
    if (contact?.email) {
      haptic.light();
      Linking.openURL(`mailto:${contact.email}`);
    }
  };

  // Handle SMS
  const handleSMS = () => {
    if (contact?.phone) {
      haptic.light();
      Linking.openURL(`sms:${contact.phone}`);
    }
  };

  // Show loading state
  if (isLoading && !contact) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <LoadingSpinner fullScreen text="Loading contact..." />
      </ThemedSafeAreaView>
    );
  }

  // Show error state
  if (!contact && !isLoading) {
    return (
      <ThemedSafeAreaView className="flex-1" edges={['top']}>
        <View style={styles.errorContainer}>
          <ListEmptyState
            state="error"
            title="Contact Not Found"
            description={error?.message || 'Unable to load contact.'}
            primaryAction={{
              label: 'Go Back',
              onPress: () => router.back(),
            }}
          />
        </View>
      </ThemedSafeAreaView>
    );
  }

  const displayName = getContactDisplayName(contact!);
  const initials = getContactInitials(contact!);
  const relevantTypes = (contact!.contact_types || []).filter((type) =>
    ['lead', 'guest', 'tenant', 'vendor'].includes(type)
  );

  return (
    <ThemedSafeAreaView className="flex-1" edges={['top']}>
      {/* Header */}
      <GlassView effect="regular" intensity={40} style={styles.header}>
        <View style={styles.headerContent}>
          {/* Back button */}
          <GlassButton
            icon={<ArrowLeft size={24} color={colors.foreground} />}
            onPress={() => router.back()}
            size={40}
            effect="clear"
            containerStyle={{ marginRight: SPACING.sm }}
            accessibilityLabel="Go back"
          />

          {/* Title */}
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>
            Contact Details
          </Text>
        </View>
      </GlassView>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + SPACING.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar and name section */}
        <View style={styles.profileSection}>
          <View
            style={[
              styles.avatar,
              { backgroundColor: withOpacity(colors.primary, 'medium') },
            ]}
          >
            <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>
              {initials}
            </Text>
          </View>
          <Text style={[styles.displayName, { color: colors.foreground }]}>
            {displayName}
          </Text>
          {contact!.job_title && (
            <Text style={[styles.jobTitle, { color: colors.mutedForeground }]}>
              {contact!.job_title}
            </Text>
          )}

          {/* Status badge */}
          <Badge
            variant={
              contact!.status === 'active'
                ? 'success'
                : contact!.status === 'new'
                ? 'info'
                : 'default'
            }
            size="md"
          >
            {formatStatus(contact!.status)}
          </Badge>

          {/* Contact type badges */}
          {relevantTypes.length > 0 && (
            <View style={styles.typeBadges}>
              {relevantTypes.map((type) => (
                <Badge key={type} variant={getContactTypeBadgeVariant(type)} size="sm">
                  {formatContactType(type)}
                </Badge>
              ))}
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.quickActions}>
          {contact!.phone && (
            <>
              <Button
                variant="outline"
                size="lg"
                onPress={handleCall}
                className="flex-1"
              >
                <Phone size={18} color={colors.foreground} />
                <Text style={{ color: colors.foreground, marginLeft: SPACING.xs }}>
                  Call
                </Text>
              </Button>
              <Button
                variant="outline"
                size="lg"
                onPress={handleSMS}
                className="flex-1"
              >
                <MessageSquare size={18} color={colors.foreground} />
                <Text style={{ color: colors.foreground, marginLeft: SPACING.xs }}>
                  Text
                </Text>
              </Button>
            </>
          )}
          {contact!.email && (
            <Button
              variant="outline"
              size="lg"
              onPress={handleEmail}
              className="flex-1"
            >
              <Mail size={18} color={colors.foreground} />
              <Text style={{ color: colors.foreground, marginLeft: SPACING.xs }}>
                Email
              </Text>
            </Button>
          )}
        </View>

        {/* Contact info section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Contact Information
          </Text>

          {contact!.email && (
            <InfoRow
              icon={Mail}
              label="Email"
              value={contact!.email}
              onPress={handleEmail}
              colors={colors}
            />
          )}

          {contact!.phone && (
            <InfoRow
              icon={Phone}
              label="Phone"
              value={contact!.phone}
              onPress={handleCall}
              colors={colors}
            />
          )}

          {contact!.company && (
            <InfoRow icon={Building2} label="Company" value={contact!.company} colors={colors} />
          )}

          {(contact!.city || contact!.state || contact!.zip) && (
            <InfoRow
              icon={MapPin}
              label="Location"
              value={[contact!.city, contact!.state, contact!.zip].filter(Boolean).join(', ')}
              colors={colors}
            />
          )}
        </View>

        {/* Details section */}
        <View
          style={[
            styles.section,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Details</Text>

          {contact!.source && (
            <InfoRow
              icon={Tag}
              label="Source"
              value={formatSource(contact!.source)}
              colors={colors}
            />
          )}

          {contact!.score !== null && contact!.score !== undefined && (
            <View style={styles.infoRow}>
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: withOpacity(getScoreColor(contact!.score, colors), 'light') },
                ]}
              >
                <Star size={16} color={getScoreColor(contact!.score, colors)} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>
                  Score
                </Text>
                <Text
                  style={[
                    styles.infoValue,
                    { color: getScoreColor(contact!.score, colors) },
                  ]}
                >
                  {contact!.score} pts
                </Text>
              </View>
            </View>
          )}

          {contact!.created_at && (
            <InfoRow
              icon={Clock}
              label="Added"
              value={new Date(contact!.created_at).toLocaleDateString()}
              colors={colors}
            />
          )}
        </View>

        {/* Notes section */}
        {contact!.notes && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Notes</Text>
            <Text style={[styles.notes, { color: colors.foreground }]}>
              {contact!.notes}
            </Text>
          </View>
        )}

        {/* Tags section */}
        {contact!.tags && contact!.tags.length > 0 && (
          <View
            style={[
              styles.section,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Tags</Text>
            <View style={styles.tags}>
              {contact!.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" size="sm">
                  {tag}
                </Badge>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedSafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  profileSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600',
  },
  displayName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  jobTitle: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.sm,
  },
  typeBadges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
  quickActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  section: {
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.base,
    fontWeight: '600',
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  infoRowTouchable: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: FONT_SIZES.xs,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: FONT_SIZES.base,
  },
  notes: {
    fontSize: FONT_SIZES.base,
    lineHeight: FONT_SIZES.base * LINE_HEIGHTS.relaxed,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
});

export default ContactDetailScreen;

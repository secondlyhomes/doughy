// src/features/contacts/screens/contact-detail/ProfileSection.tsx
// Profile section displaying avatar, name, and badges

import React from 'react';
import { View, Text } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Badge } from '@/components/ui';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, FONT_SIZES } from '@/constants/design-tokens';
import { getContactDisplayName, getContactInitials, type Contact, type CrmContactType } from '../../types';
import { formatContactType, getContactTypeBadgeVariant, formatStatus } from './formatters';

export interface ProfileSectionProps {
  contact: Contact;
}

export function ProfileSection({ contact }: ProfileSectionProps) {
  const colors = useThemeColors();
  const displayName = getContactDisplayName(contact);
  const initials = getContactInitials(contact);
  const relevantTypes = (contact.contact_types || []).filter((type) =>
    ['lead', 'guest', 'tenant', 'vendor'].includes(type)
  );

  return (
    <View style={styles.profileSection}>
      <View style={[styles.avatar, { backgroundColor: withOpacity(colors.primary, 'medium') }]}>
        <Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials}</Text>
      </View>
      <Text style={[styles.displayName, { color: colors.foreground }]}>{displayName}</Text>
      {contact.job_title && (
        <Text style={[styles.jobTitle, { color: colors.mutedForeground }]}>{contact.job_title}</Text>
      )}

      <Badge
        variant={contact.status === 'active' ? 'success' : contact.status === 'new' ? 'info' : 'default'}
        size="md"
      >
        {formatStatus(contact.status)}
      </Badge>

      {relevantTypes.length > 0 && (
        <View style={styles.typeBadges}>
          {relevantTypes.map((type) => (
            <Badge key={type} variant={getContactTypeBadgeVariant(type as CrmContactType)} size="sm">
              {formatContactType(type as CrmContactType)}
            </Badge>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = {
  profileSection: {
    alignItems: 'center' as const,
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    marginBottom: SPACING.md,
  },
  avatarText: {
    fontSize: FONT_SIZES['2xl'],
    fontWeight: '600' as const,
  },
  displayName: {
    fontSize: FONT_SIZES.xl,
    fontWeight: '600' as const,
    marginBottom: SPACING.xs,
  },
  jobTitle: {
    fontSize: FONT_SIZES.base,
    marginBottom: SPACING.sm,
  },
  typeBadges: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    gap: SPACING.xs,
    marginTop: SPACING.sm,
  },
};

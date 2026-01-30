// src/features/contacts/components/ContactCard.tsx
// Card component for displaying a contact with name, type badges, phone, email, and score
// Uses DataCard for consistency with other list items

import React from 'react';
import { View, Text } from 'react-native';
import { Phone, Mail, ChevronRight, Building2, Star } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { DataCard, DataCardField, Badge } from '@/components/ui';
import { formatStatus, getStatusBadgeVariant, getScoreColor } from '@/lib/formatters';
import { ICON_SIZES } from '@/constants/design-tokens';
import { Contact, getContactDisplayName, CrmContactType, CrmContactSource } from '../types';

interface ContactCardProps {
  contact: Contact;
  onPress: () => void;
  /** Card variant: 'default' for solid, 'glass' for glass effect */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 55 */
  glassIntensity?: number;
}

// Badge variant mapping for contact types
const getContactTypeBadgeVariant = (type: CrmContactType): 'success' | 'info' | 'warning' | 'default' => {
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

// Format contact type for display
const formatContactType = (type: CrmContactType): string => {
  return type.charAt(0).toUpperCase() + type.slice(1);
};

// Format source for display
const formatSource = (source: CrmContactSource): string => {
  // Handle compound names
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

export function ContactCard({
  contact,
  onPress,
  variant = 'default',
  glassIntensity = 55,
}: ContactCardProps) {
  const colors = useThemeColors();

  const displayName = getContactDisplayName(contact);

  // Build fields array from contact data
  const fields: DataCardField[] = [
    ...(contact.email ? [{ icon: Mail, value: contact.email }] : []),
    ...(contact.phone ? [{ icon: Phone, value: contact.phone }] : []),
    ...(contact.company ? [{ icon: Building2, value: contact.company }] : []),
  ];

  // Filter to only landlord-relevant types for badge display
  const relevantTypes = (contact.contact_types || []).filter(
    (type) => ['lead', 'guest', 'tenant', 'vendor'].includes(type)
  );

  return (
    <DataCard
      onPress={onPress}
      variant={variant}
      glassIntensity={glassIntensity}
      title={displayName}
      subtitle={contact.job_title || undefined}
      headerBadge={{
        label: formatStatus(contact.status),
        variant: getStatusBadgeVariant(contact.status),
        size: 'sm',
      }}
      headerRight={<ChevronRight size={ICON_SIZES.lg} color={colors.mutedForeground} />}
      fields={fields}
      footerContent={
        <View className="mb-2">
          {/* Contact Type Badges */}
          {relevantTypes.length > 0 && (
            <View className="flex-row items-center flex-wrap gap-1 mb-2">
              {relevantTypes.map((type) => (
                <Badge
                  key={type}
                  variant={getContactTypeBadgeVariant(type)}
                  size="sm"
                >
                  {formatContactType(type)}
                </Badge>
              ))}
            </View>
          )}

          {/* Score and Source Row */}
          <View className="flex-row items-center justify-between">
            {/* Score */}
            {contact.score !== null && contact.score !== undefined && (
              <View className="flex-row items-center">
                <Star size={ICON_SIZES.xs} color={getScoreColor(contact.score, colors)} />
                <Text
                  className="text-sm font-medium ml-1"
                  style={{ color: getScoreColor(contact.score, colors) }}
                >
                  {contact.score}
                </Text>
                <Text className="text-xs ml-0.5" style={{ color: colors.mutedForeground }}>
                  pts
                </Text>
              </View>
            )}

            {/* Source */}
            {contact.source && (
              <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                via {formatSource(contact.source)}
              </Text>
            )}
          </View>
        </View>
      }
    />
  );
}

export default ContactCard;

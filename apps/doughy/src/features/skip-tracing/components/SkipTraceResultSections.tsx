// src/features/skip-tracing/components/SkipTraceResultSections.tsx
// Content sections for skip trace detail: error, matched property, results, pending state

import React from 'react';
import { View, Text } from 'react-native';
import {
  Phone,
  Mail,
  MapPin,
  Home,
  Link2,
  AlertCircle,
  Loader2,
} from 'lucide-react-native';
import { Badge } from '@/components/ui';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';
import { CollapsibleSection } from './CollapsibleSection';
import { PropertyOwnershipCard } from './PropertyOwnershipCard';
import { PhoneCard, EmailCard, AddressCard } from './ContactInfoCard';
import type { SkipTraceResultWithRelations } from '../types';

interface SkipTraceResultSectionsProps {
  result: SkipTraceResultWithRelations;
}

export function SkipTraceErrorMessage({ result }: SkipTraceResultSectionsProps) {
  const colors = useThemeColors();

  if (result.status !== 'failed' || !result.error_message) return null;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.destructive,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <AlertCircle size={ICON_SIZES.ml} color={colors.destructive} style={{ marginRight: 8, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 14, fontWeight: '500', color: colors.destructive }}>Error</Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{result.error_message}</Text>
        </View>
      </View>
    </View>
  );
}

export function SkipTraceMatchedProperty({ result }: SkipTraceResultSectionsProps) {
  const colors = useThemeColors();

  if (!result.matched_property) return null;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        borderWidth: 1,
        borderColor: colors.success,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <Link2 size={ICON_SIZES.md} color={colors.success} style={{ marginRight: 8 }} />
        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.success }}>Matched Property</Text>
        {result.match_confidence && (
          <Badge variant="outline" style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 12 }}>{result.match_confidence}% confidence</Text>
          </Badge>
        )}
      </View>
      <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
        {result.matched_property.address}
      </Text>
      <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
        {result.matched_property.city}, {result.matched_property.state}
      </Text>
    </View>
  );
}

export function SkipTraceCompletedResults({ result }: SkipTraceResultSectionsProps) {
  const colors = useThemeColors();

  if (result.status !== 'completed') return null;

  const hasNoResults =
    (!result.phones || result.phones.length === 0) &&
    (!result.emails || result.emails.length === 0) &&
    (!result.addresses || result.addresses.length === 0) &&
    (!result.properties_owned || result.properties_owned.length === 0);

  return (
    <>
      {/* Phones */}
      {result.phones && result.phones.length > 0 && (
        <CollapsibleSection
          title="Phone Numbers"
          icon={<Phone size={ICON_SIZES.md} color={colors.primary} />}
          count={result.phones.length}
        >
          {result.phones.map((phone, index) => (
            <PhoneCard key={`phone-${index}`} phone={phone} />
          ))}
        </CollapsibleSection>
      )}

      {/* Emails */}
      {result.emails && result.emails.length > 0 && (
        <CollapsibleSection
          title="Email Addresses"
          icon={<Mail size={ICON_SIZES.md} color={colors.primary} />}
          count={result.emails.length}
        >
          {result.emails.map((email, index) => (
            <EmailCard key={`email-${index}`} email={email} />
          ))}
        </CollapsibleSection>
      )}

      {/* Addresses */}
      {result.addresses && result.addresses.length > 0 && (
        <CollapsibleSection
          title="Known Addresses"
          icon={<MapPin size={ICON_SIZES.md} color={colors.primary} />}
          count={result.addresses.length}
        >
          {result.addresses.map((address, index) => (
            <AddressCard key={`address-${index}`} address={address} />
          ))}
        </CollapsibleSection>
      )}

      {/* Properties Owned */}
      {result.properties_owned && result.properties_owned.length > 0 && (
        <CollapsibleSection
          title="Properties Owned"
          icon={<Home size={ICON_SIZES.md} color={colors.primary} />}
          count={result.properties_owned.length}
        >
          {result.properties_owned.map((property, index) => (
            <PropertyOwnershipCard key={`property-${index}`} property={property} />
          ))}
        </CollapsibleSection>
      )}

      {/* No Results Message */}
      {hasNoResults && (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 8,
            padding: 24,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <AlertCircle size={ICON_SIZES['2xl']} color={colors.mutedForeground} style={{ marginBottom: 8 }} />
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.mutedForeground }}>
            No Results Found
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: 4 }}>
            No contact information was found for this person/address combination.
          </Text>
        </View>
      )}
    </>
  );
}

export function SkipTracePendingState({ result }: SkipTraceResultSectionsProps) {
  const colors = useThemeColors();

  if (result.status !== 'pending' && result.status !== 'processing') return null;

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 24,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Loader2 size={ICON_SIZES['2xl']} color={colors.primary} style={{ marginBottom: 8 }} />
      <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>Processing...</Text>
      <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: 4 }}>
        Your skip trace is being processed. Results will appear here shortly.
      </Text>
    </View>
  );
}

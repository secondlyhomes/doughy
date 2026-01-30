// src/features/skip-tracing/screens/SkipTraceDetailScreen.tsx
// Detail screen for viewing a single skip trace result

import React, { useState } from 'react';
import { View, Text, ScrollView, RefreshControl, Alert, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Phone,
  Mail,
  MapPin,
  Home,
  User,
  Clock,
  Trash2,
  Link2,
  CheckCircle,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Building2,
  DollarSign,
} from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Badge } from '@/components/ui';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { useThemeColors } from '@/contexts/ThemeContext';
import { useSkipTraceResult, useDeleteSkipTrace } from '../hooks/useSkipTracing';
import { PhoneCard, EmailCard, AddressCard } from '../components/ContactInfoCard';
import { SKIP_TRACE_STATUS_CONFIG } from '../types';
import type { PropertyOwnership } from '../types';
import { formatRelativeTime, formatCurrency } from '@/utils/format';

// Property Ownership Card Component
function PropertyOwnershipCard({ property }: { property: PropertyOwnership }) {
  const colors = useThemeColors();

  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 8,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
        <Home size={18} color={colors.primary} style={{ marginRight: 12, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>
            {property.address}
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground }}>
            {property.city}, {property.state} {property.zip}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 8, flexWrap: 'wrap' }}>
            <Badge variant={property.ownershipType === 'investment' ? 'secondary' : 'default'}>
              <Text style={{ fontSize: 10, textTransform: 'capitalize' }}>{property.ownershipType}</Text>
            </Badge>
            {property.purchaseDate && (
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                Purchased: {new Date(property.purchaseDate).toLocaleDateString()}
              </Text>
            )}
          </View>
          {(property.purchasePrice || property.estimatedValue) && (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 8, gap: 16 }}>
              {property.purchasePrice && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <DollarSign size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    Paid: {formatCurrency(property.purchasePrice)}
                  </Text>
                </View>
              )}
              {property.estimatedValue && (
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Building2 size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
                  <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                    Est: {formatCurrency(property.estimatedValue)}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  icon,
  count,
  children,
  defaultOpen = true,
}: {
  title: string;
  icon: React.ReactNode;
  count: number;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <View style={{ marginBottom: 16 }}>
      <Pressable
        onPress={() => setIsOpen(!isOpen)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: colors.muted,
          padding: 12,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {icon}
          <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground, marginLeft: 8 }}>
            {title}
          </Text>
          <Badge variant="secondary" style={{ marginLeft: 8 }}>
            <Text style={{ fontSize: 12 }}>{count}</Text>
          </Badge>
        </View>
        {isOpen ? (
          <ChevronUp size={18} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={18} color={colors.mutedForeground} />
        )}
      </Pressable>
      {isOpen && <View style={{ paddingTop: 8 }}>{children}</View>}
    </View>
  );
}

export function SkipTraceDetailScreen() {
  const router = useRouter();
  const colors = useThemeColors();
  const { resultId } = useLocalSearchParams<{ resultId: string }>();

  const { data: result, isLoading, isRefetching, isError, error, refetch } = useSkipTraceResult(resultId);
  const deleteSkipTrace = useDeleteSkipTrace();

  const handleDelete = () => {
    if (!resultId) {
      Alert.alert('Error', 'Invalid result ID');
      return;
    }

    Alert.alert(
      'Delete Skip Trace',
      'Are you sure you want to delete this skip trace result? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSkipTrace.mutateAsync(resultId);
              router.back();
            } catch (deleteError) {
              const errorMessage = deleteError instanceof Error ? deleteError.message : 'Unknown error';
              console.error('Failed to delete skip trace:', deleteError);
              Alert.alert('Delete Failed', `Could not delete skip trace result: ${errorMessage}`);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <ScreenHeader title="Skip Trace Result" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={{ marginTop: 16, color: colors.mutedForeground }}>
            Loading skip trace result...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Handle error state separately from "not found"
  if (isError) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to load skip trace result';
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <ScreenHeader title="Skip Trace Result" />
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <AlertCircle size={48} color={colors.destructive} style={{ marginBottom: 16 }} />
          <Text style={{ fontSize: 18, fontWeight: '500', color: colors.foreground, marginBottom: 8 }}>
            Failed to Load
          </Text>
          <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 }}>
            {errorMessage}
          </Text>
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button variant="outline" onPress={() => router.back()}>
              <Text style={{ color: colors.foreground }}>Go Back</Text>
            </Button>
            <Button onPress={() => refetch()}>
              <Text style={{ color: colors.primaryForeground }}>Try Again</Text>
            </Button>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!result) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <AlertCircle size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
        <Text style={{ fontSize: 18, color: colors.mutedForeground }}>Result not found</Text>
        <Button variant="outline" onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={{ color: colors.foreground }}>Go Back</Text>
        </Button>
      </SafeAreaView>
    );
  }

  const statusConfig = SKIP_TRACE_STATUS_CONFIG[result.status];
  const displayName =
    result.contact?.first_name && result.contact?.last_name
      ? `${result.contact.first_name} ${result.contact.last_name}`
      : result.input_first_name && result.input_last_name
        ? `${result.input_first_name} ${result.input_last_name}`
        : 'Unknown Person';

  const StatusIcon = () => {
    switch (result.status) {
      case 'completed':
        return <CheckCircle size={18} color={colors.success} />;
      case 'pending':
      case 'processing':
        return <Loader2 size={18} color={colors.warning} />;
      case 'failed':
        return <AlertCircle size={18} color={colors.destructive} />;
      default:
        return <AlertCircle size={18} color={colors.mutedForeground} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ScreenHeader
        title="Skip Trace Result"
        rightAction={
          <TouchableOpacity onPress={handleDelete}>
            <Trash2 size={20} color={colors.destructive} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        {/* Header Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 8,
            padding: 16,
            marginBottom: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <View
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 24,
                  backgroundColor: colors.primary + '15',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginRight: 12,
                }}
              >
                <User size={24} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 20, fontWeight: 'bold', color: colors.foreground }}>{displayName}</Text>
                {result.input_address && (
                  <Text style={{ fontSize: 14, color: colors.mutedForeground }} numberOfLines={1}>
                    {result.input_address}, {result.input_city}, {result.input_state}
                  </Text>
                )}
              </View>
            </View>
          </View>

          {/* Status Badge */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <StatusIcon />
              <Badge
                variant={
                  statusConfig.color === 'success'
                    ? 'default'
                    : statusConfig.color === 'destructive'
                      ? 'destructive'
                      : 'secondary'
                }
                style={{ marginLeft: 8 }}
              >
                <Text style={{ fontSize: 12 }}>{statusConfig.label}</Text>
              </Badge>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Clock size={12} color={colors.mutedForeground} style={{ marginRight: 4 }} />
              <Text style={{ fontSize: 12, color: colors.mutedForeground }}>
                {formatRelativeTime(result.created_at)}
              </Text>
              {result.credits_used > 0 && (
                <Text style={{ fontSize: 12, color: colors.mutedForeground, marginLeft: 8 }}>
                  • {result.credits_used} credit{result.credits_used !== 1 ? 's' : ''}
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Error Message */}
        {result.status === 'failed' && result.error_message && (
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
              <AlertCircle size={18} color={colors.destructive} style={{ marginRight: 8, marginTop: 2 }} />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', color: colors.destructive }}>Error</Text>
                <Text style={{ fontSize: 14, color: colors.mutedForeground }}>{result.error_message}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Matched Property */}
        {result.matched_property && (
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
              <Link2 size={16} color={colors.success} style={{ marginRight: 8 }} />
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
        )}

        {/* Results Sections */}
        {result.status === 'completed' && (
          <>
            {/* Phones */}
            {result.phones && result.phones.length > 0 && (
              <CollapsibleSection
                title="Phone Numbers"
                icon={<Phone size={16} color={colors.primary} />}
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
                icon={<Mail size={16} color={colors.primary} />}
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
                icon={<MapPin size={16} color={colors.primary} />}
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
                icon={<Home size={16} color={colors.primary} />}
                count={result.properties_owned.length}
              >
                {result.properties_owned.map((property, index) => (
                  <PropertyOwnershipCard key={`property-${index}`} property={property} />
                ))}
              </CollapsibleSection>
            )}

            {/* No Results Message */}
            {(!result.phones || result.phones.length === 0) &&
              (!result.emails || result.emails.length === 0) &&
              (!result.addresses || result.addresses.length === 0) &&
              (!result.properties_owned || result.properties_owned.length === 0) && (
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
                  <AlertCircle size={32} color={colors.mutedForeground} style={{ marginBottom: 8 }} />
                  <Text style={{ fontSize: 16, fontWeight: '500', color: colors.mutedForeground }}>
                    No Results Found
                  </Text>
                  <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: 4 }}>
                    No contact information was found for this person/address combination.
                  </Text>
                </View>
              )}
          </>
        )}

        {/* Pending/Processing State */}
        {(result.status === 'pending' || result.status === 'processing') && (
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
            <Loader2 size={32} color={colors.primary} style={{ marginBottom: 8 }} />
            <Text style={{ fontSize: 16, fontWeight: '500', color: colors.foreground }}>Processing...</Text>
            <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginTop: 4 }}>
              Your skip trace is being processed. Results will appear here shortly.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

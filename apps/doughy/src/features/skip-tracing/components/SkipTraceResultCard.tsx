// src/features/skip-tracing/components/SkipTraceResultCard.tsx
// Card component for displaying skip trace results

import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, Mail, MapPin, Home, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react-native';
import { Card, CardContent, Badge } from '@/components/ui';
import type { SkipTraceResultWithRelations, SkipTraceStatus } from '../types';
import { SKIP_TRACE_STATUS_CONFIG } from '../types';
import { formatRelativeTime } from '@/utils/format';

interface SkipTraceResultCardProps {
  result: SkipTraceResultWithRelations;
  onPress?: () => void;
}

const StatusIcon: React.FC<{ status: SkipTraceStatus }> = ({ status }) => {
  const iconProps = { size: 14, className: 'mr-1' };

  switch (status) {
    case 'completed':
      return <CheckCircle {...iconProps} className="text-success mr-1" />;
    case 'pending':
    case 'processing':
      return <Loader2 {...iconProps} className="text-warning mr-1 animate-spin" />;
    case 'failed':
      return <AlertCircle {...iconProps} className="text-destructive mr-1" />;
    case 'no_results':
      return <AlertCircle {...iconProps} className="text-muted-foreground mr-1" />;
    default:
      return null;
  }
};

export const SkipTraceResultCard: React.FC<SkipTraceResultCardProps> = ({ result, onPress }) => {
  const router = useRouter();
  const statusConfig = SKIP_TRACE_STATUS_CONFIG[result.status];

  const displayName =
    result.contact?.first_name && result.contact?.last_name
      ? `${result.contact.first_name} ${result.contact.last_name}`
      : result.input_first_name && result.input_last_name
        ? `${result.input_first_name} ${result.input_last_name}`
        : 'Unknown';

  const displayAddress =
    result.input_address && result.input_city && result.input_state
      ? `${result.input_address}, ${result.input_city}, ${result.input_state}`
      : result.property
        ? `${result.property.address}, ${result.property.city}, ${result.property.state}`
        : null;

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push(`/skip-tracing/${result.id}`);
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityLabel={`View skip trace result for ${displayName}`}
      accessibilityRole="button"
      accessibilityHint={`Status: ${statusConfig.label}`}
    >
      <Card className="mb-3">
        <CardContent className="p-4">
          {/* Header */}
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-lg font-semibold text-foreground">{displayName}</Text>
            <Badge
              variant={
                statusConfig.color === 'success'
                  ? 'default'
                  : statusConfig.color === 'warning'
                    ? 'secondary'
                    : statusConfig.color === 'destructive'
                      ? 'destructive'
                      : 'outline'
              }
            >
              <View className="flex-row items-center">
                <StatusIcon status={result.status} />
                <Text className="text-xs">{statusConfig.label}</Text>
              </View>
            </Badge>
          </View>

          {/* Input Address */}
          {displayAddress && (
            <View className="flex-row items-center mb-2">
              <MapPin size={14} className="text-muted-foreground mr-2" />
              <Text className="text-sm text-muted-foreground flex-1" numberOfLines={1}>
                {displayAddress}
              </Text>
            </View>
          )}

          {/* Results Summary */}
          {result.status === 'completed' && (
            <View className="flex-row items-center gap-4 mt-2 pt-2 border-t border-border">
              {/* Phones */}
              <View className="flex-row items-center">
                <Phone size={14} className="text-primary mr-1" />
                <Text className="text-sm font-medium text-foreground">
                  {result.phones?.length || 0}
                </Text>
              </View>

              {/* Emails */}
              <View className="flex-row items-center">
                <Mail size={14} className="text-primary mr-1" />
                <Text className="text-sm font-medium text-foreground">
                  {result.emails?.length || 0}
                </Text>
              </View>

              {/* Addresses */}
              <View className="flex-row items-center">
                <MapPin size={14} className="text-primary mr-1" />
                <Text className="text-sm font-medium text-foreground">
                  {result.addresses?.length || 0}
                </Text>
              </View>

              {/* Properties Owned */}
              {(result.properties_owned?.length ?? 0) > 0 && (
                <View className="flex-row items-center">
                  <Home size={14} className="text-primary mr-1" />
                  <Text className="text-sm font-medium text-foreground">
                    {result.properties_owned?.length}
                  </Text>
                </View>
              )}
            </View>
          )}

          {/* Matched Property */}
          {result.matched_property && (
            <View className="flex-row items-center mt-2 pt-2 border-t border-border">
              <Home size={14} className="text-success mr-2" />
              <Text className="text-sm text-success flex-1" numberOfLines={1}>
                Matched: {result.matched_property.address}
              </Text>
              {result.match_confidence && (
                <Text className="text-xs text-muted-foreground">
                  {result.match_confidence}% confidence
                </Text>
              )}
            </View>
          )}

          {/* Timestamp */}
          <View className="flex-row items-center mt-2">
            <Clock size={12} className="text-muted-foreground mr-1" />
            <Text className="text-xs text-muted-foreground">
              {formatRelativeTime(result.created_at)}
            </Text>
            {result.credits_used > 0 && (
              <Text className="text-xs text-muted-foreground ml-2">
                • {result.credits_used} credit{result.credits_used !== 1 ? 's' : ''}
              </Text>
            )}
          </View>
        </CardContent>
      </Card>
    </Pressable>
  );
};

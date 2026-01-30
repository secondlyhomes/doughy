// Lead Card Component - React Native
// Converted from web app lead card components
// Now uses DataCard for consistency

import React from 'react';
import { View, Text } from 'react-native';
import {
  Star,
  Phone,
  Mail,
  ChevronRight,
  MapPin
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';

// Zone A UI Components
import { DataCard, DataCardField } from '@/components/ui';

// Shared formatters
import { formatStatus, getStatusBadgeVariant, getScoreColor } from '@/lib/formatters';

import { Lead } from '../types';

interface LeadCardProps {
  lead: Lead;
  onPress: () => void;
  /** Card variant: 'default' for solid, 'glass' for glass effect */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 55 */
  glassIntensity?: number;
}

export function LeadCard({ lead, onPress, variant = 'default', glassIntensity = 55 }: LeadCardProps) {
  const colors = useThemeColors();

  // Build fields array from lead data
  const fields: DataCardField[] = [
    ...(lead.email ? [{ icon: Mail, value: lead.email }] : []),
    ...(lead.phone ? [{ icon: Phone, value: lead.phone }] : []),
    ...((lead.city || lead.state) ? [{
      icon: MapPin,
      value: [lead.city, lead.state].filter(Boolean).join(', '),
    }] : []),
  ];

  // Build badges array
  const cardBadges = [
    ...(lead.tags?.slice(0, 2).map(tag => ({
      label: tag,
      variant: 'outline' as const,
      size: 'sm' as const,
    })) || []),
  ];

  return (
    <DataCard
      onPress={onPress}
      variant={variant}
      glassIntensity={glassIntensity}
      title={lead.name || 'Unnamed Lead'}
      subtitle={lead.company}
      headerIcon={lead.starred ? Star : undefined}
      headerBadge={{
        label: formatStatus(lead.status),
        variant: getStatusBadgeVariant(lead.status),
        size: 'sm',
      }}
      headerRight={<ChevronRight size={ICON_SIZES.lg} color={colors.mutedForeground} />}
      fields={fields}
      badges={cardBadges}
      footerContent={
        <View className="flex-row items-center justify-between mb-2">
          {/* Score */}
          {lead.score !== undefined && (
            <View className="flex-row items-center">
              <Text className="text-sm font-medium" style={{ color: getScoreColor(lead.score, colors) }}>
                {lead.score}
              </Text>
              <Text className="text-xs ml-0.5" style={{ color: colors.mutedForeground }}>
                pts
              </Text>
            </View>
          )}
          {/* Tag overflow indicator */}
          {lead.tags && lead.tags.length > 2 && (
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              +{lead.tags.length - 2} more tags
            </Text>
          )}
        </View>
      }
    />
  );
}

export default LeadCard;

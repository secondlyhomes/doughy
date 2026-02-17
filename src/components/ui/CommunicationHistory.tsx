// src/components/ui/CommunicationHistory.tsx
// Read-only communication history for lead/contact detail screens
// Displays calls and touches in chronological order

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Phone, Mail, MessageSquare, Clock, ExternalLink } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES, ICON_SIZES } from '@/constants/design-tokens';
import { formatDate } from '@/lib/formatters';

export interface CommunicationEntry {
  id: string;
  type: 'call' | 'sms' | 'email' | 'whatsapp' | 'note';
  direction?: 'inbound' | 'outbound';
  summary: string;
  timestamp: string;
  duration?: number; // seconds, for calls
}

export interface CommunicationHistoryProps {
  entries: CommunicationEntry[];
  /** Whether to show the "Continue in CallPilot" button */
  showCallPilotLink?: boolean;
  onOpenCallPilot?: () => void;
  /** Max entries to show (default: 5) */
  maxEntries?: number;
}

const typeIcons = {
  call: Phone,
  sms: MessageSquare,
  email: Mail,
  whatsapp: MessageSquare,
  note: Clock,
};

const typeLabels = {
  call: 'Call',
  sms: 'SMS',
  email: 'Email',
  whatsapp: 'WhatsApp',
  note: 'Note',
};

function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
}

export function CommunicationHistory({
  entries,
  showCallPilotLink = true,
  onOpenCallPilot,
  maxEntries = 5,
}: CommunicationHistoryProps) {
  const colors = useThemeColors();
  const visibleEntries = entries.slice(0, maxEntries);

  if (entries.length === 0) {
    return (
      <View style={{ paddingVertical: SPACING.lg, alignItems: 'center' }}>
        <Text style={{ color: colors.mutedForeground, fontSize: FONT_SIZES.sm }}>
          No communication history yet
        </Text>
      </View>
    );
  }

  return (
    <View>
      {visibleEntries.map((entry, index) => {
        const IconComponent = typeIcons[entry.type] || Clock;
        const isLast = index === visibleEntries.length - 1;

        return (
          <View
            key={entry.id}
            style={{
              flexDirection: 'row',
              paddingVertical: SPACING.sm,
              borderBottomWidth: isLast ? 0 : 1,
              borderBottomColor: colors.border,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: colors.muted,
                alignItems: 'center',
                justifyContent: 'center',
                marginRight: SPACING.sm,
              }}
            >
              <IconComponent size={ICON_SIZES.sm} color={colors.mutedForeground} />
            </View>

            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: FONT_SIZES.sm, fontWeight: '500', color: colors.foreground }}>
                  {typeLabels[entry.type]}
                  {entry.direction && ` (${entry.direction})`}
                </Text>
                <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground }}>
                  {formatDate(entry.timestamp)}
                </Text>
              </View>

              <Text
                style={{ fontSize: FONT_SIZES.sm, color: colors.mutedForeground, marginTop: 2 }}
                numberOfLines={2}
              >
                {entry.summary}
              </Text>

              {entry.duration !== undefined && (
                <Text style={{ fontSize: FONT_SIZES.xs, color: colors.mutedForeground, marginTop: 2 }}>
                  Duration: {formatDuration(entry.duration)}
                </Text>
              )}
            </View>
          </View>
        );
      })}

      {entries.length > maxEntries && (
        <Text style={{ textAlign: 'center', color: colors.mutedForeground, fontSize: FONT_SIZES.xs, marginTop: SPACING.sm }}>
          +{entries.length - maxEntries} more
        </Text>
      )}

      {showCallPilotLink && onOpenCallPilot && (
        <TouchableOpacity
          onPress={onOpenCallPilot}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            paddingVertical: SPACING.sm,
            marginTop: SPACING.sm,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            gap: SPACING.xs,
          }}
          accessibilityLabel="Continue in CallPilot"
          accessibilityRole="link"
        >
          <Text style={{ color: colors.primary, fontSize: FONT_SIZES.sm, fontWeight: '600' }}>
            Continue in CallPilot
          </Text>
          <ExternalLink size={14} color={colors.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
}

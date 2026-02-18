// src/features/lead-inbox/components/ChannelSelector.tsx
// Channel selector component for choosing SMS or Email when composing messages

import React, { memo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Mail, MessageSquare, Phone, AlertCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import type { InvestorChannel } from '../types';

interface ChannelSelectorProps {
  selectedChannel: InvestorChannel;
  onSelectChannel: (channel: InvestorChannel) => void;
  availableChannels?: InvestorChannel[];
  leadOptStatus?: string | null;
  leadPhone?: string | null;
  leadEmail?: string | null;
  disabled?: boolean;
}

function getChannelIcon(channel: InvestorChannel) {
  switch (channel) {
    case 'email':
      return Mail;
    case 'sms':
    case 'whatsapp':
      return MessageSquare;
    case 'phone':
      return Phone;
    default:
      return MessageSquare;
  }
}

function getChannelLabel(channel: InvestorChannel): string {
  switch (channel) {
    case 'email':
      return 'Email';
    case 'sms':
      return 'SMS';
    case 'whatsapp':
      return 'WhatsApp';
    case 'phone':
      return 'Phone';
    default:
      return channel;
  }
}

function isChannelAvailable(
  channel: InvestorChannel,
  leadPhone?: string | null,
  leadEmail?: string | null,
  leadOptStatus?: string | null
): { available: boolean; reason?: string } {
  switch (channel) {
    case 'sms':
    case 'whatsapp':
    case 'phone':
      if (!leadPhone) {
        return { available: false, reason: 'No phone number' };
      }
      if (leadOptStatus === 'opted_out') {
        return { available: false, reason: 'Lead opted out of SMS' };
      }
      return { available: true };
    case 'email':
      if (!leadEmail) {
        return { available: false, reason: 'No email address' };
      }
      return { available: true };
    default:
      return { available: true };
  }
}

export const ChannelSelector = memo(function ChannelSelector({
  selectedChannel,
  onSelectChannel,
  availableChannels = ['sms', 'email'],
  leadOptStatus,
  leadPhone,
  leadEmail,
  disabled = false,
}: ChannelSelectorProps) {
  const colors = useThemeColors();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: colors.mutedForeground }]}>
        Send via
      </Text>
      <View style={styles.channelsRow}>
        {availableChannels.map((channel) => {
          const { available, reason } = isChannelAvailable(
            channel,
            leadPhone,
            leadEmail,
            leadOptStatus
          );
          const isSelected = selectedChannel === channel;
          const ChannelIcon = getChannelIcon(channel);
          const isDisabled = disabled || !available;

          return (
            <TouchableOpacity
              key={channel}
              onPress={() => !isDisabled && onSelectChannel(channel)}
              disabled={isDisabled}
              style={[
                styles.channelButton,
                {
                  backgroundColor: isSelected
                    ? colors.primary
                    : isDisabled
                    ? withOpacity(colors.muted, 'medium')
                    : colors.muted,
                  borderColor: isSelected ? colors.primary : colors.border,
                  opacity: isDisabled ? 0.6 : 1,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${getChannelLabel(channel)}${isSelected ? ', selected' : ''}${!available ? `, ${reason}` : ''}`}
              accessibilityState={{ selected: isSelected, disabled: isDisabled }}
            >
              <ChannelIcon
                size={16}
                color={isSelected ? colors.primaryForeground : colors.foreground}
              />
              <Text
                style={[
                  styles.channelLabel,
                  {
                    color: isSelected ? colors.primaryForeground : colors.foreground,
                  },
                ]}
              >
                {getChannelLabel(channel)}
              </Text>
              {!available && (
                <AlertCircle size={12} color={colors.warning} style={styles.warningIcon} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Opt-status warning for SMS */}
      {selectedChannel === 'sms' && leadOptStatus && leadOptStatus !== 'opted_in' && (
        <View
          style={[
            styles.warningBanner,
            {
              backgroundColor: withOpacity(
                leadOptStatus === 'opted_out' ? colors.destructive : colors.warning,
                'light'
              ),
            },
          ]}
        >
          <AlertCircle
            size={14}
            color={leadOptStatus === 'opted_out' ? colors.destructive : colors.warning}
          />
          <Text
            style={[
              styles.warningText,
              {
                color: leadOptStatus === 'opted_out' ? colors.destructive : colors.warning,
              },
            ]}
          >
            {leadOptStatus === 'opted_out'
              ? 'Lead has opted out of SMS. Use email instead.'
              : leadOptStatus === 'pending'
              ? 'SMS consent pending. First message will request opt-in.'
              : 'SMS consent status unknown.'}
          </Text>
        </View>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONT_SIZES.xs,
    fontWeight: '500',
    marginBottom: SPACING.xs,
  },
  channelsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  channelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
  },
  channelLabel: {
    fontSize: FONT_SIZES.sm,
    fontWeight: '500',
  },
  warningIcon: {
    marginLeft: 4,
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  warningText: {
    fontSize: FONT_SIZES.xs,
    flex: 1,
  },
});

export default ChannelSelector;

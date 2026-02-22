/**
 * ContactCard Component
 *
 * Full card for hot/warm contacts with module badge, temperature badge,
 * module-specific subtitle, and quick-action icons.
 */

import { View, TouchableOpacity, Pressable, ViewStyle } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { triggerImpact } from '@/utils/haptics'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { TemperatureBadge } from '../TemperatureBadge'
import type { Contact } from '@/types'
import { MODULE_ICONS, CONTACT_TYPE_LABELS } from '@/types/contact'
import { formatRelativeTime, truncate } from '@/utils/formatters'

export interface ContactCardProps {
  contact: Contact
  onPress: (contact: Contact) => void
  onCall?: (contact: Contact) => void
  onMessage?: (contact: Contact) => void
  style?: ViewStyle
}

export function ContactCard({ contact, onPress, onCall, onMessage, style }: ContactCardProps) {
  const { theme } = useTheme()

  function handlePress() {
    triggerImpact(Haptics.ImpactFeedbackStyle.Light)
    onPress(contact)
  }

  const moduleIcon = MODULE_ICONS[contact.module]
  const contactTypeLabel = contact.contactType
    ? CONTACT_TYPE_LABELS[contact.contactType]
    : contact.role || ''

  const hasPhone = !!contact.phone
  const callDisabled = !hasPhone

  // Module-specific subtitle
  let subtitle = ''
  if (contact.module === 'investor') {
    subtitle = contact.address || contact.company || ''
  } else if (contact.contactType === 'contractor' && contact.contractorInfo) {
    subtitle = `Specialty: ${contact.contractorInfo.specialty}`
  } else if (contact.contactType === 'tenant' && contact.leaseInfo) {
    subtitle = contact.leaseInfo.unitNumber
      ? `Unit ${contact.leaseInfo.unitNumber}, ${contact.leaseInfo.propertyAddress}`
      : contact.leaseInfo.propertyAddress
  } else {
    subtitle = contact.address || ''
  }

  // Module-specific bottom-line info
  let bottomInfo = ''
  if (contact.module === 'investor' && contact.estimatedPremium > 0) {
    bottomInfo = `$${contact.estimatedPremium.toLocaleString()}`
  } else if (contact.contactType === 'contractor' && contact.contractorInfo) {
    bottomInfo = `${contact.contractorInfo.totalJobs} jobs \u00B7 avg $${contact.contractorInfo.avgJobCost}`
  } else if (contact.contactType === 'tenant' && contact.leaseInfo) {
    const end = new Date(contact.leaseInfo.leaseEnd)
    bottomInfo = `Lease: ${end.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`
  }

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={`${contact.firstName} ${contact.lastName}, ${contactTypeLabel}`}
      style={[
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.tokens.borderRadius.lg,
          padding: theme.tokens.spacing[4],
          ...theme.tokens.shadows.sm,
        },
        style,
      ]}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1, marginRight: theme.tokens.spacing[3] }}>
          <Text variant="h5">
            {contact.firstName} {contact.lastName}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1], marginTop: 2 }}>
            <Text variant="caption" color={theme.colors.text.secondary}>
              {moduleIcon} {contact.module === 'investor' ? 'Investor' : 'Landlord'}
            </Text>
            {contactTypeLabel ? (
              <>
                <Text variant="caption" color={theme.colors.text.tertiary}>{'\u00B7'}</Text>
                <Text variant="caption" color={theme.colors.text.secondary}>{contactTypeLabel}</Text>
              </>
            ) : null}
          </View>
        </View>
        <TemperatureBadge temperature={contact.temperature} />
      </View>

      {subtitle ? (
        <Text
          variant="bodySmall"
          color={theme.colors.text.secondary}
          numberOfLines={1}
          style={{ marginTop: theme.tokens.spacing[2] }}
        >
          {subtitle}
        </Text>
      ) : null}

      {/* Context snippet from notes */}
      {contact.notes ? (
        <Text
          variant="caption"
          color={theme.colors.text.tertiary}
          numberOfLines={2}
          style={{ marginTop: theme.tokens.spacing[1] }}
        >
          {truncate(contact.notes, 100)}
        </Text>
      ) : null}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: theme.tokens.spacing[3] }}>
        <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[4] }}>
          {bottomInfo ? (
            <Text variant="caption" weight="semibold" color={theme.colors.text.secondary}>
              {bottomInfo}
            </Text>
          ) : null}
          {contact.lastContactDate ? (
            <Text variant="caption" color={theme.colors.text.tertiary}>
              {formatRelativeTime(contact.lastContactDate)}
            </Text>
          ) : null}
        </View>

        {/* Quick action icons */}
        <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[3] }}>
          {onCall && (
            <Pressable
              onPress={() => {
                if (!callDisabled) {
                  triggerImpact(Haptics.ImpactFeedbackStyle.Medium)
                  onCall(contact)
                }
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Call"
              accessibilityRole="button"
              style={{ opacity: callDisabled ? 0.3 : 1 }}
            >
              <Ionicons name="call-outline" size={18} color={theme.colors.success[500]} />
            </Pressable>
          )}
          {onMessage && (
            <Pressable
              onPress={() => {
                triggerImpact(Haptics.ImpactFeedbackStyle.Light)
                onMessage(contact)
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Message"
              accessibilityRole="button"
            >
              <Ionicons name="chatbubble-outline" size={18} color={theme.colors.info[500]} />
            </Pressable>
          )}
        </View>
      </View>
    </TouchableOpacity>
  )
}

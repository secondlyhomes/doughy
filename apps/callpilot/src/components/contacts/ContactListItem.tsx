/**
 * ContactListItem
 *
 * Compact row for cold contacts — avatar initials, module badge, name, type, chevron.
 */

import { View, TouchableOpacity } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { Text } from '@/components/Text'
import { formatRelativeTime } from '@/utils/formatters'
import { MODULE_ICONS, CONTACT_TYPE_LABELS } from '@/types/contact'
import type { Contact } from '@/types'

export interface ContactListItemProps {
  contact: Contact
  onPress: (contact: Contact) => void
}

export function ContactListItem({ contact, onPress }: ContactListItemProps) {
  const { theme } = useTheme()
  const initials = `${contact.firstName[0] ?? ''}${contact.lastName[0] ?? ''}`
  const tempColor = callpilotColors.temperature[contact.temperature]
  const moduleIcon = MODULE_ICONS[contact.module]
  const typeLabel = contact.contactType
    ? CONTACT_TYPE_LABELS[contact.contactType]
    : contact.company || ''

  return (
    <TouchableOpacity
      onPress={() => onPress(contact)}
      accessibilityRole="button"
      accessibilityLabel={`${contact.firstName} ${contact.lastName}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: theme.tokens.spacing[4],
        paddingVertical: theme.tokens.spacing[3],
        backgroundColor: theme.colors.background,
      }}
    >
      {/* Avatar with temperature dot */}
      <View style={{ position: 'relative', marginRight: theme.tokens.spacing[3] }}>
        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
            backgroundColor: theme.colors.primary[100],
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text variant="bodySmall" weight="bold" color={theme.colors.primary[700]}>
            {initials}
          </Text>
        </View>
        <View
          style={{
            position: 'absolute',
            bottom: 0,
            right: 0,
            width: 10,
            height: 10,
            borderRadius: 5,
            backgroundColor: tempColor,
            borderWidth: theme.tokens.borderWidth[2],
            borderColor: theme.colors.background,
          }}
        />
      </View>

      {/* Name + Module/Type */}
      <View style={{ flex: 1 }}>
        <Text variant="body" weight="semibold" numberOfLines={1}>
          {contact.firstName} {contact.lastName}
        </Text>
        <Text variant="caption" color={theme.colors.text.secondary} numberOfLines={1}>
          {moduleIcon} {typeLabel}
        </Text>
      </View>

      {/* Last contact date */}
      {contact.lastContactDate ? (
        <Text variant="caption" color={theme.colors.text.tertiary} style={{ marginRight: theme.tokens.spacing[2] }}>
          {formatRelativeTime(contact.lastContactDate)}
        </Text>
      ) : null}

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
    </TouchableOpacity>
  )
}

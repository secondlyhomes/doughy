/**
 * ContactHeader
 *
 * Contact name, temperature badge, module label, and contact info rows
 * for the contact detail screen.
 */

import { View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '@/components'
import { TemperatureBadge } from '@/components/TemperatureBadge'
import { MODULE_ICONS, CONTACT_TYPE_LABELS } from '@/types/contact'
import type { Contact } from '@/types'

interface ContactHeaderProps {
  contact: Contact
}

export function ContactHeader({ contact }: ContactHeaderProps) {
  const { theme } = useTheme()

  const moduleIcon = MODULE_ICONS[contact.module]
  const moduleLabel = contact.module === 'investor' ? 'Investor' : 'Landlord'
  const contactTypeLabel = contact.contactType
    ? CONTACT_TYPE_LABELS[contact.contactType]
    : ''

  const infoRows = ([
    { icon: 'location-outline' as const, value: contact.address },
    { icon: 'call-outline' as const, value: contact.phone },
    { icon: 'mail-outline' as const, value: contact.email },
  ] as const).filter((row) => row.value)

  return (
    <>
      {/* Name + Temperature */}
      <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
          <Text variant="h2">{contact.firstName} {contact.lastName}</Text>
          <TemperatureBadge temperature={contact.temperature} size="md" />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1], marginTop: theme.tokens.spacing[1] }}>
          <Text variant="bodySmall" weight="semibold" color={theme.colors.primary[500]}>
            {moduleIcon} {moduleLabel}
          </Text>
          {contactTypeLabel ? (
            <>
              <Text variant="bodySmall" color={theme.colors.text.tertiary}>{'\u00B7'}</Text>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>{contactTypeLabel}</Text>
            </>
          ) : null}
        </View>
      </View>

      {/* Contact Info Rows */}
      <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[4], gap: theme.tokens.spacing[2] }}>
        {infoRows.map((row) => (
          <View key={row.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
            <Ionicons name={row.icon} size={16} color={theme.colors.text.secondary} />
            <Text variant="bodySmall" color={theme.colors.text.secondary}>{row.value}</Text>
          </View>
        ))}
      </View>
    </>
  )
}

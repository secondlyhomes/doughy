/**
 * ModuleInfoSection
 *
 * Module-specific detail section: Deal Info (investor), Lease Info (tenant),
 * Contractor Info (contractor). Returns null if no relevant data.
 */

import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text, Card, SectionHeader } from '@/components'
import type { Contact } from '@/types'

interface ModuleInfoSectionProps {
  contact: Contact
}

function InfoRow({ label, value, isFirst }: { label: string; value: string; isFirst: boolean }) {
  const { theme } = useTheme()
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: isFirst ? 0 : theme.tokens.spacing[2] }}>
      <Text variant="bodySmall" color={theme.colors.text.secondary}>{label}</Text>
      <Text variant="bodySmall" weight="semibold">{value}</Text>
    </View>
  )
}

export function ModuleInfoSection({ contact }: ModuleInfoSectionProps) {
  const { theme } = useTheme()

  if (contact.module === 'investor' && contact.estimatedPremium > 0) {
    const rows = [
      { label: 'Offer Price', value: `$${contact.estimatedPremium.toLocaleString()}` },
      { label: 'Status', value: contact.status.charAt(0).toUpperCase() + contact.status.slice(1) },
      { label: 'Source', value: contact.source.charAt(0).toUpperCase() + contact.source.slice(1) },
    ]
    return (
      <View style={{ marginTop: theme.tokens.spacing[4] }}>
        <SectionHeader title="Deal Info" />
        <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
          <Card variant="outlined" padding="md">
            {rows.map((row, i) => (
              <InfoRow key={row.label} label={row.label} value={row.value} isFirst={i === 0} />
            ))}
          </Card>
        </View>
      </View>
    )
  }

  if (contact.contactType === 'tenant' && contact.leaseInfo) {
    const lease = contact.leaseInfo
    const rows = [
      { label: 'Property', value: lease.propertyAddress },
      ...(lease.unitNumber ? [{ label: 'Unit', value: lease.unitNumber }] : []),
      { label: 'Lease Start', value: new Date(lease.leaseStart).toLocaleDateString() },
      { label: 'Lease End', value: new Date(lease.leaseEnd).toLocaleDateString() },
      { label: 'Monthly Rent', value: `$${lease.monthlyRent.toLocaleString()}` },
    ]
    return (
      <View style={{ marginTop: theme.tokens.spacing[4] }}>
        <SectionHeader title="Lease Info" />
        <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
          <Card variant="outlined" padding="md">
            {rows.map((row, i) => (
              <InfoRow key={row.label} label={row.label} value={row.value} isFirst={i === 0} />
            ))}
          </Card>
        </View>
      </View>
    )
  }

  if (contact.contactType === 'contractor' && contact.contractorInfo) {
    const info = contact.contractorInfo
    const rows = [
      { label: 'Specialty', value: info.specialty },
      { label: 'Total Jobs', value: `${info.totalJobs}` },
      { label: 'Avg Cost', value: `$${info.avgJobCost}` },
      ...(info.avgResponseTime ? [{ label: 'Avg Response', value: info.avgResponseTime }] : []),
    ]
    return (
      <View style={{ marginTop: theme.tokens.spacing[4] }}>
        <SectionHeader title="Contractor Info" />
        <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
          <Card variant="outlined" padding="md">
            {rows.map((row, i) => (
              <InfoRow key={row.label} label={row.label} value={row.value} isFirst={i === 0} />
            ))}
          </Card>
        </View>
      </View>
    )
  }

  return null
}

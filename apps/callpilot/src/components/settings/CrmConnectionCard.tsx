/**
 * CrmConnectionCard
 *
 * Shows connected CRM status in settings.
 */

import { View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { withOpacity } from '@/utils/formatters'
import { Text, Card, StatusBadge } from '@/components'

export function CrmConnectionCard() {
  const { theme } = useTheme()

  return (
    <View style={{ paddingHorizontal: theme.tokens.spacing[4], gap: theme.tokens.spacing[2] }}>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="body" weight="semibold">Doughy</Text>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              Syncing contacts and deals
            </Text>
          </View>
          <StatusBadge
            label="Connected"
            color={theme.colors.success[500]}
            backgroundColor={withOpacity(theme.colors.success[500], 'light')}
          />
        </View>
      </Card>
      <Card variant="outlined">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
          <Ionicons name="add-circle-outline" size={20} color={theme.colors.text.tertiary} />
          <View>
            <Text variant="body" color={theme.colors.text.secondary}>Connect another CRM</Text>
            <Text variant="caption" color={theme.colors.text.tertiary}>HubSpot, Salesforce, Podio (Coming soon)</Text>
          </View>
        </View>
      </Card>
    </View>
  )
}

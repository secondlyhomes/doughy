/**
 * ApproachTab
 *
 * Shows suggested approach, watch-out-for warnings, and relationship strength.
 */

import { View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Card } from '../Card'
import { StatusBadge } from '../StatusBadge'
import type { CallCoaching } from '@/types'

export interface ApproachTabProps {
  coaching: CallCoaching
}

export function ApproachTab({ coaching }: ApproachTabProps) {
  const { theme } = useTheme()

  return (
    <View style={{ gap: theme.tokens.spacing[4] }}>
      {/* Relationship strength */}
      {coaching.relationshipStrength ? (
        <StatusBadge
          label={coaching.relationshipStrength}
          variant="relationship"
          relationship={coaching.relationshipStrength}
          size="md"
        />
      ) : null}

      {/* Suggested approach */}
      <Card variant="filled" padding="md">
        <Text
          variant="caption"
          weight="semibold"
          color={theme.colors.primary[400]}
          style={{ marginBottom: theme.tokens.spacing[2] }}
        >
          SUGGESTED APPROACH
        </Text>
        <Text variant="body" color={theme.tokens.colors.white}>
          {coaching.suggestedApproach}
        </Text>
      </Card>

      {/* Watch out for */}
      {coaching.watchOutFor.length > 0 ? (
        <View style={{ gap: theme.tokens.spacing[2] }}>
          <Text
            variant="caption"
            weight="semibold"
            color={theme.colors.warning[400]}
          >
            WATCH OUT FOR
          </Text>
          {coaching.watchOutFor.map((item, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: theme.tokens.spacing[2],
              }}
            >
              <Ionicons
                name="warning-outline"
                size={16}
                color={theme.colors.warning[400]}
                style={{ marginTop: 2 }}
              />
              <Text
                variant="bodySmall"
                color={theme.colors.warning[300]}
                style={{ flex: 1 }}
              >
                {item}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

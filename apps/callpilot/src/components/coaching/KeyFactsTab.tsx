/**
 * KeyFactsTab
 *
 * Shows key facts as insight badges and objections with warning styling.
 */

import { View } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { KeyInsightBadge } from '../briefs/KeyInsightBadge'
import type { CallCoaching } from '@/types'

export interface KeyFactsTabProps {
  coaching: CallCoaching
}

export function KeyFactsTab({ coaching }: KeyFactsTabProps) {
  const { theme } = useTheme()

  return (
    <View style={{ gap: theme.tokens.spacing[4] }}>
      {/* Key facts */}
      {coaching.keyFacts.length > 0 ? (
        <View style={{ gap: theme.tokens.spacing[2] }}>
          <Text
            variant="caption"
            weight="semibold"
            color={theme.colors.info[400]}
          >
            KEY FACTS
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {coaching.keyFacts.map((fact, index) => (
              <KeyInsightBadge key={index} text={fact} />
            ))}
          </View>
        </View>
      ) : null}

      {/* Objections */}
      {coaching.objections.length > 0 ? (
        <View style={{ gap: theme.tokens.spacing[2] }}>
          <Text
            variant="caption"
            weight="semibold"
            color={theme.colors.warning[400]}
          >
            KNOWN OBJECTIONS
          </Text>
          {coaching.objections.map((objection, index) => (
            <View
              key={index}
              style={{
                flexDirection: 'row',
                alignItems: 'flex-start',
                gap: theme.tokens.spacing[2],
              }}
            >
              <Ionicons
                name="shield-outline"
                size={16}
                color={theme.colors.warning[400]}
                style={{ marginTop: 2 }}
              />
              <Text
                variant="bodySmall"
                color={theme.colors.warning[300]}
                style={{ flex: 1 }}
              >
                {objection}
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  )
}

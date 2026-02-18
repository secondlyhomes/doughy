/**
 * Per-Action Overrides Screen
 *
 * Shows global trust level at top, then categorized action types
 * with per-action trust level pickers.
 */

import { View, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { useTrustLevel } from '@/hooks/useTrustLevel'
import { Text } from '@/components/Text'
import { Card } from '@/components/Card/Card'
import { Badge } from '@/components/Badge/Badge'
import { ACTION_CATEGORIES } from '@/constants/trust'
import { TRUST_LEVEL_CONFIGS, TRUST_LEVEL_ORDER } from '@/types'
import type { TrustLevel } from '@/types'

function TrustLevelSelector({
  actionType,
  currentLevel,
  globalLevel,
  onSelect,
}: {
  actionType: string
  currentLevel: TrustLevel | null
  globalLevel: TrustLevel
  onSelect: (actionType: string, level: TrustLevel | null) => void
}) {
  const { theme } = useTheme()
  const effective = currentLevel ?? globalLevel

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: theme.tokens.spacing[3],
      }}
    >
      <View style={{ flex: 1 }}>
        <Text variant="body">{actionType.replace(/_/g, ' ')}</Text>
        {currentLevel && (
          <Text variant="caption" color={theme.colors.primary[500]}>Override active</Text>
        )}
      </View>

      <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[1] }}>
        {TRUST_LEVEL_ORDER.map((level) => {
          const lvlConfig = TRUST_LEVEL_CONFIGS[level]
          const isActive = effective === level

          return (
            <TouchableOpacity
              key={level}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                if (level === globalLevel && currentLevel !== null) {
                  onSelect(actionType, null) // remove override
                } else {
                  onSelect(actionType, level)
                }
              }}
              style={{
                width: 32,
                height: 32,
                borderRadius: theme.tokens.borderRadius.md,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isActive ? lvlConfig.color : 'transparent',
                borderWidth: 1,
                borderColor: isActive ? lvlConfig.color : theme.colors.border,
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={lvlConfig.label}
            >
              <Text variant="caption" color={isActive ? '#fff' : theme.colors.text.tertiary}>
                {lvlConfig.emoji}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>
    </View>
  )
}

export default function PerActionOverridesScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { trustLevel, overrides, setOverride, removeOverride } = useTrustLevel()
  const globalConfig = TRUST_LEVEL_CONFIGS[trustLevel]

  function handleSelect(actionType: string, level: TrustLevel | null) {
    if (level === null) {
      removeOverride(actionType)
    } else {
      setOverride({ actionType, trustLevel: level })
    }
  }

  function getOverrideLevel(actionType: string): TrustLevel | null {
    const override = overrides.find((o) => o.actionType === actionType)
    return override?.trustLevel ?? null
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.tokens.spacing[4],
          gap: theme.tokens.spacing[3],
        }}
      >
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" accessibilityLabel="Go back">
          <Ionicons name="arrow-back" size={24} color={theme.colors.text.primary} />
        </TouchableOpacity>
        <Text variant="h3" weight="bold">Per-Action Overrides</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.tokens.spacing[4], paddingBottom: theme.tokens.spacing[10] }}>
        {/* Global level info */}
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <Text variant="bodySmall" color={theme.colors.text.tertiary} style={{ marginBottom: theme.tokens.spacing[1] }}>
            Global Trust Level
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2] }}>
            <Text variant="h3">{globalConfig.emoji}</Text>
            <Text variant="body" weight="bold">{globalConfig.label}</Text>
            <Badge label={globalConfig.queueBehavior} variant="default" />
          </View>
          <Text variant="caption" color={theme.colors.text.secondary} style={{ marginTop: theme.tokens.spacing[1] }}>
            Actions without an override use this level.
          </Text>
        </Card>

        {/* Legend */}
        <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[3], marginBottom: theme.tokens.spacing[3] }}>
          {TRUST_LEVEL_ORDER.map((level) => (
            <View key={level} style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text variant="caption">{TRUST_LEVEL_CONFIGS[level].emoji}</Text>
              <Text variant="caption" color={theme.colors.text.tertiary}>{TRUST_LEVEL_CONFIGS[level].label}</Text>
            </View>
          ))}
        </View>

        {/* Action categories */}
        {ACTION_CATEGORIES.map(({ category, actions }) => (
          <Card key={category} variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[3] }}>
            <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[1] }}>
              {category}
            </Text>
            {actions.map((action) => (
              <TrustLevelSelector
                key={action}
                actionType={action}
                currentLevel={getOverrideLevel(action)}
                globalLevel={trustLevel}
                onSelect={handleSelect}
              />
            ))}
          </Card>
        ))}
      </ScrollView>
    </SafeAreaView>
  )
}

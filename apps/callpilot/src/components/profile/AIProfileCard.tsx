import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Card } from '../Card'
import { StatusBadge } from '../StatusBadge'
import type { CommunicationStyleProfile } from '@/types'

export interface AIProfileCardProps {
  profile: CommunicationStyleProfile
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}

export function AIProfileCard({ profile }: AIProfileCardProps) {
  const { theme } = useTheme()

  return (
    <View style={{ gap: theme.tokens.spacing[4] }}>
      {/* Confidence & Stats */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View>
            <Text variant="h5">AI Confidence</Text>
            <Text variant="caption" color={theme.colors.text.secondary}>
              Based on {profile.communicationsAnalyzed} communications
            </Text>
          </View>
          <Text variant="h3" color={theme.colors.primary[500]}>
            {formatPercent(profile.confidenceScore)}
          </Text>
        </View>
        {/* Progress bar */}
        <View
          style={{
            height: 6,
            backgroundColor: theme.colors.surfaceSecondary,
            borderRadius: theme.tokens.borderRadius.full,
            overflow: 'hidden',
            marginTop: theme.tokens.spacing[3],
          }}
        >
          <View
            style={{
              width: `${Math.round(profile.confidenceScore * 100)}%`,
              height: '100%',
              backgroundColor: theme.colors.primary[500],
              borderRadius: theme.tokens.borderRadius.full,
            }}
          />
        </View>
      </Card>

      {/* Tone Profile */}
      <Card>
        <Text variant="h5" style={{ marginBottom: theme.tokens.spacing[3] }}>
          Communication Style
        </Text>
        <Text variant="body" weight="semibold">
          {profile.toneProfile.primaryTone}
        </Text>
        <View style={{ gap: theme.tokens.spacing[2], marginTop: theme.tokens.spacing[3] }}>
          <ToneBar label="Formality" value={profile.toneProfile.formality} theme={theme} />
          <ToneBar label="Warmth" value={profile.toneProfile.warmth} theme={theme} />
          <ToneBar label="Directness" value={profile.toneProfile.directness} theme={theme} />
        </View>
      </Card>

      {/* Strengths */}
      <Card>
        <Text variant="h5" style={{ marginBottom: theme.tokens.spacing[3] }}>
          Strengths
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.tokens.spacing[2] }}>
          {profile.strengths.map((s) => (
            <StatusBadge
              key={s}
              label={s}
              color={theme.colors.success[600]}
              backgroundColor={theme.colors.success[500] + '20'}
              size="md"
            />
          ))}
        </View>
      </Card>

      {/* Growth Areas */}
      <Card>
        <Text variant="h5" style={{ marginBottom: theme.tokens.spacing[3] }}>
          Growth Areas
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.tokens.spacing[2] }}>
          {profile.growthAreas.map((g) => (
            <StatusBadge
              key={g}
              label={g}
              color={theme.colors.warning[600]}
              backgroundColor={theme.colors.warning[500] + '20'}
              size="md"
            />
          ))}
        </View>
      </Card>
    </View>
  )
}

function ToneBar({ label, value, theme }: { label: string; value: number; theme: any }) {
  return (
    <View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 2 }}>
        <Text variant="caption">{label}</Text>
        <Text variant="caption" color={theme.colors.text.tertiary}>
          {Math.round(value * 100)}%
        </Text>
      </View>
      <View
        style={{
          height: 4,
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: theme.tokens.borderRadius.full,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: `${Math.round(value * 100)}%`,
            height: '100%',
            backgroundColor: theme.colors.primary[400],
            borderRadius: theme.tokens.borderRadius.full,
          }}
        />
      </View>
    </View>
  )
}

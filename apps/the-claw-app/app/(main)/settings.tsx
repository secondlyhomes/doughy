/**
 * Settings Screen
 *
 * Full-screen settings accessible from the gear icon in PinnedHeader.
 * Sections: Notifications, Queue Settings, Cost Limits, Data, About.
 */

import { View, ScrollView, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import Constants from 'expo-constants'
import { useTheme, type ThemeMode } from '@/theme'
import { useTrustLevel } from '@/hooks/useTrustLevel'
import { useConnectionContext } from '@/contexts/ConnectionContext'
import { useAuth } from '@/contexts/AuthContext'
import { Text } from '@/components/Text'
import { Card } from '@/components/Card/Card'
import { SegmentedControl } from '@/components/shared/SegmentedControl'
import { Button } from '@/components/Button/Button'
import type { HeaderMode } from '@/types'

const THEME_OPTIONS = [
  { label: 'Light', value: 'light' as ThemeMode },
  { label: 'Dark', value: 'dark' as ThemeMode },
  { label: 'System', value: 'system' as ThemeMode },
]

const HEADER_OPTIONS = [
  { label: 'Compact', value: 'compact' as HeaderMode },
  { label: 'Detailed', value: 'detailed' as HeaderMode },
]

function SettingsRow({
  label,
  value,
  theme,
}: {
  label: string
  value: string
  theme: any
}) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.tokens.spacing[2] }}>
      <Text variant="bodySmall" color={theme.colors.text.secondary}>{label}</Text>
      <Text variant="bodySmall" weight="medium" style={{ fontVariant: ['tabular-nums'] }}>{value}</Text>
    </View>
  )
}

export default function SettingsScreen() {
  const { theme, themeMode, setThemeMode } = useTheme()
  const router = useRouter()
  const { countdownSeconds, dailySpendLimitCents, dailyCallLimit, headerMode, setHeaderMode } = useTrustLevel()
  const { isConnected } = useConnectionContext()
  const { signOut, user } = useAuth()

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
        <Text variant="h3" weight="bold">Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: theme.tokens.spacing[4], paddingBottom: theme.tokens.spacing[12] }}>
        {/* Theme */}
        <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
          Appearance
        </Text>
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <SegmentedControl options={THEME_OPTIONS} selected={themeMode} onSelect={setThemeMode} />
        </Card>

        {/* Display */}
        <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
          Display
        </Text>
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>Header</Text>
            <View style={{ width: 180 }}>
              <SegmentedControl options={HEADER_OPTIONS} selected={headerMode} onSelect={setHeaderMode} />
            </View>
          </View>
        </Card>

        {/* Queue Settings */}
        <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
          Queue Settings
        </Text>
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <SettingsRow label="Default delay" value={`${countdownSeconds} sec`} theme={theme} />
        </Card>

        {/* Cost Limits */}
        <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
          Cost Limits
        </Text>
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <SettingsRow label="Daily spend limit" value={`$${(dailySpendLimitCents / 100).toFixed(2)}`} theme={theme} />
          <SettingsRow label="Max AI calls/day" value={String(dailyCallLimit)} theme={theme} />
        </Card>

        {/* About */}
        <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
          About
        </Text>
        <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[4] }}>
          <SettingsRow label="Version" value={`The Claw v${Constants.expoConfig?.version ?? '1.0.0'}`} theme={theme} />
          <SettingsRow label="Mode" value="Live" theme={theme} />
          {user?.email && <SettingsRow label="Account" value={user.email} theme={theme} />}
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: theme.tokens.spacing[2], gap: theme.tokens.spacing[1] }}>
            <Text variant="bodySmall" color={theme.colors.text.secondary}>Status</Text>
            <View style={{ flex: 1 }} />
            <View style={{
              width: 8, height: 8, borderRadius: 4,
              backgroundColor: isConnected ? theme.colors.success[500] : theme.colors.error[500],
            }} />
            <Text
              variant="bodySmall"
              weight="medium"
              color={isConnected ? theme.colors.success[600] : theme.colors.error[600]}
            >
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </Card>

        {/* Sign out */}
        <Button
          title="Sign Out"
          variant="secondary"
          size="lg"
          onPress={async () => {
            await signOut()
          }}
          style={{ marginTop: theme.tokens.spacing[2] }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

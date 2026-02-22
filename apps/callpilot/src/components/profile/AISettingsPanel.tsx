import { View, Switch } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Card } from '../Card'
import type { AIProfileSettings } from '@/types'

export interface AISettingsPanelProps {
  settings: AIProfileSettings
  onUpdateSettings: (updates: Partial<AIProfileSettings>) => void
}

export function AISettingsPanel({ settings, onUpdateSettings }: AISettingsPanelProps) {
  const { theme } = useTheme()

  return (
    <Card>
      <Text variant="h5" style={{ marginBottom: theme.tokens.spacing[4] }}>
        AI Learning Settings
      </Text>

      <SettingRow
        label="Passive Learning"
        description="Allow AI to learn from your communication patterns"
        value={settings.passiveLearningEnabled}
        onValueChange={(v) => onUpdateSettings({ passiveLearningEnabled: v })}
        theme={theme}
      />
      <SettingRow
        label="Analyze Call Transcripts"
        description="Include call recordings in style analysis"
        value={settings.analyzeCallTranscripts}
        onValueChange={(v) => onUpdateSettings({ analyzeCallTranscripts: v })}
        theme={theme}
      />
      <SettingRow
        label="Analyze Text Messages"
        description="Include SMS conversations in analysis"
        value={settings.analyzeTextMessages}
        onValueChange={(v) => onUpdateSettings({ analyzeTextMessages: v })}
        theme={theme}
      />
      <SettingRow
        label="Analyze Emails"
        description="Include email exchanges in analysis"
        value={settings.analyzeEmails}
        onValueChange={(v) => onUpdateSettings({ analyzeEmails: v })}
        theme={theme}
        isLast
      />
    </Card>
  )
}

function SettingRow({
  label,
  description,
  value,
  onValueChange,
  theme,
  isLast = false,
}: {
  label: string
  description: string
  value: boolean
  onValueChange: (value: boolean) => void
  theme: any
  isLast?: boolean
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: theme.tokens.spacing[3],
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: theme.colors.border,
      }}
    >
      <View style={{ flex: 1, marginRight: theme.tokens.spacing[3] }}>
        <Text variant="body">{label}</Text>
        <Text variant="caption" color={theme.colors.text.secondary}>
          {description}
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: theme.colors.neutral[300], true: theme.colors.primary[400] }}
        thumbColor={value ? theme.colors.primary[500] : theme.colors.neutral[100]}
      />
    </View>
  )
}

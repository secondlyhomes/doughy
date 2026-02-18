/**
 * SettingsRow
 *
 * Row component for settings screens with label, optional value, icon, and trailing element.
 */

import { ReactNode } from 'react'
import { View, TouchableOpacity, Switch } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '@/components/Text'

export interface SettingsRowProps {
  label: string
  value?: string
  icon?: keyof typeof Ionicons.glyphMap
  onPress?: () => void
  trailing?: 'chevron' | 'toggle' | ReactNode
  toggleValue?: boolean
  onToggle?: (value: boolean) => void
}

export function SettingsRow({
  label,
  value,
  icon,
  onPress,
  trailing = 'chevron',
  toggleValue,
  onToggle,
}: SettingsRowProps) {
  const { theme } = useTheme()

  const content = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.tokens.spacing[3],
        paddingHorizontal: theme.tokens.spacing[4],
        minHeight: 48,
      }}
    >
      {icon && (
        <Ionicons
          name={icon}
          size={20}
          color={theme.colors.text.secondary}
          style={{ marginRight: theme.tokens.spacing[3] }}
        />
      )}

      <View style={{ flex: 1 }}>
        <Text variant="body">{label}</Text>
        {value && (
          <Text variant="caption" color={theme.colors.text.secondary}>
            {value}
          </Text>
        )}
      </View>

      {trailing === 'chevron' && onPress && (
        <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
      )}
      {trailing === 'toggle' && (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          accessibilityLabel={label}
          trackColor={{ true: theme.colors.primary[500], false: theme.colors.neutral[300] }}
        />
      )}
      {typeof trailing !== 'string' && trailing}
    </View>
  )

  if (onPress && trailing !== 'toggle') {
    return (
      <TouchableOpacity onPress={onPress} accessibilityRole="button" activeOpacity={0.7}>
        {content}
      </TouchableOpacity>
    )
  }

  return content
}

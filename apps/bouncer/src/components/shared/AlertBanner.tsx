/**
 * AlertBanner Component
 *
 * Themed alert/warning banner for contextual messages.
 */

import { View, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Icon } from '@/components/Icon'
import type { IconProps } from '@/components/Icon'

export type AlertBannerVariant = 'warning' | 'error' | 'info' | 'success'

export interface AlertBannerProps {
  message: string
  variant?: AlertBannerVariant
  iconName?: IconProps['name']
  style?: ViewStyle
}

const VARIANT_CONFIG: Record<AlertBannerVariant, { bgKey: '50'; borderKey: '300'; textKey: '700'; icon: IconProps['name'] }> = {
  warning: { bgKey: '50', borderKey: '300', textKey: '700', icon: 'warning-outline' },
  error: { bgKey: '50', borderKey: '300', textKey: '700', icon: 'alert-circle-outline' },
  info: { bgKey: '50', borderKey: '300', textKey: '700', icon: 'information-circle-outline' },
  success: { bgKey: '50', borderKey: '300', textKey: '700', icon: 'checkmark-circle-outline' },
}

export function AlertBanner({ message, variant = 'warning', iconName, style }: AlertBannerProps) {
  const { theme } = useTheme()
  const config = VARIANT_CONFIG[variant]
  const colorScale = theme.colors[variant]
  const icon = iconName ?? config.icon

  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: theme.tokens.spacing[3],
          borderRadius: theme.tokens.borderRadius.md,
          backgroundColor: colorScale[config.bgKey],
          borderWidth: 1,
          borderColor: colorScale[config.borderKey],
          gap: theme.tokens.spacing[2],
        },
        style,
      ]}
    >
      <Icon name={icon} size="sm" color={colorScale[config.textKey]} />
      <Text variant="bodySmall" color={colorScale[config.textKey]} style={{ flex: 1 }}>
        {message}
      </Text>
    </View>
  )
}

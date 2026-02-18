/**
 * EmptyState Component
 *
 * Empty state with icon, title, description, and optional CTA
 */

import React from 'react'
import { View, Platform, ViewStyle } from 'react-native'
import { BlurView } from 'expo-blur'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Button } from '../Button/Button'
import { Icon } from '@/components/Icon'
import { LiquidGlass, isLiquidGlassAvailable } from '../../../modules/liquid-glass'
import { withAlpha } from '@/utils/color'
import type { IconProps } from '@/components/Icon'

export interface EmptyStateProps {
  icon?: string | React.ReactNode
  iconName?: IconProps['name']
  title: string
  description?: string
  actionText?: string
  onAction?: () => void
  style?: ViewStyle
}

export function EmptyState({
  icon,
  iconName = 'clipboard-outline',
  title,
  description,
  actionText,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme, isDark } = useTheme()

  return (
    <View
      style={[
        {
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          padding: theme.tokens.spacing[6],
        },
        style,
      ]}
    >
      <View style={{ marginBottom: theme.tokens.spacing[6] }}>
        {icon ? (
          typeof icon === 'string' ? (
            <Text style={{ fontSize: 64 }}>{icon}</Text>
          ) : (
            icon
          )
        ) : (
          <GlassIconCircle isDark={isDark}>
            <Icon name={iconName} size={48} color={theme.colors.text.tertiary} />
          </GlassIconCircle>
        )}
      </View>

      <Text variant="h3" align="center" style={{ marginBottom: theme.tokens.spacing[2] }}>
        {title}
      </Text>

      {description && (
        <Text
          variant="body"
          color={theme.colors.text.secondary}
          align="center"
          style={{ marginBottom: theme.tokens.spacing[6], maxWidth: 300 }}
        >
          {description}
        </Text>
      )}

      {actionText && onAction && (
        <Button
          title={actionText}
          variant="primary"
          onPress={onAction}
          style={{ minWidth: 160 }}
        />
      )}
    </View>
  )
}

const CIRCLE_SIZE = 96

function GlassIconCircle({ isDark, children }: { isDark: boolean; children: React.ReactNode }) {
  const circleStyle: ViewStyle = {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }

  if (Platform.OS === 'ios') {
    if (isLiquidGlassAvailable) {
      return (
        <LiquidGlass cornerRadius={CIRCLE_SIZE / 2} style={circleStyle}>
          {children}
        </LiquidGlass>
      )
    }

    return (
      <View style={circleStyle}>
        <BlurView
          intensity={40}
          tint={isDark ? 'dark' : 'light'}
          style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
        />
        {children}
      </View>
    )
  }

  // Android fallback
  return (
    <View
      style={[
        circleStyle,
        { backgroundColor: withAlpha(isDark ? '#ffffff' : '#000000', 0.06) },
      ]}
    >
      {children}
    </View>
  )
}

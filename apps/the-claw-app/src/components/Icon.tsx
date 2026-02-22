/**
 * Icon Component
 *
 * Themed wrapper around Ionicons from @expo/vector-icons.
 * Provides consistent sizing via t-shirt sizes and theme-aware coloring.
 */

import { Ionicons } from '@expo/vector-icons'
import type { ComponentProps } from 'react'
import { useTheme } from '@/theme'

type IoniconsName = ComponentProps<typeof Ionicons>['name']

export type IconSize = 'sm' | 'md' | 'lg' | number

const SIZE_MAP: Record<string, number> = {
  sm: 16,
  md: 24,
  lg: 32,
}

export interface IconProps {
  name: IoniconsName
  size?: IconSize
  color?: string
  style?: ComponentProps<typeof Ionicons>['style']
}

export function Icon({ name, size = 'md', color, style }: IconProps) {
  const { theme } = useTheme()
  const resolvedSize = typeof size === 'string' ? SIZE_MAP[size] ?? 24 : size
  const resolvedColor = color ?? theme.colors.text.primary

  return (
    <Ionicons
      name={name}
      size={resolvedSize}
      color={resolvedColor}
      style={style}
    />
  )
}

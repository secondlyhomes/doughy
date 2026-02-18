/**
 * COLOR UTILITIES
 *
 * Utility functions for color manipulation in white-label theming
 */

import { Image } from 'react-native'
import type { WhiteLabelBranding } from '../types'

/**
 * Validate color hex codes
 */
export function isValidColor(color: string): boolean {
  return /^#[0-9A-F]{6}$/i.test(color)
}

/**
 * Convert hex to RGB
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastColor(backgroundColor: string): string {
  const rgb = hexToRgb(backgroundColor)
  if (!rgb) return '#000000'

  const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000
  return brightness > 128 ? '#000000' : '#FFFFFF'
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(color: string, percent: number): string {
  const rgb = hexToRgb(color)
  if (!rgb) return color

  const factor = 1 + percent / 100

  const r = Math.min(255, Math.round(rgb.r * factor))
  const g = Math.min(255, Math.round(rgb.g * factor))
  const b = Math.min(255, Math.round(rgb.b * factor))

  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(color: string, percent: number): string {
  return lightenColor(color, -percent)
}

/**
 * Preload branding assets (logos, icons, etc.)
 */
export async function preloadBrandingAssets(branding: WhiteLabelBranding): Promise<void> {
  const assets = [
    branding.logo,
    branding.logoWhite,
    branding.icon,
    branding.splashScreen,
    branding.backgroundImage,
  ].filter(Boolean) as string[]

  await Promise.all(
    assets.map(uri =>
      Image.prefetch(uri).catch(err =>
        console.error(`Failed to preload asset: ${uri}`, err)
      )
    )
  )
}

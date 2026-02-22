/**
 * Color Utilities
 *
 * Safe color manipulation functions that work with any color format.
 */

/**
 * Apply alpha/opacity to a hex color string.
 * Returns an rgba() string, avoiding fragile hex concatenation.
 *
 * @example
 * withAlpha('#ef4444', 0.1)  // 'rgba(239, 68, 68, 0.1)'
 * withAlpha('#3b82f6', 0.5)  // 'rgba(59, 130, 246, 0.5)'
 */
export function withAlpha(color: string, opacity: number): string {
  const hex = color.replace('#', '')

  // Handle 3-digit hex
  const fullHex =
    hex.length === 3
      ? hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2]
      : hex.slice(0, 6)

  const r = parseInt(fullHex.slice(0, 2), 16)
  const g = parseInt(fullHex.slice(2, 4), 16)
  const b = parseInt(fullHex.slice(4, 6), 16)

  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return color
  }

  return `rgba(${r}, ${g}, ${b}, ${opacity})`
}

/**
 * EmptyState Component (Advanced Example)
 *
 * Empty state with icon, title, description, and optional CTA
 * This is a reference implementation - copy to src/components/ and customize
 */

import React from 'react'
import { View, StyleSheet, ViewStyle } from 'react-native'
import { useTheme } from '@/theme'
import { Text, Button } from '@/components'

export interface EmptyStateProps {
  /**
   * Empty state icon (emoji or component)
   * @default '📭'
   */
  icon?: string | React.ReactNode

  /**
   * Empty state title
   */
  title: string

  /**
   * Empty state description
   */
  description?: string

  /**
   * CTA button text
   */
  actionText?: string

  /**
   * Callback when CTA button is pressed
   */
  onAction?: () => void

  /**
   * Custom style
   */
  style?: ViewStyle
}

/**
 * EmptyState Component
 *
 * @example
 * ```tsx
 * // Basic empty state
 * <EmptyState
 *   title="No tasks yet"
 *   description="Create your first task to get started"
 *   actionText="Create Task"
 *   onAction={() => navigation.navigate('CreateTask')}
 * />
 *
 * // Without action
 * <EmptyState
 *   icon="🔍"
 *   title="No results found"
 *   description="Try adjusting your search"
 * />
 *
 * // Custom icon
 * <EmptyState
 *   icon={<CustomIcon name="inbox" size={64} />}
 *   title="Inbox is empty"
 *   description="You're all caught up!"
 * />
 * ```
 */
export function EmptyState({
  icon = '📭',
  title,
  description,
  actionText,
  onAction,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme()

  return (
    <View style={[styles.container, style]}>
      {/* Icon */}
      <View style={styles.iconContainer}>
        {typeof icon === 'string' ? (
          <Text style={styles.iconText}>{icon}</Text>
        ) : (
          icon
        )}
      </View>

      {/* Title */}
      <Text variant="h3" align="center" style={styles.title}>
        {title}
      </Text>

      {/* Description */}
      {description && (
        <Text
          variant="body"
          color={theme.colors.text.secondary}
          align="center"
          style={styles.description}
        >
          {description}
        </Text>
      )}

      {/* Action Button */}
      {actionText && onAction && (
        <Button
          title={actionText}
          variant="primary"
          onPress={onAction}
          style={styles.actionButton}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconText: {
    fontSize: 64,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    marginBottom: 24,
    maxWidth: 300,
  },
  actionButton: {
    minWidth: 160,
  },
})

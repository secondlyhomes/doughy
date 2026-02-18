/**
 * Quick Actions Bar Component
 *
 * Horizontal scrollable list of quick action buttons.
 */

import React from 'react'
import { View, Text, TouchableOpacity, ScrollView } from 'react-native'
import { styles } from './ai-assistant.styles'
import type { QuickActionsBarProps } from './types'

/**
 * Quick actions bar for common AI tasks
 *
 * @example
 * ```tsx
 * <QuickActionsBar
 *   actions={quickActions}
 *   selectedAction={selectedAction}
 *   onActionPress={handleQuickAction}
 * />
 * ```
 */
export function QuickActionsBar({
  actions,
  selectedAction,
  onActionPress,
}: QuickActionsBarProps) {
  return (
    <View style={styles.quickActions}>
      <Text style={styles.quickActionsTitle}>Quick Actions</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.quickActionsScroll}
      >
        {actions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={[
              styles.quickActionButton,
              selectedAction?.id === action.id && styles.quickActionSelected,
            ]}
            onPress={() => onActionPress(action)}
          >
            {action.icon && <Text style={styles.quickActionIcon}>{action.icon}</Text>}
            <Text style={styles.quickActionLabel}>{action.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  )
}

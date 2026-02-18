/**
 * MediumWidget.tsx
 *
 * Medium (4x2) iOS Home Screen Widget
 * Shows task count and up to 3 upcoming tasks
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { SizeWidgetProps } from './types';
import { getWidgetStyles } from './utils/widget-utils';

/**
 * Medium widget displays:
 * - Header with title and completion badge
 * - Up to 3 upcoming (incomplete) tasks
 * - Empty state when no tasks
 */
export function MediumWidget({
  tasks,
  completedCount,
  totalCount,
  colorScheme
}: SizeWidgetProps) {
  const styles = getWidgetStyles(colorScheme);
  const upcomingTasks = tasks.filter(t => !t.completed).slice(0, 3);

  return (
    <View style={[styles.container, styles.mediumContainer]}>
      <View style={styles.header}>
        <Text style={styles.title}>Today's Tasks</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {completedCount}/{totalCount}
          </Text>
        </View>
      </View>

      <View style={styles.taskList}>
        {upcomingTasks.length > 0 ? (
          upcomingTasks.map((task) => (
            <View key={task.id} style={styles.taskRow}>
              <View style={[
                styles.checkbox,
                task.completed && styles.checkboxCompleted
              ]}>
                {task.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text
                style={[
                  styles.taskText,
                  task.completed && styles.taskTextCompleted
                ]}
                numberOfLines={1}
              >
                {task.title}
              </Text>
              {task.priority === 'high' && (
                <View style={styles.priorityDot} />
              )}
            </View>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks</Text>
          </View>
        )}
      </View>
    </View>
  );
}

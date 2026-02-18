/**
 * TaskRow.tsx
 *
 * Individual task row component for widget display
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { TaskRowProps } from '../types';
import { getWidgetStyles, formatDueDate } from '../utils/widget-utils';

/**
 * Renders a single task row with checkbox, title, category, and metadata
 */
export function TaskRow({ task, colorScheme }: TaskRowProps) {
  const styles = getWidgetStyles(colorScheme);

  return (
    <View style={styles.taskRow}>
      <View style={[
        styles.checkbox,
        task.completed && styles.checkboxCompleted
      ]}>
        {task.completed && <Text style={styles.checkmark}>✓</Text>}
      </View>

      <View style={styles.taskContent}>
        <Text
          style={[
            styles.taskText,
            task.completed && styles.taskTextCompleted
          ]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        {task.category && (
          <Text style={styles.categoryText} numberOfLines={1}>
            {task.category}
          </Text>
        )}
      </View>

      <View style={styles.taskMeta}>
        {task.priority === 'high' && (
          <View style={[styles.priorityDot, styles.priorityHigh]} />
        )}
        {task.priority === 'medium' && (
          <View style={[styles.priorityDot, styles.priorityMedium]} />
        )}
        {task.dueDate && (
          <Text style={styles.dueDate}>
            {formatDueDate(task.dueDate)}
          </Text>
        )}
      </View>
    </View>
  );
}

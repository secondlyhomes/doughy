/**
 * LargeWidget.tsx
 *
 * Large (4x4) iOS Home Screen Widget
 * Shows task count, up to 7 tasks, and progress bar
 */

import React from 'react';
import { View, Text } from 'react-native';
import type { SizeWidgetProps } from './types';
import { TaskRow } from './components/TaskRow';
import { getWidgetStyles, calculatePercentage } from './utils/widget-utils';

/**
 * Large widget displays:
 * - Header with title, subtitle, and task count badge
 * - Progress bar with percentage
 * - Up to 7 tasks with full details
 * - Footer with call-to-action
 */
export function LargeWidget({
  tasks,
  completedCount,
  totalCount,
  colorScheme
}: SizeWidgetProps) {
  const styles = getWidgetStyles(colorScheme);
  const allTasks = tasks.slice(0, 7);
  const percentage = calculatePercentage(completedCount, totalCount);

  return (
    <View style={[styles.container, styles.largeContainer]}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Tasks</Text>
          <Text style={styles.subtitle}>
            {completedCount} of {totalCount} completed
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalCount}</Text>
        </View>
      </View>

      <View style={styles.progressBarContainer}>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${percentage}%` }
            ]}
          />
        </View>
        <Text style={styles.progressText}>{percentage}%</Text>
      </View>

      <View style={styles.taskList}>
        {allTasks.length > 0 ? (
          allTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              colorScheme={colorScheme}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tasks yet</Text>
            <Text style={styles.emptySubtext}>
              Tap to add your first task
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>Tap to open app</Text>
      </View>
    </View>
  );
}

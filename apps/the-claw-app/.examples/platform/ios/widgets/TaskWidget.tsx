/**
 * TaskWidget.tsx
 *
 * iOS Home Screen Widget for displaying tasks
 *
 * This example demonstrates:
 * - Widget configuration for small, medium, and large sizes
 * - Integration with react-native-widget-extension
 * - Data synchronization with main app
 * - Deep linking from widget to app
 * - Timeline-based widget updates
 *
 * Requirements:
 * - npm install react-native-widget-extension
 * - iOS 14+
 * - Xcode widget target configuration
 *
 * Related docs:
 * - .examples/platform/ios/widgets/README.md
 * - .examples/platform/ios/widgets/widgetConfig.ts
 */

import React from 'react';
import type { TaskWidgetProps } from './types';
import { SmallWidget } from './SmallWidget';
import { MediumWidget } from './MediumWidget';
import { LargeWidget } from './LargeWidget';

/**
 * Main widget component that renders appropriate size variant
 *
 * @param props.tasks - Array of task objects to display
 * @param props.completedCount - Number of completed tasks
 * @param props.totalCount - Total number of tasks
 * @param props.size - Widget size: 'small', 'medium', or 'large'
 * @param props.colorScheme - Color scheme: 'light' or 'dark'
 */
export function TaskWidget(props: TaskWidgetProps) {
  const { size, tasks, completedCount, totalCount, colorScheme } = props;

  switch (size) {
    case 'small':
      return (
        <SmallWidget
          completedCount={completedCount}
          totalCount={totalCount}
          colorScheme={colorScheme}
        />
      );
    case 'medium':
      return (
        <MediumWidget
          tasks={tasks}
          completedCount={completedCount}
          totalCount={totalCount}
          colorScheme={colorScheme}
        />
      );
    case 'large':
      return (
        <LargeWidget
          tasks={tasks}
          completedCount={completedCount}
          totalCount={totalCount}
          colorScheme={colorScheme}
        />
      );
    default:
      return (
        <MediumWidget
          tasks={tasks}
          completedCount={completedCount}
          totalCount={totalCount}
          colorScheme={colorScheme}
        />
      );
  }
}

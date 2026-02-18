/**
 * TaskSection Component
 *
 * Displays a section of tasks with a header and optional "more" indicator.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { TaskItemWidget } from '../../components/TaskItemWidget';
import { TaskSectionProps } from '../types';
import { TYPOGRAPHY } from '../styles';

export function TaskSection({
  title,
  tasks,
  maxItems,
  theme,
  showDetailed = false,
}: TaskSectionProps) {
  const visibleTasks = tasks.slice(0, maxItems);
  const remainingCount = tasks.length - maxItems;

  return (
    <FlexWidget style={{ flexDirection: 'column' }}>
      <TextWidget
        text={`${title} (${tasks.length})`}
        style={{
          fontSize: TYPOGRAPHY.sectionHeader.fontSize,
          fontWeight: TYPOGRAPHY.sectionHeader.fontWeight,
          color: theme.onSurfaceVariant,
          marginBottom: 10,
          letterSpacing: TYPOGRAPHY.sectionHeader.letterSpacing,
        }}
      />
      {visibleTasks.map((task, index) => (
        <TaskItemWidget
          key={task.id}
          task={task}
          theme={theme}
          showDivider={index < visibleTasks.length - 1}
          detailed={showDetailed}
        />
      ))}
      {remainingCount > 0 && (
        <TextWidget
          text={`+${remainingCount} more`}
          style={{
            fontSize: TYPOGRAPHY.moreText.fontSize,
            color: theme.onSurfaceVariant,
            textAlign: 'center',
            paddingVertical: 8,
          }}
        />
      )}
    </FlexWidget>
  );
}

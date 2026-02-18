/**
 * LargeTaskWidget (4x2)
 *
 * Detailed task list with progress bar.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { TaskItemWidget } from './components/TaskItemWidget';
import { WidgetComponentProps } from './types';

export function LargeTaskWidget({ data, theme }: WidgetComponentProps) {
  const incompleteTasks = data.tasks.filter((t) => !t.completed);

  return (
    <FlexWidget
      style={{
        height: 'match_parent',
        width: 'match_parent',
        backgroundColor: theme.surface,
        borderRadius: 16,
        padding: 16,
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <FlexWidget
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 16,
        }}
      >
        <FlexWidget style={{ flexDirection: 'column' }}>
          <TextWidget
            text="Today's Tasks"
            style={{
              fontSize: 18,
              fontWeight: 'bold',
              color: theme.onSurface,
            }}
          />
          <TextWidget
            text={new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'short',
              day: 'numeric',
            })}
            style={{
              fontSize: 12,
              color: theme.onSurfaceVariant,
              marginTop: 2,
            }}
          />
        </FlexWidget>
        <FlexWidget style={{ flexDirection: 'column', alignItems: 'flex-end' }}>
          <TextWidget
            text={`${data.completedCount}/${data.totalCount}`}
            style={{
              fontSize: 24,
              fontWeight: 'bold',
              color: theme.primary,
            }}
          />
          <TextWidget
            text="completed"
            style={{ fontSize: 11, color: theme.onSurfaceVariant }}
          />
        </FlexWidget>
      </FlexWidget>

      {/* Progress Bar */}
      <FlexWidget
        style={{
          height: 8,
          backgroundColor: theme.surfaceVariant,
          borderRadius: 4,
          marginBottom: 16,
          overflow: 'hidden',
        }}
      >
        <FlexWidget
          style={{
            height: '100%',
            width: `${(data.completedCount / data.totalCount) * 100}%`,
            backgroundColor: theme.primary,
            borderRadius: 4,
          }}
        />
      </FlexWidget>

      {/* Incomplete Tasks */}
      <TextWidget
        text="To Do"
        style={{
          fontSize: 12,
          fontWeight: '600',
          color: theme.onSurfaceVariant,
          marginBottom: 8,
        }}
      />
      <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
        {incompleteTasks.slice(0, 4).map((task, index) => (
          <TaskItemWidget
            key={task.id}
            task={task}
            theme={theme}
            showDivider={index < incompleteTasks.length - 1}
          />
        ))}
        {incompleteTasks.length === 0 && (
          <TextWidget
            text="No pending tasks"
            style={{
              fontSize: 14,
              color: theme.onSurfaceVariant,
              fontStyle: 'italic',
              textAlign: 'center',
              paddingVertical: 16,
            }}
          />
        )}
      </FlexWidget>

      {/* Quick Actions */}
      <FlexWidget style={{ flexDirection: 'row', marginTop: 12, gap: 8 }}>
        <FlexWidget
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor: theme.primaryContainer,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          clickAction="ADD_TASK"
        >
          <TextWidget
            text="+ Add"
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: theme.onPrimaryContainer,
            }}
          />
        </FlexWidget>
        <FlexWidget
          style={{
            flex: 1,
            paddingVertical: 10,
            backgroundColor: theme.surfaceVariant,
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
          clickAction="VIEW_ALL"
        >
          <TextWidget
            text="View All"
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: theme.onSurfaceVariant,
            }}
          />
        </FlexWidget>
      </FlexWidget>
    </FlexWidget>
  );
}

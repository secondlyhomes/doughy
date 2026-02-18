/**
 * TaskItemWidget Component
 *
 * Reusable task item for widget task lists.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { Task, WidgetTheme } from '../types';

interface TaskItemWidgetProps {
  task: Task;
  theme: WidgetTheme;
  showDivider?: boolean;
  detailed?: boolean;
}

export function TaskItemWidget({
  task,
  theme,
  showDivider = false,
  detailed = false,
}: TaskItemWidgetProps) {
  return (
    <FlexWidget style={{ flexDirection: 'column' }}>
      <FlexWidget
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: detailed ? 10 : 8,
        }}
        clickAction="TOGGLE_TASK"
        clickActionData={{ taskId: task.id }}
      >
        {/* Checkbox */}
        <FlexWidget
          style={{
            width: detailed ? 24 : 20,
            height: detailed ? 24 : 20,
            borderRadius: detailed ? 12 : 10,
            borderWidth: 2,
            borderColor: task.completed ? theme.primary : theme.outline,
            backgroundColor: task.completed ? theme.primary : 'transparent',
            marginRight: 12,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          {task.completed && (
            <TextWidget
              text="✓"
              style={{
                fontSize: detailed ? 14 : 12,
                color: theme.onPrimary,
              }}
            />
          )}
        </FlexWidget>

        {/* Task Content */}
        <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
          <TextWidget
            text={task.title}
            style={{
              fontSize: detailed ? 15 : 14,
              color: task.completed ? theme.onSurfaceVariant : theme.onSurface,
              textDecoration: task.completed ? 'line-through' : 'none',
            }}
            maxLines={detailed ? 2 : 1}
          />
          {detailed && task.dueDate && (
            <TextWidget
              text={`Due: ${new Date(task.dueDate).toLocaleDateString()}`}
              style={{
                fontSize: 12,
                color: theme.onSurfaceVariant,
                marginTop: 2,
              }}
            />
          )}
        </FlexWidget>

        {/* Priority Indicators */}
        {task.priority === 'high' && (
          <FlexWidget
            style={{
              paddingHorizontal: 8,
              paddingVertical: 4,
              backgroundColor: '#FEE2E2',
              borderRadius: 4,
              marginLeft: 8,
            }}
          >
            <TextWidget
              text="HIGH"
              style={{
                fontSize: 10,
                fontWeight: '600',
                color: '#DC2626',
              }}
            />
          </FlexWidget>
        )}
        {task.priority === 'medium' && detailed && (
          <FlexWidget
            style={{
              width: 10,
              height: 10,
              borderRadius: 5,
              backgroundColor: '#F59E0B',
              marginLeft: 8,
            }}
          />
        )}
      </FlexWidget>

      {/* Divider */}
      {showDivider && (
        <FlexWidget
          style={{
            height: 1,
            backgroundColor: theme.outline + '20',
            marginVertical: 4,
          }}
        />
      )}
    </FlexWidget>
  );
}

/**
 * MediumTaskWidget (2x2)
 *
 * Task list with quick actions.
 */

import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import { WidgetComponentProps } from './types';

export function MediumTaskWidget({ data, theme }: WidgetComponentProps) {
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
          marginBottom: 12,
        }}
      >
        <TextWidget
          text="Today's Tasks"
          style={{
            fontSize: 16,
            fontWeight: 'bold',
            color: theme.onSurface,
          }}
        />
        <TextWidget
          text={`${data.completedCount}/${data.totalCount}`}
          style={{
            fontSize: 14,
            color: theme.onSurfaceVariant,
          }}
        />
      </FlexWidget>

      {/* Task List - Show top 3 tasks */}
      <FlexWidget style={{ flex: 1, flexDirection: 'column' }}>
        {data.tasks.slice(0, 3).map((task, index) => (
          <FlexWidget
            key={task.id}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              paddingVertical: 6,
              borderBottomWidth: index < 2 ? 1 : 0,
              borderBottomColor: theme.outline + '30',
            }}
            clickAction="TOGGLE_TASK"
            clickActionData={{ taskId: task.id }}
          >
            <FlexWidget
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                borderWidth: 2,
                borderColor: task.completed ? theme.primary : theme.outline,
                backgroundColor: task.completed ? theme.primary : 'transparent',
                marginRight: 8,
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              {task.completed && (
                <TextWidget
                  text="✓"
                  style={{ fontSize: 12, color: theme.onPrimary }}
                />
              )}
            </FlexWidget>
            <TextWidget
              text={task.title}
              style={{
                flex: 1,
                fontSize: 14,
                color: task.completed ? theme.onSurfaceVariant : theme.onSurface,
                textDecoration: task.completed ? 'line-through' : 'none',
              }}
              maxLines={1}
            />
            {task.priority === 'high' && (
              <FlexWidget
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: '#EF4444',
                  marginLeft: 4,
                }}
              />
            )}
          </FlexWidget>
        ))}
      </FlexWidget>

      {/* Add Task Button */}
      <FlexWidget
        style={{
          marginTop: 12,
          paddingVertical: 8,
          paddingHorizontal: 16,
          backgroundColor: theme.primaryContainer,
          borderRadius: 8,
          justifyContent: 'center',
          alignItems: 'center',
        }}
        clickAction="ADD_TASK"
      >
        <TextWidget
          text="+ Add Task"
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: theme.onPrimaryContainer,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}

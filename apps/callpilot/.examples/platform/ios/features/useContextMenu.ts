/**
 * useContextMenu Hook
 *
 * Hook for building context menu configurations.
 */

import { Alert } from 'react-native';
import { ContextMenuAction, ContextMenuConfig, Task } from './types';

/**
 * Build task context menu actions
 */
export function useTaskContextMenuActions(
  task: Task,
  callbacks: {
    onComplete?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onShare?: () => void;
  }
): ContextMenuAction[] {
  const { onComplete, onEdit, onDelete, onDuplicate, onShare } = callbacks;

  return [
    {
      title: task.completed ? 'Mark Incomplete' : 'Mark Complete',
      systemIcon: task.completed ? 'circle' : 'checkmark.circle.fill',
      onPress: onComplete,
    },
    {
      title: 'Edit',
      systemIcon: 'pencil',
      onPress: onEdit,
    },
    {
      title: 'Duplicate',
      systemIcon: 'doc.on.doc',
      onPress: onDuplicate,
    },
    {
      title: 'Share',
      systemIcon: 'square.and.arrow.up',
      onPress: onShare,
    },
    {
      title: 'More Actions',
      systemIcon: 'ellipsis.circle',
      inlineChildren: true,
      actions: [
        {
          title: 'Set Priority',
          systemIcon: 'flag',
          actions: [
            {
              title: 'High',
              systemIcon: 'flag.fill',
              onPress: () => console.log('Set high priority'),
            },
            {
              title: 'Medium',
              systemIcon: 'flag',
              onPress: () => console.log('Set medium priority'),
            },
            {
              title: 'Low',
              systemIcon: 'flag',
              onPress: () => console.log('Set low priority'),
            },
          ],
        },
        {
          title: 'Set Due Date',
          systemIcon: 'calendar',
          onPress: () => console.log('Set due date'),
        },
      ],
    },
    {
      title: 'Delete',
      systemIcon: 'trash',
      destructive: true,
      onPress: () => {
        Alert.alert(
          'Delete Task',
          'Are you sure you want to delete this task?',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: onDelete,
            },
          ]
        );
      },
    },
  ];
}

/**
 * Build a complete context menu config for a task
 */
export function useTaskContextMenuConfig(
  task: Task,
  callbacks: {
    onComplete?: () => void;
    onEdit?: () => void;
    onDelete?: () => void;
    onDuplicate?: () => void;
    onShare?: () => void;
  }
): ContextMenuConfig {
  const actions = useTaskContextMenuActions(task, callbacks);

  return {
    title: task.title,
    actions,
  };
}

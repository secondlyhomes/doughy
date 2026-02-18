/**
 * TaskCard Component
 *
 * Task card with integrated context menu support.
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TaskCardProps } from './types';
import { TaskContextMenu } from './TaskContextMenu';

/**
 * Task Card with Context Menu
 *
 * Displays a task with checkbox and title, wrapped in a context menu
 * for quick actions.
 *
 * @example
 * ```tsx
 * <TaskCard task={{ id: '1', title: 'Buy groceries', completed: false }} />
 * ```
 */
export function TaskCard({ task }: TaskCardProps) {
  const handleComplete = () => {
    console.log('Complete task:', task.id);
  };

  const handleEdit = () => {
    console.log('Edit task:', task.id);
  };

  const handleDelete = () => {
    console.log('Delete task:', task.id);
  };

  return (
    <TaskContextMenu
      task={task}
      onComplete={handleComplete}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onDuplicate={() => console.log('Duplicate')}
      onShare={() => console.log('Share')}
    >
      <View style={styles.taskCard}>
        <View style={styles.checkbox}>
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
        <View style={styles.taskContent}>
          <Text style={[styles.taskTitle, task.completed && styles.completed]}>
            {task.title}
          </Text>
          {task.description && (
            <Text style={styles.taskDescription}>{task.description}</Text>
          )}
        </View>
      </View>
    </TaskContextMenu>
  );
}

const styles = StyleSheet.create({
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '700',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#000000',
  },
  completed: {
    textDecorationLine: 'line-through',
    color: '#6C6C70',
  },
  taskDescription: {
    fontSize: 15,
    color: '#6C6C70',
    marginTop: 4,
  },
});

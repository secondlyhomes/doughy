/**
 * TaskDetailWithHandoff.tsx
 *
 * Example component demonstrating Handoff integration with a task detail view
 */

import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import { useHandoff } from '../hooks/useHandoff';
import { styles } from '../styles';
import { HandoffActivityType, TaskDetailWithHandoffProps } from '../types';

/**
 * Task Detail Screen with Handoff support
 *
 * Demonstrates how to integrate Handoff into a screen component.
 * When the user views this screen on their iPhone, they can continue
 * viewing the same task on their Mac or iPad.
 */
export function TaskDetailWithHandoff({ task }: TaskDetailWithHandoffProps) {
  const { startActivity, stopActivity } = useHandoff(HandoffActivityType.ViewTask);

  // Start Handoff when screen mounts
  useEffect(() => {
    startActivity(
      `Viewing: ${task.title}`,
      {
        taskId: task.id,
        taskTitle: task.title,
      },
      `https://yourapp.com/tasks/${task.id}` // Universal Link
    );

    // Stop Handoff when screen unmounts
    return () => {
      stopActivity();
    };
  }, [task.id, task.title, startActivity, stopActivity]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{task.title}</Text>
      {task.description && (
        <Text style={styles.description}>{task.description}</Text>
      )}
    </View>
  );
}

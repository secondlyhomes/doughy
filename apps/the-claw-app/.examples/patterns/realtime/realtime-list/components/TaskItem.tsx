/**
 * TaskItem Component
 *
 * Individual task row with checkbox, title, and delete button.
 */

import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import type { TaskItemProps } from '../types';
import { styles } from '../styles';

export function TaskItem({ task, isPending, onToggle, onDelete }: TaskItemProps) {
  return (
    <View style={[styles.taskItem, isPending && styles.taskItemPending]}>
      <TouchableOpacity
        style={styles.checkbox}
        onPress={() => onToggle(task)}
        disabled={isPending}
      >
        <View
          style={[
            styles.checkboxInner,
            task.completed && styles.checkboxChecked,
          ]}
        >
          {task.completed && <Text style={styles.checkmark}>✓</Text>}
        </View>
      </TouchableOpacity>

      <View style={styles.taskContent}>
        <Text
          style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}
        >
          {task.title}
        </Text>
        <Text style={styles.taskDate}>
          {new Date(task.created_at).toLocaleString()}
        </Text>
      </View>

      {isPending && (
        <ActivityIndicator size="small" color="#4ECDC4" style={styles.spinner} />
      )}

      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => onDelete(task.id)}
        disabled={isPending}
      >
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

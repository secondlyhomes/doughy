/**
 * Widget Utilities
 *
 * Data fetching and event handling for Android widgets.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClickEvent } from 'react-native-android-widget';
import { Task, WidgetData } from '../types';

/**
 * Fetch widget data from storage
 */
export async function getWidgetData(): Promise<WidgetData> {
  try {
    const tasksJson = await AsyncStorage.getItem('@tasks');
    const tasks: Task[] = tasksJson ? JSON.parse(tasksJson) : [];

    const completedCount = tasks.filter((t) => t.completed).length;
    const totalCount = tasks.length;

    return {
      tasks,
      completedCount,
      totalCount,
      lastUpdate: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }),
    };
  } catch (error) {
    console.error('Failed to load widget data:', error);
    return {
      tasks: [],
      completedCount: 0,
      totalCount: 0,
      lastUpdate: 'Unknown',
    };
  }
}

/**
 * Toggle task completion status
 */
export async function toggleTask(taskId: string): Promise<void> {
  try {
    const tasksJson = await AsyncStorage.getItem('@tasks');
    const tasks: Task[] = tasksJson ? JSON.parse(tasksJson) : [];

    const updatedTasks = tasks.map((task) =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );

    await AsyncStorage.setItem('@tasks', JSON.stringify(updatedTasks));
  } catch (error) {
    console.error('Failed to toggle task:', error);
  }
}

/**
 * Handle widget click events
 */
export async function handleWidgetClick(event: ClickEvent): Promise<void> {
  const { action, data } = event;

  switch (action) {
    case 'TOGGLE_TASK':
      if (data?.taskId) {
        await toggleTask(data.taskId);
      }
      break;
    case 'ADD_TASK':
      // Open app to add task screen
      break;
    case 'VIEW_ALL':
      // Open app to task list
      break;
    case 'OPEN_APP':
      // Open app to home screen
      break;
  }
}

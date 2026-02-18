/**
 * viewTasksHandler.ts
 *
 * Handler for ViewTasks Siri intent
 */

import {
  ViewTasksIntent,
  IntentResponse,
  IntentType,
} from '../types';

/**
 * Handle view tasks intent
 */
export async function handleViewTasks(
  intent: ViewTasksIntent,
  listeners: Map<string, Function>
): Promise<IntentResponse> {
  const handler = listeners.get(IntentType.ViewTasks);

  if (!handler) {
    return {
      success: false,
      message: 'No handler registered for view tasks',
    };
  }

  try {
    const tasks = await handler(intent);
    return {
      success: true,
      message: `Found ${tasks.length} tasks`,
      data: tasks,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to view tasks: ${error}`,
    };
  }
}

/**
 * createTaskHandler.ts
 *
 * Handler for CreateTask Siri intent
 */

import {
  CreateTaskIntent,
  IntentResponse,
  IntentType,
} from '../types';

/**
 * Handle create task intent
 */
export async function handleCreateTask(
  intent: CreateTaskIntent,
  listeners: Map<string, Function>
): Promise<IntentResponse> {
  const handler = listeners.get(IntentType.CreateTask);

  if (!handler) {
    return {
      success: false,
      message: 'No handler registered for create task',
    };
  }

  try {
    const result = await handler(intent);
    return {
      success: true,
      message: `Created task: ${intent.taskTitle}`,
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to create task: ${error}`,
    };
  }
}

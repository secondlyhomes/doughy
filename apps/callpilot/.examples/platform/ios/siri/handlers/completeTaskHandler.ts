/**
 * completeTaskHandler.ts
 *
 * Handler for CompleteTask Siri intent
 */

import {
  CompleteTaskIntent,
  IntentResponse,
  IntentType,
} from '../types';

/**
 * Handle complete task intent
 */
export async function handleCompleteTask(
  intent: CompleteTaskIntent,
  listeners: Map<string, Function>
): Promise<IntentResponse> {
  const handler = listeners.get(IntentType.CompleteTask);

  if (!handler) {
    return {
      success: false,
      message: 'No handler registered for complete task',
    };
  }

  try {
    await handler(intent);
    return {
      success: true,
      message: 'Task completed',
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to complete task: ${error}`,
    };
  }
}

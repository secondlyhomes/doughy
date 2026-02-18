/**
 * searchTasksHandler.ts
 *
 * Handler for SearchTasks Siri intent
 */

import {
  SearchTasksIntent,
  IntentResponse,
  IntentType,
} from '../types';

/**
 * Handle search tasks intent
 */
export async function handleSearchTasks(
  intent: SearchTasksIntent,
  listeners: Map<string, Function>
): Promise<IntentResponse> {
  const handler = listeners.get(IntentType.SearchTasks);

  if (!handler) {
    return {
      success: false,
      message: 'No handler registered for search tasks',
    };
  }

  try {
    const results = await handler(intent);
    return {
      success: true,
      message: `Found ${results.length} matching tasks`,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      message: `Failed to search tasks: ${error}`,
    };
  }
}

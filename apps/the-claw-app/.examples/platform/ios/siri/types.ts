/**
 * types.ts
 *
 * Type definitions for Siri Intent Handler
 */

// Intent types
export enum IntentType {
  CreateTask = 'CreateTaskIntent',
  CompleteTask = 'CompleteTaskIntent',
  ViewTasks = 'ViewTasksIntent',
  SearchTasks = 'SearchTasksIntent',
}

// Intent parameter types
export interface CreateTaskIntent {
  type: IntentType.CreateTask;
  taskTitle: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
}

export interface CompleteTaskIntent {
  type: IntentType.CompleteTask;
  taskId: string;
}

export interface ViewTasksIntent {
  type: IntentType.ViewTasks;
  filter?: 'all' | 'today' | 'completed' | 'pending';
}

export interface SearchTasksIntent {
  type: IntentType.SearchTasks;
  query: string;
}

export type Intent =
  | CreateTaskIntent
  | CompleteTaskIntent
  | ViewTasksIntent
  | SearchTasksIntent;

// Intent response
export interface IntentResponse {
  success: boolean;
  message: string;
  data?: any;
}

// Handler function type
export type IntentHandler<T extends Intent = Intent> = (
  intent: T
) => Promise<any>;

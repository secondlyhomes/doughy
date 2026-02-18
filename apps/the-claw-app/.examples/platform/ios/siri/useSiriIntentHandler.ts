/**
 * useSiriIntentHandler.ts
 *
 * React hook for handling Siri intents
 */

import { useEffect, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  Intent,
  IntentType,
  CreateTaskIntent,
  CompleteTaskIntent,
  ViewTasksIntent,
  SearchTasksIntent,
} from './types';
import { IntentHandlerManager } from './IntentHandlerManager';

/**
 * React hook for handling Siri intents
 */
export function useSiriIntentHandler() {
  const navigation = useNavigation();
  const [lastIntent, setLastIntent] = useState<Intent | null>(null);

  useEffect(() => {
    IntentHandlerManager.initialize();

    // Register create task handler
    IntentHandlerManager.registerHandler(
      IntentType.CreateTask,
      async (intent: CreateTaskIntent) => {
        console.log('[Siri Hook] Create task:', intent.taskTitle);

        navigation.navigate('AddTask' as never, {
          title: intent.taskTitle,
          priority: intent.priority,
          dueDate: intent.dueDate,
        } as never);

        setLastIntent(intent);
        return { taskId: 'new', title: intent.taskTitle };
      }
    );

    // Register complete task handler
    IntentHandlerManager.registerHandler(
      IntentType.CompleteTask,
      async (intent: CompleteTaskIntent) => {
        console.log('[Siri Hook] Complete task:', intent.taskId);

        navigation.navigate('TaskDetail' as never, {
          taskId: intent.taskId,
          autoComplete: true,
        } as never);

        setLastIntent(intent);
      }
    );

    // Register view tasks handler
    IntentHandlerManager.registerHandler(
      IntentType.ViewTasks,
      async (intent: ViewTasksIntent) => {
        console.log('[Siri Hook] View tasks:', intent.filter);

        navigation.navigate('Tasks' as never, {
          filter: intent.filter || 'all',
        } as never);

        setLastIntent(intent);

        return [
          { id: '1', title: 'Task 1', completed: false },
          { id: '2', title: 'Task 2', completed: true },
        ];
      }
    );

    // Register search tasks handler
    IntentHandlerManager.registerHandler(
      IntentType.SearchTasks,
      async (intent: SearchTasksIntent) => {
        console.log('[Siri Hook] Search tasks:', intent.query);

        navigation.navigate('Search' as never, {
          query: intent.query,
        } as never);

        setLastIntent(intent);

        return [
          { id: '1', title: `Matching task for: ${intent.query}` },
        ];
      }
    );

    return () => {
      IntentHandlerManager.cleanup();
    };
  }, [navigation]);

  return {
    lastIntent,
  };
}

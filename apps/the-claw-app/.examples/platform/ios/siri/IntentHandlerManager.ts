/**
 * IntentHandlerManager.ts
 *
 * Core manager for Siri intent handling
 */

import { NativeEventEmitter } from 'react-native';
import {
  Intent,
  IntentType,
  IntentResponse,
  CreateTaskIntent,
  CompleteTaskIntent,
  ViewTasksIntent,
  SearchTasksIntent,
} from './types';
import {
  handleCreateTask,
  handleCompleteTask,
  handleViewTasks,
  handleSearchTasks,
} from './handlers';

/**
 * Intent Handler Manager
 */
export class IntentHandlerManager {
  private static emitter: NativeEventEmitter | null = null;
  private static listeners: Map<string, Function> = new Map();

  /**
   * Initialize intent handler
   */
  static initialize() {
    // Setup native event emitter
    // this.emitter = new NativeEventEmitter(NativeModules.SiriIntents);

    // Listen for intent events
    this.setupListeners();
  }

  /**
   * Setup event listeners
   */
  private static setupListeners() {
    if (!this.emitter) return;

    this.emitter.addListener('onIntentReceived', (intent: Intent) => {
      console.log('[Siri] Intent received:', intent);
      this.handleIntent(intent);
    });

    this.emitter.addListener('onIntentCancelled', () => {
      console.log('[Siri] Intent cancelled');
    });
  }

  /**
   * Handle incoming intent
   */
  static async handleIntent(intent: Intent): Promise<IntentResponse> {
    console.log('[Siri] Handling intent:', intent.type);

    try {
      switch (intent.type) {
        case IntentType.CreateTask:
          return await handleCreateTask(intent as CreateTaskIntent, this.listeners);

        case IntentType.CompleteTask:
          return await handleCompleteTask(intent as CompleteTaskIntent, this.listeners);

        case IntentType.ViewTasks:
          return await handleViewTasks(intent as ViewTasksIntent, this.listeners);

        case IntentType.SearchTasks:
          return await handleSearchTasks(intent as SearchTasksIntent, this.listeners);

        default:
          return {
            success: false,
            message: 'Unknown intent type',
          };
      }
    } catch (error) {
      console.error('[Siri] Intent handling error:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Intent failed',
      };
    }
  }

  /**
   * Register intent handler
   */
  static registerHandler(intentType: IntentType, handler: Function) {
    this.listeners.set(intentType, handler);
    console.log('[Siri] Registered handler for:', intentType);
  }

  /**
   * Unregister intent handler
   */
  static unregisterHandler(intentType: IntentType) {
    this.listeners.delete(intentType);
  }

  /**
   * Cleanup
   */
  static cleanup() {
    if (this.emitter) {
      this.emitter.removeAllListeners('onIntentReceived');
      this.emitter.removeAllListeners('onIntentCancelled');
    }
    this.listeners.clear();
  }
}

/**
 * responseBuilder.ts
 *
 * Intent response builder utilities
 * Formats responses for Siri
 */

import { IntentResponse } from '../types';

/**
 * Intent response builder
 */
export class IntentResponseBuilder {
  /**
   * Build success response with custom message
   */
  static success(message: string, data?: any): IntentResponse {
    return {
      success: true,
      message,
      data,
    };
  }

  /**
   * Build error response
   */
  static error(message: string): IntentResponse {
    return {
      success: false,
      message,
    };
  }

  /**
   * Build task created response
   */
  static taskCreated(taskTitle: string, taskId: string): IntentResponse {
    return this.success(`Created task: ${taskTitle}`, {
      taskId,
      taskTitle,
    });
  }

  /**
   * Build task completed response
   */
  static taskCompleted(taskTitle: string): IntentResponse {
    return this.success(`Completed: ${taskTitle}`);
  }

  /**
   * Build tasks list response
   */
  static tasksList(tasks: any[], filter?: string): IntentResponse {
    const filterText = filter ? ` (${filter})` : '';
    return this.success(
      `You have ${tasks.length} task${tasks.length !== 1 ? 's' : ''}${filterText}`,
      tasks
    );
  }

  /**
   * Build search results response
   */
  static searchResults(query: string, results: any[]): IntentResponse {
    return this.success(
      `Found ${results.length} task${results.length !== 1 ? 's' : ''} matching "${query}"`,
      results
    );
  }
}

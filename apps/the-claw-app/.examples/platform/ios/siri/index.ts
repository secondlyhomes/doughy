/**
 * index.ts
 *
 * Siri Intent Handler for React Native
 *
 * Handles Siri requests and app launches:
 * - Parse intent parameters
 * - Execute app logic
 * - Return response to Siri
 * - Handle background execution
 *
 * Requirements:
 * - Intents Extension target in Xcode
 * - Intents.intentdefinition file
 * - Background modes enabled
 *
 * Related docs:
 * - .examples/platform/ios/siri/README.md
 * - .examples/platform/ios/siri/shortcuts.ts
 */

// Types
export {
  IntentType,
  type Intent,
  type IntentResponse,
  type IntentHandler,
  type CreateTaskIntent,
  type CompleteTaskIntent,
  type ViewTasksIntent,
  type SearchTasksIntent,
} from './types';

// Core manager
export { IntentHandlerManager } from './IntentHandlerManager';

// Handlers
export {
  handleCreateTask,
  handleCompleteTask,
  handleViewTasks,
  handleSearchTasks,
} from './handlers';

// Utils
export { IntentResponseBuilder } from './utils';

// React components and hooks
export { useSiriIntentHandler } from './useSiriIntentHandler';
export { SiriIntentProvider, ExampleSiriIntentScreen } from './SiriIntentProvider';

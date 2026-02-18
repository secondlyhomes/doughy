/**
 * index.ts
 *
 * Clean re-exports for iOS Handoff (Continuity) Integration
 *
 * Usage:
 * ```typescript
 * import {
 *   HandoffManager,
 *   useHandoff,
 *   HandoffActivityType,
 *   TaskDetailWithHandoff,
 * } from '.examples/platform/ios/features/handoff';
 * ```
 */

// Types
export { HandoffActivityType } from './types';
export type {
  HandoffActivity,
  Task,
  UseHandoffReturn,
  TaskDetailWithHandoffProps,
} from './types';

// Manager class
export { HandoffManager } from './HandoffManager';

// Hooks
export { useHandoff } from './hooks/useHandoff';

// Components
export { TaskDetailWithHandoff } from './components/TaskDetailWithHandoff';

// Styles
export { styles } from './styles';

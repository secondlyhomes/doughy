/**
 * ShareSheet Module
 *
 * iOS Share Sheet Integration
 *
 * @example
 * ```tsx
 * import { useShare, ShareButton, ShareTaskScreen } from './ShareSheet';
 *
 * // Using the hook
 * const { shareTask, shareTaskList, shareCustom, copyToClipboard } = useShare();
 * await shareTask(myTask);
 *
 * // Using components
 * <ShareButton task={myTask} />
 * <ShareTaskScreen task={myTask} />
 * ```
 *
 * For Share Extension setup, see SHARE_EXTENSION.md
 */

// Types
export type { ShareContent, ShareResult, ShareableTask } from './types';

// Core functionality
export { ShareManager } from './ShareManager';

// Hooks
export { useShare } from './hooks/useShareSheet';

// Components
export { ShareButton } from './components/ShareButton';
export { ShareTaskScreen } from './components/ShareTaskScreen';

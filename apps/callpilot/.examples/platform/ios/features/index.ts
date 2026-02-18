/**
 * iOS Context Menu Feature
 *
 * Barrel export for all context menu related components and utilities.
 *
 * @example
 * ```tsx
 * import {
 *   TaskContextMenu,
 *   TaskCard,
 *   SimpleContextMenu,
 *   ContextMenuWithPreview,
 *   useTaskContextMenuConfig,
 *   type ContextMenuAction,
 *   type Task,
 * } from './features';
 * ```
 */

// Types
export type {
  ContextMenuAction,
  ContextMenuConfig,
  Task,
  TaskContextMenuProps,
  SimpleContextMenuProps,
  ContextMenuWithPreviewProps,
  TaskCardProps,
} from './types';

// Hooks
export { useTaskContextMenuActions, useTaskContextMenuConfig } from './useContextMenu';

// Components
export { TaskContextMenu } from './TaskContextMenu';
export { TaskCard } from './TaskCard';
export { SimpleContextMenu, ContextMenuWithPreview } from './SimpleContextMenu';

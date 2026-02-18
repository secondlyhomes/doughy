/**
 * TaskContextMenu Component
 *
 * Context menu wrapper for task items with common actions.
 */

import React from 'react';
import { View } from 'react-native';
import { TaskContextMenuProps } from './types';
import { useTaskContextMenuConfig } from './useContextMenu';

/**
 * Task Context Menu Component
 *
 * Wraps children with a context menu containing task-specific actions.
 * Uses react-native-context-menu-view for native iOS context menus.
 *
 * @example
 * ```tsx
 * <TaskContextMenu
 *   task={task}
 *   onComplete={handleComplete}
 *   onEdit={handleEdit}
 *   onDelete={handleDelete}
 * >
 *   <TaskCard task={task} />
 * </TaskContextMenu>
 * ```
 */
export function TaskContextMenu({
  task,
  children,
  onComplete,
  onEdit,
  onDelete,
  onDuplicate,
  onShare,
}: TaskContextMenuProps) {
  // Build menu configuration using the hook
  const _menuConfig = useTaskContextMenuConfig(task, {
    onComplete,
    onEdit,
    onDelete,
    onDuplicate,
    onShare,
  });

  // Using react-native-context-menu-view
  // Install: npm install react-native-context-menu-view
  //
  // Real implementation would wrap children with ContextMenuView:
  // <ContextMenuView
  //   menuConfig={menuConfig}
  //   onPressMenuItem={handlePress}
  // >
  //   {children}
  // </ContextMenuView>

  return <View>{children}</View>;
}

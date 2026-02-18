/**
 * Context Menu Types
 *
 * Type definitions for iOS Context Menu components.
 */

import React from 'react';

/**
 * Menu action configuration
 */
export interface ContextMenuAction {
  title: string;
  systemIcon?: string;
  image?: string;
  destructive?: boolean;
  disabled?: boolean;
  inlineChildren?: boolean;
  actions?: ContextMenuAction[];
  onPress?: () => void;
}

/**
 * Menu configuration
 */
export interface ContextMenuConfig {
  title?: string;
  actions: ContextMenuAction[];
  previewConfig?: {
    backgroundColor?: string;
    borderRadius?: number;
  };
}

/**
 * Task type for context menu examples
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority?: 'high' | 'medium' | 'low';
  dueDate?: Date;
}

/**
 * TaskContextMenu props
 */
export interface TaskContextMenuProps {
  task: Task;
  children: React.ReactNode;
  onComplete?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onShare?: () => void;
}

/**
 * SimpleContextMenu props
 */
export interface SimpleContextMenuProps {
  children: React.ReactNode;
  actions: ContextMenuAction[];
}

/**
 * ContextMenuWithPreview props
 */
export interface ContextMenuWithPreviewProps {
  children: React.ReactNode;
  previewContent: React.ReactNode;
  actions: ContextMenuAction[];
}

/**
 * TaskCard props
 */
export interface TaskCardProps {
  task: Task;
}

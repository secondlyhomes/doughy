/**
 * ContextMenu.tsx
 *
 * iOS Context Menu (3D Touch / Haptic Touch)
 *
 * Context menus provide quick actions when long-pressing or
 * force-touching an element.
 *
 * Features:
 * - Preview content before action
 * - Quick actions without navigation
 * - System-style menus
 * - Haptic feedback
 *
 * Requirements:
 * - iOS 13+ for Context Menus
 * - iOS 10+ for 3D Touch (older devices)
 * - react-native-context-menu-view
 *
 * @module ContextMenu
 */

// Re-export all components and types
export * from './types';
export * from './useContextMenu';
export * from './TaskContextMenu';
export * from './TaskCard';
export * from './SimpleContextMenu';

/**
 * SF Symbols Icons (iOS)
 *
 * Common system icons for context menus:
 *
 * Actions:
 * - checkmark.circle (complete)
 * - checkmark.circle.fill (completed)
 * - pencil (edit)
 * - trash (delete)
 * - doc.on.doc (duplicate)
 * - square.and.arrow.up (share)
 *
 * Organization:
 * - folder (move to folder)
 * - tag (add tag)
 * - flag (set priority)
 * - calendar (set date)
 * - star (favorite)
 *
 * Navigation:
 * - arrow.right (go to)
 * - arrow.up.right (open in)
 * - arrow.turn.up.right (reply)
 *
 * More:
 * - ellipsis.circle (more options)
 * - info.circle (details)
 * - eye (preview)
 * - link (copy link)
 */

/**
 * Native Implementation Guide
 *
 * For UIContextMenuConfiguration in iOS:
 *
 * ```swift
 * // In your UIViewController or UICollectionViewCell
 *
 * func contextMenuInteraction(
 *   _ interaction: UIContextMenuInteraction,
 *   configurationForMenuAtLocation location: CGPoint
 * ) -> UIContextMenuConfiguration? {
 *
 *   return UIContextMenuConfiguration(
 *     identifier: nil,
 *     previewProvider: {
 *       // Return preview view controller
 *       return TaskPreviewViewController(task: self.task)
 *     },
 *     actionProvider: { suggestedActions in
 *       // Create menu actions
 *       let completeAction = UIAction(
 *         title: "Complete",
 *         image: UIImage(systemName: "checkmark.circle")
 *       ) { action in
 *         self.completeTask()
 *       }
 *
 *       let editAction = UIAction(
 *         title: "Edit",
 *         image: UIImage(systemName: "pencil")
 *       ) { action in
 *         self.editTask()
 *       }
 *
 *       let deleteAction = UIAction(
 *         title: "Delete",
 *         image: UIImage(systemName: "trash"),
 *         attributes: .destructive
 *       ) { action in
 *         self.deleteTask()
 *       }
 *
 *       // Create menu
 *       return UIMenu(title: "", children: [
 *         completeAction,
 *         editAction,
 *         deleteAction
 *       ])
 *     }
 *   )
 * }
 * ```
 *
 * For React Native integration:
 *
 * ```typescript
 * import ContextMenu from 'react-native-context-menu-view';
 *
 * <ContextMenu
 *   actions={[
 *     { title: 'Complete', systemIcon: 'checkmark.circle' },
 *     { title: 'Edit', systemIcon: 'pencil' },
 *     { title: 'Delete', systemIcon: 'trash', destructive: true },
 *   ]}
 *   onPress={(e) => {
 *     const { index } = e.nativeEvent;
 *     if (index === 0) completeTask();
 *     if (index === 1) editTask();
 *     if (index === 2) deleteTask();
 *   }}
 *   previewBackgroundColor="#FFFFFF"
 * >
 *   <TaskCard task={task} />
 * </ContextMenu>
 * ```
 */

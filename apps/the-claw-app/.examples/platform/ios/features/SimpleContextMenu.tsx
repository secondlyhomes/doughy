/**
 * SimpleContextMenu Component
 *
 * Basic context menu wrapper with custom actions.
 */

import React from 'react';
import { View } from 'react-native';
import { SimpleContextMenuProps, ContextMenuWithPreviewProps } from './types';

/**
 * Simple Context Menu
 *
 * Wraps children with a basic context menu.
 *
 * @example
 * ```tsx
 * <SimpleContextMenu
 *   actions={[
 *     { title: 'Copy', systemIcon: 'doc.on.doc', onPress: handleCopy },
 *     { title: 'Delete', systemIcon: 'trash', destructive: true, onPress: handleDelete },
 *   ]}
 * >
 *   <Text>Long press me</Text>
 * </SimpleContextMenu>
 * ```
 */
export function SimpleContextMenu({ children, actions }: SimpleContextMenuProps) {
  // Store actions for use in real implementation
  const _actions = actions;

  return <View>{children}</View>;
}

/**
 * Context Menu with Preview
 *
 * Shows a preview when long-pressing, with context menu actions.
 *
 * @example
 * ```tsx
 * <ContextMenuWithPreview
 *   previewContent={<ImagePreview uri={imageUri} />}
 *   actions={[
 *     { title: 'Save', systemIcon: 'square.and.arrow.down' },
 *     { title: 'Share', systemIcon: 'square.and.arrow.up' },
 *   ]}
 * >
 *   <Thumbnail uri={imageUri} />
 * </ContextMenuWithPreview>
 * ```
 */
export function ContextMenuWithPreview({
  children,
  previewContent,
  actions,
}: ContextMenuWithPreviewProps) {
  // Store for real implementation
  const _previewContent = previewContent;
  const _actions = actions;

  return (
    <View>
      {children}
      {/* Preview shown when long-pressing */}
    </View>
  );
}

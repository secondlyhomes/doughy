/**
 * DocumentCard Component
 * Reusable card for displaying documents (all types: lead, property, research, transaction)
 *
 * Built on DataCard pattern for consistency with existing UI components.
 * Follows Zone B design system standards with zero hardcoded values.
 */

import React from 'react';
import { View, Image } from 'react-native';
import {
  Download,
  Trash2,
  Link as LinkIcon,
  Eye,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { BORDER_RADIUS } from '@/constants/design-tokens';
import { DataCard, DataCardField, DataCardAction, DataCardBadge } from './DataCard';
import { getDocumentTypeIcon, getDocumentTypeLabel, formatFileSize, formatDate } from '@/components/ui/document-card-helpers';

// Re-export types and compact variant for barrel exports
export type { DocumentCardDocument, DocumentCardProps } from '@/components/ui/document-card-types';
export { DocumentCardCompact } from '@/components/ui/DocumentCardCompact';

import type { DocumentCardProps } from '@/components/ui/document-card-types';

export function DocumentCard({
  document,
  showLinkBadge = false,
  linkedPropertiesCount = 0,
  isPrimary = false,
  onView,
  onDownload,
  onDelete,
  onLink,
  readOnly = false,
  style,
  variant = 'default',
}: DocumentCardProps) {
  const colors = useThemeColors();

  const DocIcon = getDocumentTypeIcon(document.type);
  const typeLabel = getDocumentTypeLabel(document.type);

  // Build data fields
  const fields: DataCardField[] = [];

  // Add file size if available
  if (document.file_size) {
    fields.push({
      label: 'Size',
      value: formatFileSize(document.file_size),
      iconColor: colors.mutedForeground,
    });
  }

  // Add upload date
  fields.push({
    label: 'Uploaded',
    value: formatDate(document.created_at),
    iconColor: colors.mutedForeground,
  });

  // Build badges
  const badges: DataCardBadge[] = [
    {
      label: typeLabel,
      variant: 'outline',
      size: 'sm',
    },
  ];

  // Add link badge if document is linked to multiple properties
  if (showLinkBadge && linkedPropertiesCount > 1) {
    badges.push({
      label: isPrimary
        ? `Primary (${linkedPropertiesCount - 1} linked)`
        : `Linked to ${linkedPropertiesCount} properties`,
      variant: 'info',
      size: 'sm',
    });
  }

  // Build actions
  const actions: DataCardAction[] = [];

  if (onView) {
    actions.push({
      icon: Eye,
      label: 'View',
      onPress: onView,
      variant: 'default',
    });
  }

  if (onDownload) {
    actions.push({
      icon: Download,
      label: 'Download',
      onPress: onDownload,
      variant: 'default',
    });
  }

  if (!readOnly) {
    if (onLink) {
      actions.push({
        icon: LinkIcon,
        label: 'Link',
        onPress: onLink,
        variant: 'default',
      });
    }

    if (onDelete) {
      actions.push({
        icon: Trash2,
        label: 'Delete',
        onPress: onDelete,
        variant: 'destructive',
      });
    }
  }

  return (
    <DataCard
      title={document.title}
      subtitle={document.type}
      headerIcon={DocIcon}
      fields={fields}
      badges={badges}
      actions={actions}
      onPress={onView}
      style={style}
      variant={variant}
      headerRight={
        document.thumbnail_url ? (
          <View
            style={{
              width: 48,
              height: 48,
              borderRadius: BORDER_RADIUS.md,
              overflow: 'hidden',
              backgroundColor: withOpacity(colors.muted, 'strong'),
            }}
          >
            <Image
              source={{ uri: document.thumbnail_url }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>
        ) : undefined
      }
    />
  );
}

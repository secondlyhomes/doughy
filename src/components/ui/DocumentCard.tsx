/**
 * DocumentCard Component
 * Reusable card for displaying documents (all types: lead, property, research, transaction)
 *
 * Built on DataCard pattern for consistency with existing UI components.
 * Follows Zone B design system standards with zero hardcoded values.
 */

import React from 'react';
import { View, Text, TouchableOpacity, Image, ViewStyle } from 'react-native';
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  Link as LinkIcon,
  Eye,
  MoreVertical,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES } from '@/constants/design-tokens';
import { DataCard, DataCardField, DataCardAction, DataCardBadge } from './DataCard';
import { Badge } from './Badge';

export interface DocumentCardDocument {
  id: string;
  title: string;
  type: string;
  file_url: string;
  created_at: string;
  file_size?: number;
  thumbnail_url?: string;
}

export interface DocumentCardProps {
  /** Document data */
  document: DocumentCardDocument;

  /** Whether to show badge indicating document is linked to multiple properties */
  showLinkBadge?: boolean;

  /** Number of properties this document is linked to */
  linkedPropertiesCount?: number;

  /** Whether this is the primary property for this document */
  isPrimary?: boolean;

  /** Action handlers */
  onView?: () => void;
  onDownload?: () => void;
  onDelete?: () => void;
  onLink?: () => void;

  /** Whether the card is in read-only mode (no delete/link actions) */
  readOnly?: boolean;

  /** Custom styling */
  style?: ViewStyle;

  /** Card variant */
  variant?: 'default' | 'glass';
}

/**
 * Get icon for document type
 */
function getDocumentTypeIcon(type: string) {
  const lowerType = type.toLowerCase();

  if (lowerType.includes('image') || lowerType.includes('photo') || lowerType.includes('jpg') || lowerType.includes('png')) {
    return ImageIcon;
  }

  if (lowerType.includes('pdf')) {
    return FileText;
  }

  return File;
}

/**
 * Get user-friendly document type label
 */
function getDocumentTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    id: 'ID',
    tax_return: 'Tax Return',
    bank_statement: 'Bank Statement',
    w9: 'W-9',
    death_cert: 'Death Certificate',
    poa: 'Power of Attorney',
    inspection: 'Inspection Report',
    appraisal: 'Appraisal',
    title_search: 'Title Search',
    survey: 'Survey',
    photo: 'Photo',
    comp: 'Comp',
    offer: 'Offer',
    counter_offer: 'Counter Offer',
    purchase_agreement: 'Purchase Agreement',
    addendum: 'Addendum',
    closing_statement: 'Closing Statement',
    hud1: 'HUD-1',
    deed: 'Deed',
    contract: 'Contract',
    receipt: 'Receipt',
    other: 'Other',
  };

  return typeMap[type.toLowerCase()] || type;
}

/**
 * Format file size for display
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '';

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

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

/**
 * Compact variant for list views
 */
export function DocumentCardCompact({
  document,
  showLinkBadge = false,
  linkedPropertiesCount = 0,
  onPress,
  style,
}: Pick<DocumentCardProps, 'document' | 'showLinkBadge' | 'linkedPropertiesCount' | 'style'> & {
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const DocIcon = getDocumentTypeIcon(document.type);
  const typeLabel = getDocumentTypeLabel(document.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Document: ${document.title}`}
    >
      {/* Icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: BORDER_RADIUS.md,
          backgroundColor: withOpacity(colors.primary, 'muted'),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.md,
        }}
      >
        <DocIcon size={ICON_SIZES.lg} color={colors.primary} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: 2,
          }}
          numberOfLines={1}
        >
          {document.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
            }}
          >
            {typeLabel}
          </Text>
          {showLinkBadge && linkedPropertiesCount > 1 && (
            <>
              <Text style={{ color: colors.mutedForeground }}>•</Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.info,
                }}
              >
                {linkedPropertiesCount} properties
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Date */}
      <Text
        style={{
          fontSize: 12,
          color: colors.mutedForeground,
          marginLeft: SPACING.sm,
        }}
      >
        {formatDate(document.created_at)}
      </Text>
    </TouchableOpacity>
  );
}

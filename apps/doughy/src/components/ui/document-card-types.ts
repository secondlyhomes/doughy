/**
 * DocumentCard Types
 * Shared type definitions for DocumentCard and DocumentCardCompact components.
 */

import { ViewStyle } from 'react-native';

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

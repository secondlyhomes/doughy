/**
 * DocumentCard Helpers
 * Pure utility functions for document type icons, labels, file size formatting, and date formatting.
 */

import {
  FileText,
  Image as ImageIcon,
  File,
} from 'lucide-react-native';

/**
 * Get icon for document type
 */
export function getDocumentTypeIcon(type: string) {
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
export function getDocumentTypeLabel(type: string): string {
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
export function formatFileSize(bytes?: number): string {
  if (!bytes) return '';

  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * Format date for display
 */
export function formatDate(dateString: string): string {
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

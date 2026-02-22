// src/features/real-estate/components/property-docs-constants.ts
// Constants and type mappings for PropertyDocsTab

import {
  FileText,
  FileImage,
  FileCheck,
  FileCog,
  File,
} from 'lucide-react-native';

// Document type classifications for filtering
export const RESEARCH_TYPES = ['inspection', 'appraisal', 'title_search', 'survey', 'photo', 'comp'];
export const TRANSACTION_TYPES = ['offer', 'counter_offer', 'purchase_agreement', 'addendum', 'closing_statement', 'hud1', 'deed', 'contract'];

// Document type icons
export const DOC_TYPE_ICONS: Record<string, any> = {
  contract: FileCheck,
  inspection: FileCog,
  appraisal: FileText,
  photo: FileImage,
  receipt: FileText,
  other: File,
};

export function getDocIcon(type: string) {
  return DOC_TYPE_ICONS[type] || File;
}

// Pure filter/grouping helpers
import { Document } from '../types';
import { DOCUMENT_CATEGORIES, DocumentCategory } from '../hooks/usePropertyDocuments';
import { DocumentFilterType } from './DocumentTypeFilter';

export function filterDocumentsByType(documents: Document[], filterType: DocumentFilterType): Document[] {
  if (filterType === 'all') return documents;

  return documents.filter((doc) => {
    const docType = (doc.type || doc.category || 'other').toLowerCase();
    if (filterType === 'research') {
      return RESEARCH_TYPES.includes(docType);
    }
    if (filterType === 'transaction') {
      return TRANSACTION_TYPES.includes(docType);
    }
    // 'seller' filter doesn't apply to property docs (those are in LeadDocsTab)
    return true;
  });
}

export function groupDocumentsByCategory(documents: Document[]): Map<DocumentCategory, Document[]> {
  const map = new Map<DocumentCategory, Document[]>();
  DOCUMENT_CATEGORIES.forEach(cat => map.set(cat.id, []));

  documents.forEach(doc => {
    const category = (doc.type || doc.category || 'other') as DocumentCategory;
    const validCategory = DOCUMENT_CATEGORIES.find(c => c.id === category) ? category : 'other';
    const existing = map.get(validCategory) || [];
    existing.push(doc);
    map.set(validCategory, existing);
  });

  return map;
}

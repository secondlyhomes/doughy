// src/features/real-estate/components/PropertyDocsTab.tsx
// Documents tab content for property detail

import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { Upload } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Button, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { ICON_SIZES } from '@/constants/design-tokens';
import { Property } from '../types';
import {
  usePropertyDocuments,
  DOCUMENT_CATEGORIES,
  DocumentCategory,
} from '../hooks/usePropertyDocuments';
import { UploadDocumentSheet } from './UploadDocumentSheet';
import { DocumentFilterType } from './DocumentTypeFilter';
import { filterDocumentsByType, groupDocumentsByCategory } from './property-docs-constants';
import { DocsEmptyState } from './DocsEmptyState';
import { DocumentCategorySection } from './DocumentCategorySection';
import { useDocumentActions } from './useDocumentActions';

interface PropertyDocsTabProps {
  property: Property;
  /** Optional filter type to show only specific document categories */
  filterType?: DocumentFilterType;
  /** Hide the header (useful when embedded in another component with its own header) */
  hideHeader?: boolean;
}

export function PropertyDocsTab({ property, filterType = 'all', hideHeader = false }: PropertyDocsTabProps) {
  const colors = useThemeColors();
  const { documents, isLoading, error, refetch } = usePropertyDocuments({
    propertyId: property.id,
  });

  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<DocumentCategory>>(
    new Set(['contract', 'inspection', 'appraisal'])
  );

  const { deletingId, handleViewDocument, handleDeleteDocument } = useDocumentActions(refetch);

  const filteredDocuments = useMemo(
    () => filterDocumentsByType(documents, filterType),
    [documents, filterType]
  );

  const filteredDocumentsByCategory = useMemo(
    () => groupDocumentsByCategory(filteredDocuments),
    [filteredDocuments]
  );

  const hasDocuments = filteredDocuments.length > 0;

  const toggleCategory = useCallback((category: DocumentCategory) => {
    setExpandedCategories((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  }, []);

  const handleUploadSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Loading state
  if (isLoading && documents.length === 0) {
    return (
      <View className="py-8">
        <LoadingSpinner fullScreen text="Loading documents..." />
      </View>
    );
  }

  // Error state
  if (error && documents.length === 0) {
    return (
      <View className="gap-4 py-8 items-center">
        <Text style={{ color: colors.destructive }}>{error.message}</Text>
        <Button onPress={refetch}>Retry</Button>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
    >
      <View className="gap-4">
        {/* Header */}
      {!hideHeader && (
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Documents</Text>
            {filteredDocuments.length > 0 && (
              <View className="px-2 py-1 rounded-full ml-2" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                <Text className="text-xs font-medium" style={{ color: colors.primary }}>{filteredDocuments.length}</Text>
              </View>
            )}
          </View>
          <Button onPress={() => setShowUploadSheet(true)} size="sm">
            <Upload size={ICON_SIZES.md} color={colors.primaryForeground} />
            Upload
          </Button>
        </View>
      )}

      {/* Empty State */}
      {!hasDocuments && (
        <DocsEmptyState onUpload={() => setShowUploadSheet(true)} />
      )}

      {/* Documents by Category */}
      {hasDocuments && (
        <View className="gap-3">
          {DOCUMENT_CATEGORIES.map((category) => {
            const categoryDocs = filteredDocumentsByCategory.get(category.id) || [];
            if (categoryDocs.length === 0) return null;

            return (
              <DocumentCategorySection
                key={category.id}
                categoryId={category.id}
                categoryLabel={category.label}
                documents={categoryDocs}
                isExpanded={expandedCategories.has(category.id)}
                deletingId={deletingId}
                onToggle={toggleCategory}
                onViewDocument={handleViewDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            );
          })}
        </View>
      )}

      {/* Upload Info */}
      <View className="rounded-xl p-4" style={{ backgroundColor: colors.muted }}>
        <View className="flex-row items-center mb-2">
          <Upload size={ICON_SIZES.md} color={colors.mutedForeground} />
          <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>Upload Documents</Text>
        </View>
        <Text className="text-xs" style={{ color: colors.mutedForeground }}>
          Supported formats: PDF, Images (JPG, PNG), Word documents. Maximum file size: 10MB.
        </Text>
      </View>

      {/* Upload Sheet */}
      <UploadDocumentSheet
        propertyId={property.id}
        isOpen={showUploadSheet}
        onClose={() => setShowUploadSheet(false)}
        onSuccess={handleUploadSuccess}
      />
      </View>
    </ScrollView>
  );
}

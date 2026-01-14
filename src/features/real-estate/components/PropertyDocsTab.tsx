// src/features/real-estate/components/PropertyDocsTab.tsx
// Documents tab content for property detail

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import {
  FileText,
  Upload,
  FileImage,
  FileCheck,
  FileCog,
  File,
  Download,
  Trash2,
  FolderOpen,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Button, LoadingSpinner } from '@/components/ui';
import { Property, Document } from '../types';
import { formatDate, formatFileSize } from '../utils/formatters';
import {
  usePropertyDocuments,
  useDocumentMutations,
  DOCUMENT_CATEGORIES,
  DocumentCategory,
} from '../hooks/usePropertyDocuments';
import { UploadDocumentSheet } from './UploadDocumentSheet';

interface PropertyDocsTabProps {
  property: Property;
}

// Document type icons
const DOC_TYPE_ICONS: Record<string, any> = {
  contract: FileCheck,
  inspection: FileCog,
  appraisal: FileText,
  photo: FileImage,
  receipt: FileText,
  other: File,
};

export function PropertyDocsTab({ property }: PropertyDocsTabProps) {
  const colors = useThemeColors();
  const { documents, isLoading, error, refetch, documentsByCategory } = usePropertyDocuments({
    propertyId: property.id,
  });
  const { deleteDocument, isLoading: isDeleting } = useDocumentMutations();

  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<DocumentCategory>>(
    new Set(['contract', 'inspection', 'appraisal'])
  );

  const hasDocuments = documents.length > 0;

  const getDocIcon = (type: string) => {
    return DOC_TYPE_ICONS[type] || File;
  };

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

  const handleViewDocument = useCallback(async (doc: Document) => {
    const url = doc.url || doc.fileUrl;
    if (!url) {
      Alert.alert('Error', 'Document URL not available');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this document');
      }
    } catch (err) {
      console.error('Error opening document:', err);
      Alert.alert('Error', 'Failed to open document');
    }
  }, []);

  const handleDeleteDocument = useCallback(
    async (doc: Document) => {
      Alert.alert('Delete Document', `Are you sure you want to delete "${doc.title || doc.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(doc.id);
            const success = await deleteDocument(doc);
            setDeletingId(null);
            if (success) {
              refetch();
            } else {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]);
    },
    [deleteDocument, refetch]
  );

  const handleUploadSuccess = useCallback(() => {
    refetch();
  }, [refetch]);

  // Render a single document item
  const renderDocumentItem = (doc: Document) => {
    const Icon = getDocIcon(doc.type || doc.category || 'other');
    const isDeletingDoc = deletingId === doc.id;

    return (
      <View
        key={doc.id}
        className="rounded-xl p-4 mb-2"
        style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => handleViewDocument(doc)}
            className="flex-row items-center flex-1"
          >
            <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: colors.muted }}>
              <Icon size={20} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="font-medium" numberOfLines={1} style={{ color: colors.foreground }}>
                {doc.title || doc.name || 'Untitled Document'}
              </Text>
              <View className="flex-row items-center mt-1 flex-wrap">
                <Text className="text-xs capitalize" style={{ color: colors.mutedForeground }}>
                  {doc.type || doc.category || 'other'}
                </Text>
                {doc.created_at && (
                  <>
                    <Text className="text-xs mx-1" style={{ color: colors.mutedForeground }}>•</Text>
                    <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                      {formatDate(doc.created_at)}
                    </Text>
                  </>
                )}
              </View>
              {doc.description && (
                <Text className="text-xs mt-1" numberOfLines={1} style={{ color: colors.mutedForeground }}>
                  {doc.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View className="flex-row gap-2 ml-2">
            <TouchableOpacity
              onPress={() => handleViewDocument(doc)}
              className="p-2 rounded-lg"
              style={{ backgroundColor: colors.muted }}
            >
              <Download size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => handleDeleteDocument(doc)}
              disabled={isDeletingDoc}
              loading={isDeletingDoc}
              style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
            >
              {!isDeletingDoc && <Trash2 size={16} color={colors.destructive} />}
            </Button>
          </View>
        </View>
      </View>
    );
  };

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
    <View className="gap-4">
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>Documents</Text>
          {documents.length > 0 && (
            <View className="px-2 py-1 rounded-full ml-2" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
              <Text className="text-xs font-medium" style={{ color: colors.primary }}>{documents.length}</Text>
            </View>
          )}
        </View>
        <Button onPress={() => setShowUploadSheet(true)} size="sm">
          <Upload size={16} color={colors.primaryForeground} />
          Upload
        </Button>
      </View>

      {/* Empty State */}
      {!hasDocuments && (
        <>
          <View className="flex-1 items-center justify-center py-12 rounded-xl" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <View className="rounded-full p-4 mb-4" style={{ backgroundColor: colors.muted }}>
              <FileText size={32} color={colors.mutedForeground} />
            </View>
            <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>No Documents</Text>
            <Text className="text-center px-8 mb-4" style={{ color: colors.mutedForeground }}>
              Upload contracts, inspections, appraisals, and other documents related to this
              property.
            </Text>
            <Button variant="secondary" onPress={() => setShowUploadSheet(true)}>
              <Upload size={16} color={colors.foreground} />
              Upload First Document
            </Button>
          </View>

          {/* Document Types Quick Info */}
          <View className="rounded-xl p-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
            <Text className="text-sm font-medium mb-3" style={{ color: colors.foreground }}>
              Supported Document Types
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DOCUMENT_CATEGORIES.map((docType) => {
                const Icon = getDocIcon(docType.id);
                return (
                  <View
                    key={docType.id}
                    className="flex-row items-center px-3 py-2 rounded-lg"
                    style={{ backgroundColor: colors.muted }}
                  >
                    <Icon size={14} color={colors.mutedForeground} />
                    <Text className="text-sm ml-2" style={{ color: colors.foreground }}>{docType.label}</Text>
                  </View>
                );
              })}
            </View>
          </View>
        </>
      )}

      {/* Documents by Category */}
      {hasDocuments && (
        <View className="gap-3">
          {DOCUMENT_CATEGORIES.map((category) => {
            const categoryDocs = documentsByCategory.get(category.id) || [];
            if (categoryDocs.length === 0) return null;

            const isExpanded = expandedCategories.has(category.id);
            const Icon = getDocIcon(category.id);
            const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

            return (
              <View key={category.id} className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
                {/* Category Header */}
                <TouchableOpacity
                  onPress={() => toggleCategory(category.id)}
                  className="flex-row items-center justify-between p-4"
                >
                  <View className="flex-row items-center">
                    <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: colors.muted }}>
                      <Icon size={18} color={colors.primary} />
                    </View>
                    <Text className="font-medium" style={{ color: colors.foreground }}>{category.label}</Text>
                    <View className="px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                      <Text className="text-xs font-medium" style={{ color: colors.primary }}>{categoryDocs.length}</Text>
                    </View>
                  </View>
                  <ChevronIcon size={20} color={colors.mutedForeground} />
                </TouchableOpacity>

                {/* Category Documents */}
                {isExpanded && (
                  <View className="px-4 pb-4">
                    {categoryDocs.map(renderDocumentItem)}
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Upload Info */}
      <View className="rounded-xl p-4" style={{ backgroundColor: colors.muted }}>
        <View className="flex-row items-center mb-2">
          <Upload size={16} color={colors.mutedForeground} />
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
  );
}

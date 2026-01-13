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
        className="bg-card rounded-xl p-4 border border-border mb-2"
      >
        <View className="flex-row items-center justify-between">
          <TouchableOpacity
            onPress={() => handleViewDocument(doc)}
            className="flex-row items-center flex-1"
          >
            <View className="bg-muted rounded-lg p-2 mr-3">
              <Icon size={20} className="text-primary" />
            </View>
            <View className="flex-1">
              <Text className="text-foreground font-medium" numberOfLines={1}>
                {doc.title || doc.name || 'Untitled Document'}
              </Text>
              <View className="flex-row items-center mt-1 flex-wrap">
                <Text className="text-xs text-muted-foreground capitalize">
                  {doc.type || doc.category || 'other'}
                </Text>
                {doc.created_at && (
                  <>
                    <Text className="text-xs text-muted-foreground mx-1">•</Text>
                    <Text className="text-xs text-muted-foreground">
                      {formatDate(doc.created_at)}
                    </Text>
                  </>
                )}
              </View>
              {doc.description && (
                <Text className="text-xs text-muted-foreground mt-1" numberOfLines={1}>
                  {doc.description}
                </Text>
              )}
            </View>
          </TouchableOpacity>

          <View className="flex-row gap-2 ml-2">
            <TouchableOpacity
              onPress={() => handleViewDocument(doc)}
              className="bg-muted p-2 rounded-lg"
            >
              <Download size={16} className="text-muted-foreground" />
            </TouchableOpacity>
            <Button
              variant="ghost"
              size="icon"
              onPress={() => handleDeleteDocument(doc)}
              disabled={isDeletingDoc}
              loading={isDeletingDoc}
              className="bg-destructive/10"
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
        <Text className="text-destructive">{error.message}</Text>
        <Button onPress={refetch}>Retry</Button>
      </View>
    );
  }

  return (
    <View className="gap-4">
      {/* Header */}
      <View className="flex-row justify-between items-center">
        <View className="flex-row items-center">
          <Text className="text-lg font-semibold text-foreground">Documents</Text>
          {documents.length > 0 && (
            <View className="bg-primary/10 px-2 py-1 rounded-full ml-2">
              <Text className="text-xs text-primary font-medium">{documents.length}</Text>
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
          <View className="flex-1 items-center justify-center py-12 bg-card rounded-xl border border-border">
            <View className="bg-muted rounded-full p-4 mb-4">
              <FileText size={32} className="text-muted-foreground" />
            </View>
            <Text className="text-lg font-semibold text-foreground mb-2">No Documents</Text>
            <Text className="text-muted-foreground text-center px-8 mb-4">
              Upload contracts, inspections, appraisals, and other documents related to this
              property.
            </Text>
            <Button variant="secondary" onPress={() => setShowUploadSheet(true)}>
              <Upload size={16} color={colors.foreground} />
              Upload First Document
            </Button>
          </View>

          {/* Document Types Quick Info */}
          <View className="bg-card rounded-xl p-4 border border-border">
            <Text className="text-sm font-medium text-foreground mb-3">
              Supported Document Types
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {DOCUMENT_CATEGORIES.map((docType) => {
                const Icon = getDocIcon(docType.id);
                return (
                  <View
                    key={docType.id}
                    className="flex-row items-center bg-muted px-3 py-2 rounded-lg"
                  >
                    <Icon size={14} className="text-muted-foreground" />
                    <Text className="text-foreground text-sm ml-2">{docType.label}</Text>
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
              <View key={category.id} className="bg-card rounded-xl border border-border overflow-hidden">
                {/* Category Header */}
                <TouchableOpacity
                  onPress={() => toggleCategory(category.id)}
                  className="flex-row items-center justify-between p-4"
                >
                  <View className="flex-row items-center">
                    <View className="bg-muted rounded-lg p-2 mr-3">
                      <Icon size={18} className="text-primary" />
                    </View>
                    <Text className="text-foreground font-medium">{category.label}</Text>
                    <View className="bg-primary/10 px-2 py-0.5 rounded-full ml-2">
                      <Text className="text-xs text-primary font-medium">{categoryDocs.length}</Text>
                    </View>
                  </View>
                  <ChevronIcon size={20} className="text-muted-foreground" />
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
      <View className="bg-muted rounded-xl p-4">
        <View className="flex-row items-center mb-2">
          <Upload size={16} className="text-muted-foreground" />
          <Text className="text-sm font-medium text-foreground ml-2">Upload Documents</Text>
        </View>
        <Text className="text-xs text-muted-foreground">
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

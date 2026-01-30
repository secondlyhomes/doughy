// src/features/leads/components/LeadDocsTab.tsx
// Documents tab content for lead/seller detail

import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, Alert, Linking, ScrollView } from 'react-native';
import {
  FileText,
  Upload,
  FileImage,
  FileCheck,
  FileCog,
  File,
  Download,
  Trash2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES } from '@/constants/design-tokens';
import { Button, LoadingSpinner, TAB_BAR_SAFE_PADDING } from '@/components/ui';
import { Document } from '@/features/real-estate/types';
import {
  useLeadDocuments,
  useLeadDocumentMutations,
  DOCUMENT_CATEGORIES,
  DocumentCategory,
} from '../hooks/useLeadDocuments';
import { UploadLeadDocumentSheet } from './UploadLeadDocumentSheet';
import { formatDate } from '@/lib/formatters';

interface LeadDocsTabProps {
  leadId: string;
  leadName?: string;
  readOnly?: boolean;
}

// Document type icons
const DOC_TYPE_ICONS: Record<string, typeof File> = {
  contract: FileCheck,
  inspection: FileCog,
  appraisal: FileText,
  photo: FileImage,
  receipt: FileText,
  other: File,
};

export function LeadDocsTab({ leadId, leadName, readOnly = false }: LeadDocsTabProps) {
  const colors = useThemeColors();
  const { documents, isLoading, error, refetch, documentsByCategory } = useLeadDocuments({
    leadId,
  });
  const { deleteDocument, isLoading: isDeleting } = useLeadDocumentMutations();

  const [showUploadSheet, setShowUploadSheet] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<DocumentCategory>>(
    new Set(['contract', 'other'])
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
      if (readOnly) return;

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
    [deleteDocument, refetch, readOnly]
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
              <Icon size={ICON_SIZES.lg} color={colors.primary} />
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
              <Download size={ICON_SIZES.md} color={colors.mutedForeground} />
            </TouchableOpacity>
            {!readOnly && (
              <Button
                variant="ghost"
                size="icon"
                onPress={() => handleDeleteDocument(doc)}
                disabled={isDeletingDoc}
                loading={isDeletingDoc}
                style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
              >
                {!isDeletingDoc && <Trash2 size={ICON_SIZES.md} color={colors.destructive} />}
              </Button>
            )}
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
    <ScrollView
      className="flex-1"
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_PADDING }}
    >
      <View className="gap-4">
        {/* Header */}
        <View className="flex-row justify-between items-center">
          <View className="flex-row items-center">
            <Text className="text-lg font-semibold" style={{ color: colors.foreground }}>
              Documents
            </Text>
            {documents.length > 0 && (
              <View className="px-2 py-1 rounded-full ml-2" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                <Text className="text-xs font-medium" style={{ color: colors.primary }}>{documents.length}</Text>
              </View>
            )}
          </View>
          {!readOnly && (
            <Button onPress={() => setShowUploadSheet(true)} size="sm">
              <Upload size={ICON_SIZES.md} color={colors.primaryForeground} />
              Upload
            </Button>
          )}
        </View>

        {/* Empty State */}
        {!hasDocuments && (
          <>
            <View className="flex-1 items-center justify-center py-12 rounded-xl" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
              <View className="rounded-full p-4 mb-4" style={{ backgroundColor: colors.muted }}>
                <FileText size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
              </View>
              <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>No Documents</Text>
              <Text className="text-center px-8 mb-4" style={{ color: colors.mutedForeground }}>
                {readOnly
                  ? 'No documents have been uploaded for this seller yet.'
                  : 'Upload contracts, IDs, and other seller-related documents.'}
              </Text>
              {!readOnly && (
                <Button variant="secondary" onPress={() => setShowUploadSheet(true)}>
                  <Upload size={ICON_SIZES.md} color={colors.foreground} />
                  Upload First Document
                </Button>
              )}
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
                        <Icon size={ICON_SIZES.ml} color={colors.primary} />
                      </View>
                      <Text className="font-medium" style={{ color: colors.foreground }}>{category.label}</Text>
                      <View className="px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
                        <Text className="text-xs font-medium" style={{ color: colors.primary }}>{categoryDocs.length}</Text>
                      </View>
                    </View>
                    <ChevronIcon size={ICON_SIZES.lg} color={colors.mutedForeground} />
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

        {/* Upload Info - only show if not read-only */}
        {!readOnly && (
          <View className="rounded-xl p-4" style={{ backgroundColor: colors.muted }}>
            <View className="flex-row items-center mb-2">
              <Upload size={ICON_SIZES.md} color={colors.mutedForeground} />
              <Text className="text-sm font-medium ml-2" style={{ color: colors.foreground }}>Upload Documents</Text>
            </View>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              Supported formats: PDF, Images (JPG, PNG), Word documents. Maximum file size: 10MB.
            </Text>
          </View>
        )}

        {/* Upload Sheet */}
        {!readOnly && (
          <UploadLeadDocumentSheet
            leadId={leadId}
            isOpen={showUploadSheet}
            onClose={() => setShowUploadSheet(false)}
            onSuccess={handleUploadSuccess}
          />
        )}
      </View>
    </ScrollView>
  );
}

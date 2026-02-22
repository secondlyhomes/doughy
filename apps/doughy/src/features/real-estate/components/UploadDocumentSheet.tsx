// src/features/real-estate/components/UploadDocumentSheet.tsx
// Bottom sheet for uploading documents

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { FileText, Upload, X, Check, AlertCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { ICON_SIZES } from '@/constants/design-tokens';
import * as DocumentPicker from 'expo-document-picker';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useDocumentMutations, DOCUMENT_CATEGORIES, DocumentCategory } from '../hooks/usePropertyDocuments';
import { formatFileSize } from '../utils/formatters';

interface UploadDocumentSheetProps {
  propertyId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function UploadDocumentSheet({
  propertyId,
  isOpen,
  onClose,
  onSuccess,
}: UploadDocumentSheetProps) {
  const colors = useThemeColors();
  const { pickDocument, uploadDocument, isLoading, error, uploadProgress } = useDocumentMutations();

  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('other');
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset form when sheet opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setCategory('other');
      setValidationError(null);
    }
  }, [isOpen]);

  const handlePickDocument = useCallback(async () => {
    try {
      setValidationError(null);
      const result = await pickDocument();

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Check file size (10MB limit)
        if (file.size && file.size > 10 * 1024 * 1024) {
          setValidationError('File size must be less than 10MB');
          return;
        }

        setSelectedFile(file);
        // Auto-fill title from filename if empty
        if (!title) {
          const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
          setTitle(nameWithoutExt);
        }
      }
    } catch (err) {
      console.error('Error picking document:', err);
      setValidationError('Failed to select document. Please try again.');
    }
  }, [pickDocument, title]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) {
      setValidationError('Please select a document to upload');
      return;
    }

    if (!title.trim()) {
      setValidationError('Please enter a document title');
      return;
    }

    setValidationError(null);
    const result = await uploadDocument(propertyId, selectedFile, {
      title: title.trim(),
      category,
      description: description.trim() || undefined,
    });

    if (result) {
      onSuccess?.();
      onClose();
    }
  }, [selectedFile, title, category, description, propertyId, uploadDocument, onSuccess, onClose]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      onClose();
    }
  }, [isLoading, onClose]);

  const getFileTypeLabel = (mimeType?: string): string => {
    if (!mimeType) return 'File';
    if (mimeType.startsWith('image/')) return 'Image';
    if (mimeType === 'application/pdf') return 'PDF';
    if (mimeType.includes('word')) return 'Word';
    return 'File';
  };

  return (
    <BottomSheet visible={isOpen} onClose={handleClose} title="Upload Document">
      <View className="gap-4">
        {/* File Selection */}
        <View>
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Select File *</Text>
          {selectedFile ? (
            <View className="rounded-xl p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: colors.primary + '1A' }}>
                    <FileText size={ICON_SIZES.xl} color={colors.primary} />
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium" numberOfLines={1} style={{ color: colors.foreground }}>
                      {selectedFile.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                        {getFileTypeLabel(selectedFile.mimeType)}
                      </Text>
                      {selectedFile.size && (
                        <>
                          <Text className="text-xs mx-1" style={{ color: colors.mutedForeground }}>•</Text>
                          <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                            {formatFileSize(selectedFile.size)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  className="p-2 rounded-lg ml-2"
                  style={{ backgroundColor: colors.muted }}
                  disabled={isLoading}
                >
                  <X size={ICON_SIZES.md} color={colors.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickDocument}
              className="border-2 border-dashed rounded-xl p-8 items-center"
              style={{ backgroundColor: colors.muted, borderColor: colors.border }}
              disabled={isLoading}
            >
              <Upload size={ICON_SIZES['2xl']} color={colors.mutedForeground} className="mb-2" />
              <Text className="font-medium" style={{ color: colors.foreground }}>Choose File</Text>
              <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
                PDF, Images, Word (max 10MB)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View>
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Document title"
            placeholderTextColor={colors.mutedForeground}
            className="rounded-xl px-4 py-3 border"
            style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }}
            editable={!isLoading}
          />
        </View>

        {/* Category */}
        <View>
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {DOCUMENT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                className="px-4 py-2 rounded-lg border"
                style={{
                  backgroundColor: category === cat.id ? colors.primary : colors.muted,
                  borderColor: category === cat.id ? colors.primary : colors.border,
                }}
                disabled={isLoading}
              >
                <Text
                  className="text-sm font-medium"
                  style={{ color: category === cat.id ? colors.primaryForeground : colors.foreground }}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View>
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add notes about this document"
            placeholderTextColor={colors.mutedForeground}
            className="rounded-xl px-4 py-3 border"
            style={{ backgroundColor: colors.input, borderColor: colors.border, color: colors.foreground }}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        {/* Upload Progress */}
        {isLoading && uploadProgress > 0 && (
          <View className="rounded-xl p-4 border" style={{ backgroundColor: colors.card, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium" style={{ color: colors.foreground }}>Uploading...</Text>
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>{uploadProgress}%</Text>
            </View>
            <View className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: colors.muted }}>
              <View
                className="h-full rounded-full"
                style={{ width: `${uploadProgress}%`, backgroundColor: colors.primary }}
              />
            </View>
          </View>
        )}

        {/* Error Display */}
        {(validationError || error) && (
          <View className="rounded-xl p-4 flex-row items-center" style={{ backgroundColor: colors.destructive + '1A' }}>
            <AlertCircle size={ICON_SIZES.lg} color={colors.destructive} className="mr-2" />
            <Text className="flex-1" style={{ color: colors.destructive }}>
              {validationError || error?.message || 'Upload failed'}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 pt-2">
          <TouchableOpacity
            onPress={handleClose}
            className="flex-1 py-4 rounded-xl items-center"
            style={{ backgroundColor: colors.muted }}
            disabled={isLoading}
          >
            <Text className="font-semibold" style={{ color: colors.foreground }}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleUpload}
            disabled={isLoading || !selectedFile || !title.trim()}
            className="flex-1 py-4 rounded-xl items-center flex-row justify-center"
            style={{
              backgroundColor: isLoading || !selectedFile || !title.trim()
                ? colors.primary + '80'
                : colors.primary,
            }}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primaryForeground} size="small" />
            ) : (
              <>
                <Upload size={ICON_SIZES.lg} color={colors.primaryForeground} />
                <Text className="font-semibold ml-2" style={{ color: colors.primaryForeground }}>Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

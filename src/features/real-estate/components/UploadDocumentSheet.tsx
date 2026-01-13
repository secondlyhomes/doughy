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
          <Text className="text-sm font-medium text-foreground mb-2">Select File *</Text>
          {selectedFile ? (
            <View className="bg-card rounded-xl p-4 border border-border">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="bg-primary/10 rounded-lg p-2 mr-3">
                    <FileText size={24} className="text-primary" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-foreground font-medium" numberOfLines={1}>
                      {selectedFile.name}
                    </Text>
                    <View className="flex-row items-center mt-1">
                      <Text className="text-xs text-muted-foreground">
                        {getFileTypeLabel(selectedFile.mimeType)}
                      </Text>
                      {selectedFile.size && (
                        <>
                          <Text className="text-xs text-muted-foreground mx-1">•</Text>
                          <Text className="text-xs text-muted-foreground">
                            {formatFileSize(selectedFile.size)}
                          </Text>
                        </>
                      )}
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => setSelectedFile(null)}
                  className="bg-muted p-2 rounded-lg ml-2"
                  disabled={isLoading}
                >
                  <X size={16} className="text-muted-foreground" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handlePickDocument}
              className="bg-muted border-2 border-dashed border-border rounded-xl p-8 items-center"
              disabled={isLoading}
            >
              <Upload size={32} className="text-muted-foreground mb-2" />
              <Text className="text-foreground font-medium">Choose File</Text>
              <Text className="text-xs text-muted-foreground mt-1">
                PDF, Images, Word (max 10MB)
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Title */}
        <View>
          <Text className="text-sm font-medium text-foreground mb-2">Title *</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Document title"
            placeholderTextColor="#9ca3af"
            className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
            editable={!isLoading}
          />
        </View>

        {/* Category */}
        <View>
          <Text className="text-sm font-medium text-foreground mb-2">Category</Text>
          <View className="flex-row flex-wrap gap-2">
            {DOCUMENT_CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                onPress={() => setCategory(cat.id)}
                className={`px-4 py-2 rounded-lg border ${
                  category === cat.id
                    ? 'bg-primary border-primary'
                    : 'bg-muted border-border'
                }`}
                disabled={isLoading}
              >
                <Text
                  className={`text-sm font-medium ${
                    category === cat.id ? 'text-primary-foreground' : 'text-foreground'
                  }`}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Description */}
        <View>
          <Text className="text-sm font-medium text-foreground mb-2">Description (optional)</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Add notes about this document"
            placeholderTextColor="#9ca3af"
            className="bg-input border border-border rounded-xl px-4 py-3 text-foreground"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            editable={!isLoading}
          />
        </View>

        {/* Upload Progress */}
        {isLoading && uploadProgress > 0 && (
          <View className="bg-card rounded-xl p-4 border border-border">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-foreground">Uploading...</Text>
              <Text className="text-sm text-muted-foreground">{uploadProgress}%</Text>
            </View>
            <View className="h-2 bg-muted rounded-full overflow-hidden">
              <View
                className="h-full bg-primary rounded-full"
                style={{ width: `${uploadProgress}%` }}
              />
            </View>
          </View>
        )}

        {/* Error Display */}
        {(validationError || error) && (
          <View className="bg-destructive/10 rounded-xl p-4 flex-row items-center">
            <AlertCircle size={20} className="text-destructive mr-2" />
            <Text className="text-destructive flex-1">
              {validationError || error?.message || 'Upload failed'}
            </Text>
          </View>
        )}

        {/* Actions */}
        <View className="flex-row gap-3 pt-2">
          <TouchableOpacity
            onPress={handleClose}
            className="flex-1 bg-muted py-4 rounded-xl items-center"
            disabled={isLoading}
          >
            <Text className="text-foreground font-semibold">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleUpload}
            disabled={isLoading || !selectedFile || !title.trim()}
            className={`flex-1 py-4 rounded-xl items-center flex-row justify-center ${
              isLoading || !selectedFile || !title.trim()
                ? 'bg-primary/50'
                : 'bg-primary'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <Upload size={18} color="white" />
                <Text className="text-primary-foreground font-semibold ml-2">Upload</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

/**
 * Hook for FileUpload component state and logic
 *
 * Manages file selection, upload handling, and state management
 */

import { useState, useCallback } from 'react';
import * as DocumentPicker from 'expo-document-picker';
import { useFileUpload } from '@/hooks/useFileUpload';
import type { SelectedFile, UploadResult } from '../types';

interface UseFileUploadLogicOptions {
  bucket: string;
  path: string;
  maxSizeMB: number;
  allowedTypes?: string[];
  onUploadSuccess?: (result: UploadResult) => void;
  onUploadError?: (error: Error) => void;
}

interface UseFileUploadLogicReturn {
  selectedFile: SelectedFile | null;
  uploading: boolean;
  progress: number;
  error: Error | null;
  handleSelectFile: () => Promise<void>;
  handleUpload: () => Promise<void>;
  handleCancel: () => void;
}

export function useFileUploadLogic({
  bucket,
  path,
  maxSizeMB,
  allowedTypes,
  onUploadSuccess,
  onUploadError,
}: UseFileUploadLogicOptions): UseFileUploadLogicReturn {
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);

  const { upload, uploading, progress, error, reset } = useFileUpload({
    bucket,
    maxSizeMB,
    allowedTypes,
    onSuccess: (result) => {
      setSelectedFile(null);
      reset();
      onUploadSuccess?.(result);
    },
    onError: (err) => {
      onUploadError?.(err);
    },
  });

  const handleSelectFile = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: allowedTypes || '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      setSelectedFile({
        name: file.name,
        size: file.size || 0,
        uri: file.uri,
      });
    } catch (err) {
      console.error('Error selecting file:', err);
    }
  }, [allowedTypes]);

  const handleUpload = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const fileName = selectedFile.name;
      const filePath = `${path}/${Date.now()}-${fileName}`;
      await upload(selectedFile.uri, filePath);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  }, [selectedFile, path, upload]);

  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    reset();
  }, [reset]);

  return {
    selectedFile,
    uploading,
    progress,
    error,
    handleSelectFile,
    handleUpload,
    handleCancel,
  };
}

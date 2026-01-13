// src/components/ui/FileUpload.tsx
// File picker using expo-document-picker
import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, FlatList, ViewProps } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { Upload, File, X, AlertCircle } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

export interface FileUploadProps extends ViewProps {
  value?: DocumentPicker.DocumentPickerAsset[];
  onChange?: (files: DocumentPicker.DocumentPickerAsset[]) => void;
  accept?: string[];
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  disabled?: boolean;
  label?: string;
  error?: string;
  className?: string;
}

export function FileUpload({
  value = [],
  onChange,
  accept,
  multiple = false,
  maxFiles = 10,
  maxSize,
  disabled = false,
  label,
  error,
  className,
  ...props
}: FileUploadProps) {
  const colors = useThemeColors();

  // Format file size
  const formatSize = useCallback((bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }, []);

  // Pick files
  const handlePick = useCallback(async () => {
    if (disabled) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: accept || '*/*',
        multiple,
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets) {
        let newFiles = result.assets;

        // Validate file size
        if (maxSize) {
          newFiles = newFiles.filter((file) => {
            if (file.size && file.size > maxSize) {
              console.warn(`File ${file.name} exceeds max size`);
              return false;
            }
            return true;
          });
        }

        // Limit number of files
        const totalFiles = multiple ? [...value, ...newFiles] : newFiles;
        const limitedFiles = totalFiles.slice(0, maxFiles);

        onChange?.(limitedFiles);
      }
    } catch (err) {
      console.error('Error picking document:', err);
    }
  }, [disabled, accept, multiple, maxSize, maxFiles, value, onChange]);

  // Remove file
  const handleRemove = useCallback(
    (index: number) => {
      const newFiles = [...value];
      newFiles.splice(index, 1);
      onChange?.(newFiles);
    },
    [value, onChange]
  );

  // Render file item
  const renderFileItem = ({
    item,
    index,
  }: {
    item: DocumentPicker.DocumentPickerAsset;
    index: number;
  }) => (
    <View className="flex-row items-center gap-3 rounded-md border border-border bg-muted/30 p-3">
      <File size={20} color={colors.mutedForeground} />
      <View className="flex-1">
        <Text className="text-sm font-medium text-foreground" numberOfLines={1}>
          {item.name}
        </Text>
        {item.size && (
          <Text className="text-xs text-muted-foreground">{formatSize(item.size)}</Text>
        )}
      </View>
      {!disabled && (
        <TouchableOpacity
          onPress={() => handleRemove(index)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${item.name}`}
        >
          <X size={16} color={colors.mutedForeground} />
        </TouchableOpacity>
      )}
    </View>
  );

  const canAddMore = multiple ? value.length < maxFiles : value.length === 0;

  return (
    <View className={cn('w-full', className)} {...props}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium text-foreground">{label}</Text>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <TouchableOpacity
          className={cn(
            'items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 p-6',
            disabled && 'opacity-50',
            error && 'border-destructive'
          )}
          onPress={handlePick}
          disabled={disabled}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel={`Select ${multiple ? 'files' : 'a file'}`}
        >
          <Upload size={24} color={colors.mutedForeground} />
          <Text className="mt-2 text-sm font-medium text-foreground">
            Tap to select {multiple ? 'files' : 'a file'}
          </Text>
          <Text className="mt-1 text-xs text-muted-foreground">
            {accept ? `Accepted: ${accept.join(', ')}` : 'All file types accepted'}
          </Text>
          {maxSize && (
            <Text className="text-xs text-muted-foreground">
              Max size: {formatSize(maxSize)}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* File list */}
      {value.length > 0 && (
        <View className={cn(canAddMore && 'mt-3')}>
          <FlatList
            data={value}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            renderItem={renderFileItem}
            ItemSeparatorComponent={() => <View className="h-2" />}
            scrollEnabled={false}
          />
        </View>
      )}

      {/* Error message */}
      {error && (
        <View className="mt-2 flex-row items-center gap-1" accessibilityRole="alert">
          <AlertCircle size={14} color={colors.destructive} />
          <Text className="text-sm text-destructive">{error}</Text>
        </View>
      )}

      {/* File count info */}
      {multiple && value.length > 0 && (
        <Text className="mt-2 text-xs text-muted-foreground">
          {value.length} of {maxFiles} files selected
        </Text>
      )}
    </View>
  );
}

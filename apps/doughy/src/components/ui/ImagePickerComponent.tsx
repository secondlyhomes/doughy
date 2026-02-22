// src/components/ui/ImagePickerComponent.tsx
// Image picker using expo-image-picker
import React, { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, Image, FlatList, ViewProps } from 'react-native';
import * as ExpoImagePicker from 'expo-image-picker';
import { Camera, ImageIcon, X, Plus, AlertCircle } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';
import { PRESS_OPACITY } from '@/constants/design-tokens';

export interface ImagePickerProps extends ViewProps {
  value?: ExpoImagePicker.ImagePickerAsset[];
  onChange?: (images: ExpoImagePicker.ImagePickerAsset[]) => void;
  multiple?: boolean;
  maxImages?: number;
  aspectRatio?: [number, number];
  allowsEditing?: boolean;
  quality?: number;
  disabled?: boolean;
  label?: string;
  error?: string;
  className?: string;
  showCamera?: boolean;
  showGallery?: boolean;
}

export function ImagePickerComponent({
  value = [],
  onChange,
  multiple = false,
  maxImages = 10,
  aspectRatio,
  allowsEditing = false,
  quality = 0.8,
  disabled = false,
  label,
  error,
  className,
  showCamera = true,
  showGallery = true,
  ...props
}: ImagePickerProps) {
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const colors = useThemeColors();

  // Request permissions
  const requestPermission = useCallback(async (type: 'camera' | 'library') => {
    if (type === 'camera') {
      const { status } = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        setPermissionError('Camera permission is required to take photos');
        return false;
      }
    } else {
      const { status } = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        setPermissionError('Gallery permission is required to select photos');
        return false;
      }
    }
    setPermissionError(null);
    return true;
  }, []);

  // Launch camera
  const handleCamera = useCallback(async () => {
    if (disabled) return;

    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    try {
      const result = await ExpoImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing,
        aspect: aspectRatio,
        quality,
      });

      if (!result.canceled && result.assets) {
        const newImages = multiple
          ? [...value, ...result.assets].slice(0, maxImages)
          : result.assets;
        onChange?.(newImages);
      }
    } catch (err) {
      console.error('Error launching camera:', err);
    }
  }, [disabled, requestPermission, allowsEditing, aspectRatio, quality, multiple, value, maxImages, onChange]);

  // Launch image library
  const handleGallery = useCallback(async () => {
    if (disabled) return;

    const hasPermission = await requestPermission('library');
    if (!hasPermission) return;

    try {
      const result = await ExpoImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: !multiple && allowsEditing,
        allowsMultipleSelection: multiple,
        selectionLimit: maxImages - value.length,
        aspect: aspectRatio,
        quality,
      });

      if (!result.canceled && result.assets) {
        const newImages = multiple
          ? [...value, ...result.assets].slice(0, maxImages)
          : result.assets;
        onChange?.(newImages);
      }
    } catch (err) {
      console.error('Error launching gallery:', err);
    }
  }, [disabled, requestPermission, multiple, allowsEditing, maxImages, value, aspectRatio, quality, onChange]);

  // Remove image
  const handleRemove = useCallback(
    (index: number) => {
      const newImages = [...value];
      newImages.splice(index, 1);
      onChange?.(newImages);
    },
    [value, onChange]
  );

  // Render image item
  const renderImageItem = ({
    item,
    index,
  }: {
    item: ExpoImagePicker.ImagePickerAsset;
    index: number;
  }) => (
    <View className="relative mr-2 h-24 w-24">
      <Image
        source={{ uri: item.uri }}
        className="h-full w-full rounded-md"
        resizeMode="cover"
      />
      {!disabled && (
        <TouchableOpacity
          className="absolute -right-1 -top-1 h-6 w-6 items-center justify-center rounded-full"
          style={{ backgroundColor: colors.destructive }}
          onPress={() => handleRemove(index)}
          accessibilityRole="button"
          accessibilityLabel="Remove image"
        >
          <X size={12} color={colors.destructiveForeground} />
        </TouchableOpacity>
      )}
    </View>
  );

  const canAddMore = multiple ? value.length < maxImages : value.length === 0;

  return (
    <View className={cn('w-full', className)} {...props}>
      {label && (
        <Text className="mb-1.5 text-sm font-medium" style={{ color: colors.foreground }}>{label}</Text>
      )}

      {/* Image grid */}
      {value.length > 0 && (
        <View className="mb-3">
          <FlatList
            data={value}
            keyExtractor={(item, index) => `${item.uri}-${index}`}
            renderItem={renderImageItem}
            horizontal
            showsHorizontalScrollIndicator={false}
          />
        </View>
      )}

      {/* Action buttons */}
      {canAddMore && (
        <View className="flex-row gap-2">
          {showCamera && (
            <TouchableOpacity
              className={cn(
                'flex-1 flex-row items-center justify-center gap-2 rounded-md px-4 py-3',
                disabled && 'opacity-50'
              )}
              style={{
                borderWidth: 1,
                borderColor: error ? colors.destructive : colors.input,
                backgroundColor: colors.background,
              }}
              onPress={handleCamera}
              disabled={disabled}
              activeOpacity={PRESS_OPACITY.DEFAULT}
              accessibilityRole="button"
              accessibilityLabel="Take photo with camera"
            >
              <Camera size={20} color={colors.mutedForeground} />
              <Text className="text-sm font-medium" style={{ color: colors.foreground }}>Camera</Text>
            </TouchableOpacity>
          )}

          {showGallery && (
            <TouchableOpacity
              className={cn(
                'flex-1 flex-row items-center justify-center gap-2 rounded-md px-4 py-3',
                disabled && 'opacity-50'
              )}
              style={{
                borderWidth: 1,
                borderColor: error ? colors.destructive : colors.input,
                backgroundColor: colors.background,
              }}
              onPress={handleGallery}
              disabled={disabled}
              activeOpacity={PRESS_OPACITY.DEFAULT}
              accessibilityRole="button"
              accessibilityLabel="Select photo from gallery"
            >
              <ImageIcon size={20} color={colors.mutedForeground} />
              <Text className="text-sm font-medium" style={{ color: colors.foreground }}>Gallery</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Add more button for grid view */}
      {!canAddMore && multiple && value.length < maxImages && (
        <TouchableOpacity
          className={cn(
            'mt-2 flex-row items-center justify-center gap-2 rounded-md px-4 py-3',
            disabled && 'opacity-50'
          )}
          style={{
            borderWidth: 1,
            borderStyle: 'dashed',
            borderColor: colors.border,
            backgroundColor: `${colors.muted}4D`,
          }}
          onPress={handleGallery}
          disabled={disabled}
          activeOpacity={PRESS_OPACITY.DEFAULT}
          accessibilityRole="button"
          accessibilityLabel="Add more images"
        >
          <Plus size={16} color={colors.mutedForeground} />
          <Text className="text-sm" style={{ color: colors.mutedForeground }}>Add more</Text>
        </TouchableOpacity>
      )}

      {/* Permission error */}
      {permissionError && (
        <View className="mt-2 flex-row items-center gap-1" accessibilityRole="alert">
          <AlertCircle size={14} color={colors.warning} />
          <Text className="text-sm" style={{ color: colors.warning }}>{permissionError}</Text>
        </View>
      )}

      {/* Error message */}
      {error && (
        <View className="mt-2 flex-row items-center gap-1" accessibilityRole="alert">
          <AlertCircle size={14} color={colors.destructive} />
          <Text className="text-sm" style={{ color: colors.destructive }}>{error}</Text>
        </View>
      )}

      {/* Image count info */}
      {multiple && value.length > 0 && (
        <Text className="mt-2 text-xs" style={{ color: colors.mutedForeground }}>
          {value.length} of {maxImages} images selected
        </Text>
      )}
    </View>
  );
}

// Export with simpler name
export { ImagePickerComponent as ImagePicker };

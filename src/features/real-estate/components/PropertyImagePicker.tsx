/**
 * PropertyImagePicker Component
 *
 * Component for selecting and managing property photos.
 * Uses expo-image-picker for camera and gallery access.
 */

import React, { useCallback } from 'react';
import { View, Text, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Camera, ImagePlus, X, Image as ImageIcon } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';

interface PropertyImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export function PropertyImagePicker({
  images,
  onChange,
  maxImages = 10,
  disabled = false,
}: PropertyImagePickerProps) {
  const colors = useThemeColors();

  const requestPermissions = useCallback(async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert(
        'Permissions Required',
        'Please grant camera and photo library permissions to add property photos.',
        [{ text: 'OK' }]
      );
      return false;
    }
    return true;
  }, []);

  const pickImages = useCallback(async () => {
    if (disabled) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImages = result.assets.map(asset => asset.uri);
        const combined = [...images, ...newImages];
        onChange(combined.slice(0, maxImages));
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images. Please try again.');
    }
  }, [disabled, images, maxImages, onChange, requestPermissions]);

  const takePhoto = useCallback(async () => {
    if (disabled) return;

    const hasPermission = await requestPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        const newImage = result.assets[0].uri;
        const combined = [...images, newImage];
        onChange(combined.slice(0, maxImages));
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  }, [disabled, images, maxImages, onChange, requestPermissions]);

  const removeImage = useCallback((index: number) => {
    if (disabled) return;

    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            onChange(images.filter((_, i) => i !== index));
          },
        },
      ]
    );
  }, [disabled, images, onChange]);

  const canAddMore = images.length < maxImages;

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 4, paddingVertical: 8 }}
      >
        <View className="flex-row gap-3">
          {/* Add from Gallery Button */}
          {canAddMore && (
            <TouchableOpacity
              onPress={pickImages}
              disabled={disabled}
              style={{
                backgroundColor: disabled ? withOpacity(colors.muted, 'opaque') : colors.muted,
                borderColor: disabled ? colors.muted : colors.border,
              }}
              className="w-24 h-24 rounded-xl items-center justify-center border-2 border-dashed"
              activeOpacity={0.7}
            >
              <ImagePlus
                size={24}
                color={disabled ? colors.muted : colors.mutedForeground}
              />
              <Text
                style={{ color: disabled ? colors.muted : colors.mutedForeground }}
                className="text-xs mt-1"
              >
                Gallery
              </Text>
            </TouchableOpacity>
          )}

          {/* Take Photo Button */}
          {canAddMore && (
            <TouchableOpacity
              onPress={takePhoto}
              disabled={disabled}
              style={{
                backgroundColor: disabled ? withOpacity(colors.muted, 'opaque') : colors.muted,
                borderColor: disabled ? colors.muted : colors.border,
              }}
              className="w-24 h-24 rounded-xl items-center justify-center border-2 border-dashed"
              activeOpacity={0.7}
            >
              <Camera
                size={24}
                color={disabled ? colors.muted : colors.mutedForeground}
              />
              <Text
                style={{ color: disabled ? colors.muted : colors.mutedForeground }}
                className="text-xs mt-1"
              >
                Camera
              </Text>
            </TouchableOpacity>
          )}

          {/* Existing Images */}
          {images.map((uri, index) => (
            <View key={`${uri}-${index}`} className="relative">
              <Image
                source={{ uri }}
                className="w-24 h-24 rounded-xl"
                resizeMode="cover"
              />
              {!disabled && (
                <TouchableOpacity
                  onPress={() => removeImage(index)}
                  style={{ backgroundColor: colors.destructive }}
                  className="absolute -top-2 -right-2 rounded-full w-6 h-6 items-center justify-center shadow-sm"
                  activeOpacity={0.7}
                >
                  <X size={14} color={colors.destructiveForeground} />
                </TouchableOpacity>
              )}
              {index === 0 && (
                <View style={{ backgroundColor: withOpacity(colors.primary, 'opaque') }} className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded">
                  <Text style={{ color: colors.primaryForeground }} className="text-xs font-medium">Primary</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Photo Count */}
      <View className="flex-row justify-between items-center mt-2 px-1">
        <Text style={{ color: colors.mutedForeground }} className="text-xs">
          {images.length}/{maxImages} photos
        </Text>
        {images.length === 0 && (
          <View className="flex-row items-center">
            <ImageIcon size={12} color={colors.mutedForeground} />
            <Text style={{ color: colors.mutedForeground }} className="text-xs ml-1">
              Add photos to showcase your property
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

// src/features/real-estate/components/property-actions/PhotosView.tsx
// Photos management view for property actions sheet

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Link, Camera, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { BackButton } from './BackButton';
import type { Property } from '../../types';

export interface PhotosViewProps {
  property: Property;
  urlInput: string;
  urlError: string | null;
  processingAction: string | null;
  isLoading: boolean;
  onUrlChange: (text: string) => void;
  onBack: () => void;
  onAddFromUrl: () => void;
  onAddFromDevice: () => void;
  onRemoveImage: (imageId: string) => void;
}

export function PhotosView({
  property,
  urlInput,
  urlError,
  processingAction,
  isLoading,
  onUrlChange,
  onBack,
  onAddFromUrl,
  onAddFromDevice,
  onRemoveImage,
}: PhotosViewProps) {
  const colors = useThemeColors();
  const images = property.images || [];

  return (
    <View>
      <BackButton onPress={onBack} />
      <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>
        Update Photos
      </Text>
      <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
        {images.length} photo{images.length !== 1 ? 's' : ''} • Add from URL or device
      </Text>

      {/* Add from URL */}
      <View className="mb-4">
        <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
          Add from URL
        </Text>
        <View className="flex-row gap-2">
          <TextInput
            value={urlInput}
            onChangeText={onUrlChange}
            placeholder="Paste image URL here..."
            placeholderTextColor={colors.mutedForeground}
            className="flex-1 px-3 py-2.5 rounded-xl border"
            style={{
              backgroundColor: colors.card,
              borderColor: urlError ? colors.destructive : colors.border,
              color: colors.foreground,
            }}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
          <TouchableOpacity
            onPress={onAddFromUrl}
            disabled={isLoading || !urlInput.trim()}
            className="px-4 py-2.5 rounded-xl items-center justify-center"
            style={{ backgroundColor: urlInput.trim() ? colors.primary : colors.muted }}
          >
            {processingAction === 'add-url' ? (
              <ActivityIndicator size="small" color={colors.primaryForeground} />
            ) : (
              <Link size={20} color={urlInput.trim() ? colors.primaryForeground : colors.mutedForeground} />
            )}
          </TouchableOpacity>
        </View>
        {urlError && (
          <Text className="text-xs mt-1" style={{ color: colors.destructive }}>
            {urlError}
          </Text>
        )}
        <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
          Supports Unsplash, Imgur, or any image URL
        </Text>
      </View>

      {/* Add from Device */}
      <TouchableOpacity
        onPress={onAddFromDevice}
        disabled={isLoading}
        className="flex-row items-center justify-center gap-2 py-3 rounded-xl border mb-4"
        style={{ borderColor: colors.border, backgroundColor: colors.card }}
      >
        {processingAction === 'add-device' ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : (
          <Camera size={20} color={colors.primary} />
        )}
        <Text className="font-medium" style={{ color: colors.primary }}>
          Add from Device
        </Text>
      </TouchableOpacity>

      {/* Current Images */}
      {images.length > 0 && (
        <View>
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>
            Current Photos
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 4 }}>
            <View className="flex-row gap-3">
              {images.map((image, index) => {
                const isRemoving = processingAction === `remove-${image.id}`;
                return (
                  <View key={image.id || index} className="relative">
                    <Image source={{ uri: image.url }} className="w-20 h-20 rounded-xl" resizeMode="cover" />
                    <TouchableOpacity
                      onPress={() => onRemoveImage(image.id)}
                      disabled={isLoading}
                      style={{ backgroundColor: colors.destructive }}
                      className="absolute -top-2 -right-2 rounded-full w-6 h-6 items-center justify-center shadow-sm"
                    >
                      {isRemoving ? (
                        <ActivityIndicator size="small" color={colors.destructiveForeground} />
                      ) : (
                        <X size={14} color={colors.destructiveForeground} />
                      )}
                    </TouchableOpacity>
                    {index === 0 && (
                      <View
                        style={{ backgroundColor: withOpacity(colors.primary, 'opaque') }}
                        className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded"
                      >
                        <Text style={{ color: colors.primaryForeground }} className="text-xs font-medium">
                          Primary
                        </Text>
                      </View>
                    )}
                  </View>
                );
              })}
            </View>
          </ScrollView>
        </View>
      )}
    </View>
  );
}

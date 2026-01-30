// src/features/field-mode/components/PhotoBucketCard.tsx
// Photo bucket component for organizing photos by category

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  FlatList,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import {
  Camera,
  ImageIcon,
  X,
  ChevronDown,
  ChevronUp,
  Home,
  UtensilsCrossed,
  Bath,
  Wrench,
  Zap,
  FileText,
  Mic,
} from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card } from '@/components/ui/Card';
import { PhotoBucket, WalkthroughItem, PHOTO_BUCKET_CONFIG } from '../../deals/types';
import { ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';

// Icon mapping for buckets
const BUCKET_ICONS: Record<PhotoBucket, React.ComponentType<{ size: number; color: string }>> = {
  exterior_roof: Home,
  kitchen: UtensilsCrossed,
  baths: Bath,
  basement_mechanical: Wrench,
  electrical_plumbing: Zap,
  notes_other: FileText,
};

interface PhotoBucketCardProps {
  bucket: PhotoBucket;
  items: WalkthroughItem[];
  onAddPhoto: (bucket: PhotoBucket, uri: string) => void;
  onRemoveItem: (itemId: string) => void;
  onRecordMemo: (bucket: PhotoBucket) => void;
  disabled?: boolean;
}

export function PhotoBucketCard({
  bucket,
  items,
  onAddPhoto,
  onRemoveItem,
  onRecordMemo,
  disabled = false,
}: PhotoBucketCardProps) {
  const colors = useThemeColors();
  const [isExpanded, setIsExpanded] = useState(true);

  const config = PHOTO_BUCKET_CONFIG[bucket];
  const Icon = BUCKET_ICONS[bucket];
  const photos = items.filter((item) => item.item_type === 'photo');
  const memos = items.filter((item) => item.item_type === 'voice_memo');

  // Request camera permission and take photo
  const handleCamera = useCallback(async () => {
    if (disabled) return;

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera permission is needed to take photos');
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onAddPhoto(bucket, result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Camera Error', 'Failed to take photo. Please try again.');
    }
  }, [bucket, disabled, onAddPhoto]);

  // Request gallery permission and select photo
  const handleGallery = useCallback(async () => {
    if (disabled) return;

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Gallery permission is needed to select photos');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsMultipleSelection: true,
        selectionLimit: 10,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        result.assets.forEach((asset) => {
          onAddPhoto(bucket, asset.uri);
        });
      }
    } catch (err) {
      console.error('Error selecting photos:', err);
      Alert.alert('Gallery Error', 'Failed to select photos. Please try again.');
    }
  }, [bucket, disabled, onAddPhoto]);

  // Confirm and remove item
  const handleRemove = useCallback((itemId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => onRemoveItem(itemId) },
      ]
    );
  }, [onRemoveItem]);

  // Render photo thumbnail
  const renderPhotoItem = ({ item }: { item: WalkthroughItem }) => (
    <View className="relative mr-2">
      <Image
        source={{ uri: item.file_url }}
        className="w-20 h-20 rounded-md"
        resizeMode="cover"
      />
      {!disabled && (
        <TouchableOpacity
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.destructive }}
          onPress={() => handleRemove(item.id)}
          accessibilityLabel="Remove photo"
          accessibilityRole="button"
        >
          <X size={ICON_SIZES.xs} color={colors.destructiveForeground} />
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <Card className="mb-3">
      {/* Header */}
      <TouchableOpacity
        className="flex-row items-center justify-between p-4"
        onPress={() => setIsExpanded(!isExpanded)}
        activeOpacity={PRESS_OPACITY.DEFAULT}
        accessibilityLabel={`${config.label} section, ${photos.length} photos, ${memos.length} memos`}
        accessibilityRole="button"
      >
        <View className="flex-row items-center flex-1">
          <View
            className="w-10 h-10 rounded-lg items-center justify-center mr-3"
            style={{ backgroundColor: colors.muted }}
          >
            <Icon size={ICON_SIZES.lg} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="text-base font-semibold" style={{ color: colors.foreground }}>
              {config.label}
            </Text>
            <Text className="text-xs" style={{ color: colors.mutedForeground }}>
              {photos.length} photos • {memos.length} memos
            </Text>
          </View>
        </View>
        {isExpanded ? (
          <ChevronUp size={ICON_SIZES.lg} color={colors.mutedForeground} />
        ) : (
          <ChevronDown size={ICON_SIZES.lg} color={colors.mutedForeground} />
        )}
      </TouchableOpacity>

      {/* Expanded content */}
      {isExpanded && (
        <View className="px-4 pb-4">
          {/* Photos grid */}
          {photos.length > 0 && (
            <View className="mb-3">
              <FlatList
                data={photos}
                keyExtractor={(item) => item.id}
                renderItem={renderPhotoItem}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          {/* Voice memos list */}
          {memos.length > 0 && (
            <View className="mb-3">
              {memos.map((memo) => (
                <View
                  key={memo.id}
                  className="flex-row items-center p-2 rounded-md mb-1"
                  style={{ backgroundColor: colors.muted }}
                >
                  <Mic size={ICON_SIZES.md} color={colors.primary} />
                  <Text className="flex-1 ml-2 text-sm" style={{ color: colors.foreground }} numberOfLines={1}>
                    {memo.transcript || 'Voice memo'}
                  </Text>
                  {!disabled && (
                    <TouchableOpacity
                      onPress={() => handleRemove(memo.id)}
                      accessibilityLabel="Remove memo"
                      accessibilityRole="button"
                    >
                      <X size={ICON_SIZES.md} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Action buttons */}
          {!disabled && (
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-md"
                style={{ backgroundColor: colors.muted }}
                onPress={handleCamera}
                accessibilityLabel="Take photo"
                accessibilityRole="button"
              >
                <Camera size={ICON_SIZES.md} color={colors.mutedForeground} />
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>Camera</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-md"
                style={{ backgroundColor: colors.muted }}
                onPress={handleGallery}
                accessibilityLabel="Select from gallery"
                accessibilityRole="button"
              >
                <ImageIcon size={ICON_SIZES.md} color={colors.mutedForeground} />
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>Gallery</Text>
              </TouchableOpacity>

              <TouchableOpacity
                className="flex-1 flex-row items-center justify-center gap-2 py-2.5 rounded-md"
                style={{ backgroundColor: colors.muted }}
                onPress={() => onRecordMemo(bucket)}
                accessibilityLabel="Record voice memo"
                accessibilityRole="button"
              >
                <Mic size={ICON_SIZES.md} color={colors.mutedForeground} />
                <Text className="text-sm" style={{ color: colors.mutedForeground }}>Memo</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </Card>
  );
}

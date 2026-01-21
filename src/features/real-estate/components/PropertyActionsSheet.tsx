// src/features/real-estate/components/PropertyActionsSheet.tsx
// Bottom sheet with property actions menu

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Image,
  ScrollView,
} from 'react-native';
import {
  Share2,
  Copy,
  FileDown,
  CircleDot,
  Check,
  Edit2,
  Trash2,
  ChevronRight,
  ImagePlus,
  Link,
  X,
  Camera,
} from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/context/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Property } from '../types';
import { PropertyStatus, PropertyConstants } from '../types/constants';
import { usePropertyActions } from '../hooks/usePropertyActions';

interface PropertyActionsSheetProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: () => void;
  onPhotosUpdate?: () => void;
}

type ActionView = 'main' | 'share' | 'status' | 'photos';

export function PropertyActionsSheet({
  property,
  isOpen,
  onClose,
  onEdit,
  onDelete,
  onStatusChange,
  onPhotosUpdate,
}: PropertyActionsSheetProps) {
  const colors = useThemeColors();
  const {
    shareProperty,
    exportPropertySummary,
    copyPropertyLink,
    updatePropertyStatus,
    addPropertyImage,
    removePropertyImage,
    isLoading,
  } = usePropertyActions();

  const [currentView, setCurrentView] = useState<ActionView>('main');
  const [processingAction, setProcessingAction] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState('');
  const [urlError, setUrlError] = useState<string | null>(null);

  // Status colors using theme
  const getStatusColors = (status: string) => {
    switch (status) {
      case 'Active':
        return { bg: withOpacity(colors.success, 'muted'), text: colors.success, solid: colors.success };
      case 'Pending':
        return { bg: withOpacity(colors.warning, 'muted'), text: colors.warning, solid: colors.warning };
      case 'Sold':
        return { bg: withOpacity(colors.info, 'muted'), text: colors.info, solid: colors.info };
      case 'Withdrawn':
        return { bg: colors.muted, text: colors.mutedForeground, solid: colors.mutedForeground };
      case 'Expired':
        return { bg: withOpacity(colors.destructive, 'muted'), text: colors.destructive, solid: colors.destructive };
      case 'Off Market':
        return { bg: withOpacity(colors.primary, 'muted'), text: colors.primary, solid: colors.primary };
      default:
        return { bg: colors.muted, text: colors.foreground, solid: colors.foreground };
    }
  };

  const handleClose = useCallback(() => {
    setCurrentView('main');
    setProcessingAction(null);
    setUrlInput('');
    setUrlError(null);
    onClose();
  }, [onClose]);

  // Validate URL is a valid image URL
  const isValidImageUrl = useCallback((url: string): boolean => {
    try {
      const urlObj = new URL(url);
      // Check for common image hosting domains or image extensions
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
      const imageHostDomains = ['unsplash.com', 'images.unsplash.com', 'imgur.com', 'i.imgur.com', 'cloudinary.com'];

      const hasImageExtension = imageExtensions.some(ext => urlObj.pathname.toLowerCase().includes(ext));
      const isImageHost = imageHostDomains.some(domain => urlObj.hostname.includes(domain));

      // Accept if it has an image extension, is from known image hosts, or is HTTPS
      return hasImageExtension || isImageHost || urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  }, []);

  // Add image from URL
  const handleAddImageFromUrl = useCallback(async () => {
    const trimmedUrl = urlInput.trim();

    if (!trimmedUrl) {
      setUrlError('Please enter a URL');
      return;
    }

    if (!isValidImageUrl(trimmedUrl)) {
      setUrlError('Please enter a valid image URL');
      return;
    }

    setProcessingAction('add-url');
    setUrlError(null);

    const success = await addPropertyImage(property.id, trimmedUrl);
    setProcessingAction(null);

    if (success) {
      setUrlInput('');
      onPhotosUpdate?.();
      Alert.alert('Success', 'Image added successfully');
    } else {
      Alert.alert('Error', 'Failed to add image. Please try again.');
    }
  }, [urlInput, isValidImageUrl, addPropertyImage, property.id, onPhotosUpdate]);

  // Add image from device
  const handleAddImageFromDevice = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (status !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please grant photo library permission to add images from your device.'
      );
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: true,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets.length > 0) {
        const imageUri = result.assets[0].uri;
        setProcessingAction('add-device');

        // For now, we save the local URI directly
        // In production, this would upload to Supabase Storage first
        const success = await addPropertyImage(property.id, imageUri, 'Device Photo');
        setProcessingAction(null);

        if (success) {
          onPhotosUpdate?.();
          Alert.alert('Success', 'Image added successfully');
        } else {
          Alert.alert('Error', 'Failed to add image. Please try again.');
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  }, [addPropertyImage, property.id, onPhotosUpdate]);

  // Remove image
  const handleRemoveImage = useCallback(async (imageId: string) => {
    Alert.alert(
      'Remove Image',
      'Are you sure you want to remove this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setProcessingAction(`remove-${imageId}`);
            const success = await removePropertyImage(imageId);
            setProcessingAction(null);

            if (success) {
              onPhotosUpdate?.();
            } else {
              Alert.alert('Error', 'Failed to remove image. Please try again.');
            }
          },
        },
      ]
    );
  }, [removePropertyImage, onPhotosUpdate]);

  const handleShare = useCallback(
    async (type: 'link' | 'text' | 'full') => {
      setProcessingAction(`share-${type}`);
      const success = await shareProperty(property, type);
      setProcessingAction(null);
      if (success) {
        handleClose();
      }
    },
    [shareProperty, property, handleClose]
  );

  const handleCopy = useCallback(async () => {
    setProcessingAction('copy');
    const success = await copyPropertyLink(property);
    setProcessingAction(null);
    if (success) {
      Alert.alert('Copied!', 'Property details copied to clipboard');
      handleClose();
    } else {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  }, [copyPropertyLink, property, handleClose]);

  const handleExport = useCallback(async () => {
    setProcessingAction('export');
    const result = await exportPropertySummary(property);
    setProcessingAction(null);
    if (result) {
      handleClose();
    } else {
      Alert.alert('Error', 'Failed to export property summary');
    }
  }, [exportPropertySummary, property, handleClose]);

  const handleStatusChange = useCallback(
    async (status: PropertyStatus) => {
      if (property.status === status) {
        setCurrentView('main');
        return;
      }

      setProcessingAction(`status-${status}`);
      const success = await updatePropertyStatus(property.id, status);
      setProcessingAction(null);

      if (success) {
        onStatusChange?.();
        handleClose();
      } else {
        Alert.alert('Error', 'Failed to update property status');
      }
    },
    [updatePropertyStatus, property.id, property.status, onStatusChange, handleClose]
  );

  const handleEdit = useCallback(() => {
    handleClose();
    onEdit?.();
  }, [handleClose, onEdit]);

  const handleDelete = useCallback(() => {
    handleClose();
    onDelete?.();
  }, [handleClose, onDelete]);

  // Render action button
  const renderActionButton = (
    icon: React.ReactNode,
    label: string,
    onPress: () => void,
    options?: {
      destructive?: boolean;
      showArrow?: boolean;
      disabled?: boolean;
      processingKey?: string;
    }
  ) => {
    const isProcessing = processingAction === options?.processingKey;
    const textColor = options?.destructive ? colors.destructive : colors.foreground;

    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isLoading || options?.disabled}
        className={`flex-row items-center justify-between py-4 px-2 border-b ${
          options?.disabled ? 'opacity-50' : ''
        }`}
        style={{ borderColor: colors.border }}
      >
        <View className="flex-row items-center flex-1">
          {icon}
          <Text className="font-medium ml-3" style={{ color: textColor }}>{label}</Text>
        </View>
        {isProcessing ? (
          <ActivityIndicator size="small" />
        ) : options?.showArrow ? (
          <ChevronRight size={20} color={colors.mutedForeground} />
        ) : null}
      </TouchableOpacity>
    );
  };

  // Main actions view
  const renderMainView = () => (
    <View>
      {/* Share Options */}
      {renderActionButton(
        <Share2 size={20} color={colors.primary} />,
        'Share Property',
        () => setCurrentView('share'),
        { showArrow: true }
      )}

      {/* Copy to Clipboard */}
      {renderActionButton(
        <Copy size={20} color={colors.primary} />,
        'Copy Details',
        handleCopy,
        { processingKey: 'copy' }
      )}

      {/* Export Summary */}
      {renderActionButton(
        <FileDown size={20} color={colors.primary} />,
        'Export Summary',
        handleExport,
        { processingKey: 'export' }
      )}

      {/* Change Status */}
      {renderActionButton(
        <CircleDot size={20} color={colors.primary} />,
        'Change Status',
        () => setCurrentView('status'),
        { showArrow: true }
      )}

      {/* Update Photos */}
      {renderActionButton(
        <ImagePlus size={20} color={colors.primary} />,
        'Update Photos',
        () => setCurrentView('photos'),
        { showArrow: true }
      )}

      {/* Divider */}
      <View className="h-2" />

      {/* Edit Property */}
      {onEdit &&
        renderActionButton(<Edit2 size={20} color={colors.foreground} />, 'Edit Property', handleEdit)}

      {/* Delete Property */}
      {onDelete &&
        renderActionButton(
          <Trash2 size={20} color={colors.destructive} />,
          'Delete Property',
          handleDelete,
          { destructive: true }
        )}
    </View>
  );

  // Share options view
  const renderShareView = () => (
    <View>
      {/* Back button */}
      <TouchableOpacity
        onPress={() => setCurrentView('main')}
        className="flex-row items-center py-2 mb-2"
      >
        <ChevronRight size={20} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
        <Text className="ml-1" style={{ color: colors.mutedForeground }}>Back</Text>
      </TouchableOpacity>

      <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Share Property</Text>

      {renderActionButton(
        <Share2 size={20} color={colors.primary} />,
        'Quick Share (Basic Info)',
        () => handleShare('text'),
        { processingKey: 'share-text' }
      )}

      {renderActionButton(
        <Share2 size={20} color={colors.primary} />,
        'Full Details',
        () => handleShare('full'),
        { processingKey: 'share-full' }
      )}

      {renderActionButton(
        <Copy size={20} color={colors.primary} />,
        'Copy to Clipboard',
        handleCopy,
        { processingKey: 'copy' }
      )}
    </View>
  );

  // Status change view
  const renderStatusView = () => {
    const currentStatus = property.status || 'Active';

    return (
      <View>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => setCurrentView('main')}
          className="flex-row items-center py-2 mb-2"
        >
          <ChevronRight size={20} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text className="ml-1" style={{ color: colors.mutedForeground }}>Back</Text>
        </TouchableOpacity>

        <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>Change Status</Text>
        <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
          Current: <Text className="font-medium" style={{ color: colors.foreground }}>{currentStatus}</Text>
        </Text>

        <View className="gap-2">
          {PropertyConstants.STATUS_OPTIONS.map((option) => {
            const isSelected = currentStatus === option.value;
            const statusColors = getStatusColors(option.value);
            const isProcessing = processingAction === `status-${option.value}`;

            return (
              <TouchableOpacity
                key={option.value}
                onPress={() => handleStatusChange(option.value as PropertyStatus)}
                disabled={isLoading}
                className="flex-row items-center justify-between p-4 rounded-xl border"
                style={{
                  borderColor: isSelected ? colors.primary : colors.border,
                  backgroundColor: isSelected ? withOpacity(colors.primary, 'subtle') : colors.card,
                }}
              >
                <View className="flex-row items-center">
                  <View className="w-3 h-3 rounded-full mr-3" style={{ backgroundColor: statusColors.solid }} />
                  <Text
                    className="font-medium"
                    style={{ color: isSelected ? colors.primary : colors.foreground }}
                  >
                    {option.label}
                  </Text>
                </View>
                {isProcessing ? (
                  <ActivityIndicator size="small" />
                ) : isSelected ? (
                  <Check size={20} color={colors.primary} />
                ) : null}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // Photos management view
  const renderPhotosView = () => {
    const images = property.images || [];

    return (
      <View>
        {/* Back button */}
        <TouchableOpacity
          onPress={() => setCurrentView('main')}
          className="flex-row items-center py-2 mb-2"
        >
          <ChevronRight size={20} color={colors.mutedForeground} style={{ transform: [{ rotate: '180deg' }] }} />
          <Text className="ml-1" style={{ color: colors.mutedForeground }}>Back</Text>
        </TouchableOpacity>

        <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>Update Photos</Text>
        <Text className="text-sm mb-4" style={{ color: colors.mutedForeground }}>
          {images.length} photo{images.length !== 1 ? 's' : ''} • Add from URL or device
        </Text>

        {/* Add from URL */}
        <View className="mb-4">
          <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Add from URL</Text>
          <View className="flex-row gap-2">
            <TextInput
              value={urlInput}
              onChangeText={(text) => {
                setUrlInput(text);
                setUrlError(null);
              }}
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
              onPress={handleAddImageFromUrl}
              disabled={isLoading || !urlInput.trim()}
              className="px-4 py-2.5 rounded-xl items-center justify-center"
              style={{
                backgroundColor: urlInput.trim() ? colors.primary : colors.muted,
              }}
            >
              {processingAction === 'add-url' ? (
                <ActivityIndicator size="small" color={colors.primaryForeground} />
              ) : (
                <Link size={20} color={urlInput.trim() ? colors.primaryForeground : colors.mutedForeground} />
              )}
            </TouchableOpacity>
          </View>
          {urlError && (
            <Text className="text-xs mt-1" style={{ color: colors.destructive }}>{urlError}</Text>
          )}
          <Text className="text-xs mt-1" style={{ color: colors.mutedForeground }}>
            Supports Unsplash, Imgur, or any image URL
          </Text>
        </View>

        {/* Add from Device */}
        <TouchableOpacity
          onPress={handleAddImageFromDevice}
          disabled={isLoading}
          className="flex-row items-center justify-center gap-2 py-3 rounded-xl border mb-4"
          style={{
            borderColor: colors.border,
            backgroundColor: colors.card,
          }}
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingVertical: 4 }}
            >
              <View className="flex-row gap-3">
                {images.map((image, index) => {
                  const isRemoving = processingAction === `remove-${image.id}`;

                  return (
                    <View key={image.id || index} className="relative">
                      <Image
                        source={{ uri: image.url }}
                        className="w-20 h-20 rounded-xl"
                        resizeMode="cover"
                      />
                      <TouchableOpacity
                        onPress={() => handleRemoveImage(image.id)}
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
  };

  const getTitle = () => {
    switch (currentView) {
      case 'share':
        return 'Share Options';
      case 'status':
        return 'Property Status';
      case 'photos':
        return 'Update Photos';
      default:
        return 'Property Actions';
    }
  };

  return (
    <BottomSheet visible={isOpen} onClose={handleClose} title={getTitle()}>
      <View className="pb-4">
        {currentView === 'main' && renderMainView()}
        {currentView === 'share' && renderShareView()}
        {currentView === 'status' && renderStatusView()}
        {currentView === 'photos' && renderPhotosView()}
      </View>
    </BottomSheet>
  );
}

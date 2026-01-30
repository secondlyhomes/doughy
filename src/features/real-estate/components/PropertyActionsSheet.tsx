// src/features/real-estate/components/PropertyActionsSheet.tsx
// Bottom sheet with property actions menu

import React, { useState, useCallback } from 'react';
import { View, Text, Alert } from 'react-native';
import { Share2, Copy, FileDown, CircleDot, Edit2, Trash2, ImagePlus } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { BottomSheet } from '@/components/ui/BottomSheet';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Property } from '../types';
import { PropertyStatus } from '../types/constants';
import { usePropertyActions } from '../hooks/usePropertyActions';
import {
  ActionButton,
  BackButton,
  StatusView,
  PhotosView,
  isValidImageUrl,
  type ActionView,
} from './property-actions';

interface PropertyActionsSheetProps {
  property: Property;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onStatusChange?: () => void;
  onPhotosUpdate?: () => void;
}

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

  const handleClose = useCallback(() => {
    setCurrentView('main');
    setProcessingAction(null);
    setUrlInput('');
    setUrlError(null);
    onClose();
  }, [onClose]);

  // Share handlers
  const handleShare = useCallback(async (type: 'link' | 'text' | 'full') => {
    setProcessingAction(`share-${type}`);
    const success = await shareProperty(property, type);
    setProcessingAction(null);
    if (success) handleClose();
  }, [shareProperty, property, handleClose]);

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
    if (result) handleClose();
    else Alert.alert('Error', 'Failed to export property summary');
  }, [exportPropertySummary, property, handleClose]);

  // Status handler
  const handleStatusChange = useCallback(async (status: PropertyStatus) => {
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
  }, [updatePropertyStatus, property.id, property.status, onStatusChange, handleClose]);

  // Photo handlers
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
  }, [urlInput, addPropertyImage, property.id, onPhotosUpdate]);

  const handleAddImageFromDevice = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Please grant photo library permission to add images from your device.');
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
        setProcessingAction('add-device');
        const success = await addPropertyImage(property.id, result.assets[0].uri, 'Device Photo');
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

  const handleRemoveImage = useCallback(async (imageId: string) => {
    Alert.alert('Remove Image', 'Are you sure you want to remove this image?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: async () => {
          setProcessingAction(`remove-${imageId}`);
          const success = await removePropertyImage(imageId);
          setProcessingAction(null);
          if (success) onPhotosUpdate?.();
          else Alert.alert('Error', 'Failed to remove image. Please try again.');
        },
      },
    ]);
  }, [removePropertyImage, onPhotosUpdate]);

  const handleEdit = useCallback(() => { handleClose(); onEdit?.(); }, [handleClose, onEdit]);
  const handleDelete = useCallback(() => { handleClose(); onDelete?.(); }, [handleClose, onDelete]);

  const getTitle = () => {
    switch (currentView) {
      case 'share': return 'Share Options';
      case 'status': return 'Property Status';
      case 'photos': return 'Update Photos';
      default: return 'Property Actions';
    }
  };

  // Render main view
  const renderMainView = () => (
    <View>
      <ActionButton icon={<Share2 size={20} color={colors.primary} />} label="Share Property" onPress={() => setCurrentView('share')} showArrow />
      <ActionButton icon={<Copy size={20} color={colors.primary} />} label="Copy Details" onPress={handleCopy} isProcessing={processingAction === 'copy'} />
      <ActionButton icon={<FileDown size={20} color={colors.primary} />} label="Export Summary" onPress={handleExport} isProcessing={processingAction === 'export'} />
      <ActionButton icon={<CircleDot size={20} color={colors.primary} />} label="Change Status" onPress={() => setCurrentView('status')} showArrow />
      <ActionButton icon={<ImagePlus size={20} color={colors.primary} />} label="Update Photos" onPress={() => setCurrentView('photos')} showArrow />
      <View className="h-2" />
      {onEdit && <ActionButton icon={<Edit2 size={20} color={colors.foreground} />} label="Edit Property" onPress={handleEdit} />}
      {onDelete && <ActionButton icon={<Trash2 size={20} color={colors.destructive} />} label="Delete Property" onPress={handleDelete} destructive />}
    </View>
  );

  // Render share view
  const renderShareView = () => (
    <View>
      <BackButton onPress={() => setCurrentView('main')} />
      <Text className="text-lg font-semibold mb-4" style={{ color: colors.foreground }}>Share Property</Text>
      <ActionButton icon={<Share2 size={20} color={colors.primary} />} label="Quick Share (Basic Info)" onPress={() => handleShare('text')} isProcessing={processingAction === 'share-text'} />
      <ActionButton icon={<Share2 size={20} color={colors.primary} />} label="Full Details" onPress={() => handleShare('full')} isProcessing={processingAction === 'share-full'} />
      <ActionButton icon={<Copy size={20} color={colors.primary} />} label="Copy to Clipboard" onPress={handleCopy} isProcessing={processingAction === 'copy'} />
    </View>
  );

  return (
    <BottomSheet visible={isOpen} onClose={handleClose} title={getTitle()}>
      <View className="pb-4">
        {currentView === 'main' && renderMainView()}
        {currentView === 'share' && renderShareView()}
        {currentView === 'status' && (
          <StatusView
            currentStatus={property.status || 'Active'}
            processingAction={processingAction}
            isLoading={isLoading}
            onBack={() => setCurrentView('main')}
            onStatusChange={handleStatusChange}
          />
        )}
        {currentView === 'photos' && (
          <PhotosView
            property={property}
            urlInput={urlInput}
            urlError={urlError}
            processingAction={processingAction}
            isLoading={isLoading}
            onUrlChange={(text) => { setUrlInput(text); setUrlError(null); }}
            onBack={() => setCurrentView('main')}
            onAddFromUrl={handleAddImageFromUrl}
            onAddFromDevice={handleAddImageFromDevice}
            onRemoveImage={handleRemoveImage}
          />
        )}
      </View>
    </BottomSheet>
  );
}

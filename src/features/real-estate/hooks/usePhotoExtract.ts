// src/features/real-estate/hooks/usePhotoExtract.ts
// Hook for capturing photos and extracting property data using AI vision

import { useState, useCallback } from 'react';
import * as ImagePicker from 'expo-image-picker';
import { extractFromImage, ImageExtractionResult, DocumentType } from '@/lib/openai';

export interface PhotoExtractState {
  isCapturing: boolean;
  isExtracting: boolean;
  photoUri: string | null;
  extractionResult: ImageExtractionResult | null;
  error: string | null;
}

interface UsePhotoExtractReturn {
  state: PhotoExtractState;
  capturePhoto: () => Promise<string | null>;
  pickFromLibrary: () => Promise<string | null>;
  extractData: (photoUri: string) => Promise<ImageExtractionResult | null>;
  captureAndExtract: () => Promise<ImageExtractionResult | null>;
  pickAndExtract: () => Promise<ImageExtractionResult | null>;
  reset: () => void;
}

/**
 * Hook for photo-based data extraction
 *
 * Supports:
 * - Camera capture
 * - Photo library selection
 * - AI-powered extraction for:
 *   - MLS sheets
 *   - Tax records
 *   - Repair estimates
 *   - Business cards
 *
 * @example
 * ```typescript
 * const { state, captureAndExtract } = usePhotoExtract();
 *
 * const handleCapture = async () => {
 *   const result = await captureAndExtract();
 *   if (result?.type === 'business_card') {
 *     // Pre-fill lead form with contact info
 *     setLeadName(result.extractedData.name);
 *     setPhone(result.extractedData.phone);
 *   }
 * };
 * ```
 */
export function usePhotoExtract(): UsePhotoExtractReturn {
  const [state, setState] = useState<PhotoExtractState>({
    isCapturing: false,
    isExtracting: false,
    photoUri: null,
    extractionResult: null,
    error: null,
  });

  // Request camera permissions
  const requestCameraPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      setState(prev => ({
        ...prev,
        error: 'Camera permission is required to capture photos',
      }));
      return false;
    }
    return true;
  }, []);

  // Request media library permissions
  const requestLibraryPermission = useCallback(async (): Promise<boolean> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      setState(prev => ({
        ...prev,
        error: 'Photo library permission is required',
      }));
      return false;
    }
    return true;
  }, []);

  // Capture photo using camera
  const capturePhoto = useCallback(async (): Promise<string | null> => {
    try {
      const hasPermission = await requestCameraPermission();
      if (!hasPermission) return null;

      setState(prev => ({
        ...prev,
        isCapturing: true,
        error: null,
      }));

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      setState(prev => ({ ...prev, isCapturing: false }));

      if (result.canceled || !result.assets?.[0]?.uri) {
        return null;
      }

      const uri = result.assets[0].uri;
      setState(prev => ({ ...prev, photoUri: uri }));
      return uri;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to capture photo';
      console.error('[usePhotoExtract] Capture error:', errorMessage);

      setState(prev => ({
        ...prev,
        isCapturing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [requestCameraPermission]);

  // Pick photo from library
  const pickFromLibrary = useCallback(async (): Promise<string | null> => {
    try {
      const hasPermission = await requestLibraryPermission();
      if (!hasPermission) return null;

      setState(prev => ({
        ...prev,
        isCapturing: true,
        error: null,
      }));

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      setState(prev => ({ ...prev, isCapturing: false }));

      if (result.canceled || !result.assets?.[0]?.uri) {
        return null;
      }

      const uri = result.assets[0].uri;
      setState(prev => ({ ...prev, photoUri: uri }));
      return uri;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to pick photo';
      console.error('[usePhotoExtract] Pick error:', errorMessage);

      setState(prev => ({
        ...prev,
        isCapturing: false,
        error: errorMessage,
      }));
      return null;
    }
  }, [requestLibraryPermission]);

  // Extract data from photo using AI
  const extractData = useCallback(async (photoUri: string): Promise<ImageExtractionResult | null> => {
    try {
      setState(prev => ({
        ...prev,
        isExtracting: true,
        error: null,
      }));

      const result = await extractFromImage(photoUri);

      setState(prev => ({
        ...prev,
        isExtracting: false,
        extractionResult: result,
      }));

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to extract data from photo';
      console.error('[usePhotoExtract] Extract error:', errorMessage);

      setState(prev => ({
        ...prev,
        isExtracting: false,
        error: errorMessage,
      }));
      return null;
    }
  }, []);

  // Capture photo and immediately extract data
  const captureAndExtract = useCallback(async (): Promise<ImageExtractionResult | null> => {
    const photoUri = await capturePhoto();
    if (!photoUri) return null;
    return extractData(photoUri);
  }, [capturePhoto, extractData]);

  // Pick from library and immediately extract data
  const pickAndExtract = useCallback(async (): Promise<ImageExtractionResult | null> => {
    const photoUri = await pickFromLibrary();
    if (!photoUri) return null;
    return extractData(photoUri);
  }, [pickFromLibrary, extractData]);

  // Reset state
  const reset = useCallback(() => {
    setState({
      isCapturing: false,
      isExtracting: false,
      photoUri: null,
      extractionResult: null,
      error: null,
    });
  }, []);

  return {
    state,
    capturePhoto,
    pickFromLibrary,
    extractData,
    captureAndExtract,
    pickAndExtract,
    reset,
  };
}

// Export types for convenience
export type { ImageExtractionResult, DocumentType };

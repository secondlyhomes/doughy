// src/features/capture/screens/useCaptureActions.ts
// All capture action handlers (record, upload, photo, note, call, text)

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useCreateCaptureItem } from '../hooks/useCaptureItems';

export function useCaptureActions() {
  const [showRecorder, setShowRecorder] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');

  const { mutateAsync: createItem, isPending: isCreating } = useCreateCaptureItem();

  // Handle voice memo recording
  const handleRecordComplete = useCallback(async (data: {
    transcript: string;
    durationSeconds: number;
    audioUri?: string;
    keepAudio: boolean;
  }) => {
    try {
      await createItem({
        type: 'recording',
        title: `Voice Memo ${new Date().toLocaleDateString()}`,
        transcript: data.transcript,
        duration_seconds: data.durationSeconds,
        file_url: data.audioUri,
        source: 'app_recording',
      });
      setShowRecorder(false);
      Alert.alert('Saved', 'Voice memo added to triage queue.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save voice memo: ${message}`);
    }
  }, [createItem]);

  // Handle document upload
  // TODO: Files are currently stored with local URIs. This needs Supabase Storage
  // integration to upload files and store permanent URLs. See separate ticket.
  const handleUploadDocument = useCallback(async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'text/*', 'image/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      await createItem({
        type: 'document',
        title: file.name,
        file_name: file.name,
        file_url: file.uri, // TODO: Upload to Supabase Storage and use permanent URL
        file_size: file.size,
        mime_type: file.mimeType,
        source: 'upload',
      });
      Alert.alert('Uploaded', 'Document added to triage queue.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to upload document: ${message}`);
    }
  }, [createItem]);

  // Handle photo capture
  const handleTakePhoto = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Camera access is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        quality: 0.8,
      });

      if (result.canceled) return;

      const photo = result.assets[0];
      await createItem({
        type: 'photo',
        title: `Photo ${new Date().toLocaleDateString()}`,
        file_url: photo.uri,
        file_name: photo.fileName || 'photo.jpg',
        mime_type: photo.mimeType || 'image/jpeg',
        source: 'app_camera',
      });
      Alert.alert('Saved', 'Photo added to triage queue.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to capture photo: ${message}`);
    }
  }, [createItem]);

  // Handle quick note - open cross-platform modal
  const handleAddNote = useCallback(() => {
    setNoteText('');
    setShowNoteModal(true);
  }, []);

  // Save note from modal
  const handleSaveNote = useCallback(async () => {
    if (!noteText.trim()) {
      setShowNoteModal(false);
      return;
    }
    try {
      await createItem({
        type: 'note',
        title: `Note ${new Date().toLocaleDateString()}`,
        content: noteText.trim(),
        source: 'manual',
      });
      setShowNoteModal(false);
      setNoteText('');
      Alert.alert('Saved', 'Note added to triage queue.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      Alert.alert('Error', `Failed to save note: ${message}`);
    }
  }, [createItem, noteText]);

  // Handle log call
  const handleLogCall = useCallback(() => {
    // TODO: Open call logging sheet
    Alert.alert('Coming Soon', 'Call logging will be available soon.');
  }, []);

  // Handle log text
  const handleLogText = useCallback(() => {
    // TODO: Open text logging sheet
    Alert.alert('Coming Soon', 'Text logging will be available soon.');
  }, []);

  return {
    showRecorder,
    setShowRecorder,
    showNoteModal,
    setShowNoteModal,
    noteText,
    setNoteText,
    isCreating,
    handleRecordComplete,
    handleUploadDocument,
    handleTakePhoto,
    handleAddNote,
    handleSaveNote,
    handleLogCall,
    handleLogText,
  };
}

// src/features/real-estate/components/useDocumentActions.ts
// Document action handlers (view, delete) for PropertyDocsTab

import { useState, useCallback } from 'react';
import { Alert, Linking } from 'react-native';
import { Document } from '../types';
import { useDocumentMutations } from '../hooks/usePropertyDocuments';

export function useDocumentActions(refetch: () => void) {
  const { deleteDocument, isLoading: isDeleting } = useDocumentMutations();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleViewDocument = useCallback(async (doc: Document) => {
    const url = doc.url || doc.fileUrl;
    if (!url) {
      Alert.alert('Error', 'Document URL not available');
      return;
    }

    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Cannot open this document');
      }
    } catch (err) {
      console.error('Error opening document:', err);
      Alert.alert('Error', 'Failed to open document');
    }
  }, []);

  const handleDeleteDocument = useCallback(
    async (doc: Document) => {
      Alert.alert('Delete Document', `Are you sure you want to delete "${doc.title || doc.name}"?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(doc.id);
            const success = await deleteDocument(doc);
            setDeletingId(null);
            if (success) {
              refetch();
            } else {
              Alert.alert('Error', 'Failed to delete document');
            }
          },
        },
      ]);
    },
    [deleteDocument, refetch]
  );

  return {
    deletingId,
    handleViewDocument,
    handleDeleteDocument,
  };
}

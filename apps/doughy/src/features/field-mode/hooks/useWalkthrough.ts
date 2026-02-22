// src/features/field-mode/hooks/useWalkthrough.ts
// Hook for managing walkthrough state with mock data

import { useState, useCallback, useMemo } from 'react';
import {
  DealWalkthrough,
  WalkthroughItem,
  PhotoBucket,
  AISummary,
  WalkthroughProgress,
} from '../types';
import {
  mockWalkthrough,
  emptyWalkthrough,
  mockAISummary,
  getItemsByBucket,
} from '../data/mockWalkthrough';
import { PHOTO_BUCKET_CONFIG } from '../../deals/types';

interface UseWalkthroughOptions {
  dealId: string;
  initialData?: DealWalkthrough;
}

interface UseWalkthroughReturn {
  walkthrough: DealWalkthrough;
  items: WalkthroughItem[];
  aiSummary?: AISummary;
  progress: WalkthroughProgress;
  isLoading: boolean;
  error: string | null;

  // Item operations
  addPhoto: (bucket: PhotoBucket, uri: string, notes?: string) => void;
  addVoiceMemo: (bucket: PhotoBucket, uri: string, transcript?: string) => void;
  removeItem: (itemId: string) => void;
  updateItemNotes: (itemId: string, notes: string) => void;

  // Bucket helpers
  getItemsForBucket: (bucket: PhotoBucket) => WalkthroughItem[];
  getPhotoCount: (bucket: PhotoBucket) => number;
  getMemoCount: (bucket: PhotoBucket) => number;

  // AI operations (mock for now)
  organizeWithAI: () => Promise<void>;
  isOrganizing: boolean;

  // Save operations
  saveWalkthrough: () => Promise<void>;
  isSaving: boolean;
}

export function useWalkthrough({
  dealId,
  initialData,
}: UseWalkthroughOptions): UseWalkthroughReturn {
  // Use mock data for development if no initial data provided
  const [walkthrough, setWalkthrough] = useState<DealWalkthrough>(
    initialData || { ...emptyWalkthrough, deal_id: dealId }
  );
  const [isLoading] = useState(false);
  const [error] = useState<string | null>(null);
  const [isOrganizing, setIsOrganizing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const items = walkthrough.items || [];

  // Calculate progress
  const progress = useMemo<WalkthroughProgress>(() => {
    const photos = items.filter((item) => item.item_type === 'photo');
    const memos = items.filter((item) => item.item_type === 'voice_memo');
    const buckets = Object.keys(PHOTO_BUCKET_CONFIG) as PhotoBucket[];
    const bucketsWithContent = buckets.filter((bucket) =>
      items.some((item) => item.bucket === bucket)
    );

    return {
      totalPhotos: photos.length,
      totalMemos: memos.length,
      bucketsWithContent,
      isComplete: bucketsWithContent.length >= 3, // At least 3 buckets have content
    };
  }, [items]);

  // Add a new photo
  const addPhoto = useCallback(
    (bucket: PhotoBucket, uri: string, notes?: string) => {
      const newItem: WalkthroughItem = {
        id: `photo-${Date.now()}`,
        walkthrough_id: walkthrough.id,
        bucket,
        item_type: 'photo',
        file_url: uri,
        notes,
        created_at: new Date().toISOString(),
      };

      setWalkthrough((prev) => ({
        ...prev,
        items: [...(prev.items || []), newItem],
        status: 'in_progress',
      }));
    },
    [walkthrough.id]
  );

  // Add a new voice memo
  const addVoiceMemo = useCallback(
    (bucket: PhotoBucket, uri: string, transcript?: string) => {
      const newItem: WalkthroughItem = {
        id: `memo-${Date.now()}`,
        walkthrough_id: walkthrough.id,
        bucket,
        item_type: 'voice_memo',
        file_url: uri,
        transcript,
        created_at: new Date().toISOString(),
      };

      setWalkthrough((prev) => ({
        ...prev,
        items: [...(prev.items || []), newItem],
        status: 'in_progress',
      }));
    },
    [walkthrough.id]
  );

  // Remove an item
  const removeItem = useCallback((itemId: string) => {
    setWalkthrough((prev) => ({
      ...prev,
      items: (prev.items || []).filter((item) => item.id !== itemId),
    }));
  }, []);

  // Update item notes
  const updateItemNotes = useCallback((itemId: string, notes: string) => {
    setWalkthrough((prev) => ({
      ...prev,
      items: (prev.items || []).map((item) =>
        item.id === itemId ? { ...item, notes } : item
      ),
    }));
  }, []);

  // Get items for a specific bucket
  const getItemsForBucket = useCallback(
    (bucket: PhotoBucket): WalkthroughItem[] => {
      return getItemsByBucket(items, bucket);
    },
    [items]
  );

  // Get photo count for a bucket
  const getPhotoCount = useCallback(
    (bucket: PhotoBucket): number => {
      return items.filter(
        (item) => item.bucket === bucket && item.item_type === 'photo'
      ).length;
    },
    [items]
  );

  // Get voice memo count for a bucket
  const getMemoCount = useCallback(
    (bucket: PhotoBucket): number => {
      return items.filter(
        (item) => item.bucket === bucket && item.item_type === 'voice_memo'
      ).length;
    },
    [items]
  );

  // Mock AI organization
  const organizeWithAI = useCallback(async () => {
    setIsOrganizing(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    setWalkthrough((prev) => ({
      ...prev,
      status: 'organized',
      ai_summary: mockAISummary,
      completed_at: new Date().toISOString(),
    }));

    setIsOrganizing(false);
  }, []);

  // Save walkthrough (mock for now)
  const saveWalkthrough = useCallback(async () => {
    setIsSaving(true);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In real implementation, this would save to Supabase
    console.log('Saving walkthrough:', walkthrough);

    setIsSaving(false);
  }, [walkthrough]);

  return {
    walkthrough,
    items,
    aiSummary: walkthrough.ai_summary,
    progress,
    isLoading,
    error,
    addPhoto,
    addVoiceMemo,
    removeItem,
    updateItemNotes,
    getItemsForBucket,
    getPhotoCount,
    getMemoCount,
    organizeWithAI,
    isOrganizing,
    saveWalkthrough,
    isSaving,
  };
}

// Demo hook that returns pre-populated data for testing
export function useDemoWalkthrough(): UseWalkthroughReturn {
  return useWalkthrough({
    dealId: 'demo-deal',
    initialData: mockWalkthrough,
  });
}

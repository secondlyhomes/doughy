// src/components/ui/photo-gallery/types.ts
// Types for PhotoGallery component

export interface PhotoItem {
  /** Unique identifier for the photo */
  id: string;
  /** URL or local path to the image */
  url: string;
  /** Optional caption for the photo */
  caption?: string;
  /** Type of photo (for maintenance: before, after, receipt) */
  type?: 'before' | 'after' | 'receipt' | 'general';
}

export interface PhotoGalleryProps {
  /** Array of photos to display */
  photos: PhotoItem[];
  /** Handler for adding a new photo */
  onAddPhoto?: () => void;
  /** Handler for removing a photo */
  onRemovePhoto?: (photoId: string) => void;
  /** Handler for photo press (opens full screen viewer by default) */
  onPhotoPress?: (photo: PhotoItem, index: number) => void;
  /** Whether editing is allowed (shows add/remove buttons) */
  editable?: boolean;
  /** Maximum number of photos allowed */
  maxPhotos?: number;
  /** Size variant for photo thumbnails */
  size?: 'small' | 'medium' | 'large';
  /** Show captions below photos */
  showCaptions?: boolean;
  /** Placeholder text when no photos */
  emptyText?: string;
  /** Test ID for testing */
  testID?: string;
}

export function getPhotoSize(size: 'small' | 'medium' | 'large'): number {
  switch (size) {
    case 'small':
      return 80;
    case 'large':
      return 160;
    default:
      return 120;
  }
}

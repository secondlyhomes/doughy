/**
 * Types for ImageGallery components
 */

export interface ImageItem {
  id: string;
  url: string;
  path: string;
  width?: number;
  height?: number;
  created_at: string;
}

export interface ImageGalleryProps {
  images: ImageItem[];
  onDelete?: (image: ImageItem) => void;
  onRefresh?: () => void;
  loading?: boolean;
  numColumns?: number;
  editable?: boolean;
}

export interface ImageViewerProps {
  visible: boolean;
  image: ImageItem | null;
  editable?: boolean;
  onClose: () => void;
  onDelete?: () => void;
}

export interface GalleryItemProps {
  item: ImageItem;
  size: number;
  onPress: (image: ImageItem) => void;
}

export interface MasonryImageGalleryProps {
  images: ImageItem[];
  onImagePress?: (image: ImageItem) => void;
}

export interface ImageCarouselProps {
  images: ImageItem[];
  onImagePress?: (image: ImageItem) => void;
}

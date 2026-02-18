/**
 * ImageGallery Component
 *
 * Display images from Supabase Storage with:
 * - Grid layout
 * - Lazy loading
 * - Full-screen viewer
 * - Delete functionality
 * - Optimized image URLs
 */

import { View, Text, FlatList } from 'react-native';
import { useImageGallery } from './useImageGallery';
import { ImageViewer } from './ImageViewer';
import { GalleryItem } from './GalleryItem';
import { galleryStyles, emptyStyles } from './styles';
import type { ImageGalleryProps, ImageItem } from './types';

export function ImageGallery({
  images,
  onDelete,
  onRefresh,
  loading = false,
  numColumns = 3,
  editable = false,
}: ImageGalleryProps) {
  const {
    selectedImage,
    showViewer,
    itemSize,
    handleImagePress,
    handleClose,
    handleDelete,
  } = useImageGallery({ numColumns, onDelete });

  const renderItem = ({ item }: { item: ImageItem }) => (
    <GalleryItem item={item} size={itemSize} onPress={handleImagePress} />
  );

  const renderEmpty = () => (
    <View style={emptyStyles.container}>
      <Text style={emptyStyles.icon}>📷</Text>
      <Text style={emptyStyles.text}>No images yet</Text>
      <Text style={emptyStyles.subtext}>
        Upload your first image to get started
      </Text>
    </View>
  );

  return (
    <View style={galleryStyles.container}>
      <FlatList
        data={images}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={galleryStyles.listContent}
        columnWrapperStyle={galleryStyles.columnWrapper}
        ListEmptyComponent={!loading ? renderEmpty : null}
        onRefresh={onRefresh}
        refreshing={loading}
      />

      <ImageViewer
        visible={showViewer}
        image={selectedImage}
        editable={editable}
        onClose={handleClose}
        onDelete={editable && onDelete ? handleDelete : undefined}
      />
    </View>
  );
}

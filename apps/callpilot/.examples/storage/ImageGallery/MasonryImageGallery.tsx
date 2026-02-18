/**
 * Masonry-style image gallery with variable heights
 */

import { View, Image, Pressable, Dimensions } from 'react-native';
import { spacing } from '@/theme/tokens';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { masonryStyles } from './styles';
import type { MasonryImageGalleryProps, ImageItem } from './types';

export function MasonryImageGallery({
  images,
  onImagePress,
}: MasonryImageGalleryProps) {
  const screenWidth = Dimensions.get('window').width;
  const columnWidth = (screenWidth - spacing[3] * 3) / 2;

  const leftColumn = images.filter((_, index) => index % 2 === 0);
  const rightColumn = images.filter((_, index) => index % 2 === 1);

  const renderColumn = (columnImages: ImageItem[]) => (
    <View style={[masonryStyles.column, { width: columnWidth }]}>
      {columnImages.map((image) => {
        const aspectRatio =
          image.width && image.height ? image.width / image.height : 1;
        const height = columnWidth / aspectRatio;

        return (
          <Pressable
            key={image.id}
            onPress={() => onImagePress?.(image)}
            style={[masonryStyles.item, { height }]}
          >
            <Image
              source={{
                uri: getOptimizedImageUrl(image.url, {
                  width: columnWidth * 2,
                  quality: 80,
                }),
              }}
              style={masonryStyles.image}
              resizeMode="cover"
            />
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={masonryStyles.container}>
      {renderColumn(leftColumn)}
      {renderColumn(rightColumn)}
    </View>
  );
}

/**
 * Horizontal scrolling image carousel
 */

import { Image, Pressable, FlatList, Dimensions } from 'react-native';
import { spacing } from '@/theme/tokens';
import { getOptimizedImageUrl } from '@/utils/imageOptimization';
import { carouselStyles } from './styles';
import type { ImageCarouselProps } from './types';

export function ImageCarousel({ images, onImagePress }: ImageCarouselProps) {
  const itemWidth = Dimensions.get('window').width * 0.8;

  return (
    <FlatList
      data={images}
      horizontal
      showsHorizontalScrollIndicator={false}
      snapToInterval={itemWidth + spacing[4]}
      decelerationRate="fast"
      contentContainerStyle={carouselStyles.content}
      renderItem={({ item }) => (
        <Pressable
          onPress={() => onImagePress?.(item)}
          style={[carouselStyles.item, { width: itemWidth }]}
        >
          <Image
            source={{
              uri: getOptimizedImageUrl(item.url, {
                width: itemWidth * 2,
                quality: 85,
              }),
            }}
            style={carouselStyles.image}
            resizeMode="cover"
          />
        </Pressable>
      )}
      keyExtractor={(item) => item.id}
    />
  );
}

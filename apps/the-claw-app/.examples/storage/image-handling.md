# Image Handling with Supabase Storage

Complete guide for handling images in React Native with Supabase Storage, including picker integration, compression, thumbnails, and CDN optimization.

## Image Picker Integration

```typescript
import * as ImagePicker from 'expo-image-picker';

interface PickImageOptions {
  allowsEditing?: boolean;
  aspect?: [number, number];
  quality?: number;
  mediaTypes?: ImagePicker.MediaTypeOptions;
}

export async function pickImage(
  options: PickImageOptions = {}
): Promise<ImagePicker.ImagePickerAsset | null> {
  // Request permissions
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Camera roll permissions are required');
  }

  // Launch picker
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: options.mediaTypes || ImagePicker.MediaTypeOptions.Images,
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect || [1, 1],
    quality: options.quality ?? 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
}

export async function takePhoto(
  options: PickImageOptions = {}
): Promise<ImagePicker.ImagePickerAsset | null> {
  // Request permissions
  const { status } = await ImagePicker.requestCameraPermissionsAsync();

  if (status !== 'granted') {
    throw new Error('Camera permissions are required');
  }

  // Launch camera
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: options.allowsEditing ?? true,
    aspect: options.aspect || [1, 1],
    quality: options.quality ?? 0.8,
  });

  if (result.canceled) {
    return null;
  }

  return result.assets[0];
}
```

## Image Compression

```typescript
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

interface CompressOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: SaveFormat;
}

export async function compressImage(
  uri: string,
  options: CompressOptions = {}
): Promise<string> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.8,
    format = SaveFormat.JPEG,
  } = options;

  const manipResult = await manipulateAsync(
    uri,
    [{ resize: { width: maxWidth, height: maxHeight } }],
    { compress: quality, format }
  );

  return manipResult.uri;
}
```

## Thumbnail Generation

```typescript
interface ThumbnailOptions {
  width: number;
  height: number;
  quality?: number;
}

export async function generateThumbnail(
  uri: string,
  options: ThumbnailOptions
): Promise<string> {
  const { width, height, quality = 0.7 } = options;

  const manipResult = await manipulateAsync(
    uri,
    [{ resize: { width, height } }],
    { compress: quality, format: SaveFormat.JPEG }
  );

  return manipResult.uri;
}

/**
 * Generate multiple thumbnail sizes
 */
export async function generateThumbnails(
  uri: string
): Promise<{
  small: string;
  medium: string;
  large: string;
}> {
  const [small, medium, large] = await Promise.all([
    generateThumbnail(uri, { width: 150, height: 150 }),
    generateThumbnail(uri, { width: 400, height: 400 }),
    generateThumbnail(uri, { width: 800, height: 800 }),
  ]);

  return { small, medium, large };
}
```

## Image Optimization Hook

```typescript
import { useState } from 'react';

interface UseImageUploadOptions {
  bucket: string;
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  generateThumbs?: boolean;
}

export function useImageUpload({
  bucket,
  maxWidth = 1920,
  maxHeight = 1920,
  quality = 0.8,
  generateThumbs = false,
}: UseImageUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadImage = async (
    imageUri: string,
    path: string
  ): Promise<{
    url: string;
    thumbnails?: { small: string; medium: string; large: string };
  }> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Compress image
      setProgress(20);
      const compressedUri = await compressImage(imageUri, {
        maxWidth,
        maxHeight,
        quality,
      });

      // Upload main image
      setProgress(40);
      const result = await uploadFileWithProgress({
        bucket,
        path,
        fileUri: compressedUri,
        onProgress: (p) => setProgress(40 + p * 0.4),
      });

      if (result.error) {
        throw result.error;
      }

      let thumbnails;

      // Generate and upload thumbnails if requested
      if (generateThumbs) {
        setProgress(80);
        const thumbs = await generateThumbnails(compressedUri);

        const [smallResult, mediumResult, largeResult] = await Promise.all([
          uploadFileWithProgress({
            bucket,
            path: path.replace(/\.(\w+)$/, '-small.$1'),
            fileUri: thumbs.small,
          }),
          uploadFileWithProgress({
            bucket,
            path: path.replace(/\.(\w+)$/, '-medium.$1'),
            fileUri: thumbs.medium,
          }),
          uploadFileWithProgress({
            bucket,
            path: path.replace(/\.(\w+)$/, '-large.$1'),
            fileUri: thumbs.large,
          }),
        ]);

        thumbnails = {
          small: smallResult.url,
          medium: mediumResult.url,
          large: largeResult.url,
        };
      }

      setProgress(100);

      return {
        url: result.url,
        thumbnails,
      };
    } catch (err) {
      const error = err as Error;
      setError(error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadImage,
    uploading,
    progress,
    error,
  };
}
```

## CDN URLs and Transformations

```typescript
/**
 * Get optimized image URL with transformations
 * Supabase Storage supports image transformations via URL parameters
 */
export function getOptimizedImageUrl(
  url: string,
  options: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'png' | 'jpeg';
  } = {}
): string {
  const { width, height, quality, format } = options;

  const params = new URLSearchParams();

  if (width) params.append('width', width.toString());
  if (height) params.append('height', height.toString());
  if (quality) params.append('quality', quality.toString());
  if (format) params.append('format', format);

  const queryString = params.toString();
  return queryString ? `${url}?${queryString}` : url;
}

/**
 * Get image URL with preset sizes
 */
export function getImageUrl(
  path: string,
  bucket: string,
  size: 'thumb' | 'small' | 'medium' | 'large' | 'original' = 'medium'
): string {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);

  const sizeConfig = {
    thumb: { width: 150, height: 150, quality: 70 },
    small: { width: 400, height: 400, quality: 75 },
    medium: { width: 800, height: 800, quality: 80 },
    large: { width: 1200, height: 1200, quality: 85 },
    original: {},
  };

  return getOptimizedImageUrl(data.publicUrl, sizeConfig[size]);
}
```

## Responsive Image Component

```typescript
import { Image, ImageProps } from 'react-native';
import { useState, useEffect } from 'react';

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  bucket: string;
  size?: 'thumb' | 'small' | 'medium' | 'large' | 'original';
  placeholder?: string;
}

export function OptimizedImage({
  uri,
  bucket,
  size = 'medium',
  placeholder,
  style,
  ...props
}: OptimizedImageProps) {
  const [imageUrl, setImageUrl] = useState<string>(placeholder || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const url = getImageUrl(uri, bucket, size);
    setImageUrl(url);
  }, [uri, bucket, size]);

  return (
    <Image
      source={{ uri: imageUrl }}
      style={style}
      onLoadStart={() => setLoading(true)}
      onLoadEnd={() => setLoading(false)}
      onError={() => setError(true)}
      {...props}
    />
  );
}
```

## Complete Image Upload Flow

```typescript
import { View, Button, Image, ActivityIndicator, Text } from 'react-native';
import { useState } from 'react';

export function ImageUploadFlow() {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);

  const { uploadImage, uploading, progress, error } = useImageUpload({
    bucket: 'images',
    maxWidth: 1920,
    maxHeight: 1920,
    quality: 0.8,
    generateThumbs: true,
  });

  const handlePickImage = async () => {
    try {
      const asset = await pickImage({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (asset) {
        setImageUri(asset.uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      const asset = await takePhoto({
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (asset) {
        setImageUri(asset.uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
    }
  };

  const handleUpload = async () => {
    if (!imageUri) return;

    try {
      const path = generateFilePath('user-123', 'photo.jpg', 'photos/');
      const result = await uploadImage(imageUri, path);
      setUploadedUrl(result.url);
      setImageUri(null);
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <View style={{ padding: 16 }}>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <Button title="Choose from Library" onPress={handlePickImage} />
        <Button title="Take Photo" onPress={handleTakePhoto} />
      </View>

      {imageUri && (
        <View>
          <Image
            source={{ uri: imageUri }}
            style={{ width: '100%', height: 200, marginBottom: 16 }}
            resizeMode="cover"
          />

          <Button
            title={uploading ? 'Uploading...' : 'Upload Image'}
            onPress={handleUpload}
            disabled={uploading}
          />

          {uploading && (
            <View style={{ marginTop: 16 }}>
              <ActivityIndicator />
              <Text style={{ textAlign: 'center', marginTop: 8 }}>
                {progress}%
              </Text>
            </View>
          )}

          {error && (
            <Text style={{ color: 'red', marginTop: 8 }}>{error.message}</Text>
          )}
        </View>
      )}

      {uploadedUrl && (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>
            Uploaded Image:
          </Text>
          <Image
            source={{ uri: uploadedUrl }}
            style={{ width: '100%', height: 200 }}
            resizeMode="cover"
          />
        </View>
      )}
    </View>
  );
}
```

## Image Metadata Storage

```typescript
/**
 * Store image metadata in database after upload
 */
interface ImageMetadata {
  user_id: string;
  file_path: string;
  url: string;
  width: number;
  height: number;
  size: number;
  mime_type: string;
  thumbnail_small?: string;
  thumbnail_medium?: string;
  thumbnail_large?: string;
}

export async function saveImageMetadata(
  metadata: ImageMetadata
): Promise<void> {
  const { error } = await supabase
    .from('user_images')
    .insert({
      user_id: metadata.user_id,
      file_path: metadata.file_path,
      url: metadata.url,
      width: metadata.width,
      height: metadata.height,
      size: metadata.size,
      mime_type: metadata.mime_type,
      thumbnail_small: metadata.thumbnail_small,
      thumbnail_medium: metadata.thumbnail_medium,
      thumbnail_large: metadata.thumbnail_large,
      created_at: new Date().toISOString(),
    });

  if (error) {
    throw error;
  }
}
```

## Best Practices

1. Always compress images before uploading
2. Generate thumbnails for list views
3. Use CDN transformations for responsive images
4. Store image metadata in database
5. Implement lazy loading for image galleries
6. Use appropriate image formats (JPEG for photos, PNG for graphics)
7. Set reasonable quality settings (0.7-0.8 is usually sufficient)
8. Limit maximum dimensions (1920x1920 is usually enough)
9. Show upload progress for better UX
10. Cache images locally after download

## Image Cleanup

```typescript
/**
 * Delete image and all its thumbnails
 */
export async function deleteImage(
  bucket: string,
  path: string,
  hasThumbnails = false
): Promise<void> {
  const pathsToDelete = [path];

  if (hasThumbnails) {
    pathsToDelete.push(
      path.replace(/\.(\w+)$/, '-small.$1'),
      path.replace(/\.(\w+)$/, '-medium.$1'),
      path.replace(/\.(\w+)$/, '-large.$1')
    );
  }

  const { error } = await supabase.storage.from(bucket).remove(pathsToDelete);

  if (error) {
    throw error;
  }

  // Also delete from database
  await supabase.from('user_images').delete().eq('file_path', path);
}
```

## See Also

- [File Upload](./file-upload.md) - General file upload patterns
- [Avatar Upload](./avatar-upload.md) - Avatar-specific implementation
- [Image Gallery Component](./ImageGallery.tsx) - Display uploaded images

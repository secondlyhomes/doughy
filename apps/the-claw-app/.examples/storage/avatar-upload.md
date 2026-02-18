# Avatar Upload Flow

Complete implementation guide for avatar upload with cropping, resizing, profile updates, and cleanup of old avatars.

## Complete Avatar Upload Hook

```typescript
import { useState } from 'react';
import { supabase } from '@/services/supabase-client';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

interface UseAvatarUploadOptions {
  userId: string;
  bucket?: string;
  size?: number;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
}

export function useAvatarUpload({
  userId,
  bucket = 'avatars',
  size = 400,
  onSuccess,
  onError,
}: UseAvatarUploadOptions) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<Error | null>(null);

  const uploadAvatar = async (imageUri: string): Promise<string> => {
    try {
      setUploading(true);
      setProgress(0);
      setError(null);

      // Step 1: Get current avatar path to delete later
      setProgress(10);
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_path')
        .eq('id', userId)
        .single();

      const oldAvatarPath = profile?.avatar_path;

      // Step 2: Crop and resize to square
      setProgress(20);
      const processedImage = await manipulateAsync(
        imageUri,
        [{ resize: { width: size, height: size } }],
        { compress: 0.8, format: SaveFormat.JPEG }
      );

      // Step 3: Generate unique path
      setProgress(30);
      const timestamp = Date.now();
      const fileName = `${userId}-${timestamp}.jpg`;
      const path = `${userId}/${fileName}`;

      // Step 4: Read file as blob
      setProgress(40);
      const response = await fetch(processedImage.uri);
      const blob = await response.blob();

      // Step 5: Upload to Supabase Storage
      setProgress(50);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(path, blob, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (uploadError) {
        throw uploadError;
      }

      // Step 6: Get public URL
      setProgress(70);
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(uploadData.path);

      // Step 7: Update profile with new avatar
      setProgress(80);
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: urlData.publicUrl,
          avatar_path: uploadData.path,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        throw updateError;
      }

      // Step 8: Delete old avatar if exists
      setProgress(90);
      if (oldAvatarPath) {
        await supabase.storage.from(bucket).remove([oldAvatarPath]);
      }

      setProgress(100);
      onSuccess?.(urlData.publicUrl);

      return urlData.publicUrl;
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  const pickAndUpload = async (): Promise<string | null> => {
    try {
      // Request permissions
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Camera roll permissions are required');
      }

      // Launch picker with square crop
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return await uploadAvatar(result.assets[0].uri);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    }
  };

  const takePhotoAndUpload = async (): Promise<string | null> => {
    try {
      // Request permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();

      if (status !== 'granted') {
        throw new Error('Camera permissions are required');
      }

      // Launch camera with square crop
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return null;
      }

      return await uploadAvatar(result.assets[0].uri);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    }
  };

  const removeAvatar = async (): Promise<void> => {
    try {
      setUploading(true);
      setError(null);

      // Get current avatar path
      const { data: profile } = await supabase
        .from('profiles')
        .select('avatar_path')
        .eq('id', userId)
        .single();

      if (!profile?.avatar_path) {
        return;
      }

      // Delete from storage
      await supabase.storage.from(bucket).remove([profile.avatar_path]);

      // Update profile
      await supabase
        .from('profiles')
        .update({
          avatar_url: null,
          avatar_path: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);
    } catch (err) {
      const error = err as Error;
      setError(error);
      onError?.(error);
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return {
    uploadAvatar,
    pickAndUpload,
    takePhotoAndUpload,
    removeAvatar,
    uploading,
    progress,
    error,
  };
}
```

## Avatar Upload Component

```typescript
import { View, Text, Pressable, Image, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { colors, spacing, borderRadius } from '@/theme/tokens';

interface AvatarUploadProps {
  userId: string;
  currentAvatarUrl?: string | null;
  onUploadSuccess?: (url: string) => void;
  size?: number;
}

export function AvatarUpload({
  userId,
  currentAvatarUrl,
  onUploadSuccess,
  size = 120,
}: AvatarUploadProps) {
  const [showOptions, setShowOptions] = useState(false);

  const { pickAndUpload, takePhotoAndUpload, removeAvatar, uploading, progress, error } =
    useAvatarUpload({
      userId,
      onSuccess: (url) => {
        setShowOptions(false);
        onUploadSuccess?.(url);
      },
    });

  const handlePickImage = async () => {
    try {
      await pickAndUpload();
    } catch (err) {
      console.error('Pick image failed:', err);
    }
  };

  const handleTakePhoto = async () => {
    try {
      await takePhotoAndUpload();
    } catch (err) {
      console.error('Take photo failed:', err);
    }
  };

  const handleRemove = async () => {
    try {
      await removeAvatar();
      setShowOptions(false);
    } catch (err) {
      console.error('Remove avatar failed:', err);
    }
  };

  return (
    <View style={{ alignItems: 'center' }}>
      <Pressable
        onPress={() => setShowOptions(!showOptions)}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.neutral[200],
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
          borderWidth: 3,
          borderColor: colors.white,
        }}
      >
        {currentAvatarUrl ? (
          <Image
            source={{ uri: currentAvatarUrl }}
            style={{ width: '100%', height: '100%' }}
          />
        ) : (
          <Text
            style={{
              fontSize: size / 3,
              color: colors.neutral[500],
              fontWeight: '600',
            }}
          >
            {userId.charAt(0).toUpperCase()}
          </Text>
        )}

        {uploading && (
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0,0,0,0.6)',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <ActivityIndicator color={colors.white} size="large" />
            <Text style={{ color: colors.white, marginTop: 8, fontSize: 12 }}>
              {progress}%
            </Text>
          </View>
        )}

        {!uploading && (
          <View
            style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              backgroundColor: colors.primary[500],
              width: size / 4,
              height: size / 4,
              borderRadius: size / 8,
              justifyContent: 'center',
              alignItems: 'center',
              borderWidth: 2,
              borderColor: colors.white,
            }}
          >
            <Text style={{ color: colors.white, fontSize: size / 8 }}>✏️</Text>
          </View>
        )}
      </Pressable>

      {showOptions && !uploading && (
        <View
          style={{
            marginTop: spacing[4],
            backgroundColor: colors.white,
            borderRadius: borderRadius.lg,
            padding: spacing[2],
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <Pressable
            onPress={handlePickImage}
            style={{
              padding: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: colors.neutral[200],
            }}
          >
            <Text style={{ fontSize: 16, color: colors.neutral[900] }}>
              Choose from Library
            </Text>
          </Pressable>

          <Pressable
            onPress={handleTakePhoto}
            style={{
              padding: spacing[3],
              borderBottomWidth: 1,
              borderBottomColor: colors.neutral[200],
            }}
          >
            <Text style={{ fontSize: 16, color: colors.neutral[900] }}>
              Take Photo
            </Text>
          </Pressable>

          {currentAvatarUrl && (
            <Pressable
              onPress={handleRemove}
              style={{
                padding: spacing[3],
              }}
            >
              <Text style={{ fontSize: 16, color: colors.error[600] }}>
                Remove Avatar
              </Text>
            </Pressable>
          )}
        </View>
      )}

      {error && (
        <Text
          style={{
            color: colors.error[600],
            marginTop: spacing[2],
            fontSize: 12,
          }}
        >
          {error.message}
        </Text>
      )}
    </View>
  );
}
```

## Database Schema

```sql
-- Profiles table with avatar fields
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique,
  full_name text,
  avatar_url text,
  avatar_path text, -- Store path for easy deletion
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- RLS policies
alter table profiles enable row level security;

-- Users can view any profile
create policy "Profiles are viewable by everyone"
  on profiles for select
  using (true);

-- Users can update their own profile
create policy "Users can update own profile"
  on profiles for update
  using (auth.uid() = id);

-- Create avatars bucket
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true);

-- Storage policies for avatars bucket
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can update their own avatar"
  on storage.objects for update
  using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
```

## Profile Screen with Avatar

```typescript
import { View, Text, ScrollView } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import { supabase } from '@/services/supabase-client';

interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

export function ProfileScreen() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (url: string) => {
    setProfile((prev) => (prev ? { ...prev, avatar_url: url } : null));
  };

  if (loading || !user || !profile) {
    return <View />;
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.white }}>
      <View style={{ padding: spacing[6], alignItems: 'center' }}>
        <AvatarUpload
          userId={user.id}
          currentAvatarUrl={profile.avatar_url}
          onUploadSuccess={handleAvatarUpload}
          size={120}
        />

        <Text
          style={{
            fontSize: 24,
            fontWeight: 'bold',
            marginTop: spacing[4],
            color: colors.neutral[900],
          }}
        >
          {profile.full_name || 'No name set'}
        </Text>

        <Text
          style={{
            fontSize: 16,
            marginTop: spacing[1],
            color: colors.neutral[600],
          }}
        >
          @{profile.username || 'No username'}
        </Text>
      </View>
    </ScrollView>
  );
}
```

## Avatar Display Component

```typescript
interface AvatarProps {
  url?: string | null;
  name?: string;
  size?: number;
  style?: ViewStyle;
}

export function Avatar({ url, name, size = 40, style }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const initials = name
    ? name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '?';

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.primary[500],
          justifyContent: 'center',
          alignItems: 'center',
          overflow: 'hidden',
        },
        style,
      ]}
    >
      {url && !imageError ? (
        <Image
          source={{ uri: url }}
          style={{ width: '100%', height: '100%' }}
          onError={() => setImageError(true)}
        />
      ) : (
        <Text
          style={{
            color: colors.white,
            fontSize: size / 2.5,
            fontWeight: '600',
          }}
        >
          {initials}
        </Text>
      )}
    </View>
  );
}
```

## Cleanup Old Avatars (Optional Edge Function)

```typescript
// Supabase Edge Function to clean up old avatars
// Deploy to Supabase Functions for automated cleanup

import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SECRET_KEY')!
    );

    // Find profiles with multiple avatars
    const { data: profiles } = await supabase.from('profiles').select('id');

    for (const profile of profiles || []) {
      // List all avatars for this user
      const { data: files } = await supabase.storage
        .from('avatars')
        .list(profile.id, {
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (files && files.length > 1) {
        // Keep the most recent, delete the rest
        const filesToDelete = files.slice(1).map((f) => `${profile.id}/${f.name}`);

        await supabase.storage.from('avatars').remove(filesToDelete);

        console.log(`Cleaned up ${filesToDelete.length} old avatars for ${profile.id}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
```

## Best Practices

1. Always crop avatars to square (1:1 aspect ratio)
2. Resize to consistent dimensions (400x400 recommended)
3. Store avatar path in database for easy deletion
4. Delete old avatar when uploading new one
5. Use RLS to restrict uploads to user's own folder
6. Generate unique filenames with timestamps
7. Show upload progress for better UX
8. Provide fallback initials when no avatar
9. Handle image loading errors gracefully
10. Compress images to reduce storage costs

## Testing Checklist

- [ ] Upload avatar from library
- [ ] Take photo and upload
- [ ] Remove existing avatar
- [ ] Upload replaces old avatar
- [ ] Old avatar is deleted from storage
- [ ] Profile updates correctly
- [ ] RLS policies prevent unauthorized access
- [ ] Progress indicator shows during upload
- [ ] Error handling works properly
- [ ] Fallback initials display correctly

## See Also

- [Image Handling](./image-handling.md) - General image operations
- [File Upload](./file-upload.md) - Base upload functionality
- [Storage Service](./storageService.ts) - Reusable storage utilities

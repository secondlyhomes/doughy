// src/components/ui/Avatar.tsx
// React Native Avatar component with NativeWind styling
import React, { useState } from 'react';
import { View, Image, Text, ImageProps, ViewProps, TextProps } from 'react-native';
import { cn } from '@/lib/utils';

// Avatar Root
export interface AvatarProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function Avatar({ className, children, ...props }: AvatarProps) {
  return (
    <View
      className={cn(
        'relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

// Avatar Image
export interface AvatarImageProps extends Omit<ImageProps, 'source'> {
  src?: string;
  alt?: string;
  className?: string;
  onLoadError?: () => void;
}

export function AvatarImage({
  src,
  alt,
  className,
  onLoadError,
  ...props
}: AvatarImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return null;
  }

  return (
    <Image
      source={{ uri: src }}
      className={cn('aspect-square h-full w-full', className)}
      accessibilityLabel={alt}
      onError={() => {
        setHasError(true);
        onLoadError?.();
      }}
      {...props}
    />
  );
}

// Avatar Fallback
export interface AvatarFallbackProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function AvatarFallback({ className, children, ...props }: AvatarFallbackProps) {
  return (
    <View
      className={cn(
        'flex h-full w-full items-center justify-center rounded-full bg-muted',
        className
      )}
      {...props}
    >
      {typeof children === 'string' ? (
        <Text className="text-sm font-medium text-muted-foreground">
          {children}
        </Text>
      ) : (
        children
      )}
    </View>
  );
}

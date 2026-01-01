// src/components/ui/Card.tsx
// React Native Card components with NativeWind styling
import React from 'react';
import { View, Text, ViewProps, TextProps } from 'react-native';
import { cn } from '@/lib/utils';

interface CardProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function Card({ className, children, ...props }: CardProps) {
  return (
    <View
      className={cn(
        'rounded-lg border border-border bg-card shadow-md',
        className
      )}
      {...props}
    >
      {children}
    </View>
  );
}

interface CardHeaderProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardHeader({ className, children, ...props }: CardHeaderProps) {
  return (
    <View className={cn('flex-col gap-1.5 p-6', className)} {...props}>
      {children}
    </View>
  );
}

interface CardTitleProps extends TextProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardTitle({ className, children, ...props }: CardTitleProps) {
  return (
    <Text
      className={cn('text-2xl font-semibold text-card-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

interface CardDescriptionProps extends TextProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardDescription({ className, children, ...props }: CardDescriptionProps) {
  return (
    <Text
      className={cn('text-sm text-muted-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

interface CardContentProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardContent({ className, children, ...props }: CardContentProps) {
  return (
    <View className={cn('p-6 pt-0', className)} {...props}>
      {children}
    </View>
  );
}

interface CardFooterProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
}

export function CardFooter({ className, children, ...props }: CardFooterProps) {
  return (
    <View className={cn('flex-row items-center p-6 pt-0', className)} {...props}>
      {children}
    </View>
  );
}

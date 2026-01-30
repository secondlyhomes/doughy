// src/components/ui/Card.tsx
// React Native Card components with NativeWind styling and glass effects
import React from 'react';
import { View, Text, ViewProps, TextProps, StyleSheet } from 'react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';
import { GlassView } from './GlassView';

interface CardProps extends ViewProps {
  className?: string;
  children?: React.ReactNode;
  /** Card variant: 'default' for solid background, 'glass' for glass effect. Default: 'default' */
  variant?: 'default' | 'glass';
  /** Blur intensity for glass variant (0-100). Default: 60 */
  glassIntensity?: number;
}

export function Card({
  className,
  children,
  style,
  variant = 'default',
  glassIntensity = 60,
  ...props
}: CardProps) {
  const colors = useThemeColors();

  if (variant === 'glass') {
    return (
      <GlassView
        intensity={glassIntensity}
        style={[
          cardStyles.base,
          { borderColor: colors.border },
          style,
        ]}
        {...props}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <View
      className={cn('rounded-xl shadow-md', className)}
      style={[
        {
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

const cardStyles = StyleSheet.create({
  base: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});

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

export function CardTitle({ className, children, style, ...props }: CardTitleProps) {
  const colors = useThemeColors();
  return (
    <Text
      className={cn('text-2xl font-semibold', className)}
      style={[{ color: colors.cardForeground }, style]}
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

export function CardDescription({ className, children, style, ...props }: CardDescriptionProps) {
  const colors = useThemeColors();
  return (
    <Text
      className={cn('text-sm', className)}
      style={[{ color: colors.mutedForeground }, style]}
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

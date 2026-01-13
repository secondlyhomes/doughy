// src/components/ui/Breadcrumb.tsx
// Navigation breadcrumbs with separators
import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, ViewProps, TextProps } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

// Breadcrumb Root
export interface BreadcrumbProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
  separator?: React.ReactNode;
}

export function Breadcrumb({
  children,
  className,
  separator,
  ...props
}: BreadcrumbProps) {
  const items = React.Children.toArray(children);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className={cn(className)}
      contentContainerStyle={{ alignItems: 'center' }}
      {...props}
    >
      <View className="flex-row items-center">
        {items.map((child, index) => (
          <React.Fragment key={index}>
            {child}
            {index < items.length - 1 && (
              separator || <BreadcrumbSeparator />
            )}
          </React.Fragment>
        ))}
      </View>
    </ScrollView>
  );
}

// Breadcrumb Item - wrapper for link or page
export interface BreadcrumbItemProps extends ViewProps {
  children?: React.ReactNode;
  className?: string;
}

export function BreadcrumbItem({
  children,
  className,
  ...props
}: BreadcrumbItemProps) {
  return (
    <View className={cn('flex-row items-center', className)} {...props}>
      {children}
    </View>
  );
}

// Breadcrumb Link - clickable breadcrumb
export interface BreadcrumbLinkProps {
  href?: string;
  onPress?: () => void;
  children?: React.ReactNode;
  className?: string;
  textClassName?: string;
}

export function BreadcrumbLink({
  onPress,
  children,
  className,
  textClassName,
}: BreadcrumbLinkProps) {
  return (
    <TouchableOpacity
      className={cn(className)}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="link"
    >
      {typeof children === 'string' ? (
        <Text className={cn('text-sm text-muted-foreground', textClassName)}>
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );
}

// Breadcrumb Page - current page (non-interactive)
export interface BreadcrumbPageProps extends TextProps {
  children?: React.ReactNode;
  className?: string;
}

export function BreadcrumbPage({
  children,
  className,
  ...props
}: BreadcrumbPageProps) {
  return (
    <Text
      className={cn('text-sm font-medium text-foreground', className)}
      {...props}
    >
      {children}
    </Text>
  );
}

// Breadcrumb Separator
export interface BreadcrumbSeparatorProps {
  children?: React.ReactNode;
  className?: string;
}

export function BreadcrumbSeparator({
  children,
  className,
}: BreadcrumbSeparatorProps) {
  const colors = useThemeColors();
  return (
    <View className={cn('mx-2', className)} accessible={false} importantForAccessibility="no-hide-descendants">
      {children || <ChevronRight size={14} color={colors.mutedForeground} />}
    </View>
  );
}

// Breadcrumb Ellipsis - for collapsed items
export interface BreadcrumbEllipsisProps {
  className?: string;
}

export function BreadcrumbEllipsis({ className }: BreadcrumbEllipsisProps) {
  return (
    <View className={cn('flex-row items-center', className)}>
      <Text className="text-sm text-muted-foreground">...</Text>
    </View>
  );
}

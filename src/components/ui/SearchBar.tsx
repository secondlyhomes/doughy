// src/components/ui/SearchBar.tsx
// Reusable search bar component with consistent styling
import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator, Text } from 'react-native';
import { Search, X, SlidersHorizontal, List, LayoutGrid } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/contexts/ThemeContext';
import { GLASS_INTENSITY } from '@/constants/design-tokens';
import { GlassView } from './GlassView';

export interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  onSubmit?: () => void;
  onClear?: () => void;
  isLoading?: boolean;
  autoFocus?: boolean;
  className?: string;
  onFilter?: () => void;
  hasActiveFilters?: boolean;
  glass?: boolean;
  /** Handler for view toggle button */
  onViewToggle?: () => void;
  /** Current view mode for toggle icon display */
  viewMode?: 'list' | 'card';
}

const sizeConfig = {
  sm: {
    iconSize: 16,
    textClass: 'text-sm',
    paddingClass: 'px-3 py-1.5',
  },
  md: {
    iconSize: 18,
    textClass: 'text-base',
    paddingClass: 'px-3 py-2.5',
  },
  lg: {
    iconSize: 20,
    textClass: 'text-base',
    paddingClass: 'px-4 py-3',
  },
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
  size = 'md',
  onSubmit,
  onClear,
  isLoading = false,
  autoFocus = false,
  className,
  onFilter,
  hasActiveFilters = false,
  glass = false,
  onViewToggle,
  viewMode,
}: SearchBarProps) {
  const colors = useThemeColors();
  const config = sizeConfig[size];

  const handleClear = () => {
    if (onClear) {
      onClear();
    } else {
      onChangeText('');
    }
  };

  const searchBarContent = (
    <View
      className={cn(
        'flex-row items-center rounded-full',
        config.paddingClass,
        className
      )}
      style={{
        backgroundColor: glass ? 'transparent' : colors.muted,
        borderRadius: 9999
      }}
    >
      <Search size={config.iconSize} color={colors.mutedForeground} />
      <TextInput
        className={cn('flex-1 ml-2', config.textClass)}
        style={{ color: colors.foreground }}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        returnKeyType={onSubmit ? 'search' : 'default'}
        autoCapitalize="none"
        autoCorrect={false}
        autoFocus={autoFocus}
      />
      {isLoading ? (
        <ActivityIndicator size="small" color={colors.mutedForeground} />
      ) : (
        value.length > 0 && (
          <TouchableOpacity onPress={handleClear} className="p-1">
            <X size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )
      )}
      {onViewToggle && (
        <TouchableOpacity
          onPress={onViewToggle}
          className="ml-2 w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: colors.muted }}
          accessibilityLabel={`Switch to ${viewMode === 'card' ? 'list' : 'card'} view`}
        >
          {viewMode === 'card' ? (
            <List size={16} color={colors.foreground} />
          ) : (
            <LayoutGrid size={16} color={colors.foreground} />
          )}
        </TouchableOpacity>
      )}
      {onFilter && (
        <TouchableOpacity
          onPress={onFilter}
          className="ml-2 w-9 h-9 rounded-full items-center justify-center"
          style={{ backgroundColor: hasActiveFilters ? colors.primary : colors.muted }}
        >
          <SlidersHorizontal
            size={16}
            color={hasActiveFilters ? colors.primaryForeground : colors.mutedForeground}
          />
          {hasActiveFilters && (
            <View
              className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
              style={{ backgroundColor: colors.destructive }}
            />
          )}
        </TouchableOpacity>
      )}
    </View>
  );

  if (glass) {
    return (
      <GlassView
        intensity={GLASS_INTENSITY.light}
        effect="regular"
        className={cn('rounded-full', config.paddingClass)}
        style={{ borderRadius: 9999 }}
      >
        {searchBarContent}
      </GlassView>
    );
  }

  return searchBarContent;
}

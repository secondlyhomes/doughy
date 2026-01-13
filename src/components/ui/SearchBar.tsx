// src/components/ui/SearchBar.tsx
// Reusable search bar component with consistent styling
import React from 'react';
import { View, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';

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

  return (
    <View
      className={cn(
        'flex-row items-center rounded-md',
        config.paddingClass,
        className
      )}
      style={{ backgroundColor: colors.muted }}
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
    </View>
  );
}

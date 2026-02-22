// Add Lead Screen - Tags Input
// Tag input field with add button and removable tag chips

import React from 'react';
import { View, Text, TextInput, TouchableOpacity } from 'react-native';
import { Tag, X } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';

interface LeadTagsInputProps {
  tags: string[] | undefined;
  tagInput: string;
  onTagInputChange: (text: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
}

export function LeadTagsInput({
  tags,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
}: LeadTagsInputProps) {
  const colors = useThemeColors();

  return (
    <View className="mb-4">
      <Text className="text-sm font-medium mb-2" style={{ color: colors.foreground }}>Tags</Text>
      <View className="flex-row items-center rounded-lg px-3 py-2" style={{ backgroundColor: colors.muted }}>
        <Tag size={18} color={colors.mutedForeground} />
        <TextInput
          className="flex-1 ml-3 text-base"
          style={{ color: colors.foreground }}
          placeholder="Add a tag"
          placeholderTextColor={colors.mutedForeground}
          value={tagInput}
          onChangeText={onTagInputChange}
          onSubmitEditing={onAddTag}
          returnKeyType="done"
        />
        <TouchableOpacity
          className="px-3 py-1.5 rounded-md"
          style={{ backgroundColor: colors.primary }}
          onPress={onAddTag}
        >
          <Text className="text-sm font-medium" style={{ color: colors.primaryForeground }}>Add</Text>
        </TouchableOpacity>
      </View>

      {tags && tags.length > 0 && (
        <View className="flex-row flex-wrap gap-2 mt-2">
          {tags.map((tag, index) => (
            <View
              key={index}
              className="flex-row items-center px-3 py-1.5 rounded-full"
              style={{ backgroundColor: colors.secondary }}
            >
              <Text className="text-sm" style={{ color: colors.mutedForeground }}>{tag}</Text>
              <TouchableOpacity
                className="ml-2"
                onPress={() => onRemoveTag(tag)}
              >
                <X size={14} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

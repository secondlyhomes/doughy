// src/features/real-estate/components/DocumentItem.tsx
// Single document row for PropertyDocsTab

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Download, Trash2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { Button } from '@/components/ui';
import { ICON_SIZES } from '@/constants/design-tokens';
import { Document } from '../types';
import { formatDate } from '../utils/formatters';
import { getDocIcon } from './property-docs-constants';

interface DocumentItemProps {
  doc: Document;
  isDeletingDoc: boolean;
  onView: (doc: Document) => void;
  onDelete: (doc: Document) => void;
}

export function DocumentItem({ doc, isDeletingDoc, onView, onDelete }: DocumentItemProps) {
  const colors = useThemeColors();
  const Icon = getDocIcon(doc.type || doc.category || 'other');

  return (
    <View
      key={doc.id}
      className="rounded-xl p-4 mb-2"
      style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}
    >
      <View className="flex-row items-center justify-between">
        <TouchableOpacity
          onPress={() => onView(doc)}
          className="flex-row items-center flex-1"
        >
          <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: colors.muted }}>
            <Icon size={ICON_SIZES.lg} color={colors.primary} />
          </View>
          <View className="flex-1">
            <Text className="font-medium" numberOfLines={1} style={{ color: colors.foreground }}>
              {doc.title || doc.name || 'Untitled Document'}
            </Text>
            <View className="flex-row items-center mt-1 flex-wrap">
              <Text className="text-xs capitalize" style={{ color: colors.mutedForeground }}>
                {doc.type || doc.category || 'other'}
              </Text>
              {doc.created_at && (
                <>
                  <Text className="text-xs mx-1" style={{ color: colors.mutedForeground }}>•</Text>
                  <Text className="text-xs" style={{ color: colors.mutedForeground }}>
                    {formatDate(doc.created_at)}
                  </Text>
                </>
              )}
            </View>
            {doc.description && (
              <Text className="text-xs mt-1" numberOfLines={1} style={{ color: colors.mutedForeground }}>
                {doc.description}
              </Text>
            )}
          </View>
        </TouchableOpacity>

        <View className="flex-row gap-2 ml-2">
          <TouchableOpacity
            onPress={() => onView(doc)}
            className="p-2 rounded-lg"
            style={{ backgroundColor: colors.muted }}
          >
            <Download size={ICON_SIZES.md} color={colors.mutedForeground} />
          </TouchableOpacity>
          <Button
            variant="ghost"
            size="icon"
            onPress={() => onDelete(doc)}
            disabled={isDeletingDoc}
            loading={isDeletingDoc}
            style={{ backgroundColor: withOpacity(colors.destructive, 'muted') }}
          >
            {!isDeletingDoc && <Trash2 size={ICON_SIZES.md} color={colors.destructive} />}
          </Button>
        </View>
      </View>
    </View>
  );
}

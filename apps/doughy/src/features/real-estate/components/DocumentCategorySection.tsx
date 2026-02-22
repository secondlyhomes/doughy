// src/features/real-estate/components/DocumentCategorySection.tsx
// Collapsible category section for grouped documents

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronRight } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { ICON_SIZES } from '@/constants/design-tokens';
import { Document } from '../types';
import { DocumentCategory } from '../hooks/usePropertyDocuments';
import { getDocIcon } from './property-docs-constants';
import { DocumentItem } from './DocumentItem';

interface DocumentCategorySectionProps {
  categoryId: DocumentCategory;
  categoryLabel: string;
  documents: Document[];
  isExpanded: boolean;
  deletingId: string | null;
  onToggle: (category: DocumentCategory) => void;
  onViewDocument: (doc: Document) => void;
  onDeleteDocument: (doc: Document) => void;
}

export function DocumentCategorySection({
  categoryId,
  categoryLabel,
  documents,
  isExpanded,
  deletingId,
  onToggle,
  onViewDocument,
  onDeleteDocument,
}: DocumentCategorySectionProps) {
  const colors = useThemeColors();
  const Icon = getDocIcon(categoryId);
  const ChevronIcon = isExpanded ? ChevronDown : ChevronRight;

  return (
    <View className="rounded-xl overflow-hidden" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
      {/* Category Header */}
      <TouchableOpacity
        onPress={() => onToggle(categoryId)}
        className="flex-row items-center justify-between p-4"
      >
        <View className="flex-row items-center">
          <View className="rounded-lg p-2 mr-3" style={{ backgroundColor: colors.muted }}>
            <Icon size={ICON_SIZES.lg} color={colors.primary} />
          </View>
          <Text className="font-medium" style={{ color: colors.foreground }}>{categoryLabel}</Text>
          <View className="px-2 py-0.5 rounded-full ml-2" style={{ backgroundColor: withOpacity(colors.primary, 'muted') }}>
            <Text className="text-xs font-medium" style={{ color: colors.primary }}>{documents.length}</Text>
          </View>
        </View>
        <ChevronIcon size={ICON_SIZES.lg} color={colors.mutedForeground} />
      </TouchableOpacity>

      {/* Category Documents */}
      {isExpanded && (
        <View className="px-4 pb-4">
          {documents.map((doc) => (
            <DocumentItem
              key={doc.id}
              doc={doc}
              isDeletingDoc={deletingId === doc.id}
              onView={onViewDocument}
              onDelete={onDeleteDocument}
            />
          ))}
        </View>
      )}
    </View>
  );
}

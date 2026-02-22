// src/features/real-estate/components/DocsEmptyState.tsx
// Empty state for PropertyDocsTab when no documents exist

import React from 'react';
import { View, Text } from 'react-native';
import { FileText, Upload } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui';
import { ICON_SIZES } from '@/constants/design-tokens';
import { DOCUMENT_CATEGORIES } from '../hooks/usePropertyDocuments';
import { getDocIcon } from './property-docs-constants';

interface DocsEmptyStateProps {
  onUpload: () => void;
}

export function DocsEmptyState({ onUpload }: DocsEmptyStateProps) {
  const colors = useThemeColors();

  return (
    <>
      <View className="flex-1 items-center justify-center py-12 rounded-xl" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <View className="rounded-full p-4 mb-4" style={{ backgroundColor: colors.muted }}>
          <FileText size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
        </View>
        <Text className="text-lg font-semibold mb-2" style={{ color: colors.foreground }}>No Documents</Text>
        <Text className="text-center px-8 mb-4" style={{ color: colors.mutedForeground }}>
          Upload contracts, inspections, appraisals, and other documents related to this
          property.
        </Text>
        <Button variant="secondary" onPress={onUpload}>
          <Upload size={ICON_SIZES.md} color={colors.foreground} />
          Upload First Document
        </Button>
      </View>

      {/* Document Types Quick Info */}
      <View className="rounded-xl p-4" style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border }}>
        <Text className="text-sm font-medium mb-3" style={{ color: colors.foreground }}>
          Supported Document Types
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {DOCUMENT_CATEGORIES.map((docType) => {
            const Icon = getDocIcon(docType.id);
            return (
              <View
                key={docType.id}
                className="flex-row items-center px-3 py-2 rounded-lg"
                style={{ backgroundColor: colors.muted }}
              >
                <Icon size={ICON_SIZES.sm} color={colors.mutedForeground} />
                <Text className="text-sm ml-2" style={{ color: colors.foreground }}>{docType.label}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </>
  );
}

/**
 * DocumentCardCompact Component
 * Compact variant of DocumentCard for list views.
 */

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { withOpacity } from '@/lib/design-utils';
import { SPACING, BORDER_RADIUS, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import { DocumentCardProps } from '@/components/ui/document-card-types';
import { getDocumentTypeIcon, getDocumentTypeLabel, formatDate } from '@/components/ui/document-card-helpers';

export function DocumentCardCompact({
  document,
  showLinkBadge = false,
  linkedPropertiesCount = 0,
  onPress,
  style,
}: Pick<DocumentCardProps, 'document' | 'showLinkBadge' | 'linkedPropertiesCount' | 'style'> & {
  onPress?: () => void;
}) {
  const colors = useThemeColors();
  const DocIcon = getDocumentTypeIcon(document.type);
  const typeLabel = getDocumentTypeLabel(document.type);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={PRESS_OPACITY.DEFAULT}
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          padding: SPACING.md,
          borderRadius: BORDER_RADIUS.lg,
          backgroundColor: colors.card,
          borderWidth: 1,
          borderColor: colors.border,
        },
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`Document: ${document.title}`}
    >
      {/* Icon */}
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: BORDER_RADIUS.md,
          backgroundColor: withOpacity(colors.primary, 'muted'),
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: SPACING.md,
        }}
      >
        <DocIcon size={ICON_SIZES.lg} color={colors.primary} />
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 14,
            fontWeight: '600',
            color: colors.foreground,
            marginBottom: SPACING.xxs,
          }}
          numberOfLines={1}
        >
          {document.title}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: SPACING.xs }}>
          <Text
            style={{
              fontSize: 12,
              color: colors.mutedForeground,
            }}
          >
            {typeLabel}
          </Text>
          {showLinkBadge && linkedPropertiesCount > 1 && (
            <>
              <Text style={{ color: colors.mutedForeground }}>•</Text>
              <Text
                style={{
                  fontSize: 12,
                  color: colors.info,
                }}
              >
                {linkedPropertiesCount} properties
              </Text>
            </>
          )}
        </View>
      </View>

      {/* Date */}
      <Text
        style={{
          fontSize: 12,
          color: colors.mutedForeground,
          marginLeft: SPACING.sm,
        }}
      >
        {formatDate(document.created_at)}
      </Text>
    </TouchableOpacity>
  );
}

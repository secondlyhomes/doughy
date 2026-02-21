// src/features/guest-communication/components/TemplateCard.tsx
// Card component for displaying a guest message template

import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Trash2, Edit2 } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { Card, Badge, Button } from '@/components/ui';
import { FONT_SIZES } from '@/constants/design-tokens';
import {
  GuestMessageTemplate,
  TEMPLATE_TYPE_CONFIG,
} from '../types';

export interface TemplateCardProps {
  template: GuestMessageTemplate;
  onEdit: (template: GuestMessageTemplate) => void;
  onDelete: (template: GuestMessageTemplate) => void;
  onToggleActive: (template: GuestMessageTemplate) => void;
}

export function TemplateCard({
  template,
  onEdit,
  onDelete,
  onToggleActive,
}: TemplateCardProps) {
  const colors = useThemeColors();
  const config = TEMPLATE_TYPE_CONFIG[template.type];

  return (
    <Card className="mb-3 mx-4">
      <View className="flex-row items-start justify-between">
        <View className="flex-row items-center gap-3 flex-1">
          <View
            className="w-10 h-10 rounded-full items-center justify-center"
            style={{ backgroundColor: colors.muted }}
          >
            <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
          </View>
          <View className="flex-1">
            <View className="flex-row items-center gap-2">
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: FONT_SIZES.base,
                  fontWeight: '600',
                }}
                numberOfLines={1}
              >
                {template.name}
              </Text>
              <Badge
                variant={template.channel === 'sms' ? 'default' : 'secondary'}
                size="sm"
              >
                {template.channel.toUpperCase()}
              </Badge>
            </View>
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: FONT_SIZES.xs,
                marginTop: 2,
              }}
            >
              {config.label}
            </Text>
          </View>
        </View>

        <Switch
          value={template.is_active}
          onValueChange={() => onToggleActive(template)}
          trackColor={{ false: colors.muted, true: colors.primary }}
          thumbColor={colors.card}
        />
      </View>

      {/* Preview */}
      <View
        className="mt-3 p-3 rounded-lg"
        style={{ backgroundColor: colors.muted }}
      >
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: FONT_SIZES.xs,
          }}
          numberOfLines={3}
        >
          {template.body.substring(0, 150)}
          {template.body.length > 150 ? '...' : ''}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row gap-2 mt-3">
        <Button
          variant="outline"
          onPress={() => onEdit(template)}
          className="flex-1 flex-row items-center justify-center gap-2"
        >
          <Edit2 size={14} color={colors.foreground} />
          <Text style={{ color: colors.foreground }}>Edit</Text>
        </Button>
        <Button
          variant="destructive"
          onPress={() => onDelete(template)}
          className="px-4"
        >
          <Trash2 size={14} color="white" />
        </Button>
      </View>
    </Card>
  );
}

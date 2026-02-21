// src/features/guest-communication/components/TemplateListView.tsx
// Template selection list for GuestMessageSheet

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Send, Mail, MessageSquare, FileText } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import {
  BottomSheetSection,
  LoadingSpinner,
  Badge,
} from '@/components/ui';
import { FONT_SIZES, ICON_SIZES, PRESS_OPACITY } from '@/constants/design-tokens';
import {
  GuestMessageTemplate,
  TEMPLATE_TYPE_CONFIG,
} from '../types';

export interface TemplateListViewProps {
  isLoading: boolean;
  templates: GuestMessageTemplate[];
  onSelectTemplate: (template: GuestMessageTemplate) => void;
  onWriteCustom: () => void;
}

export function TemplateListView({
  isLoading,
  templates,
  onSelectTemplate,
  onWriteCustom,
}: TemplateListViewProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Select Template">
      {isLoading ? (
        <LoadingSpinner size="small" />
      ) : templates.length === 0 ? (
        <View
          className="py-6 items-center rounded-xl"
          style={{ backgroundColor: colors.muted }}
        >
          <FileText size={ICON_SIZES['2xl']} color={colors.mutedForeground} />
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: FONT_SIZES.sm,
              marginTop: 8,
              textAlign: 'center',
            }}
          >
            No templates yet.{'\n'}Create templates in Settings.
          </Text>
        </View>
      ) : (
        <View className="gap-2">
          {templates.map((template) => {
            const config = TEMPLATE_TYPE_CONFIG[template.type];
            return (
              <TouchableOpacity
                key={template.id}
                onPress={() => onSelectTemplate(template)}
                className="p-3 rounded-xl flex-row items-center"
                style={{ backgroundColor: colors.muted }}
                activeOpacity={PRESS_OPACITY.DEFAULT}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center mr-3"
                  style={{ backgroundColor: colors.card }}
                >
                  <Text style={{ fontSize: 18 }}>{config.emoji}</Text>
                </View>
                <View className="flex-1">
                  <Text
                    style={{
                      color: colors.foreground,
                      fontSize: FONT_SIZES.base,
                      fontWeight: '500',
                    }}
                  >
                    {template.name}
                  </Text>
                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: FONT_SIZES.xs,
                    }}
                    numberOfLines={1}
                  >
                    {config.label} • {template.channel.toUpperCase()}
                  </Text>
                </View>
                <Badge
                  variant={template.channel === 'sms' ? 'default' : 'secondary'}
                  size="sm"
                >
                  {template.channel === 'sms' ? (
                    <MessageSquare size={ICON_SIZES.xs} color={colors.primaryForeground} />
                  ) : (
                    <Mail size={ICON_SIZES.xs} color={colors.foreground} />
                  )}
                </Badge>
              </TouchableOpacity>
            );
          })}

          {/* Custom message option */}
          <TouchableOpacity
            onPress={onWriteCustom}
            className="p-3 rounded-xl flex-row items-center"
            style={{
              backgroundColor: colors.muted,
              borderWidth: 1,
              borderColor: colors.border,
              borderStyle: 'dashed',
            }}
            activeOpacity={PRESS_OPACITY.DEFAULT}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: colors.card }}
            >
              <Send size={ICON_SIZES.ml} color={colors.primary} />
            </View>
            <Text
              style={{
                color: colors.foreground,
                fontSize: FONT_SIZES.base,
                fontWeight: '500',
              }}
            >
              Write Custom Message
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </BottomSheetSection>
  );
}

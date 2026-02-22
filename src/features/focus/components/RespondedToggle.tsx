// src/features/focus/components/RespondedToggle.tsx
// Yes/No toggle for "Did they engage?" section

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { BottomSheetSection } from '@/components/ui';
import { SPACING, BORDER_RADIUS, ICON_SIZES, FONT_SIZES } from '@/constants/design-tokens';

interface RespondedToggleProps {
  responded: boolean;
  onToggle: (value: boolean) => void;
}

export function RespondedToggle({ responded, onToggle }: RespondedToggleProps) {
  const colors = useThemeColors();

  return (
    <BottomSheetSection title="Did they engage?">
      <View style={{ flexDirection: 'row', gap: SPACING.sm }}>
        <TouchableOpacity
          onPress={() => onToggle(true)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            paddingVertical: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: responded ? colors.success : colors.muted,
            borderWidth: 1,
            borderColor: responded ? colors.success : colors.border,
          }}
        >
          <CheckCircle2
            size={ICON_SIZES.sm}
            color={responded ? colors.primaryForeground : colors.foreground}
          />
          <Text
            style={{
              fontSize: FONT_SIZES.sm,
              fontWeight: '600',
              color: responded ? colors.primaryForeground : colors.foreground,
            }}
          >
            Yes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => onToggle(false)}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center',
            gap: SPACING.xs,
            paddingVertical: SPACING.md,
            borderRadius: BORDER_RADIUS.md,
            backgroundColor: !responded ? colors.destructive : colors.muted,
            borderWidth: 1,
            borderColor: !responded ? colors.destructive : colors.border,
          }}
        >
          <XCircle
            size={ICON_SIZES.sm}
            color={!responded ? colors.destructiveForeground : colors.foreground}
          />
          <Text
            style={{
              fontSize: FONT_SIZES.sm,
              fontWeight: '600',
              color: !responded ? colors.destructiveForeground : colors.foreground,
            }}
          >
            No
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheetSection>
  );
}

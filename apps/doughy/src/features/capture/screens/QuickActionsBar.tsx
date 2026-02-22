// src/features/capture/screens/QuickActionsBar.tsx
// Horizontal scrollable bar of capture quick actions

import React from 'react';
import { View, ScrollView } from 'react-native';
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS } from '@/constants/design-tokens';
import { getShadowStyle } from '@/lib/design-utils';
import {
  Mic,
  Phone,
  MessageSquare,
  Upload,
  Camera,
  StickyNote,
} from 'lucide-react-native';

import { CaptureAction } from './CaptureAction';

interface QuickActionsBarProps {
  onRecord: () => void;
  onLogCall: () => void;
  onLogText: () => void;
  onUpload: () => void;
  onPhoto: () => void;
  onNote: () => void;
}

export function QuickActionsBar({
  onRecord,
  onLogCall,
  onLogText,
  onUpload,
  onPhoto,
  onNote,
}: QuickActionsBarProps) {
  const colors = useThemeColors();

  return (
    <View style={{
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.md
    }}>
      <View
        style={{
          backgroundColor: colors.card,
          borderRadius: BORDER_RADIUS.xl,
          padding: SPACING.md,
          ...getShadowStyle(colors, { size: 'sm' }),
        }}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            gap: SPACING.lg,
            paddingHorizontal: SPACING.sm,
          }}
        >
          <CaptureAction
            icon={Mic}
            label="Record"
            color={colors.destructive}
            onPress={onRecord}
          />
          <CaptureAction
            icon={Phone}
            label="Log Call"
            color={colors.info}
            onPress={onLogCall}
          />
          <CaptureAction
            icon={MessageSquare}
            label="Log Text"
            color={colors.success}
            onPress={onLogText}
          />
          <CaptureAction
            icon={Upload}
            label="Upload"
            color={colors.primary}
            onPress={onUpload}
          />
          <CaptureAction
            icon={Camera}
            label="Photo"
            color={colors.warning}
            onPress={onPhoto}
          />
          <CaptureAction
            icon={StickyNote}
            label="Note"
            color={colors.mutedForeground}
            onPress={onNote}
          />
        </ScrollView>
      </View>
    </View>
  );
}

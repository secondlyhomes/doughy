// src/components/ui/BottomSheet.tsx
// React Native Bottom Sheet component with NativeWind styling and glass effects
import React from 'react';
import {
  Modal as RNModal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StyleSheet,
  useColorScheme,
} from 'react-native';
import { X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { cn } from '@/lib/utils';
import { useThemeColors } from '@/context/ThemeContext';
import { SPACING } from '@/constants/design-tokens';
import { GlassBackdrop, GlassView } from './GlassView';
import { getBackdropColor } from '@/lib/design-utils';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  closeOnBackdropPress?: boolean;
  title?: string;
  maxHeight?: number | 'auto';
  /** Snap points as percentage strings (e.g., ['50%', '85%']). First value is used for maxHeight. */
  snapPoints?: string[];
  /** Use glass effect for the sheet content. Default: true */
  useGlass?: boolean;
  /** Use glass blur effect for backdrop. Default: true */
  useGlassBackdrop?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  closeOnBackdropPress = true,
  title,
  maxHeight = SCREEN_HEIGHT * 0.7,
  snapPoints,
  useGlass = true,
  useGlassBackdrop = true,
}: BottomSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  // Calculate maxHeight from snapPoints if provided
  const calculatedMaxHeight = React.useMemo(() => {
    if (snapPoints && snapPoints.length > 0) {
      const firstPoint = snapPoints[0];
      const percentage = parseInt(firstPoint.replace('%', ''), 10);
      if (!isNaN(percentage)) {
        return SCREEN_HEIGHT * (percentage / 100);
      }
    }
    return maxHeight;
  }, [snapPoints, maxHeight]);

  const sheetContent = (
    <>
      {/* Handle Bar */}
      <View style={bottomSheetStyles.handleContainer}>
        <View style={[bottomSheetStyles.handle, { backgroundColor: colors.mutedForeground }]} />
      </View>

      {/* Header */}
      {title && (
        <View
          style={[bottomSheetStyles.header, { borderBottomColor: colors.border }]}
        >
          <Text style={{ fontSize: 18, fontWeight: '600', color: colors.foreground }}>
            {title}
          </Text>
          <TouchableOpacity
            onPress={onClose}
            style={bottomSheetStyles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <X size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      <ScrollView
        style={bottomSheetStyles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
      >
        {children}
      </ScrollView>
    </>
  );

  const renderSheet = () => {
    const sheetStyle = {
      maxHeight: calculatedMaxHeight === 'auto' ? undefined : calculatedMaxHeight,
    };

    if (useGlass) {
      return (
        <TouchableWithoutFeedback>
          <GlassView
            intensity={80}
            style={[
              bottomSheetStyles.sheet,
              sheetStyle,
              { borderTopColor: colors.border },
            ]}
          >
            {sheetContent}
          </GlassView>
        </TouchableWithoutFeedback>
      );
    }

    return (
      <TouchableWithoutFeedback>
        <View
          style={[
            bottomSheetStyles.sheet,
            sheetStyle,
            {
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          {sheetContent}
        </View>
      </TouchableWithoutFeedback>
    );
  };

  const renderBackdrop = () => {
    const content = (
      <TouchableWithoutFeedback
        onPress={closeOnBackdropPress ? onClose : undefined}
      >
        <View style={bottomSheetStyles.backdropContent}>
          {renderSheet()}
        </View>
      </TouchableWithoutFeedback>
    );

    if (useGlassBackdrop) {
      return (
        <GlassBackdrop intensity={20} style={bottomSheetStyles.backdrop}>
          {content}
        </GlassBackdrop>
      );
    }

    return (
      <View style={[bottomSheetStyles.backdrop, { backgroundColor: getBackdropColor(colorScheme === 'dark') }]}>
        {content}
      </View>
    );
  };

  return (
    <RNModal
      visible={visible}
      onRequestClose={onClose}
      transparent
      animationType="slide"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={bottomSheetStyles.container}
      >
        {renderBackdrop()}
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const bottomSheetStyles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backdrop: {
    flex: 1,
  },
  backdropContent: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
    borderRadius: 20,
  },
  scrollView: {
    paddingHorizontal: 16,
  },
});

// Bottom Sheet Section component for grouping content
export interface BottomSheetSectionProps {
  title?: string;
  children?: React.ReactNode;
  className?: string;
}

export function BottomSheetSection({
  title,
  children,
  className,
}: BottomSheetSectionProps) {
  const colors = useThemeColors();
  return (
    <View className={cn('py-4', className)}>
      {title && (
        <Text
          className="text-sm font-medium mb-3 uppercase tracking-wide"
          style={{ color: colors.mutedForeground }}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  );
}

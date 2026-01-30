// src/components/ui/BottomSheet.tsx
// React Native Bottom Sheet component with NativeWind styling and glass effects
import React, { useEffect, useCallback, useRef } from 'react';
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
import { useThemeColors } from '@/contexts/ThemeContext';
import { SPACING, BORDER_RADIUS, FONT_SIZES } from '@/constants/design-tokens';
import { useKeyboardAvoidance } from '@/hooks/useKeyboardAvoidance';
import { GlassBackdrop, GlassView } from './GlassView';
import { getBackdropColor } from '@/lib/design-utils';
import { haptic } from '@/lib/haptics';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children?: React.ReactNode;
  closeOnBackdropPress?: boolean;
  title?: string;
  /** Subtitle text displayed below the title in the header */
  subtitle?: string;
  maxHeight?: number | 'auto';
  /** Snap points as percentage strings (e.g., ['50%', '85%']). First value is used for maxHeight. */
  snapPoints?: string[];
  /** Use glass effect for the sheet content. Default: true */
  useGlass?: boolean;
  /** Use glass blur effect for backdrop. Default: true */
  useGlassBackdrop?: boolean;
  /** Whether content should be wrapped in ScrollView. Set to false when using FlatList. Default: true */
  scrollable?: boolean;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  closeOnBackdropPress = true,
  title,
  subtitle,
  maxHeight = SCREEN_HEIGHT * 0.7,
  snapPoints,
  useGlass = true,
  useGlassBackdrop = true,
  scrollable = true,
}: BottomSheetProps) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const keyboardProps = useKeyboardAvoidance({
    hasTabBar: false,
    hasNavigationHeader: false,
  });

  // Trigger haptic feedback when sheet opens
  useEffect(() => {
    if (visible) {
      haptic.light();
    }
  }, [visible]);


  // Handle close with haptic feedback
  const handleClose = useCallback(() => {
    haptic.light();
    onClose();
  }, [onClose]);

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
      {(title || subtitle) && (
        <View
          style={[bottomSheetStyles.header, { borderBottomColor: colors.border }]}
        >
          <View style={bottomSheetStyles.headerTitles}>
            {title && (
              <Text style={{ fontSize: FONT_SIZES.lg, fontWeight: '600', color: colors.foreground, textAlign: 'center' }}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={{ fontSize: FONT_SIZES.sm, color: colors.mutedForeground, textAlign: 'center', marginTop: 2 }}>
                {subtitle}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleClose}
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
      {scrollable ? (
        <ScrollView
          ref={scrollViewRef}
          style={bottomSheetStyles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={{ paddingBottom: insets.bottom + SPACING.lg }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[bottomSheetStyles.nonScrollContent, { paddingBottom: insets.bottom + SPACING.lg }]}>
          {children}
        </View>
      )}
    </>
  );

  const renderSheet = () => {
    const sheetStyle = {
      maxHeight: calculatedMaxHeight === 'auto' ? undefined : calculatedMaxHeight,
      // When scrollable is false, we need explicit height for flex children to work
      ...(scrollable === false && calculatedMaxHeight !== 'auto' && { height: calculatedMaxHeight }),
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
        onPress={closeOnBackdropPress ? handleClose : undefined}
      >
        <View style={bottomSheetStyles.backdropContent} accessibilityViewIsModal={true}>
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
      onRequestClose={handleClose}
      transparent
      animationType="slide"
    >
      <KeyboardAvoidingView
        behavior={keyboardProps.behavior}
        keyboardVerticalOffset={keyboardProps.keyboardVerticalOffset}
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
    borderTopLeftRadius: BORDER_RADIUS['24'],
    borderTopRightRadius: BORDER_RADIUS['24'],
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    opacity: 0.3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: SPACING['2xl'] + SPACING.sm,
  },
  closeButton: {
    padding: SPACING.sm,
    marginRight: -SPACING.sm,
    borderRadius: BORDER_RADIUS['2xl'],
  },
  scrollView: {
    paddingHorizontal: SPACING.lg,
  },
  nonScrollContent: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
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

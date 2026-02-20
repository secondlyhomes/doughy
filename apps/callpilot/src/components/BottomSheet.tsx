/**
 * BottomSheet Component
 *
 * Adapted from Doughy's BottomSheet for CallPilot's theme system.
 * Supports glass backdrop, snap points, haptic feedback, and scrollable content.
 */

import { useEffect, useCallback, useRef, useMemo, ReactNode } from 'react'
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  StyleSheet,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import * as Haptics from 'expo-haptics'
import { useTheme, useThemeColors } from '@/theme'
import { GlassView } from './GlassView'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')

export interface BottomSheetProps {
  visible: boolean
  onClose: () => void
  children?: ReactNode
  closeOnBackdropPress?: boolean
  title?: string
  subtitle?: string
  maxHeight?: number | 'auto'
  /** Snap points as percentage strings (e.g., ['50%', '85%']). First value is used for maxHeight. */
  snapPoints?: string[]
  /** Use glass effect for the sheet content. Default: true */
  useGlass?: boolean
  /** Whether content should be wrapped in ScrollView. Set to false when using FlatList. Default: true */
  scrollable?: boolean
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
  scrollable = true,
}: BottomSheetProps) {
  const { theme, isDark } = useTheme()
  const colors = useThemeColors()
  const insets = useSafeAreaInsets()
  const scrollViewRef = useRef<ScrollView>(null)

  // Haptic on open
  useEffect(() => {
    if (visible) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    }
  }, [visible])

  const handleClose = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
    onClose()
  }, [onClose])

  // Calculate maxHeight from snapPoints
  const calculatedMaxHeight = useMemo(() => {
    if (snapPoints && snapPoints.length > 0) {
      const percentage = parseInt(snapPoints[0]!.replace('%', ''), 10)
      if (!isNaN(percentage)) {
        return SCREEN_HEIGHT * (percentage / 100)
      }
    }
    return maxHeight
  }, [snapPoints, maxHeight])

  const { spacing, borderRadius: br, fontSize: fs } = theme.tokens

  const sheetContent = (
    <>
      {/* Handle Bar */}
      <View style={styles.handleContainer}>
        <View style={[styles.handle, { backgroundColor: colors.text.tertiary }]} />
      </View>

      {/* Header */}
      {(title || subtitle) && (
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <View style={styles.headerTitles}>
            {title && (
              <Text style={{ fontSize: fs.lg, fontWeight: '600', color: colors.text.primary, textAlign: 'center' }}>
                {title}
              </Text>
            )}
            {subtitle && (
              <Text style={{ fontSize: fs.sm, color: colors.text.secondary, textAlign: 'center', marginTop: 2 }}>
                {subtitle}
              </Text>
            )}
          </View>
          <TouchableOpacity
            onPress={handleClose}
            style={styles.closeButton}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Ionicons name="close" size={20} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Content */}
      {scrollable ? (
        <ScrollView
          ref={scrollViewRef}
          style={{ paddingHorizontal: spacing[4] }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
          contentContainerStyle={{ paddingBottom: insets.bottom + spacing[6] }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={{ flex: 1, paddingHorizontal: spacing[4], paddingBottom: insets.bottom + spacing[6] }}>
          {children}
        </View>
      )}
    </>
  )

  const sheetStyle = {
    maxHeight: calculatedMaxHeight === 'auto' ? undefined : calculatedMaxHeight,
    ...(scrollable === false && calculatedMaxHeight !== 'auto' && { height: calculatedMaxHeight }),
  }

  const renderSheet = () => {
    if (useGlass) {
      return (
        <TouchableWithoutFeedback>
          <GlassView
            intensity="opaque"
            borderRadius={br['3xl']}
            style={{
              ...styles.sheet,
              ...sheetStyle,
              borderTopColor: colors.border,
            } as any}
          >
            {sheetContent}
          </GlassView>
        </TouchableWithoutFeedback>
      )
    }

    return (
      <TouchableWithoutFeedback>
        <View
          style={[
            styles.sheet,
            sheetStyle,
            {
              borderTopLeftRadius: br['3xl'],
              borderTopRightRadius: br['3xl'],
              backgroundColor: colors.background,
              borderTopColor: colors.border,
            },
          ]}
        >
          {sheetContent}
        </View>
      </TouchableWithoutFeedback>
    )
  }

  return (
    <Modal
      visible={visible}
      onRequestClose={handleClose}
      transparent
      animationType="slide"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <TouchableWithoutFeedback
          onPress={closeOnBackdropPress ? handleClose : undefined}
        >
          <View style={[styles.backdrop, { backgroundColor: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)' }]}>
            <View style={styles.backdropContent} accessibilityViewIsModal>
              {renderSheet()}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  )
}

const styles = StyleSheet.create({
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
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderTopWidth: 1,
    overflow: 'hidden',
  },
  handleContainer: {
    alignItems: 'center',
    paddingTop: 16,
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
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitles: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  closeButton: {
    padding: 8,
    marginRight: -8,
    borderRadius: 20,
  },
})

// Bottom Sheet Section component for grouping content
export interface BottomSheetSectionProps {
  title?: string
  children?: ReactNode
}

export function BottomSheetSection({ title, children }: BottomSheetSectionProps) {
  const colors = useThemeColors()
  const { theme } = useTheme()
  return (
    <View style={{ paddingVertical: theme.tokens.spacing[4] }}>
      {title && (
        <Text
          style={{
            fontSize: theme.tokens.fontSize.xs,
            fontWeight: '500',
            color: colors.text.tertiary,
            marginBottom: theme.tokens.spacing[3],
            textTransform: 'uppercase',
            letterSpacing: 0.5,
          }}
        >
          {title}
        </Text>
      )}
      {children}
    </View>
  )
}

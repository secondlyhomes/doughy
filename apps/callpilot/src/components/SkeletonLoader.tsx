/**
 * SkeletonLoader
 *
 * Shimmer placeholder for loading states. Replaces ActivityIndicator spinners.
 * Uses Reanimated for smooth shimmer animation.
 */

import { useEffect } from 'react'
import { View, ViewStyle } from 'react-native'
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated'
import { useTheme } from '@/theme'

interface SkeletonProps {
  width?: number | `${number}%`
  height?: number
  borderRadius?: number
  style?: ViewStyle
}

function SkeletonBox({ width = '100%', height = 16, borderRadius = 8, style }: SkeletonProps) {
  const { theme } = useTheme()
  const opacity = useSharedValue(0.3)

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    )
  }, [opacity])

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }))

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: theme.colors.surfaceSecondary,
        },
        animatedStyle,
        style,
      ]}
    />
  )
}

export function SkeletonContactCard() {
  const { theme } = useTheme()
  return (
    <View style={{
      backgroundColor: theme.colors.surface,
      borderRadius: theme.tokens.borderRadius.lg,
      padding: theme.tokens.spacing[4],
      marginHorizontal: theme.tokens.spacing[4],
      marginBottom: theme.tokens.spacing[2],
      ...theme.tokens.shadows.sm,
    }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: theme.tokens.spacing[2] }}>
          <SkeletonBox width={160} height={18} />
          <SkeletonBox width={120} height={14} />
        </View>
        <SkeletonBox width={48} height={24} borderRadius={12} />
      </View>
      <SkeletonBox width="90%" height={12} style={{ marginTop: theme.tokens.spacing[3] }} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: theme.tokens.spacing[3] }}>
        <SkeletonBox width={100} height={12} />
        <View style={{ flexDirection: 'row', gap: theme.tokens.spacing[3] }}>
          <SkeletonBox width={24} height={24} borderRadius={12} />
          <SkeletonBox width={24} height={24} borderRadius={12} />
        </View>
      </View>
    </View>
  )
}

export function SkeletonContactRow() {
  const { theme } = useTheme()
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.tokens.spacing[4],
      paddingVertical: theme.tokens.spacing[3],
    }}>
      <SkeletonBox width={40} height={40} borderRadius={20} style={{ marginRight: theme.tokens.spacing[3] }} />
      <View style={{ flex: 1, gap: theme.tokens.spacing[1] }}>
        <SkeletonBox width={140} height={16} />
        <SkeletonBox width={100} height={12} />
      </View>
      <SkeletonBox width={50} height={12} />
    </View>
  )
}

export function SkeletonConversationRow() {
  const { theme } = useTheme()
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: theme.tokens.spacing[4],
      paddingVertical: theme.tokens.spacing[3],
    }}>
      <SkeletonBox width={48} height={48} borderRadius={24} style={{ marginRight: theme.tokens.spacing[3] }} />
      <View style={{ flex: 1, gap: theme.tokens.spacing[1] }}>
        <SkeletonBox width={130} height={16} />
        <SkeletonBox width="80%" height={14} />
      </View>
      <View style={{ alignItems: 'flex-end', gap: theme.tokens.spacing[1] }}>
        <SkeletonBox width={40} height={12} />
        <SkeletonBox width={16} height={16} borderRadius={8} />
      </View>
    </View>
  )
}

export function SkeletonSettingsCard() {
  const { theme } = useTheme()
  return (
    <View style={{
      padding: theme.tokens.spacing[4],
      marginHorizontal: theme.tokens.spacing[4],
      gap: theme.tokens.spacing[3],
    }}>
      <SkeletonBox width={180} height={20} />
      <SkeletonBox width={140} height={14} />
    </View>
  )
}

export { SkeletonBox }

/**
 * TrustLevelPicker Component
 *
 * Bottom sheet with 4 TrustLevelOption cards + "Per-action overrides" link.
 * Built with Animated + GestureHandler (no new deps).
 */

import { useRef, useEffect } from 'react'
import { View, Animated, TouchableOpacity, Dimensions, Modal, ScrollView } from 'react-native'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { TrustLevelOption } from './TrustLevelOption'
import { TRUST_LEVEL_ORDER, TRUST_LEVEL_CONFIGS, type TrustLevel } from '@/types'

const SCREEN_HEIGHT = Dimensions.get('window').height

export interface TrustLevelPickerProps {
  visible: boolean
  currentLevel: TrustLevel
  onSelect: (level: TrustLevel) => void
  onOverridesPress: () => void
  onClose: () => void
}

export function TrustLevelPicker({
  visible,
  currentLevel,
  onSelect,
  onOverridesPress,
  onClose,
}: TrustLevelPickerProps) {
  const { theme } = useTheme()
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current
  const backdropAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, ...theme.tokens.springs.snappy, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start()
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: SCREEN_HEIGHT, duration: 250, useNativeDriver: true }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start()
    }
  }, [visible])

  if (!visible) return null

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      {/* Backdrop */}
      <Animated.View
        style={{
          ...{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
          backgroundColor: 'rgba(0,0,0,0.5)',
          opacity: backdropAnim,
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} onPress={onClose} activeOpacity={1} />
      </Animated.View>

      {/* Sheet */}
      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: theme.colors.background,
          borderTopLeftRadius: theme.tokens.borderRadius['2xl'],
          borderTopRightRadius: theme.tokens.borderRadius['2xl'],
          transform: [{ translateY: slideAnim }],
          maxHeight: SCREEN_HEIGHT * 0.8,
        }}
      >
        {/* Handle */}
        <View style={{ alignItems: 'center', paddingTop: theme.tokens.spacing[3] }}>
          <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: theme.colors.neutral[300] }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: theme.tokens.spacing[4], paddingBottom: theme.tokens.spacing[10] }}>
          <Text variant="h3" weight="bold" style={{ marginBottom: theme.tokens.spacing[4] }}>
            Trust Level
          </Text>

          <View style={{ gap: theme.tokens.spacing[3] }}>
            {TRUST_LEVEL_ORDER.map((level) => (
              <TrustLevelOption
                key={level}
                config={TRUST_LEVEL_CONFIGS[level]}
                isSelected={level === currentLevel}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                  onSelect(level)
                }}
              />
            ))}
          </View>

          {/* Per-action overrides link */}
          <TouchableOpacity
            onPress={onOverridesPress}
            style={{ marginTop: theme.tokens.spacing[4], paddingVertical: theme.tokens.spacing[3] }}
          >
            <Text variant="body" color={theme.colors.primary[500]} weight="medium">
              Per-action overrides →
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </Modal>
  )
}

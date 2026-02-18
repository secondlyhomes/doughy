/**
 * PinnedHeader Component
 *
 * Glass header with two layout modes:
 * - Detailed: Trust pill (emoji+label) + kill circle + settings gear, trust bar below
 * - Compact: Trust bar (tappable) with small kill circle + settings gear floated right
 *
 * When killed: red bar, "KILLED" label + Resume button.
 */

import { View, TouchableOpacity, Alert } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { GlassHeader } from '../shared/GlassHeader'
import { Text } from '../Text'
import { TRUST_LEVEL_CONFIGS, type TrustLevel, type HeaderMode } from '@/types'
import { withAlpha } from '@/utils/color'

export interface PinnedHeaderProps {
  trustLevel: TrustLevel
  killSwitchActive: boolean
  killSwitchDegraded?: boolean
  headerMode: HeaderMode
  onTrustBarPress: () => void
  onKillSwitchPress: () => void
  onSettingsPress: () => void
  onHeightChange?: (height: number) => void
}

export function PinnedHeader({
  trustLevel,
  killSwitchActive,
  killSwitchDegraded,
  headerMode,
  onTrustBarPress,
  onKillSwitchPress,
  onSettingsPress,
  onHeightChange,
}: PinnedHeaderProps) {
  const { theme } = useTheme()
  const config = TRUST_LEVEL_CONFIGS[trustLevel]
  const barColor = killSwitchDegraded
    ? theme.colors.warning[500]
    : killSwitchActive
      ? theme.colors.trust.killed
      : config.color

  function handleKillPress() {
    if (killSwitchActive) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
      onKillSwitchPress()
    } else {
      Alert.alert(
        'Kill All Agents?',
        'Nothing will execute until you resume. All pending actions will be paused.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Kill All',
            style: 'destructive',
            onPress: () => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
              onKillSwitchPress()
            },
          },
        ],
      )
    }
  }

  if (headerMode === 'compact') {
    return (
      <GlassHeader onHeightChange={onHeightChange}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: theme.tokens.spacing[4],
            paddingTop: theme.tokens.spacing[1],
            paddingBottom: theme.tokens.spacing[1],
            gap: theme.tokens.spacing[2],
          }}
        >
          {/* Tappable trust bar (fills remaining space) */}
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onTrustBarPress()
            }}
            activeOpacity={0.7}
            style={{ flex: 1, justifyContent: 'center' }}
            accessibilityRole="button"
            accessibilityLabel={`Trust level: ${config.label}. Tap to change.`}
          >
            <View
              style={{
                height: 4,
                backgroundColor: barColor,
                borderRadius: 2,
              }}
            />
          </TouchableOpacity>

          {/* Kill circle (28px) */}
          <TouchableOpacity
            onPress={handleKillPress}
            activeOpacity={0.7}
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: killSwitchDegraded
                ? withAlpha(theme.colors.warning[500], 0.15)
                : killSwitchActive
                  ? withAlpha(theme.colors.success[500], 0.15)
                  : withAlpha(theme.colors.error[500], 0.12),
              alignItems: 'center',
              justifyContent: 'center',
            }}
            accessibilityRole="button"
            accessibilityLabel={killSwitchDegraded ? 'Kill switch status unknown' : killSwitchActive ? 'Resume all agents' : 'Kill all agents'}
          >
            <Ionicons
              name={killSwitchDegraded ? 'warning' : killSwitchActive ? 'play' : 'stop'}
              size={12}
              color={killSwitchDegraded ? theme.colors.warning[500] : killSwitchActive ? theme.colors.success[500] : theme.colors.error[500]}
            />
          </TouchableOpacity>

          {/* Settings gear (20px icon) */}
          <TouchableOpacity
            onPress={onSettingsPress}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Ionicons name="settings-outline" size={20} color={theme.colors.text.secondary} />
          </TouchableOpacity>
        </View>
      </GlassHeader>
    )
  }

  // Detailed mode (default)
  return (
    <GlassHeader onHeightChange={onHeightChange}>
      {/* Row 1: Trust pill + spacer + kill circle + settings gear */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: theme.tokens.spacing[5],
          paddingTop: theme.tokens.spacing[2],
          paddingBottom: theme.tokens.spacing[2],
          gap: theme.tokens.spacing[2],
        }}
      >
        {/* Trust pill (left) */}
        {killSwitchDegraded ? (
          <Text variant="body" weight="bold" color={theme.colors.warning[500]}>
            {'\u26A0'} STATUS UNKNOWN
          </Text>
        ) : killSwitchActive ? (
          <Text variant="body" weight="bold" color={theme.colors.trust.killed}>
            {'\u26D4'} KILLED
          </Text>
        ) : (
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
              onTrustBarPress()
            }}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`Trust level: ${config.label}. Tap to change.`}
          >
            <Text variant="body" weight="bold" color={barColor}>
              {config.emoji} {config.label.toUpperCase()}
            </Text>
          </TouchableOpacity>
        )}

        {/* Spacer */}
        <View style={{ flex: 1 }} />

        {/* Kill circle (36px) */}
        <TouchableOpacity
          onPress={handleKillPress}
          activeOpacity={0.7}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: killSwitchDegraded
              ? withAlpha(theme.colors.warning[500], 0.15)
              : killSwitchActive
                ? withAlpha(theme.colors.success[500], 0.15)
                : withAlpha(theme.colors.error[500], 0.12),
            alignItems: 'center',
            justifyContent: 'center',
          }}
          accessibilityRole="button"
          accessibilityLabel={killSwitchDegraded ? 'Kill switch status unknown' : killSwitchActive ? 'Resume all agents' : 'Kill all agents'}
        >
          <Ionicons
            name={killSwitchDegraded ? 'warning' : killSwitchActive ? 'play' : 'stop'}
            size={16}
            color={killSwitchDegraded ? theme.colors.warning[500] : killSwitchActive ? theme.colors.success[500] : theme.colors.error[500]}
          />
        </TouchableOpacity>

        {/* Settings gear */}
        <TouchableOpacity
          onPress={onSettingsPress}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <Ionicons name="settings-outline" size={22} color={theme.colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Row 2: Trust bar */}
      <View
        style={{
          height: 4,
          backgroundColor: barColor,
          marginHorizontal: theme.tokens.spacing[5],
          borderRadius: 2,
        }}
      />
    </GlassHeader>
  )
}

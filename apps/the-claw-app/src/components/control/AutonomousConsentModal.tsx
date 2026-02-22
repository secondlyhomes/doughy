/**
 * AutonomousConsentModal Component
 *
 * Mandatory consent flow for enabling Autonomous mode.
 * User must scroll through ToS, toggle acceptance, then confirm.
 */

import { useState } from 'react'
import { View, ScrollView, Modal, TouchableOpacity, Platform, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native'
import { BlurView } from 'expo-blur'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Button } from '../Button/Button'
import { Switch } from '../Switch/Switch'
import { LiquidGlass, isLiquidGlassAvailable } from '../../../modules/liquid-glass'

export interface AutonomousConsentModalProps {
  visible: boolean
  onAccept: () => void
  onCancel: () => void
}

const TOS_VERSION = '1.0.0'
const PRIVACY_VERSION = '1.0.0'

export function AutonomousConsentModal({ visible, onAccept, onCancel }: AutonomousConsentModalProps) {
  const { theme, isDark } = useTheme()
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false)
  const [accepted, setAccepted] = useState(false)

  function handleScroll(e: NativeSyntheticEvent<NativeScrollEvent>) {
    const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40
    if (isAtBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true)
    }
  }

  function handleAcceptToggle(value: boolean) {
    setAccepted(value)
    if (value) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    }
  }

  function handleConfirm() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
    onAccept()
    // Reset state for next opening
    setHasScrolledToBottom(false)
    setAccepted(false)
  }

  function handleCancel() {
    onCancel()
    setHasScrolledToBottom(false)
    setAccepted(false)
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleCancel}
    >
      <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
        {/* Glass header */}
        <View style={{ overflow: 'hidden' }}>
          {Platform.OS === 'ios' ? (
            isLiquidGlassAvailable ? (
              <LiquidGlass style={StyleSheet.absoluteFill} />
            ) : (
              <BlurView
                intensity={80}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
            )
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: theme.colors.surface }]} />
          )}
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: theme.tokens.spacing[4],
            }}
          >
            <Text variant="h3">Enable Autonomous Mode</Text>
            <TouchableOpacity onPress={handleCancel} accessibilityRole="button" accessibilityLabel="Cancel">
              <Text variant="body" color={theme.colors.text.tertiary}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Warning */}
        <View
          style={{
            margin: theme.tokens.spacing[4],
            padding: theme.tokens.spacing[4],
            borderRadius: theme.tokens.borderRadius.lg,
            backgroundColor: theme.colors.error[50],
            borderWidth: 1,
            borderColor: theme.colors.error[300],
          }}
        >
          <Text variant="body" weight="bold" color={theme.colors.error[700]} style={{ marginBottom: theme.tokens.spacing[2] }}>
            Important: Read Before Enabling
          </Text>
          <Text variant="bodySmall" color={theme.colors.error[700]}>
            In Autonomous mode, your AI agent will act without asking for approval.
            This means it will send emails, merge PRs, create events, post messages,
            and take other actions on your behalf automatically.
          </Text>
          <Text variant="bodySmall" color={theme.colors.error[700]} weight="semibold" style={{ marginTop: theme.tokens.spacing[2] }}>
            You are fully responsible for all actions taken in Autonomous mode.
          </Text>
        </View>

        {/* Scrollable Terms */}
        <View style={{ flex: 1, marginHorizontal: theme.tokens.spacing[4] }}>
          <Text variant="bodySmall" weight="semibold" style={{ marginBottom: theme.tokens.spacing[2] }}>
            Terms of Service & Privacy Policy
          </Text>
          <Text variant="caption" color={theme.colors.text.tertiary} style={{ marginBottom: theme.tokens.spacing[2] }}>
            Scroll to the bottom to continue
          </Text>
          <ScrollView
            style={{
              flex: 1,
              borderWidth: 1,
              borderColor: theme.colors.border,
              borderRadius: theme.tokens.borderRadius.md,
              padding: theme.tokens.spacing[3],
            }}
            onScroll={handleScroll}
            scrollEventThrottle={100}
          >
            <Text variant="bodySmall" color={theme.colors.text.secondary}>
              {`AUTONOMOUS MODE TERMS OF SERVICE (v${TOS_VERSION})\n\n` +
              '1. ACCEPTANCE OF TERMS\n' +
              'By enabling Autonomous mode, you agree to these terms and acknowledge that ' +
              'your AI agent will perform actions without individual approval.\n\n' +
              '2. SCOPE OF AUTONOMOUS ACTIONS\n' +
              'In Autonomous mode, the AI agent may:\n' +
              '- Send emails and messages on your behalf\n' +
              '- Create, modify, and delete calendar events\n' +
              '- Create and merge pull requests\n' +
              '- Post to communication channels (Slack, Discord, etc.)\n' +
              '- Create and update tasks and documents\n' +
              '- Any other action enabled by connected integrations\n\n' +
              '3. USER RESPONSIBILITY\n' +
              'You accept full responsibility for all actions taken by the AI agent ' +
              'while Autonomous mode is active. This includes any consequences arising ' +
              'from automated actions such as sent communications, modified code, or ' +
              'created/deleted resources.\n\n' +
              '4. LIMITATIONS\n' +
              'Even in Autonomous mode, certain actions classified as "blocked" tier ' +
              'will still require manual approval. The system maintains safety rails ' +
              'for permanently dangerous operations.\n\n' +
              '5. REVOCATION\n' +
              'You may disable Autonomous mode at any time by selecting a different ' +
              'guard level. This takes effect immediately for future actions. Actions ' +
              'already in progress may complete.\n\n' +
              '6. AUDIT TRAIL\n' +
              'All actions taken in Autonomous mode are recorded in the Activity feed. ' +
              'We recommend reviewing this regularly to monitor agent behavior.\n\n' +
              '7. DATA PRIVACY\n' +
              'Your consent record, including the timestamp and version, is stored ' +
              'locally on your device. Activity logs are maintained for your review.\n\n' +
              `PRIVACY POLICY (v${PRIVACY_VERSION})\n\n` +
              'Autonomous mode consent and activity data are stored locally on your device. ' +
              'No additional data is shared beyond what is already transmitted through ' +
              'your connected integrations.\n\n' +
              'By scrolling to the bottom and enabling the toggle below, you confirm ' +
              'that you have read and understood these terms.'}
            </Text>
          </ScrollView>
        </View>

        {/* Consent toggle + confirm */}
        <View style={{ padding: theme.tokens.spacing[4], gap: theme.tokens.spacing[4] }}>
          <Switch
            value={accepted}
            onValueChange={handleAcceptToggle}
            disabled={!hasScrolledToBottom}
            label="I understand and accept full responsibility"
          />
          <Button
            title="Enable Autonomous Mode"
            variant="primary"
            size="lg"
            onPress={handleConfirm}
            disabled={!accepted || !hasScrolledToBottom}
          />
        </View>
      </View>
    </Modal>
  )
}

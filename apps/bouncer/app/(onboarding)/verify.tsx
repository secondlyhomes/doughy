/**
 * Verify Screen
 *
 * Post-login verification. Shows connection success and routes to main app.
 * Kept for completeness but the connect screen auto-redirects on auth.
 */

import { useRef, useEffect } from 'react'
import { View, ScrollView, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { useOnboarding } from '@/hooks'
import { useConnectionContext } from '@/contexts/ConnectionContext'
import { Text, Button, Card, KeyValueRow } from '@/components'

export default function VerifyScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { isConnected } = useConnectionContext()
  const { completeOnboarding } = useOnboarding()

  // Entrance animation
  const scaleAnim = useRef(new Animated.Value(0.5)).current
  const fadeAnim = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        ...theme.tokens.springs.snappy,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  async function handleCompleteSetup() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    await completeOnboarding()
    router.replace('/(main)')
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: theme.tokens.spacing[6],
          justifyContent: 'center',
        }}
      >
        {/* Success icon */}
        <Animated.View
          style={{
            alignItems: 'center',
            marginBottom: theme.tokens.spacing[6],
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: theme.tokens.borderRadius.full,
              backgroundColor: theme.colors.success[100],
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.tokens.spacing[4],
              ...theme.tokens.shadows.glass,
            }}
          >
            <Ionicons name="checkmark-circle" size={48} color={theme.colors.success[500]} />
          </View>
          <Text variant="h2" align="center">Connected!</Text>
          <Text variant="body" color={theme.colors.text.secondary} align="center" style={{ marginTop: theme.tokens.spacing[2] }}>
            Your AI agent is connected and ready.
          </Text>
        </Animated.View>

        {/* Server info card */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Card variant="outlined" padding="md" style={{ marginBottom: theme.tokens.spacing[8] }}>
            <KeyValueRow label="Mode" value="Live" />
            <KeyValueRow label="Agent" value="The Claw" />
            <KeyValueRow label="Status" value={isConnected ? 'Connected' : 'Connecting...'} />
          </Card>

          <Button
            title="Complete Setup"
            variant="primary"
            size="lg"
            onPress={handleCompleteSetup}
          />
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

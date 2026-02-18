/**
 * Connect Screen
 *
 * Supabase email/password login screen.
 * Same credentials as Doughy — one user, one login, three apps.
 */

import { useState, useRef, useEffect } from 'react'
import { View, ScrollView, Animated, KeyboardAvoidingView, Platform } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { useAuth } from '@/contexts/AuthContext'
import { Text, Button, Input, Card } from '@/components'

export default function ConnectScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { signIn, isAuthenticated, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [connecting, setConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Entrance animation
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(20)).current

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        ...theme.tokens.springs.gentle,
        useNativeDriver: true,
      }),
    ]).start()
  }, [])

  // Navigate to main when authenticated
  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      router.replace('/(main)')
    }
  }, [isAuthenticated, authLoading, router])

  async function handleSignIn() {
    if (!email.trim() || !password.trim()) return
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setConnecting(true)
    setError(null)
    try {
      const result = await signIn(email.trim(), password)
      if (result.error) {
        setError(result.error)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        return
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      // Navigation handled by the useEffect above
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign in failed. Please try again.')
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={{
            flexGrow: 1,
            padding: theme.tokens.spacing[6],
            justifyContent: 'center',
          }}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            }}
          >
            {/* Branding */}
            <View style={{ alignItems: 'center', marginBottom: theme.tokens.spacing[6] }}>
              <View
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: theme.tokens.borderRadius.xl,
                  backgroundColor: theme.colors.primary[500],
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: theme.tokens.spacing[4],
                  ...theme.tokens.shadows.elevated,
                }}
              >
                <Ionicons name="shield-checkmark" size={32} color={theme.colors.neutral[50]} />
              </View>
              <Text variant="h2" align="center" style={{ marginBottom: theme.tokens.spacing[1] }}>
                Sign In
              </Text>
              <Text
                variant="body"
                color={theme.colors.text.secondary}
                align="center"
              >
                Use your Doughy account credentials
              </Text>
            </View>

            {/* Login form */}
            <Card variant="outlined" padding="lg" style={{ marginBottom: theme.tokens.spacing[4] }}>
              <Input
                label="Email"
                placeholder="you@doughy.app"
                value={email}
                onChangeText={(text) => { setEmail(text); setError(null) }}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                returnKeyType="next"
              />

              <Input
                label="Password"
                placeholder="Your password"
                value={password}
                onChangeText={(text) => { setPassword(text); setError(null) }}
                secureTextEntry
                returnKeyType="go"
                onSubmitEditing={handleSignIn}
              />

              {error && (
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: theme.tokens.spacing[2],
                    padding: theme.tokens.spacing[3],
                    backgroundColor: theme.colors.error[50],
                    borderRadius: theme.tokens.borderRadius.sm,
                    marginBottom: theme.tokens.spacing[3],
                  }}
                >
                  <Ionicons name="alert-circle" size={18} color={theme.colors.error[500]} />
                  <Text
                    variant="bodySmall"
                    color={theme.colors.error[700]}
                    style={{ flex: 1 }}
                  >
                    {error}
                  </Text>
                </View>
              )}

              <Button
                title="Sign In"
                variant="primary"
                size="lg"
                onPress={handleSignIn}
                disabled={!email.trim() || !password.trim() || connecting}
                loading={connecting}
              />
            </Card>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

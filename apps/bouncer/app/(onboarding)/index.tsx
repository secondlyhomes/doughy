/**
 * Welcome Screen
 *
 * Premium onboarding with value props. Sign-in CTA.
 * Animated entrance with brand icon and feature highlights.
 */

import { useRef, useEffect } from 'react'
import { View, ScrollView, Animated } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text, Button } from '@/components'

function FeatureRow({ icon, text, theme, delay }: { icon: string; text: string; theme: any; delay: number }) {
  const fadeAnim = useRef(new Animated.Value(0)).current
  const slideAnim = useRef(new Animated.Value(12)).current

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.spring(slideAnim, { toValue: 0, ...theme.tokens.springs.gentle, useNativeDriver: true }),
      ]).start()
    }, delay)
    return () => clearTimeout(timer)
  }, [])

  return (
    <Animated.View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.tokens.spacing[3],
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
    >
      <View
        style={{
          width: 36,
          height: 36,
          borderRadius: theme.tokens.borderRadius.sm,
          backgroundColor: theme.colors.primary[50],
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={icon as any} size={18} color={theme.colors.primary[500]} />
      </View>
      <Text variant="body" color={theme.colors.text.secondary} style={{ flex: 1 }}>
        {text}
      </Text>
    </Animated.View>
  )
}

export default function WelcomeScreen() {
  const { theme } = useTheme()
  const router = useRouter()

  // Entrance animation
  const heroFade = useRef(new Animated.Value(0)).current
  const heroSlide = useRef(new Animated.Value(30)).current
  const ctaFade = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.timing(heroFade, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.spring(heroSlide, { toValue: 0, ...theme.tokens.springs.gentle, useNativeDriver: true }),
      ]),
      Animated.timing(ctaFade, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start()
  }, [])

  function handleSignIn() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    router.push('/(onboarding)/connect')
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
        {/* Hero */}
        <Animated.View
          style={{
            alignItems: 'center',
            marginBottom: theme.tokens.spacing[8],
            opacity: heroFade,
            transform: [{ translateY: heroSlide }],
          }}
        >
          {/* Brand icon */}
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: theme.tokens.borderRadius['2xl'],
              backgroundColor: theme.colors.primary[500],
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: theme.tokens.spacing[5],
              ...theme.tokens.shadows.elevated,
            }}
          >
            <Ionicons name="shield-checkmark" size={40} color={theme.colors.neutral[50]} />
          </View>

          <Text variant="h1" align="center" style={{ fontSize: 44, marginBottom: theme.tokens.spacing[2] }}>
            The Claw
          </Text>
          <Text
            variant="bodyLarge"
            align="center"
            color={theme.colors.primary[500]}
            weight="semibold"
            style={{ marginBottom: theme.tokens.spacing[6] }}
          >
            Your AI's audit trail.{'\n'}Your rules. Your control.
          </Text>

          {/* Feature highlights */}
          <View style={{ alignSelf: 'stretch', gap: theme.tokens.spacing[3] }}>
            <FeatureRow
              icon="pulse-outline"
              text="See everything your AI has done in real time"
              theme={theme}
              delay={400}
            />
            <FeatureRow
              icon="checkmark-circle-outline"
              text="Approve or reject actions before they execute"
              theme={theme}
              delay={550}
            />
            <FeatureRow
              icon="shield-outline"
              text="Set the autonomy level that feels right for you"
              theme={theme}
              delay={700}
            />
          </View>
        </Animated.View>

        {/* CTA */}
        <Animated.View style={{ opacity: ctaFade }}>
          <Button
            title="Sign In"
            variant="primary"
            size="lg"
            onPress={handleSignIn}
          />
          <Text
            variant="caption"
            color={theme.colors.text.tertiary}
            align="center"
            style={{ marginTop: theme.tokens.spacing[2] }}
          >
            Sign in with your Doughy account to get started.
          </Text>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  )
}

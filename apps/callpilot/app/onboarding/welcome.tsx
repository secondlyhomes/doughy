import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { Text, Button } from '@/components'

const FEATURES = [
  { emoji: '\uD83D\uDCCB', label: 'Pre-call briefs to prepare you for every conversation' },
  { emoji: '\uD83C\uDFA4', label: 'Voice memo analysis that captures key insights' },
  { emoji: '\uD83D\uDD04', label: 'CRM sync to keep your pipeline up to date' },
]

export default function WelcomeScreen() {
  const { theme } = useTheme()
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: theme.tokens.spacing[6] }}>
        {/* Heading */}
        <Text variant="h1" align="center">
          Welcome to CallPilot
        </Text>
        <Text
          variant="bodyLarge"
          color={theme.colors.text.secondary}
          align="center"
          style={{ marginTop: theme.tokens.spacing[3] }}
        >
          Your AI-powered sales call companion
        </Text>

        {/* Feature Bullets */}
        <View style={{ marginTop: theme.tokens.spacing[10], gap: theme.tokens.spacing[5] }}>
          {FEATURES.map((feature, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[4] }}>
              <Text style={{ fontSize: 32 }}>{feature.emoji}</Text>
              <Text variant="body" color={theme.colors.text.secondary} style={{ flex: 1 }}>
                {feature.label}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: theme.tokens.spacing[6], paddingBottom: theme.tokens.spacing[6] }}>
        <Button
          title="Get Started"
          onPress={() => router.push('/onboarding/profile-setup')}
          size="lg"
        />
      </View>
    </SafeAreaView>
  )
}

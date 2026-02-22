import { View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { Text, Button, Card } from '@/components'

const STEPS = [
  { emoji: '\uD83D\uDCCB', text: 'Before a call, check your brief' },
  { emoji: '\uD83C\uDFA4', text: 'After a call, record a quick memo' },
  { emoji: '\u2728', text: "We'll handle the rest" },
]

export default function FirstCallScreen() {
  const { theme } = useTheme()
  const router = useRouter()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, justifyContent: 'center', paddingHorizontal: theme.tokens.spacing[6] }}>
        {/* Heading */}
        <Text variant="h1" align="center">
          You're All Set!
        </Text>
        <Text
          variant="bodyLarge"
          color={theme.colors.text.secondary}
          align="center"
          style={{ marginTop: theme.tokens.spacing[3] }}
        >
          Here's how CallPilot works
        </Text>

        {/* Walkthrough Steps */}
        <Card
          variant="filled"
          padding="lg"
          style={{ marginTop: theme.tokens.spacing[8] }}
        >
          <View style={{ gap: theme.tokens.spacing[5] }}>
            {STEPS.map((step, i) => (
              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[4] }}>
                <Text style={{ fontSize: 28 }}>{step.emoji}</Text>
                <Text variant="body" style={{ flex: 1 }}>{step.text}</Text>
              </View>
            ))}
          </View>
        </Card>
      </View>

      {/* CTA */}
      <View style={{ paddingHorizontal: theme.tokens.spacing[6], paddingBottom: theme.tokens.spacing[6] }}>
        <Button
          title="Start Using CallPilot"
          onPress={() => router.replace('/(tabs)/contacts')}
          size="lg"
        />
      </View>
    </SafeAreaView>
  )
}

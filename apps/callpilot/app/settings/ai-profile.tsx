/**
 * AI Profile Screen
 *
 * View AI communication profile, manage settings, and access questionnaire
 */

import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { Text, Button } from '@/components'
import { AIProfileCard, AISettingsPanel } from '@/components/profile'
import { useAIProfile } from '@/hooks'

export default function AIProfileScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { profile, settings, updateSettings } = useAIProfile()

  if (!profile || !settings) return null

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: theme.tokens.spacing[8] }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
          <Button title="Back" variant="text" size="sm" onPress={() => router.back()} />
        </View>

        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[3] }}>
          <Text variant="h3">AI Communication Profile</Text>
          <Text variant="body" color={theme.colors.text.secondary} style={{ marginTop: theme.tokens.spacing[1] }}>
            How AI understands your communication style
          </Text>
        </View>

        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
          <AIProfileCard profile={profile} />
        </View>

        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
          <AISettingsPanel settings={settings} onUpdateSettings={updateSettings} />
        </View>

        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
          <Button
            title={profile.questionnaire ? 'Update Questionnaire' : 'Take Style Questionnaire'}
            variant="secondary"
            onPress={() => router.push('/settings/questionnaire')}
            size="lg"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

/**
 * Questionnaire Screen
 *
 * Multi-step questionnaire to help AI understand communication style
 */

import { ScrollView } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { QuestionnaireForm } from '@/components/profile'
import { useAIProfile } from '@/hooks'

export default function QuestionnaireScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { submitQuestionnaire } = useAIProfile()

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          paddingHorizontal: theme.tokens.spacing[6],
          paddingTop: theme.tokens.spacing[6],
          paddingBottom: theme.tokens.spacing[8],
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <QuestionnaireForm
          onSubmit={(answers) => {
            submitQuestionnaire(answers)
            router.back()
          }}
          onSkip={() => router.back()}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

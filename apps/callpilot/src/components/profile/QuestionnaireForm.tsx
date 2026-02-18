import { useState } from 'react'
import { View } from 'react-native'
import { useTheme } from '@/theme'
import { Text } from '../Text'
import { Input } from '../Input'
import { Button } from '../Button'
import type { QuestionnaireAnswers } from '@/types'

export interface QuestionnaireFormProps {
  onSubmit: (answers: QuestionnaireAnswers) => void
  onSkip: () => void
}

const QUESTIONS = [
  { key: 'yearsExperience', label: 'Years of Sales Experience', placeholder: 'e.g. 8 years' },
  { key: 'sellingStyle', label: 'How would you describe your selling style?', placeholder: 'e.g. Consultative, relationship-focused' },
  { key: 'biggestChallenge', label: "What's your biggest sales challenge?", placeholder: 'e.g. Closing deals quickly' },
  { key: 'idealCustomer', label: 'Describe your ideal customer', placeholder: 'e.g. Small business owners needing commercial coverage' },
  { key: 'competitiveAdvantage', label: "What sets you apart from competitors?", placeholder: 'e.g. Deep industry expertise and fast claims handling' },
] as const

export function QuestionnaireForm({ onSubmit, onSkip }: QuestionnaireFormProps) {
  const { theme } = useTheme()
  const [answers, setAnswers] = useState<QuestionnaireAnswers>({
    yearsExperience: '',
    sellingStyle: '',
    biggestChallenge: '',
    idealCustomer: '',
    competitiveAdvantage: '',
  })

  const hasAtLeastOne = Object.values(answers).some((v) => v.trim().length > 0)

  function handleChange(key: keyof QuestionnaireAnswers, value: string) {
    setAnswers((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <View style={{ flex: 1 }}>
      <Text variant="h4" style={{ marginBottom: theme.tokens.spacing[2] }}>
        Tell AI About Your Style
      </Text>
      <Text variant="body" color={theme.colors.text.secondary} style={{ marginBottom: theme.tokens.spacing[5] }}>
        Help the AI understand your communication style. Answer what you can — you can always update later.
      </Text>

      {QUESTIONS.map(({ key, label, placeholder }) => (
        <Input
          key={key}
          label={label}
          placeholder={placeholder}
          value={answers[key]}
          onChangeText={(v) => handleChange(key, v)}
          autoCapitalize="sentences"
        />
      ))}

      <View style={{ gap: theme.tokens.spacing[3], marginTop: theme.tokens.spacing[4] }}>
        <Button
          title="Save Answers"
          onPress={() => onSubmit(answers)}
          disabled={!hasAtLeastOne}
          size="lg"
        />
        <Button title="Skip for Now" variant="text" onPress={onSkip} />
      </View>
    </View>
  )
}

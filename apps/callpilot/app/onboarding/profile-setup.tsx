import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { Text, Button, Input } from '@/components'

export default function ProfileSetupScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [whatYouSell, setWhatYouSell] = useState('')

  const isValid = firstName.trim().length > 0 && lastName.trim().length > 0

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
        <Text variant="h2">Set Up Your Profile</Text>
        <Text variant="body" color={theme.colors.text.secondary} style={{ marginTop: theme.tokens.spacing[2] }}>
          Tell us a bit about yourself so we can personalize your experience.
        </Text>

        <View style={{ marginTop: theme.tokens.spacing[6] }}>
          <Input
            label="First Name"
            placeholder="Enter your first name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
          <Input
            label="Last Name"
            placeholder="Enter your last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <Input
            label="Company"
            placeholder="Your company name"
            value={company}
            onChangeText={setCompany}
            autoCapitalize="words"
          />
          <Input
            label="Role"
            placeholder="e.g. Account Executive"
            value={role}
            onChangeText={setRole}
            autoCapitalize="words"
          />
          <Input
            label="What You Sell"
            placeholder="e.g. Commercial Insurance"
            value={whatYouSell}
            onChangeText={setWhatYouSell}
            autoCapitalize="sentences"
          />
        </View>

        <View style={{ flex: 1 }} />

        <Button
          title="Continue"
          onPress={() => router.push('/settings/questionnaire')}
          size="lg"
          disabled={!isValid}
        />
        <Button
          title="Skip AI Setup"
          variant="text"
          onPress={() => router.push('/onboarding/connect-crm')}
          style={{ marginTop: theme.tokens.spacing[2] }}
        />
      </ScrollView>
    </SafeAreaView>
  )
}

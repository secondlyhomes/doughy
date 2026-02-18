/**
 * Profile Edit Screen
 *
 * Editable form: name, company, role, phone.
 */

import { useState } from 'react'
import { ScrollView, View, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useTheme } from '@/theme'
import { Text, Button, Input } from '@/components'
import { useProfile } from '@/hooks'

export default function ProfileEditScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { profile } = useProfile()

  const [firstName, setFirstName] = useState(profile?.firstName ?? '')
  const [lastName, setLastName] = useState(profile?.lastName ?? '')
  const [company, setCompany] = useState(profile?.company ?? '')
  const [role, setRole] = useState(profile?.role ?? '')

  function handleSave() {
    Alert.alert('Profile Updated', 'Your profile has been saved.', [
      { text: 'OK', onPress: () => router.back() },
    ])
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.tokens.spacing[8] }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[2] }}>
          <Button title="Back" variant="text" size="sm" onPress={() => router.back()} />
        </View>

        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[3] }}>
          <Text variant="h2">Edit Profile</Text>
        </View>

        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5], gap: theme.tokens.spacing[4] }}>
          <Input label="First Name" value={firstName} onChangeText={setFirstName} />
          <Input label="Last Name" value={lastName} onChangeText={setLastName} />
          <Input label="Company" value={company} onChangeText={setCompany} />
          <Input label="Role" value={role} onChangeText={setRole} />
        </View>

        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[6] }}>
          <Button title="Save" onPress={handleSave} size="lg" />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

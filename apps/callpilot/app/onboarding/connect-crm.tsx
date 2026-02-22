import { useState } from 'react'
import { View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text, Button, Card, StatusBadge } from '@/components'

export default function ConnectCrmScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const [crmState, setCrmState] = useState<'idle' | 'connecting' | 'connected'>('idle')

  function handleConnect() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
    setCrmState('connecting')
    setTimeout(() => {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
      setCrmState('connected')
    }, 2000)
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <View style={{ flex: 1, paddingHorizontal: theme.tokens.spacing[6], paddingTop: theme.tokens.spacing[6] }}>
        <Text variant="h2">Connect Your CRM</Text>
        <Text variant="body" color={theme.colors.text.secondary} style={{ marginTop: theme.tokens.spacing[2] }}>
          Sync your contacts and call data automatically.
        </Text>

        {/* HubSpot Card */}
        <Card
          variant="outlined"
          padding="lg"
          style={{ marginTop: theme.tokens.spacing[6] }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ flex: 1 }}>
              <Text variant="h4">HubSpot</Text>
              <Text variant="bodySmall" color={theme.colors.text.secondary}>
                Sync contacts, deals, and call logs
              </Text>
            </View>
            {crmState === 'connected' ? (
              <StatusBadge
                label="Connected"
                color={theme.colors.success[700]}
                backgroundColor={theme.colors.success[100]}
                size="md"
              />
            ) : (
              <Button
                title={crmState === 'connecting' ? 'Connecting...' : 'Connect'}
                onPress={handleConnect}
                size="sm"
                loading={crmState === 'connecting'}
                disabled={crmState === 'connecting'}
              />
            )}
          </View>
        </Card>

        {/* Skip */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            router.push('/onboarding/first-call')
          }}
          style={{
            alignSelf: 'center',
            marginTop: theme.tokens.spacing[6],
            minHeight: 48,
            justifyContent: 'center',
          }}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Text variant="body" color={theme.colors.text.tertiary}>
            Skip for Now
          </Text>
        </TouchableOpacity>
      </View>

      {/* Continue */}
      <View style={{ paddingHorizontal: theme.tokens.spacing[6], paddingBottom: theme.tokens.spacing[6] }}>
        <Button
          title="Continue"
          onPress={() => router.push('/onboarding/first-call')}
          size="lg"
        />
      </View>
    </SafeAreaView>
  )
}

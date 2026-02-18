/**
 * Settings Screen
 *
 * iOS Settings-inspired layout with insetGrouped card sections.
 * Each section wrapped in SettingsGroup for rounded rect containment.
 */

import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text } from '@/components'
import { GlassView } from '@/components/GlassView'
import { SkeletonSettingsCard } from '@/components/SkeletonLoader'
import { SettingsRow } from '@/components/settings/SettingsRow'
import { SettingsGroup } from '@/components/settings/SettingsGroup'
import { ThemeSelector } from '@/components/settings/ThemeSelector'
import { CrmConnectionCard } from '@/components/settings/CrmConnectionCard'
import { UsageMeter } from '@/components/settings/UsageMeter'
import { useProfile } from '@/hooks'

function SectionLabel({ children }: { children: React.ReactNode }) {
  const { theme } = useTheme()
  return (
    <View style={{ paddingHorizontal: theme.tokens.spacing[5], marginBottom: theme.tokens.spacing[2] }}>
      <Text variant="caption" weight="semibold" color={theme.colors.text.tertiary} style={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {children}
      </Text>
    </View>
  )
}

function Divider() {
  const { theme } = useTheme()
  return <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: theme.tokens.spacing[4] }} />
}

export default function SettingsScreen() {
  const { theme } = useTheme()
  const router = useRouter()
  const { profile } = useProfile()

  const [draftSuggestions, setDraftSuggestions] = useState(true)
  const [pushToWhatsApp, setPushToWhatsApp] = useState(false)
  const [pushToSMS, setPushToSMS] = useState(false)
  const [pushToDiscord, setPushToDiscord] = useState(true)
  const [autoCheckQuestions, setAutoCheckQuestions] = useState(true)
  const [recordCalls, setRecordCalls] = useState(false)
  const [notifyMessages, setNotifyMessages] = useState(true)
  const [notifyClawSuggestions, setNotifyClawSuggestions] = useState(true)
  const [notifyMissedCalls, setNotifyMissedCalls] = useState(true)

  if (!profile) {
    return (
      <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ paddingTop: theme.tokens.spacing[4] }}>
          <SkeletonSettingsCard />
          <SkeletonSettingsCard />
          <SkeletonSettingsCard />
        </View>
      </SafeAreaView>
    )
  }

  const gap = theme.tokens.spacing[5]

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.tokens.spacing[8] }} showsVerticalScrollIndicator={false}>
        {/* Profile */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[3] }}>
          <GlassView intensity="medium" style={{ padding: theme.tokens.spacing[4] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ flex: 1 }}>
                <Text variant="h4">{profile.firstName} {profile.lastName}</Text>
                <Text variant="bodySmall" color={theme.colors.text.secondary} style={{ marginTop: theme.tokens.spacing[1] }}>{profile.company}</Text>
                <Text variant="caption" color={theme.colors.text.tertiary} style={{ marginTop: 2 }}>Northern Virginia</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.text.tertiary} />
            </View>
          </GlassView>
        </View>

        {/* CRM Connection */}
        <View style={{ marginTop: gap }}>
          <SectionLabel>CRM Connection</SectionLabel>
          <CrmConnectionCard />
        </View>

        {/* Script Templates */}
        <View style={{ marginTop: gap }}>
          <SectionLabel>Script Templates</SectionLabel>
          <SettingsGroup>
            {['Cold Call \u2014 Motivated Seller', 'Follow-Up Call', 'Tenant Screening', 'Creative Finance'].map((label, i) => (
              <View key={label}>
                {i > 0 && <Divider />}
                <SettingsRow label={label} icon="document-text-outline" onPress={() => router.push('/settings/scripts')} />
              </View>
            ))}
          </SettingsGroup>
        </View>

        {/* Claw Integration */}
        <View style={{ marginTop: gap }}>
          <SectionLabel>{'\uD83E\uDD16'} The Claw Integration</SectionLabel>
          <SettingsGroup>
            <SettingsRow label="Draft suggestions" value="Show AI-drafted replies in messages" icon="sparkles-outline" trailing="toggle" toggleValue={draftSuggestions} onToggle={setDraftSuggestions} />
            <Divider />
            <SettingsRow label="Push to WhatsApp" value="Costs per message via Twilio" icon="logo-whatsapp" trailing="toggle" toggleValue={pushToWhatsApp} onToggle={setPushToWhatsApp} />
            <Divider />
            <SettingsRow label="Push to SMS" value="Costs per message via Twilio" icon="chatbubble-outline" trailing="toggle" toggleValue={pushToSMS} onToggle={setPushToSMS} />
            <Divider />
            <SettingsRow label="Push to Discord" value="Free — always recommended" icon="logo-discord" trailing="toggle" toggleValue={pushToDiscord} onToggle={setPushToDiscord} />
          </SettingsGroup>
        </View>

        {/* Calling */}
        <View style={{ marginTop: gap }}>
          <SectionLabel>Calling</SectionLabel>
          <SettingsGroup>
            <SettingsRow label="Default Script" value="Cold Call" icon="document-outline" onPress={() => router.push('/settings/scripts')} />
            <Divider />
            <SettingsRow label="Coaching Mode" value="Balanced" icon="flash-outline" onPress={() => {}} />
            <Divider />
            <SettingsRow label="Auto-check Questions" value="Mark questions as covered during call" icon="checkmark-circle-outline" trailing="toggle" toggleValue={autoCheckQuestions} onToggle={setAutoCheckQuestions} />
            <Divider />
            <SettingsRow label="Record Calls" value="Requires consent in your state" icon="mic-outline" trailing="toggle" toggleValue={recordCalls} onToggle={setRecordCalls} />
          </SettingsGroup>
        </View>

        {/* Notifications */}
        <View style={{ marginTop: gap }}>
          <SectionLabel>Notifications</SectionLabel>
          <SettingsGroup>
            <SettingsRow label="New messages" icon="chatbubble-outline" trailing="toggle" toggleValue={notifyMessages} onToggle={setNotifyMessages} />
            <Divider />
            <SettingsRow label="Claw suggestions" icon="sparkles-outline" trailing="toggle" toggleValue={notifyClawSuggestions} onToggle={setNotifyClawSuggestions} />
            <Divider />
            <SettingsRow label="Missed calls" icon="call-outline" trailing="toggle" toggleValue={notifyMissedCalls} onToggle={setNotifyMissedCalls} />
          </SettingsGroup>
        </View>

        {/* Appearance */}
        <View style={{ marginTop: gap }}>
          <SectionLabel>Appearance</SectionLabel>
          <SettingsGroup>
            <ThemeSelector />
          </SettingsGroup>
        </View>

        {/* Usage */}
        <View style={{ marginTop: gap }}>
          <SectionLabel>Usage</SectionLabel>
          <UsageMeter callsThisMonth={profile.callsThisMonth} callLimit={profile.callLimit} />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

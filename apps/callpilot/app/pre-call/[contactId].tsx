import { ScrollView, View, TouchableOpacity } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { callpilotColors } from '@/theme/callpilotColors'
import { Text, Button, Card, SectionHeader, StatusBadge, GlassView } from '@/components'
import { BriefSection, KeyInsightBadge } from '@/components/briefs'
import { MODULE_ICONS } from '@/types/contact'
import { useBriefs, useContacts } from '@/hooks'

export default function PreCallBriefScreen() {
  const { contactId } = useLocalSearchParams<{ contactId: string }>()
  const { theme } = useTheme()
  const router = useRouter()
  const { getBriefForContact } = useBriefs()
  const { getContact } = useContacts()

  const contact = getContact(contactId ?? '')
  const brief = getBriefForContact(contactId ?? '')
  const moduleIcon = contact ? MODULE_ICONS[contact.module] : ''

  if (!brief) {
    const contactName = contact
      ? `${contact.firstName ?? ''} ${contact.lastName ?? ''}`.trim() || 'this contact'
      : 'this contact'

    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[2], paddingTop: theme.tokens.spacing[1] }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', padding: theme.tokens.spacing[1] }}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: theme.tokens.spacing[6] }}>
          <Text variant="h3" style={{ textAlign: 'center' }}>No Brief Yet</Text>
          <Text variant="body" color={theme.colors.text.secondary} style={{ textAlign: 'center', marginTop: theme.tokens.spacing[2] }}>
            A pre-call brief hasn&apos;t been generated for {contactName}. You can still start the call.
          </Text>
          <View style={{ width: '100%', marginTop: theme.tokens.spacing[6] }}>
            <Button
              title="Call Without Brief"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                router.push({ pathname: '/active-call/[contactId]', params: { contactId: contactId ?? '' } })
              }}
              size="lg"
              style={{ backgroundColor: theme.colors.success[600] }}
            />
          </View>
          <TouchableOpacity onPress={() => router.back()} style={{ marginTop: theme.tokens.spacing[3] }}>
            <Text variant="body" color={theme.colors.primary[500]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    )
  }

  function handleCallNow() {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    router.push({ pathname: '/active-call/[contactId]', params: { contactId: contactId ?? '' } })
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.tokens.spacing[8] }} showsVerticalScrollIndicator={false}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[2], paddingTop: theme.tokens.spacing[1] }}>
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Back" accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', padding: theme.tokens.spacing[1] }}>
            <Ionicons name="chevron-back" size={28} color={theme.colors.primary[500]} />
          </TouchableOpacity>
        </View>

        {/* Header */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], paddingTop: theme.tokens.spacing[1] }}>
          <Text variant="h2">Pre-Call Brief</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1], marginTop: 2 }}>
            <Text variant="body" color={theme.colors.text.secondary}>{brief.contactName}</Text>
            {moduleIcon ? <Text variant="body">{moduleIcon}</Text> : null}
          </View>
        </View>

        {/* Relationship Strength */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[3] }}>
          <StatusBadge
            label={brief.relationshipStrength}
            variant="relationship"
            relationship={brief.relationshipStrength}
            size="md"
          />
        </View>

        {/* Last Conversation */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
          <GlassView intensity="subtle" style={{ padding: theme.tokens.spacing[4] }}>
            <BriefSection
              title={brief.lastConversation.title}
              items={brief.lastConversation.items}
              accentColor={callpilotColors.brief[500]}
            />
          </GlassView>
        </View>

        {/* Key Facts */}
        <View style={{ marginTop: theme.tokens.spacing[3] }}>
          <SectionHeader title="Key Facts" />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.tokens.spacing[4] }}>
            {brief.keyFacts.map((fact, i) => (
              <KeyInsightBadge key={i} text={fact} />
            ))}
          </View>
        </View>

        {/* Suggested Approach */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[4] }}>
          <SectionHeader title="Suggested Approach" style={{ paddingHorizontal: 0 }} />
          <Card variant="outlined" padding="md" style={{ borderLeftWidth: 4, borderLeftColor: callpilotColors.positive[500] }}>
            <Text variant="body" color={theme.colors.text.secondary}>{brief.suggestedApproach}</Text>
          </Card>
        </View>

        {/* Watch Out For */}
        {brief.watchOutFor.length > 0 && (
          <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[4] }}>
            <SectionHeader title="Watch Out For" style={{ paddingHorizontal: 0 }} />
            <View style={{ gap: theme.tokens.spacing[2] }}>
              {brief.watchOutFor.map((warning, i) => (
                <Text key={i} variant="bodySmall" color={callpilotColors.attention[600]}>
                  {'\u26A0'} {warning}
                </Text>
              ))}
            </View>
          </View>
        )}

        {/* Call Now CTA */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[8] }}>
          <Button
            title="I'm Ready - Call Now"
            onPress={handleCallNow}
            size="lg"
            style={{ backgroundColor: theme.colors.success[600] }}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

/**
 * Contact Detail Screen
 *
 * iOS Contacts-inspired layout:
 * - GlassButton nav (back + "..." menu)
 * - Large centered avatar with initials
 * - iOS-grouped info cards (insetGrouped style)
 * - Module info, notes, key facts, call history
 */

import { ScrollView, View, ActionSheetIOS, Platform, Alert } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import { triggerNotification, triggerImpact } from '@/utils/haptics'
import { ImpactFeedbackStyle, NotificationFeedbackType } from 'expo-haptics'
import Ionicons from '@expo/vector-icons/Ionicons'
import { useTheme } from '@/theme'
import { Text, GlassButton, SectionHeader } from '@/components'
import { SkeletonContactCard, SkeletonContactRow } from '@/components/SkeletonLoader'
import { QuickActionBar } from '@/components/contacts/QuickActionBar'
import { CallHistoryRow } from '@/components/contacts/CallHistoryRow'
import { KeyInsightBadge } from '@/components/briefs'
import { ModuleInfoSection } from '@/components/contacts/ModuleInfoSection'
import { TemperatureBadge } from '@/components/TemperatureBadge'
import { SettingsGroup } from '@/components/settings/SettingsGroup'
import { MODULE_ICONS, CONTACT_TYPE_LABELS } from '@/types/contact'
import { useContacts, useCalls } from '@/hooks'
import type { Call } from '@/types'

export default function ContactDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { theme } = useTheme()
  const router = useRouter()
  const { getContact, isLoading, error } = useContacts()
  const { getCallsForContact } = useCalls()

  const contact = getContact(id ?? '')

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ paddingTop: theme.tokens.spacing[4] }}>
          <SkeletonContactCard />
          <SkeletonContactRow />
          <SkeletonContactRow />
        </View>
      </SafeAreaView>
    )
  }

  if (error || !contact) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
        <View style={{ paddingHorizontal: theme.tokens.spacing[3], paddingTop: theme.tokens.spacing[2] }}>
          <GlassButton
            icon={<Ionicons name="chevron-back" size={18} color={theme.colors.text.primary} />}
            onPress={() => router.back()}
            size={32}
            accessibilityLabel="Back"
          />
        </View>
        <View style={{ padding: theme.tokens.spacing[4] }}>
          <Text variant="body" color={theme.colors.text.secondary}>
            {error ? `Failed to load contact: ${error}` : 'Contact not found'}
          </Text>
        </View>
      </SafeAreaView>
    )
  }

  const contactCalls = getCallsForContact(contact.id)
  const safeFirst = contact.firstName ?? ''
  const safeLast = contact.lastName ?? ''
  const fullName = `${safeFirst} ${safeLast}`.trim() || 'Unknown Contact'
  const initials = `${safeFirst[0] ?? ''}${safeLast[0] ?? ''}`.toUpperCase() || '?'
  const moduleIcon = MODULE_ICONS[contact.module]
  const moduleLabel = contact.module === 'investor' ? 'Investor' : 'Landlord'
  const contactTypeLabel = contact.contactType
    ? CONTACT_TYPE_LABELS[contact.contactType]
    : ''

  function handleCall() {
    if (!contact?.phone) return
    triggerNotification(NotificationFeedbackType.Success)
    router.push({ pathname: '/pre-call/[contactId]', params: { contactId: contact.id } })
  }

  function handleMessage() {
    router.push({ pathname: '/messages/[contactId]', params: { contactId: contact!.id } })
  }

  function handleCallHistoryPress(call: Call) {
    triggerImpact(ImpactFeedbackStyle.Light)
    router.push({ pathname: '/call-summary/[callId]', params: { callId: call.id } })
  }

  function handleMenuPress() {
    triggerImpact(ImpactFeedbackStyle.Light)
    if (Platform.OS !== 'ios') {
      Alert.alert('Actions', '', [
        { text: 'Edit Contact', onPress: () => Alert.alert('Coming Soon', 'Editing contacts is coming soon.') },
        { text: 'Delete Contact', style: 'destructive', onPress: () => Alert.alert('Coming Soon', 'Deleting contacts is coming soon.') },
        { text: 'Cancel', style: 'cancel' },
      ])
      return
    }
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options: ['Edit Contact', 'Delete Contact', 'Cancel'],
        cancelButtonIndex: 2,
        destructiveButtonIndex: 1,
      },
      (index) => {
        if (index === 0) {
          Alert.alert('Coming Soon', 'Editing contacts is coming soon.')
        } else if (index === 1) {
          Alert.alert(
            'Delete Contact',
            `Are you sure you want to delete ${fullName}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Delete', style: 'destructive', onPress: () => Alert.alert('Coming Soon', 'Deleting contacts is coming soon.') },
            ]
          )
        }
      },
    )
  }

  // Info rows for grouped card
  const infoRows = [
    { icon: 'call-outline' as const, label: 'Phone', value: contact.phone },
    { icon: 'mail-outline' as const, label: 'Email', value: contact.email },
    { icon: 'location-outline' as const, label: 'Address', value: contact.address },
  ].filter((row) => row.value)

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: theme.tokens.spacing[8] }} showsVerticalScrollIndicator={false}>
        {/* Nav header — glass buttons */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.tokens.spacing[3],
          paddingVertical: theme.tokens.spacing[2],
        }}>
          <GlassButton
            icon={<Ionicons name="chevron-back" size={18} color={theme.colors.text.primary} />}
            onPress={() => router.back()}
            size={32}
            accessibilityLabel="Back"
          />
          <GlassButton
            icon={<Ionicons name="ellipsis-vertical" size={16} color={theme.colors.text.primary} />}
            onPress={handleMenuPress}
            size={32}
            accessibilityLabel="More actions"
          />
        </View>

        {/* Avatar + Name — centered, iOS Contacts style */}
        <View style={{ alignItems: 'center', paddingTop: theme.tokens.spacing[2] }}>
          <View style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: theme.colors.primary[100],
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Text variant="h2" color={theme.colors.primary[600]}>{initials}</Text>
          </View>
          <Text variant="h3" style={{ marginTop: theme.tokens.spacing[3] }}>{fullName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[2], marginTop: theme.tokens.spacing[1] }}>
            <TemperatureBadge temperature={contact.temperature} size="md" />
            <Text variant="bodySmall" weight="semibold" color={theme.colors.primary[500]}>
              {moduleIcon} {moduleLabel}
            </Text>
            {contactTypeLabel ? (
              <>
                <Text variant="bodySmall" color={theme.colors.text.tertiary}>{'\u00B7'}</Text>
                <Text variant="bodySmall" color={theme.colors.text.secondary}>{contactTypeLabel}</Text>
              </>
            ) : null}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={{ paddingHorizontal: theme.tokens.spacing[4], marginTop: theme.tokens.spacing[5] }}>
          <QuickActionBar
            onCall={contact.phone ? handleCall : undefined}
            onText={handleMessage}
            onEmail={contact.email ? handleMessage : undefined}
          />
        </View>

        {/* Contact Info — iOS grouped card */}
        {infoRows.length > 0 && (
          <View style={{ marginTop: theme.tokens.spacing[5] }}>
            <SectionHeader title="Info" />
            <SettingsGroup>
              {infoRows.map((row, i) => (
                <View key={row.icon}>
                  {i > 0 && (
                    <View style={{ height: 1, backgroundColor: theme.colors.border, marginLeft: theme.tokens.spacing[4] }} />
                  )}
                  <View style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: theme.tokens.spacing[3],
                    paddingHorizontal: theme.tokens.spacing[4],
                    gap: theme.tokens.spacing[3],
                  }}>
                    <Ionicons name={row.icon} size={18} color={theme.colors.text.secondary} />
                    <View style={{ flex: 1 }}>
                      <Text variant="caption" color={theme.colors.text.tertiary}>{row.label}</Text>
                      <Text variant="body">{row.value}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </SettingsGroup>
          </View>
        )}

        {/* Module Info */}
        <ModuleInfoSection contact={contact} />

        {/* Notes */}
        {contact.notes ? (
          <View style={{ marginTop: theme.tokens.spacing[5] }}>
            <SectionHeader title="About" />
            <SettingsGroup>
              <View style={{ padding: theme.tokens.spacing[4] }}>
                <Text variant="bodySmall" color={theme.colors.text.secondary}>{contact.notes}</Text>
              </View>
            </SettingsGroup>
          </View>
        ) : null}

        {/* Key Facts */}
        {contact.keyFacts.length > 0 ? (
          <View style={{ marginTop: theme.tokens.spacing[4] }}>
            <SectionHeader title="Key Facts" />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: theme.tokens.spacing[4] }}>
              {contact.keyFacts.map((fact, i) => (
                <KeyInsightBadge key={i} text={fact} />
              ))}
            </View>
          </View>
        ) : null}

        {/* Objections */}
        {contact.objections.length > 0 ? (
          <View style={{ marginTop: theme.tokens.spacing[4] }}>
            <SectionHeader title="Known Objections" />
            <SettingsGroup>
              <View style={{ padding: theme.tokens.spacing[4], gap: theme.tokens.spacing[1] }}>
                {contact.objections.map((obj, i) => (
                  <Text key={i} variant="bodySmall" color={theme.colors.warning[600]}>
                    {'\u26A0'} {obj}
                  </Text>
                ))}
              </View>
            </SettingsGroup>
          </View>
        ) : null}

        {/* Call History */}
        <View style={{ marginTop: theme.tokens.spacing[5] }}>
          <SectionHeader title={`Call History (${contactCalls.length})`} />
          {contactCalls.length > 0 ? (
            <SettingsGroup>
              {contactCalls.map((call) => (
                <CallHistoryRow key={call.id} call={call} onPress={handleCallHistoryPress} />
              ))}
            </SettingsGroup>
          ) : (
            <View style={{ paddingHorizontal: theme.tokens.spacing[4] }}>
              <Text variant="body" color={theme.colors.text.tertiary}>
                No calls yet. Tap {'\uD83D\uDCDE'} to make your first call.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

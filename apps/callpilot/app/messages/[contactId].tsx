/**
 * Conversation Thread Screen
 *
 * iOS Messages-style chat with:
 * - GlassButton nav (back + "..." menu)
 * - Channel filter pills (All / Text / Email)
 * - Inverted FlatList (newest at bottom)
 * - KeyboardAvoidingView with inline compose bar
 * - Claw suggestion card above compose bar (wired to Supabase)
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import { View, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Keyboard, Alert, ActionSheetIOS, Platform, Linking } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useLocalSearchParams, useRouter } from 'expo-router'
import Ionicons from '@expo/vector-icons/Ionicons'
import { triggerImpact } from '@/utils/haptics'
import { ImpactFeedbackStyle } from 'expo-haptics'
import { useTheme } from '@/theme'
import { Text, GlassButton } from '@/components'
import { MessageBubble, ClawSuggestionCard, ChannelFilterPills } from '@/components/messages'
import type { ChannelFilter } from '@/components/messages/ChannelFilterPills'
import { useConversations, useContacts, useClawSuggestions } from '@/hooks'
import { sendMessage } from '@/services/communicationsService'
import { MODULE_ICONS } from '@/types/contact'
import { formatPhoneNumber } from '@/utils/formatters'
import type { Message } from '@/types'

export default function ConversationThreadScreen() {
  const { contactId, contactName: paramName } = useLocalSearchParams<{ contactId: string; contactName?: string }>()
  const { theme, isDark } = useTheme()
  const router = useRouter()
  const { getMessagesForContact } = useConversations()
  const { getContact } = useContacts()
  const flatListRef = useRef<FlatList<Message>>(null)

  const contact = getContact(contactId ?? '')
  const contactName = contact
    ? `${contact.firstName} ${contact.lastName}`.trim() || formatPhoneNumber(contact.phone)
    : paramName || formatPhoneNumber(contactId) || 'Loading...'
  const moduleIcon = contact ? MODULE_ICONS[contact.module] : ''

  const messages = getMessagesForContact(contactId ?? '')

  // Channel filter state
  const [channelFilter, setChannelFilter] = useState<ChannelFilter>('all')

  // Compose state
  const [messageText, setMessageText] = useState('')
  const [sending, setSending] = useState(false)

  // Claw suggestions — wired to Supabase (falls back to mock in dev)
  const { suggestion: clawDraft, dismiss, approve: approveDraft } = useClawSuggestions(contactId)

  const canSend = messageText.trim().length > 0 && !sending

  // Inverted FlatList: newest first, filtered by channel
  const sortedMessages = useMemo(() => {
    let filtered = messages
    if (channelFilter !== 'all') {
      filtered = messages.filter((m) => m.type === channelFilter)
    }
    return [...filtered].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    )
  }, [messages, channelFilter])

  const renderMessage = useCallback(
    ({ item }: { item: Message }) => (
      <MessageBubble message={item} contactName={contactName} />
    ),
    [contactName]
  )

  const keyExtractor = useCallback((item: Message) => item.id, [])

  // Send handler
  const handleSend = useCallback(async () => {
    const trimmed = messageText.trim()
    if (!trimmed || !contactId) return
    triggerImpact(ImpactFeedbackStyle.Light)
    Keyboard.dismiss()
    setMessageText('')
    setSending(true)
    try {
      await sendMessage(contactId, trimmed)
      triggerImpact(ImpactFeedbackStyle.Medium)
    } catch (err) {
      Alert.alert('Send Failed', err instanceof Error ? err.message : 'Could not send message.')
      setMessageText(trimmed)
    } finally {
      setSending(false)
    }
  }, [messageText, contactId])

  // Claw suggestion send — send first, approve on success (safe ordering)
  const handleClawSend = useCallback(async () => {
    if (!clawDraft || !contactId) return
    triggerImpact(ImpactFeedbackStyle.Light)
    setSending(true)
    try {
      await sendMessage(contactId, clawDraft.body)
      await approveDraft(clawDraft.id)
      triggerImpact(ImpactFeedbackStyle.Medium)
    } catch (err) {
      Alert.alert('Send Failed', err instanceof Error ? err.message : 'Could not send AI suggestion.')
    } finally {
      setSending(false)
    }
  }, [clawDraft, contactId, approveDraft])

  const handleClawEdit = useCallback(() => {
    if (clawDraft) {
      dismiss(clawDraft.id)
    }
  }, [clawDraft, dismiss])

  const handleClawDismiss = useCallback(() => {
    if (clawDraft) {
      dismiss(clawDraft.id)
    }
  }, [clawDraft, dismiss])

  // Claw card removed from ListHeaderComponent — in an inverted FlatList,
  // ListHeaderComponent renders at the visual bottom. Card is placed between
  // FlatList and compose bar instead.

  // "..." action menu
  function handleMenuPress() {
    triggerImpact(ImpactFeedbackStyle.Light)
    if (Platform.OS !== 'ios') {
      Alert.alert('Actions', 'View Contact, View Brief, Call, Block', [
        { text: 'View Contact', onPress: () => contact && router.push(`/contact/${contact.id}`) },
        { text: 'Cancel', style: 'cancel' },
      ])
      return
    }
    const options = ['View Contact', 'View Brief', 'Call', 'Block', 'Cancel']
    ActionSheetIOS.showActionSheetWithOptions(
      {
        options,
        cancelButtonIndex: 4,
        destructiveButtonIndex: 3,
      },
      (index) => {
        if (!contact) return
        switch (index) {
          case 0:
            router.push(`/contact/${contact.id}`)
            break
          case 1:
            router.push({ pathname: '/pre-call/[contactId]', params: { contactId: contact.id } })
            break
          case 2:
            if (contact.phone) {
              Linking.openURL(`tel:${contact.phone}`).catch(() => {
                Alert.alert('Error', 'Could not open phone dialer.')
              })
            } else {
              Alert.alert('No Phone Number', `${contactName} has no phone number on file.`)
            }
            break
          case 3:
            Alert.alert('Block Contact', `Are you sure you want to block ${contactName}?`, [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Block', style: 'destructive', onPress: () => Alert.alert('Coming Soon', 'Blocking is coming soon.') },
            ])
            break
        }
      },
    )
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Header — glass buttons, channel pills */}
      <View style={{ paddingHorizontal: theme.tokens.spacing[3], paddingVertical: theme.tokens.spacing[2] }}>
        {/* Top row: back, name, menu */}
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <GlassButton
            icon={<Ionicons name="chevron-back" size={18} color={theme.colors.text.primary} />}
            onPress={() => router.back()}
            size={32}
            accessibilityLabel="Back"
          />

          <View style={{ flex: 1, alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.tokens.spacing[1] }}>
              <Text variant="body" weight="semibold">{contactName}</Text>
              {moduleIcon ? <Text variant="caption">{moduleIcon}</Text> : null}
            </View>
          </View>

          <GlassButton
            icon={<Ionicons name="ellipsis-vertical" size={16} color={theme.colors.text.primary} />}
            onPress={handleMenuPress}
            size={32}
            accessibilityLabel="More actions"
          />
        </View>

        {/* Channel filter pills */}
        <View style={{ alignItems: 'center', marginTop: theme.tokens.spacing[2] }}>
          <ChannelFilterPills active={channelFilter} onChange={setChannelFilter} />
        </View>
      </View>

      {/* KeyboardAvoidingView */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Messages — inverted FlatList */}
        {sortedMessages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="body" color={theme.colors.text.tertiary}>
              {channelFilter === 'all' ? 'No messages yet' : `No ${channelFilter} messages`}
            </Text>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            inverted
            data={sortedMessages}
            renderItem={renderMessage}
            keyExtractor={keyExtractor}
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: theme.tokens.spacing[3],
              paddingBottom: theme.tokens.spacing[3],
            }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            initialNumToRender={20}
            maxToRenderPerBatch={10}
            windowSize={10}
          />
        )}

        {/* Claw suggestion card — above compose bar */}
        {clawDraft && (
          <ClawSuggestionCard
            draft={clawDraft}
            onSend={handleClawSend}
            onEdit={handleClawEdit}
            onDismiss={handleClawDismiss}
          />
        )}

        {/* Inline compose bar */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'flex-end',
          paddingHorizontal: theme.tokens.spacing[3],
          paddingVertical: theme.tokens.spacing[2],
          paddingBottom: theme.tokens.spacing[2],
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          backgroundColor: theme.colors.background,
        }}>
          <View style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'flex-end',
            backgroundColor: isDark ? theme.colors.surfaceSecondary : theme.colors.neutral[100],
            borderRadius: theme.tokens.borderRadius.lg,
            paddingHorizontal: theme.tokens.spacing[3],
            paddingVertical: theme.tokens.spacing[2],
            marginRight: theme.tokens.spacing[2],
          }}>
            <TextInput
              style={{
                flex: 1,
                color: theme.colors.text.primary,
                fontSize: theme.tokens.fontSize.base,
                maxHeight: 100,
                paddingVertical: 0,
              }}
              value={messageText}
              onChangeText={setMessageText}
              placeholder="Type a message..."
              placeholderTextColor={theme.colors.text.tertiary}
              multiline
              keyboardAppearance={isDark ? 'dark' : 'light'}
            />
          </View>

          <TouchableOpacity
            onPress={handleSend}
            disabled={!canSend}
            accessibilityLabel="Send message"
            accessibilityRole="button"
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              backgroundColor: canSend ? theme.colors.primary[500] : (isDark ? theme.colors.surfaceSecondary : theme.colors.neutral[100]),
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="send"
              size={18}
              color={canSend ? theme.colors.text.inverse : theme.colors.text.tertiary}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

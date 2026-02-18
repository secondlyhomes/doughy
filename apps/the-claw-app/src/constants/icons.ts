/**
 * Icon Name Mappings
 *
 * Single source of truth for all Ionicons names used in the app.
 */

import type { ComponentProps } from 'react'
import type { Ionicons } from '@expo/vector-icons'

type IoniconsName = ComponentProps<typeof Ionicons>['name']

/** Connection icons — maps connectionId to Ionicons name */
export const CONNECTION_ICONS: Record<string, IoniconsName> = {
  doughy: 'home-outline',
  whatsapp: 'logo-whatsapp',
  discord: 'logo-discord',
  bland: 'call-outline',
  sms: 'chatbox-outline',
  slack: 'chatbubble-outline',
  hubspot: 'business-outline',
  gmail: 'mail-outline',
}

/** Activity icons — maps action types to Ionicons name */
export const ACTIVITY_ICONS: Record<string, IoniconsName> = {
  send_sms: 'chatbox-outline',
  send_message: 'chatbubble-outline',
  make_call: 'call-outline',
  update_lead: 'person-outline',
  post_message: 'megaphone-outline',
  read_inbox: 'mail-outline',
  create_event: 'calendar-outline',
}

export const DEFAULT_ACTIVITY_ICON: IoniconsName = 'flash-outline'

/** UI icons */
export const UI_ICONS = {
  lock: 'lock-closed' as IoniconsName,
  lockOutline: 'lock-closed-outline' as IoniconsName,
  warning: 'warning-outline' as IoniconsName,
  empty: 'clipboard-outline' as IoniconsName,
  emptyInbox: 'mail-open-outline' as IoniconsName,
  checkAll: 'checkmark-done-outline' as IoniconsName,
  robot: 'hardware-chip-outline' as IoniconsName,
  close: 'close' as IoniconsName,
  filter: 'filter-outline' as IoniconsName,
  help: 'help-circle-outline' as IoniconsName,
  chevronDown: 'chevron-down' as IoniconsName,
  chevronUp: 'chevron-up' as IoniconsName,
}

/**
 * Trust Constants
 *
 * Default action overrides, trust level configs, and action categories.
 */

export const ACTION_CATEGORIES = [
  { category: 'Messages', actions: ['send_sms', 'send_message', 'send_email', 'post_message'] },
  { category: 'AI Calls', actions: ['make_call', 'schedule_call'] },
  { category: 'Data Updates', actions: ['update_lead', 'update_deal', 'create_lead', 'create_event'] },
  { category: 'Never Allow', actions: ['delete_lead', 'delete_deal', 'bulk_delete'] },
] as const

export const DEFAULT_COUNTDOWN_SECONDS = 30
export const DEFAULT_DAILY_SPEND_LIMIT_CENTS = 500
export const DEFAULT_DAILY_CALL_LIMIT = 10

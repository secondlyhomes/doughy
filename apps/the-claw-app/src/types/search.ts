/**
 * Search Types
 *
 * Filter types, defaults, and label configs for the cross-section search bar.
 * Single source of truth for filter options — consumed by store, hook, and UI.
 */

import type { ConnectionId } from './connections'

export type SearchActionType = 'all' | 'messages' | 'ai-calls' | 'updates' | 'briefings'

export type SearchDateRange = 'all' | 'today' | 'this-week' | 'this-month'

export type SearchService = 'all' | 'bland' | 'twilio' | 'claude'

export interface SearchFilters {
  actionType: SearchActionType
  dateRange: SearchDateRange
  service: SearchService
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  actionType: 'all',
  dateRange: 'all',
  service: 'all',
}

/** Maps search action type categories to actual actionType values in queue/activity items */
export const ACTION_TYPE_CATEGORIES: Record<Exclude<SearchActionType, 'all'>, string[]> = {
  messages: ['send_sms', 'send_message', 'post_message'],
  'ai-calls': ['make_call'],
  updates: ['update_lead', 'update_contact', 'update_deal'],
  briefings: ['send_briefing', 'generate_summary'],
}

/** Maps search service filters to ConnectionId values */
export const SERVICE_CONNECTION_MAP: Record<Exclude<SearchService, 'all'>, ConnectionId[]> = {
  bland: ['bland'],
  twilio: ['sms', 'whatsapp'],
  claude: ['doughy'],
}

/** Filter option with display label — single source of truth for labels */
export interface FilterOption<T extends string> {
  value: T
  label: string
}

export const SEARCH_FILTER_OPTIONS: {
  actionType: FilterOption<Exclude<SearchActionType, 'all'>>[]
  dateRange: FilterOption<Exclude<SearchDateRange, 'all'>>[]
  service: FilterOption<Exclude<SearchService, 'all'>>[]
} = {
  actionType: [
    { value: 'messages', label: 'Messages' },
    { value: 'ai-calls', label: 'AI Calls' },
    { value: 'updates', label: 'Updates' },
    { value: 'briefings', label: 'Briefings' },
  ],
  dateRange: [
    { value: 'today', label: 'Today' },
    { value: 'this-week', label: 'This Week' },
    { value: 'this-month', label: 'This Month' },
  ],
  service: [
    { value: 'bland', label: 'Bland' },
    { value: 'twilio', label: 'Twilio' },
    { value: 'claude', label: 'Claude' },
  ],
}

/** Get display labels for active (non-'all') filters */
export function getActiveFilterLabels(filters: SearchFilters): { key: keyof SearchFilters; label: string }[] {
  const result: { key: keyof SearchFilters; label: string }[] = []
  for (const [key, options] of Object.entries(SEARCH_FILTER_OPTIONS)) {
    const value = filters[key as keyof SearchFilters]
    if (value !== 'all') {
      const option = options.find((o: FilterOption<string>) => o.value === value)
      if (option) result.push({ key: key as keyof SearchFilters, label: option.label })
    }
  }
  return result
}

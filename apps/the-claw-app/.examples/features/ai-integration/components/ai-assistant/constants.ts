/**
 * AI Assistant Constants
 *
 * Default values and configuration constants.
 */

import type { QuickAction } from './types'

/**
 * Default quick actions for the AI Assistant
 */
export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'summarize',
    label: 'Summarize',
    prompt: 'Summarize the following in 2-3 sentences:',
    icon: '📝',
  },
  {
    id: 'explain',
    label: 'Explain',
    prompt: 'Explain this in simple terms:',
    icon: '💡',
  },
  {
    id: 'translate',
    label: 'Translate',
    prompt: 'Translate this to Spanish:',
    icon: '🌍',
  },
  {
    id: 'improve',
    label: 'Improve',
    prompt: 'Improve the writing of:',
    icon: '✨',
  },
]

/**
 * Default system prompt for the assistant
 */
export const DEFAULT_SYSTEM_PROMPT = 'You are a helpful AI assistant. Provide concise, clear answers.'

/**
 * Default position for the floating button
 */
export const DEFAULT_POSITION = 'bottom-right' as const

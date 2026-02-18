/**
 * SentimentBadge Component
 *
 * Displays a sentiment indicator (positive/neutral/negative).
 */

import { ViewStyle } from 'react-native'
import { StatusBadge } from '../StatusBadge'
import type { CallSentiment } from '@/types'

export interface SentimentBadgeProps {
  sentiment: CallSentiment
  style?: ViewStyle
}

const SENTIMENT_LABELS: Record<CallSentiment, string> = {
  positive: 'Positive',
  neutral: 'Neutral',
  negative: 'Needs Attention',
}

export function SentimentBadge({ sentiment, style }: SentimentBadgeProps) {
  return (
    <StatusBadge
      label={SENTIMENT_LABELS[sentiment]}
      variant="sentiment"
      sentiment={sentiment}
      size="md"
      {...(style ? { style } : {})}
    />
  )
}
